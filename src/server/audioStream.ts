import readline from 'readline';
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
  return stream;
};


async function queueAudioToStream(stream: PassThrough): Promise<void>{

  const videos = [
    'https://youtu.be/UT5F9AXjwhg',
    'https://youtu.be/J1qsrBl_CR0',
    'https://youtu.be/qepRu565h14'
  ]

  try {
    while (true){
      const idx = Math.floor((Math.random() * videos.length));
      const song = videos[idx]
      await queueSong(song, stream);
    }
  } catch (err){
    console.error(`Error queueing audio: ${err}`);
  }

};


function queueSong(src: string, destination: PassThrough): Promise<void>{
    
  return new Promise<void>(async (resolve, reject) => {

    const pass = createStream(1024 * 512);

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
        showProgress(
          tracker.downloaded,
          tracker.processed
        );
      })
      .on('error', (err) => {
        reject(err);
      });
    
    ffmpeg(ytAudio)
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
      })
      .pipe(pass);

    // use extra passthorough to manually destroy and prevent 
    // memory leak caused by end option in call to pipe.
    pass
      .on('error', (err) => {
        pass.destroy();
        console.log('\n\n');
        reject(err);
      })
      .on('end', () => {
        console.log(
          `\n\nCompleted processing in ${(Date.now() - tracker.startTime) / 1000}s`
        );
        pass.destroy();
        resolve();
      })
      .pipe(destination, {
        end: false
      });

  });
};


function showProgress(downloaded: number, processed: number): void{
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(`${Math.floor((downloaded) / 1000)}kb downloaded\n`);
  process.stdout.write(`${processed}kb processed`);
  readline.moveCursor(process.stdout, 0, -1);
};
