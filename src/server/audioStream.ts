import ytdl from "ytdl-core";
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from "node:stream"

export async function startAudioStream(): Promise<void>{

  const mainStream = await createStreamedQueue();

  ffmpeg(mainStream)
    .inputOptions([
      '-re'
    ])
    .outputOption([
      // '-preset veryfast',
      // '-tune zerolatency',
      '-c:a aac',
      '-ar 44100',
    ])
    .save('rtmp://localhost/live/main.flv');
};

async function createStreamedQueue(): Promise<PassThrough>{

  const createStream = () => {
    const stream = new PassThrough({
      highWaterMark: 1024 * 512 * 100
    });
    stream._destroy = () =>
      { stream.destroyed = true; };
    return stream;
  };

  const mainStream: PassThrough = createStream();

  const ref1 = 'https://youtu.be/lLCEUpIg8rE'
  const ref2 = 'https://youtu.be/5AYvyk2PLI0';

  function queueSong(src: string, destination: PassThrough): Promise<void>{
    return new Promise<void>((resolve, reject) => {
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


// async function createStreamedQueue(): Promise<Readable>{

//   function createStream(): Readable{
//     const stream = new Readable({
//       read(){},
//       highWaterMark: 1024 * 512,
//     });
//     stream._destroy = () => { stream.destroyed = true };
//     return stream;
//   }

//   const mainStream: Readable = createStream()

//   const ref1 = 'https://youtu.be/lLCEUpIg8rE'
//   const ref2 = 'https://www.youtube.com/watch?v=_pqv06ySvuk';

//   function queueSong(src: string, stream: Readable): Promise<void>{
//     return new Promise<void>((resolve, reject) => {
//       ytdl(src, {
//           filter: 'audioonly',
//           quality: 'highestaudio'
//         })
//         .on('data', (data) => {
//           if (data !== null){
//             stream.push(data);
//           }
//         })
//         .on('end', () => {
//           resolve();
//         })
//         .on('error', (err) => {
//           console.error('Error downloading file from YouTube.', err);
//           reject(err);
//         })
//     })
//   }
  
//   await queueSong(ref1, mainStream);
//   // console.log('after firsrt: ', mainStream)
//   await queueSong(ref2, mainStream);
//   // console.log('after second: ', mainStream)

//   return mainStream;
// };