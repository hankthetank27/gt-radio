import readline from 'readline'
import ytdl from "ytdl-core";
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from "node:stream";


export function startAudioStream(): void{

  const mainStream: PassThrough = createStream(1024 * 512);
  queueAudioToStream(mainStream);

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
    .on('error', (err) => {
      console.error(`Error transcoding stream audio: ${err.message}`);
    })
    .save('rtmp://localhost/live/main.flv');
};


function createStream(bufferSize: number): PassThrough{
  const stream = new PassThrough({
    highWaterMark: bufferSize
  });
  stream._destroy = () => { stream.destroyed = true; };
  return stream;
};


async function queueAudioToStream(stream: PassThrough): Promise<PassThrough>{

  const oneSec = 'https://youtu.be/QC8iQqtG0hg';
  const ref1 = 'https://www.youtube.com/watch?v=hKosaf5tmpI';
  const ref2 = 'https://youtu.be/5AYvyk2PLI0';

  try {
    await queueSong(oneSec, stream);
    await queueSong(ref1, stream);
    await queueSong(ref2, stream);
  } catch (err){
    console.error(err)
  }

  return stream;
};


function showProgress(downloaded: number, processed: number): void{
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(`${Math.floor((downloaded) / 1000)}kb downloaded\n`);
  process.stdout.write(`${processed}kb processed`);
  readline.moveCursor(process.stdout, 0, -1);
};


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

    console.log(`Download started... ${info.title}`);

    const ytAudio = ytdl(src, {
        quality: 'highestaudio',
        filter: 'audioonly'
      })
      .on('progress', (p) => {
        tracker.downloaded += p;
        showProgress(tracker.downloaded, tracker.processed);
      })
      .on('error', (err) => {
        reject(err);
      });
    
    ffmpeg(ytAudio)
      .audioBitrate(128)
      .format('mp3')
      .on('progress', (p) => {
        tracker.processed = p.targetSize;
        showProgress(tracker.downloaded, tracker.processed)
      })
      .on('end', () => {
        console.log(
          `\n\nCompleted processing in ${(Date.now() - tracker.startTime) / 1000}s`
        );
        resolve();
      })
      .on('error', (err) => {
        console.log('\n\n');
        reject(err);
      })
      .pipe(destination, { end: false });

  });
};
