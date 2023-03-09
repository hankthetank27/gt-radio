import ytdl from "ytdl-core";
import ffmpeg from 'fluent-ffmpeg';

export function startAudioStream(){

  const ref = 'https://youtu.be/ICo6pRMRpkk';

  const stream = ytdl(ref, {
      filter: 'audioonly',
      quality: 'highestaudio'
    }
  );

  ffmpeg(stream)
    .inputOptions([
      '-re'
    ])
    .outputOption([
      // '-c:v libx264',
      // '-preset veryfast',
      // '-tune zerolatency',
      '-c:a aac',
      '-ar 44100',
    ])
    .save('rtmp://localhost/live/main.flv');
  };