import readline from 'readline'
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


function createStream(bufferSize: number): PassThrough{
  const stream = new PassThrough({
    highWaterMark: bufferSize
  });
  stream._destroy = () => { stream.destroyed = true; };
  return stream;
};


function showProgress(downloaded: number, processed: number){
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(`${Math.floor((downloaded) / 1000)}kb downloaded\n`);
  process.stdout.write(`${processed}kb processed`);
  readline.moveCursor(process.stdout, 0, -1);
};


async function createStreamedQueue(): Promise<PassThrough>{

  //100mb buffer
  const mainStream: PassThrough = createStream(100000000);

  const ref1 = 'https://www.youtube.com/watch?v=hKosaf5tmpI'
  const ref2 = 'https://youtu.be/5AYvyk2PLI0';

  function queueSong(src: string, destination: PassThrough): Promise<void>{
    
    return new Promise<void>(async (resolve, reject) => {

      const { videoDetails } = await ytdl.getBasicInfo(src);

      const info = {
        title: videoDetails.title,
        duration: videoDetails.lengthSeconds,
        channel: videoDetails.ownerProfileUrl
      };
      
      const tracker = {
        startTime: Date.now(),
        downloaded: 0,
        processed: 0
      };

      // Possibly get filter download on format do avoid mp3 processing?
      
      // const bigInfo = await ytdl.getInfo(src)
      // const format = ytdl.chooseFormat(bigInfo.formats, {quality: '134'})
      // console.log(format)

      console.log(`Download started... ${info.title}`)
      
      const audio = ytdl(src, {
          quality: 'highestaudio',
          filter: 'audioonly'
        })
        .on('progress', p => {
          tracker.downloaded += p;
          showProgress(tracker.downloaded, tracker.processed);
        })
        
      ffmpeg(audio)
        .audioBitrate(128)
        .format('mp3')
        .on('progress', p => {
          tracker.processed = p.targetSize;
          showProgress(tracker.downloaded, tracker.processed)
        })
        .on('end', () => {
          console.log(`\n\nCompleted processing in ${(Date.now() - tracker.startTime) / 1000}s`);
          resolve();
        })
        .on('error', (err) => {
          console.log('\n');
          reject(err);
        })
        .pipe(destination, { end: false })

    });
  };

  
  try {
    await queueSong(ref1, mainStream);
    await queueSong(ref2, mainStream);
    console.log(`Buffer currently at ${Math.floor(mainStream.readableLength / 1000)}kb`)
  } catch (err){
    console.error(err)
  }

  return mainStream;
};