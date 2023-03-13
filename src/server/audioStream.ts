import readline from 'readline';
import ytdl from "ytdl-core";
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from "node:stream";
import { songInfo } from './@types';



export function startAudioStream(): void{

  // highwater mark set to match size of chunk (386byte) as to not overflow buffer and sync info to audio
  const mainStream: PassThrough = createStream(400);

  queueAudioToStream(mainStream);

  // return mainStream
  
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
  return new PassThrough({
    highWaterMark: bufferSize
  });
};


async function queueAudioToStream(stream: PassThrough): Promise<void>{

  const videos = [
    'https://youtu.be/YLslsZuEaNE'
  ]

  try {
    while (true){
      const idx = Math.floor((Math.random() * videos.length));
      const src = videos[idx]
      const basicInfo = await getSongInfo(src);
      const sizeOfData = await queueSong(src, stream, basicInfo);
      console.log(sizeOfData)
    }
  } catch (err){
    console.error(`Error queueing audio: ${err}`);
  }

};

async function getSongInfo(src: string): Promise<songInfo>{
  const { videoDetails } = await ytdl.getBasicInfo(src);
  return {
    title: videoDetails.title,
    duration: videoDetails.lengthSeconds,
    channel: videoDetails.ownerProfileUrl
  };
}


function queueSong(src: string, destination: PassThrough, info: songInfo) {
    
  return new Promise(async (resolve, reject) => {

    const tracker = {
      startTime: Date.now(),
      downloaded: 0,
      processed: 0,
      totalSize: 0
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
      .on('data', (d) => {
        if (!draining){
          console.log(`\nnow playing: ${info.title}`);
          draining = true;
        }
        tracker.totalSize += d.length;
      })
      .on('end', () => {
        console.log(
          `\n\nCompleted processing in ${(Date.now() - tracker.startTime) / 1000}s`
        );
        passToDestination.destroy();
        resolve(tracker.totalSize);
      })
      .on('error', (err) => {
        passToDestination.destroy();
        console.log('\n\n');
        reject(err);
      });


    transcodeAudio
      .pipe(passToDestination)
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