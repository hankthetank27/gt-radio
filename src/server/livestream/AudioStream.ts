import fs from 'fs/promises';
import path from 'path';
import ytdl from "ytdl-core";
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from "node:stream";
import { songInfo, streamProcessTracker } from '../../@types';
import { Db, Document } from 'mongodb';
import { EventEmitter } from 'stream';
// @ts-ignore
import { Parser } from 'm3u8-parser';



export class AudioStream extends EventEmitter{
  #stream: PassThrough
  #isLive: boolean
  #currentlyPlaying: songInfo | null;
  readonly db: Db
  readonly streamName: string;
  readonly hlsMediaPath: string;

  constructor(
    streamName: string,
    db: Db
    ){
      super();
      // size of mp3 chunk
      this.#stream = this._createStream(400);
      this.#isLive = false;
      this.#currentlyPlaying = null;
      this.db = db;
      this.streamName = streamName 
      this.hlsMediaPath = path.resolve(
        __dirname, `../../../media/live/${streamName}/`
      );
  };


  async startStream(): Promise<void>{

    this.#isLive = true;
    this._initSongQueue();

    ffmpeg(this.#stream)
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
      .save(`rtmp://localhost/live/${this.streamName}.flv`);
  };


  // TODO:
  stopStream(): void{
    this.#isLive = false;
    this.#currentlyPlaying = null;
    this.#stream.destroy();
    this.#stream = this._createStream(400);
  };


  getCurrentlyPlaying(): songInfo | null{
    return this.#currentlyPlaying;
  };


  private _createStream(
    bufferSize: number
  ): PassThrough{
    return new PassThrough({
      highWaterMark: bufferSize
    });
  };


  private async _initSongQueue(){
    while (this.#isLive){
      try {

        const song = await this._selectRandomSong();
        const songInfo = await this._getSongInfo(song);
  
        // TODO: continue on song duration or DL size?
        // songInfo.duration, songInfo.length
        if (!songInfo) continue;

        await this._pushSong(songInfo);
  
      } catch (err){
        console.error(`Error queuing audio: ${err}`);
      };
    };
  };


  private _pushSong(
    songInfo: songInfo
  ): Promise<void>{
      
    return new Promise<void>(async (resolve, reject) => {

      // use extra passthorough to manually destroy stream, preventing 
      // memory leak caused by end option in call to pipe.
      const passToDestination = this._createStream(songInfo.length);
      
      const tracker: streamProcessTracker = {
        startTime: Date.now(),
        downloaded: 0,
        processed: 0,
        passThroughFlowing: false,
        ytdlDone: false,
        transcodeAudioDone: false,
        passToDestinationDone: false
      };

      function resolveQueue(
        tracker: streamProcessTracker
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
        tracker: streamProcessTracker
      ): boolean{

        const { 
          ytdlDone, 
          transcodeAudioDone, 
          passToDestinationDone
        } = tracker;

        return (
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
            this._queueDisplaySong(songInfo);
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
        .pipe(this.#stream, {
          end: false
        });
    });
  };


  private async _getSongInfo(
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
      title: videoDetails.title,
      memberPosted: src?.user_name,
      postText: src?.text,
      datePosted: src?.date_posted,
      src: videoDetails.video_url || src.link,
      duration: videoDetails.lengthSeconds,
      channel: videoDetails.ownerProfileUrl,
      itag: format.itag,
      length: Number(format.contentLength)
    };
  };


  private async _selectRandomSong(): Promise<Document | null>{
    const posts = this.db.collection('gt_posts');
    const post = await posts.aggregate([
        { $match: { link_source: 'youtube'}},
        { $sample: { size: 1 }}
      ])
      .toArray();
  
    if (!post?.[0]){
      return null;
    };
    return post[0];
  };


  private async _queueDisplaySong(
    songInfo: songInfo
  ): Promise<undefined>{
    
    const segments = await this._getM3u8Segments(this.hlsMediaPath);

    if (!segments){
      this.#currentlyPlaying = songInfo;
      this.emit('currentlyPlaying', songInfo);
      return;
    };

    const leastRecentSegment = segments[segments.length - 1];
    const hlsWatcher = fs.watch(this.hlsMediaPath);

    for await (const { eventType, filename } of hlsWatcher){

      if (eventType === 'change' && filename.split('.')[1] === 'ts'){

        const m3u8Manifest = await this._getM3u8Segments(this.hlsMediaPath);

        if (!m3u8Manifest.includes(leastRecentSegment)){
          this.#currentlyPlaying = songInfo;
          this.emit('currentlyPlaying', songInfo);
          return;
        };
      };
    };
  };


  private async _getM3u8Segments(
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


  private _parseM3u8(file: string){
    const parser = new Parser();
    parser.push(file);
    parser.end();
    return parser.manifest;
  };
};

