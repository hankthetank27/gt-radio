import ytdl from "ytdl-core";
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from "node:stream";

export async function startAudioStream(): Promise<void>{

  const mainStream = await createStreamedQueue();

  ffmpeg(mainStream)
    .inputOptions([
      '-re'
    ])
    .outputOption([
      '-preset veryfast',
      '-tune zerolatency',
      '-c:a aac',
      '-ar 44100',
    ])
    .save('rtmp://localhost/live/main.flv');
};

async function createStreamedQueue(): Promise<PassThrough>{

  const createStream = () => {
    const stream = new PassThrough({
      highWaterMark: 1024 * 51200
    });
    stream._destroy = () =>
      { stream.destroyed = true; };
    return stream;
  };

  const mainStream: PassThrough = createStream();

  const ref1 = 'https://youtu.be/lLCEUpIg8rE'
  const ref2 = 'https://youtu.be/5AYvyk2PLI0';

  function queueSong(src: string, destination: PassThrough): Promise<void>{
    return new Promise<void>(async (resolve, reject) => {

      const { 
        videoDetails 
      } = await ytdl.getBasicInfo(src);

      const info = {
        title: videoDetails.title,
        duration: videoDetails.lengthSeconds,
        channel: videoDetails.ownerProfileUrl
      }

      console.log(info)

      ytdl(src, {
          quality: 'highestaudio',
          filter: format => format.container ==='mp4',
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (err) => {
          reject(err);
        })
        .pipe(destination, { end: false });
    });
  };
  
  try {
    await queueSong(ref1, mainStream);
    await queueSong(ref2, mainStream);
  } catch (err){
    console.error(err)
  }

  return mainStream;
};