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
  };

  
  async queueDisplaySong(
    songInfo: string
  ): Promise<undefined>{
    
    const segments = await this._getM3u8Segments(this.mediaPath);

    if (!segments){
      this.emit('currentlyPlaying', songInfo);
      return;
    };

    const leastRecentSegment = segments[segments.length - 1];
    const hlsWatcher = fs.watch(this.mediaPath);

    for await (const { eventType, filename } of hlsWatcher){

      if (eventType === 'change' && filename.split('.')[1] === 'ts'){

        const m3u8Manifest = await this._getM3u8Segments(this.mediaPath);

        if (!m3u8Manifest.includes(leastRecentSegment)){
          this.emit('currentlyPlaying', songInfo);
          return;
        };
      };
    };
  };


  async _getM3u8Segments(
    mediaPath: string
  ): Promise<string[]>{

    const m3u8FilePath = `${mediaPath}/index.m3u8`;
    const fileStr = await fs.readFile(m3u8FilePath, {
      encoding: 'utf-8'
    });
    const segments = this._parseM3u8(fileStr).segments;

    if (!segments){
      return [];
    };

    return segments.map(
      (s: Record<string, number | string>) => s.uri
    );
  };


  _parseM3u8(file: string){
    const parser = new Parser();
    parser.push(file);
    parser.end();
    return parser.manifest;
  };
};



// sort of interesting take on using closures to "extend" a class. Unsure of performance drawbacks.
// might cause memory issues bc not using prototypes?

  // export interface SongDisplayer{
  //   queueDisplaySong: (songInfo: string) => void;
  //   on: (event: string, cb: (...args: any) => any) => void;
  //   getCurrentlyPlaying: () => string;
  // }
  
  
  // export function MakeSongDisplayer(
  //   mediaPath: string
  // ){
  //   const eventEmitter = new EventEmitter();
  //   let currentlyPlaying = '';
  
  //   eventEmitter.on('currentlyPlaying', (songInfo) => {
  //     currentlyPlaying = songInfo;
  //   });
  
  //   return {
  //     queueDisplaySong: (songInfo: string) => {
  //       queueDisplaySong(
  //         songInfo,
  //         mediaPath,
  //         eventEmitter
  //       );
  //     },
  //     on: (event: string, cb: (...args: any) => any) => {
  //       eventEmitter.on(event, cb);
  //     },
  //     getCurrentlyPlaying: () => currentlyPlaying
  //   };
  // };
  
  
  // async function queueDisplaySong(
  //   songInfo: string,
  //   mediaPath: string,
  //   eventEmitter: EventEmitter
  // ): Promise<undefined>{
    
  //   const segments = await _getM3u8Segments(mediaPath);
  
  //   if (!segments){
  //     eventEmitter.emit('currentlyPlaying', songInfo);
  //     return;
  //   };
  
  //   const leastRecentSegment = segments[segments.length - 1];
  //   const hlsWatcher = fs.watch(mediaPath);
  
  //   for await (const { eventType, filename } of hlsWatcher){
  
  //     if (eventType === 'change' && filename.split('.')[1] === 'ts'){
  
  //       const m3u8Manifest = await _getM3u8Segments(mediaPath);
  
  //       if (!m3u8Manifest.includes(leastRecentSegment)){
  //         eventEmitter.emit('currentlyPlaying', songInfo);
  //         return;
  //       };
  //     };
  //   };
  // };
  
  
  // async function _getM3u8Segments(
  //   mediaPath: string
  // ): Promise<string[]>{
  
  //   const m3u8FilePath = `${mediaPath}/index.m3u8`;
  //   const fileStr = await fs.readFile(m3u8FilePath, {
  //     encoding: 'utf-8'
  //   });
  //   const segments = _parseM3u8(fileStr).segments;
  
  //   if (!segments){
  //     return [];
  //   };
  
  //   return segments.map(
  //     (s: Record<string, number | string>) => s.uri
  //   );
  // };
  
  
  // function _parseM3u8(file: string){
  //   const parser = new Parser();
  //   parser.push(file);
  //   parser.end();
  //   return parser.manifest;
  // };