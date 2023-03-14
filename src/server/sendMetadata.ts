import fs from 'node:fs/promises';
import EventEmitter from 'node:events';
// @ts-ignore
import { Parser } from 'm3u8-parser'


export class SongDisplayer extends EventEmitter{
  mediaPath: string;
  currentlyPlaying: string;
  constructor(hlsMediaPath: string){
    super();
    this.mediaPath = hlsMediaPath;
    this.currentlyPlaying = '';

    this.on('currentlyPlaying', (songInfo) => {
      this.currentlyPlaying = songInfo;
    });
  }
  async displayCurrentSong(songInfo: string){

    const segments = await getM3u8Segments(this.mediaPath);
    if (!segments){
      return this.emit('currentlyPlaying', songInfo);
    };
  
    const leastRecentSegment = segments[segments.length - 1];
    const hlsWatcher = fs.watch(this.mediaPath);
  
    for await (const event of hlsWatcher){
      const { eventType, filename } = event;
  
      if (eventType === 'change' && filename.split('.')[1] === 'ts'){
        const m3u8Manifest = await getM3u8Segments(this.mediaPath);
        if (!m3u8Manifest.includes(leastRecentSegment)){
          return this.emit('currentlyPlaying', songInfo);
        };
      };
    };
  };
}

async function getM3u8Segments(mediaPath: string) {
  const m3u8FilePath = `${mediaPath}/index.m3u8`;
  const fileStr = await fs.readFile(m3u8FilePath, {
    encoding: 'utf-8'
  });
  const segments = parseM3u8(fileStr).segments;
  if (!segments) return null;
  return segments.map(
    (s: Record<string, number | string>) => s.uri
  );
};

function parseM3u8(file: string){
  const parser = new Parser();
  parser.push(file);
  parser.end();
  return parser.manifest;
};


//When pipe to HLS starts, check TS at back of m3u8 queue and store
//watch TS updates, and when that file no longer exists in queue, send metadata to client