import ytdl from "ytdl-core";
import ffmpeg from 'fluent-ffmpeg'

export function handleAudioStream(){

  const ref = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

  const stream = ytdl(ref
    // , { 
    //     filter: 'audioonly',
    //     quality: 'highestaudio'
    //   }
    )

  ffmpeg(stream)
    .inputOptions(['-re'])
    .outputOption([
    '-c:v libx264',
    '-preset veryfast',
    '-tune zerolatency',
    '-c:a aac',
    '-ar 44100',
    '-f flv'
  ])
  .save('rtmp://localhost/live/main.flv')
}