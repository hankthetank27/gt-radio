import readline from 'readline';
import path from 'path';
import ytdl from "ytdl-core";
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from "node:stream";
import { songInfo } from './@types';
import { displayCurrentSong } from './sendMetadata';


export function startAudioStream(streamName: string): void{

  const hlsMediaPath = path.resolve(
    __dirname, `../../media/live/${streamName}/`
  );

  // highwater mark set to match size of chunk (386byte)
  // as to not overflow buffer and sync info to audio
  const stream: PassThrough = createStream(400);

  queueAudioToStream(stream, hlsMediaPath);
  
  ffmpeg(stream)
    .inputOptions([
      '-re'
    ])
    .outputOption([
      '-preset veryfast',
      '-tune zerolatency',
      '-c:a aac',
      '-ar 44100',
    ])
    .on('error', (err) => {
      console.error(`Error transcoding stream audio: ${err.message}`);
    })
    .save(`rtmp://localhost/live/${streamName}.flv`);
};


function createStream(bufferSize: number): PassThrough{
  return new PassThrough({
    highWaterMark: bufferSize
  });
};


async function queueAudioToStream(stream: PassThrough, hlsMediaPath: string): Promise<void>{

  function queueSong(src: string, basicInfo: songInfo): Promise<void>{
    return new Promise<void>(async (resolve, reject) => {
  
      console.log(`Download started... ${basicInfo.title}`);
  
      const tracker = {
        startTime: Date.now(),
        downloaded: 0,
        processed: 0,
      };
  
      const ytAudio = ytdl(src, {
          quality: 'highestaudio',
          filter: 'audioonly'
        })
        .on('progress', (p) => {
          tracker.downloaded += p;
          showProgress(
            tracker.downloaded,
            tracker.processed
          );
        })
        .on('error', (err) => {
          reject(err);
        });
      
      const transcodeAudio = ffmpeg(ytAudio)
        .audioBitrate(128)
        .format('mp3')
        .on('progress', (p) => {
          tracker.processed = p.targetSize;
          showProgress(
            tracker.downloaded,
            tracker.processed
          );
        })
        .on('error', (err) => {
          console.log('\n\n');
          reject(err);
        });
  
      // use extra passthorough to manually destroy stream, preventing 
      // memory leak caused by end option in call to pipe.
      let draining = false;
      const passToDestination = createStream(1024 * 512)
        .on('data', async () => {
          if (!draining){
            displayCurrentSong(hlsMediaPath, basicInfo.title);
            draining = true;
          };
        })
        .on('end', () => {
          console.log(
            `\n\nCompleted processing in ${(Date.now() - tracker.startTime) / 1000}s`
          );
          passToDestination.destroy();
          resolve();
        })
        .on('error', (err) => {
          passToDestination.destroy();
          console.log('\n\n');
          reject(err);
        });
  
      transcodeAudio
        .pipe(passToDestination)
        .pipe(stream, {
          end: false
        });
    });
  };


  const videos = [
    'https://youtu.be/YLslsZuEaNE',
    'https://youtu.be/qepRu565h14'
  ];

  try {
    while (true){
      const idx = Math.floor((Math.random() * videos.length));
      const src = videos[idx]
      const basicInfo = await getSongInfo(src);
      await queueSong(src, basicInfo);
    }
  } catch (err){
    console.error(`Error queueing audio: ${err}`);
  };
};


async function getSongInfo(src: string): Promise<songInfo>{
  const { videoDetails } = await ytdl.getBasicInfo(src);
  return {
    title: videoDetails.title,
    duration: videoDetails.lengthSeconds,
    channel: videoDetails.ownerProfileUrl
  };
};


function showProgress(downloaded: number, processed: number): void{
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(`${Math.floor((downloaded) / 1000)}kb downloaded\n`);
  process.stdout.write(`${processed}kb processed`);
  readline.moveCursor(process.stdout, 0, -1);
};