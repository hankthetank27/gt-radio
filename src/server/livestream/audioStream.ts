import readline from 'readline';
import path from 'path';
import ytdl from "ytdl-core";
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from "node:stream";
import { songInfo } from '../@types';
import { SongDisplayer } from './songDisplayer';
import { Db } from 'mongodb'
import { selectRandomSong } from './selectRandomSong';


interface tracker {
  startTime: number;
  downloaded: number;
  processed: number;
  ytdlDone: boolean;
  transcodeAudioDone: boolean;
  passToDestinationDone: boolean;
}


export function startAudioStream(
  streamName: string,
  db: Db
): SongDisplayer{

  const hlsMediaPath = path.resolve(
    __dirname, `../../../media/live/${streamName}/`
  );

  // highwater mark set to match size of chunk (386byte)
  // as to not overflow buffer and sync info to audio
  const songDisplayer = new SongDisplayer(hlsMediaPath);
  const stream: PassThrough = createStream(400);

  queueAudioToStream(
    stream,
    db,
    songDisplayer
  );

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

  return songDisplayer;
};


function createStream(
  bufferSize: number
): PassThrough{
  return new PassThrough({
    highWaterMark: bufferSize
  });
};


async function queueAudioToStream(
  stream: PassThrough,
  db: Db,
  songDisplayer: SongDisplayer
): Promise<void>{

  function queueSong(
    src: string,
    basicInfo: songInfo
  ): Promise<void>{
      
    return new Promise<void>(async (resolve, reject) => {

      // use extra passthorough to manually destroy stream, preventing 
      // memory leak caused by end option in call to pipe.
      const passToDestination = createStream(800);

      function resolveQueue(){
        passToDestination.destroy();
        resolve();
      };

      function rejectQueue(err: string){
        passToDestination.destroy();
        reject(err);
      };
  
      console.log(`Download started... ${basicInfo.title}`);
  
      const tracker = {
        startTime: Date.now(),
        downloaded: 0,
        processed: 0,
        ytdlDone: false,
        transcodeAudioDone: false,
        passToDestinationDone: false
      };
  
      const ytAudio = ytdl(src, {
          quality: 'highestaudio',
          filter: 'audioonly'
        })
        // .on('progress', (p) => {
        //   tracker.downloaded += p;
        //   showProgress(
        //     tracker.downloaded,
        //     tracker.processed
        //   );
        // })
        .on('end', () => {
          tracker.ytdlDone = true;
          if (checkProcessingComplete(tracker)){
            resolveQueue();
          };
        })
        .on('error', (err) => {
          console.log('\n');
          rejectQueue(`Error in queueSong -> ytAudio: ${err}`);
        });
      
      const transcodeAudio = ffmpeg(ytAudio)
        .audioBitrate(128)
        .format('mp3')
        // .on('progress', (p) => {
        //   // tracker.processed = p.targetSize;
        //   // showProgress(
        //   //   tracker.downloaded,
        //   //   tracker.processed
        //   // );
        // })
        .on('end', () => {
          tracker.transcodeAudioDone = true;
          if (checkProcessingComplete(tracker)){
            resolveQueue();
          };
        })
        .on('error', (err) => {
          console.log('\n');
          rejectQueue(`Error in queueSong -> transcodeAudio: ${err}`);
        });
  

      let flowing = false;
      passToDestination
        .on('data', async () => {
          if (!flowing){
            flowing = true;
            songDisplayer.queueDisplaySong(basicInfo.title);
          };
        })
        .on('end', () => {
          console.log(
            `\n\nCompleted processing in ${(Date.now() - tracker.startTime) / 60000}m`
          );
          tracker.passToDestinationDone = true;
          if (checkProcessingComplete(tracker)){
            resolveQueue();
          };
        })
        .on('error', (err) => {
          passToDestination.destroy();
          console.log('\n');
          rejectQueue(`Error in queueSong -> passToDestination: ${err}`);
        });
  
      transcodeAudio
        .pipe(passToDestination)
        .pipe(stream, {
          end: false
        });
    });
  };


  while (true){
    try {
      const song = await selectRandomSong(db);

      if ( 
        !song ||
        !song.link ||
        ytdl.validateID(song.link)
      ) continue;

      const basicInfo = await getSongInfo(song.link);

      if (!basicInfo) continue;

      await queueSong(song.link, basicInfo);

    } catch (err){
      console.error(`Error queueing audio: ${err}`);
    };
  }
};


function checkProcessingComplete(
  tracker: tracker
): boolean{
  const { ytdlDone, transcodeAudioDone, passToDestinationDone} = tracker;
  return ytdlDone && transcodeAudioDone && passToDestinationDone;
}


async function getSongInfo(
  src: string
): Promise<songInfo | undefined>{

  try {
    const { videoDetails } = await ytdl.getBasicInfo(src);
  
    return {
      title: videoDetails.title,
      duration: videoDetails.lengthSeconds,
      channel: videoDetails.ownerProfileUrl
    };
  } catch (err){
    console.error(`Error getting song info: ${err}`)
  }
};


function showProgress(
  downloaded: number,
  processed: number
): void{

  readline.cursorTo(process.stdout, 0);
  process.stdout.write(`${Math.floor((downloaded) / 1000)}kb downloaded\n`);
  process.stdout.write(`${processed}kb processed`);
  readline.moveCursor(process.stdout, 0, -1);
};