import dotenv from 'dotenv';
import { initDB } from "../db/initDB";
import ytdl from '@distube/ytdl-core';
import { songInfo } from '../../@types';
import { Document } from 'mongodb';
import { PassThrough } from "stream";
import ffmpeg from 'fluent-ffmpeg';
import { S3Client, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { Upload } from "@aws-sdk/lib-storage";

dotenv.config();

const s3Client = new S3Client({
  region: "us-east-1",
});

async function downloadSongs(): Promise<"throttled" | "incomplete" | "done"> {
  try {
    const db = await initDB();
    if (db){
      console.log('connected to mongoDb: gt_data');
    } else {
      throw new Error('Could not connect to mongoDb: gt_data');
    };

    const posts = db.collection('gt_posts');

    const countDocs = await posts.countDocuments({ s3_file_data: { $exists: true } });
    console.log("current uploaded doc count: ", countDocs);

    const cursor = posts.find({
        link_source: "youtube"
      });

    let count = 0;
    let hasPropertyCount = 0;
    let consecutiveInvalid = 0;
    const incrementThrottle = throttleErr();

    for await (const document of cursor) {
      count++;
      if ('s3_file_data' in document || document['temp_invalid'] === true) {
        hasPropertyCount++;
      } else {
        const songInfo = await getSongInfo(document);
        if (songInfo) {
          console.log(`\nsong info found for ${songInfo.title}, attempting s3 upload...`);
          const s3FileData = await uploadToS3(songInfo);
          if (s3FileData !== null) {
            await posts.updateOne(
              { _id: document._id },
              { 
                $set: { 
                  s3_file_data: s3FileData 
                } 
              }
            );
            consecutiveInvalid = 0;
            console.log('successfully updated record!\n');
          } else {
            console.log('s3 upload failed');
            if (incrementThrottle()) {
              return "throttled"
            }
            console.log("\n");
          }
        } else {
          consecutiveInvalid += 1;
          if (consecutiveInvalid >= 10) {
            return "throttled";
          }
          await posts.updateOne(
            { _id: document._id },
            { 
              $set: { 
                temp_invalid: true 
              } 
            }
          );
        }
      }
    }

    await cursor.close();

    console.log('\nSummary:');
    console.log(`Total documents processed: ${count}`);
    console.log(`Documents with audio-stream: ${hasPropertyCount}`);
    console.log(`Documents without audio-stream: ${count - hasPropertyCount}`);

    return "done";
  } catch(e) {
    console.error("Could not complete uploads: ", e);
    return "incomplete";
  }
}

function throttleErr() {
  let errorCount = 0;
  const makeTimeout = () => setTimeout(() => {
      errorCount = 0;
    }, 10000);
  let timeout = makeTimeout(); 
  return () => {
    errorCount += 1;
    console.log("error count: ", errorCount);
    clearTimeout(timeout);
    timeout = makeTimeout();
    return errorCount >= 5;
  }
}

async function uploadToS3(songInfo: songInfo) {
  const passToDestination = new PassThrough();

  const uploadParams: PutObjectCommandInput = {
    Bucket: "great-tunes-music",
    Key: `${songInfo.title.replaceAll("/", "--")}.mp3`,
    Body: passToDestination,
  };

  const upload = new Upload({
    client: s3Client,
    params: uploadParams,
  });

  const abortUpload = async (err: Error | unknown, resolve: (v: unknown) => void) => {
    try {
      console.error(err);
      await upload.abort();
    } catch(err) {
      console.error(err);
    }
    return resolve(null);
  }

  return new Promise(async (resolve) => {
    try {

      const ytAudio = ytdl(songInfo.src, {
          filter: format => format.itag === songInfo.itag,
        })
        .on("error", (e) => abortUpload(e, resolve));

      const transcodeAudio = ffmpeg(ytAudio)
        .audioBitrate(128)
        .format('mp3')
        .on("error", (e) => abortUpload(e, resolve));

      transcodeAudio.pipe(passToDestination)
        .on("error", (e) => abortUpload(e, resolve));

      upload.on('httpUploadProgress', ({loaded}) => {
        console.log("loaded: ", loaded);
      })

      const res = await upload.done();
      console.log(`${songInfo.title}.mp3 successfully uploaded to S3`);

      return resolve({
        bucket: res.Bucket,
        key: res.Key,
        etag: res.ETag,
        location: res.Location,
        duration: songInfo.duration,
        channel: songInfo.channel,
        itag: songInfo.itag,
        length: songInfo.length,
      });
    } catch(error) {
      console.error("Error during upload: ", error);
      return abortUpload(error, resolve);
    }
  });
}

async function getSongInfo(
  src: Document | null
): Promise<songInfo | null>{
  if ( 
    !src ||
    !src.link ||
    ytdl.validateID(src.link)
  ) return null;

  try {
    const {
      videoDetails, 
      formats 
    } = await ytdl.getInfo(src.link);

    const format = ytdl.chooseFormat(formats, {
      filter: 'audioonly',
      quality: 'highestaudio',
    });

    if (Number(format.contentLength) >= 400000000) {
      console.log(`File too long - ${videoDetails.title} - at ${format.contentLength}... ${src.link}\n`);
      return null;
    }

    return {
      post_id: src._id,
      title: videoDetails.title,
      memberPosted: src?.user_name,
      datePosted: src?.date_posted,
      postText: src?.text,
      src: videoDetails.video_url || src.link,
      duration: videoDetails.lengthSeconds,
      channel: videoDetails.ownerProfileUrl,
      itag: format.itag,
      length: Number(format.contentLength),
      hasBeenPlayed: src?.hasBeenPlayed
    };
  } catch(e) {
    console.error(`Invalid song info for ${src.link}`);
    return null;
  }
};

async function main() {
  let done = "incomplete";
  while (done !== "done") {
    done = await downloadSongs();
    if (done === "throttled") {
      console.log('\nwaiting on throttle...');
      await new Promise((r) => setTimeout(r, 300000));
    }
  }
}

main();
