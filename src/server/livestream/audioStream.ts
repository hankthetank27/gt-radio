import readline from 'readline';
import path from 'path';
import ytdl from "ytdl-core";
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from "node:stream";
import { songInfo, tracker } from '../@types';
import { SongDisplayer } from './songDisplayer';
import { Db, Document } from 'mongodb'
import { selectRandomSong } from './selectRandomSong';


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
    songInfo: songInfo
  ): Promise<void>{
      
    return new Promise<void>(async (resolve, reject) => {

      // use extra passthorough to manually destroy stream, preventing 
      // memory leak caused by end option in call to pipe.
      const passToDestination = createStream(songInfo.length);
      
      const tracker: tracker = {
        startTime: Date.now(),
        downloaded: 0,
        processed: 0,
        passThroughFlowing: false,
        ytdlDone: false,
        transcodeAudioDone: false,
        passToDestinationDone: false
      };

      function resolveQueue(
        tracker: tracker
      ): void{
        const completionTime = Math.round(
            ((Date.now() - tracker.startTime) / 60000) * 10
          ) / 10;
        console.log(`Completed processing in ${completionTime}m`);
        passToDestination.destroy();
        resolve();
      };


      function rejectQueue(
        err: string
      ): void{
        passToDestination.destroy();
        reject(err);
      };


      function checkProcessingComplete(
        tracker: tracker
      ): boolean{

        const { 
          ytdlDone, 
          transcodeAudioDone, 
          passToDestinationDone
        } = tracker;

        return(
          ytdlDone &&
          transcodeAudioDone &&
          passToDestinationDone
        );
      };
  
      console.log(`Download started... ${songInfo.title}`);

      const ytAudio = ytdl(songInfo.src, {
          filter: format => format.itag === songInfo.itag
        })
        .on('end', () => {
          tracker.ytdlDone = true;
          console.log('Downloading complete...')
        })
        .on('error', (err) => {
          rejectQueue(`Error in queueSong -> ytAudio: ${err}`);
        });
      
      const transcodeAudio = ffmpeg(ytAudio)
        .audioBitrate(128)
        .format('mp3')
        .on('end', () => {
          tracker.transcodeAudioDone = true;
          console.log('Transcoding complete...')
        })
        .on('error', (err) => {
          rejectQueue(`Error in queueSong -> transcodeAudio: ${err}`);
        });

      passToDestination
        .on('data', async () => {
          if (!tracker.passThroughFlowing){
            tracker.passThroughFlowing = true;
            songDisplayer.queueDisplaySong(songInfo.title);
          };
        })
        .on('end', () => {
          tracker.passToDestinationDone = true;
          if (checkProcessingComplete(tracker)){
            resolveQueue(tracker);
          } else {
            rejectQueue(`Error in queueSong. 
              passToDestination completed before audio transcoding finsished.`
            );
          };
        })
        .on('error', (err) => {
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
      const songInfo = await getSongInfo(song);

      if (!songInfo) continue;

      await queueSong(songInfo);

    } catch (err){
      console.error(`Error queueing audio: ${err}`);
    };
  };
};


async function getSongInfo(
  src: Document | null
): Promise<songInfo | null>{

  if ( 
    !src ||
    !src.link ||
    ytdl.validateID(src.link)
  ) return null;

  const {
    videoDetails, 
    formats 
  } = await ytdl.getInfo(src.link);
      
  const format = ytdl.chooseFormat(formats, {
    filter: 'audioonly',
    quality: 'highestaudio'
  });

  return {
    src: videoDetails.video_url || src.link,
    title: videoDetails.title,
    duration: videoDetails.lengthSeconds,
    channel: videoDetails.ownerProfileUrl,
    itag: format.itag,
    length: Number(format.contentLength)
  };
};


