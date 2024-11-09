import fs from 'fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough, Readable } from "node:stream";
import { streamProcessTracker } from '../../@types';
import { Db, ObjectId } from 'mongodb';
import { EventEmitter } from 'stream';
import { serverEmiters } from '../../socketEvents';
import { Server } from 'socket.io';
import { SongDocument } from '../../@types';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
// @ts-ignore
import { Parser as m3u8Parser } from 'm3u8-parser';

export const TEARDOWN_STREAM = 'teardownStream';
const HLS_TIME = 4;

export class AudioStream extends EventEmitter{
  #stream: PassThrough
  #isLive: boolean
  #currentlyPlaying: SongDocument | null;
  #ffmpegCmd?: ffmpeg.FfmpegCommand;
  s3Client: S3Client;
  readonly db: Db
  readonly streamName: string;
  readonly hlsMediaPath: string;
  
  constructor(
    streamName: string,
    db: Db,
    io: Server
  ) {
    super();
    // size of mp3 chunk
    this.#stream = this._createStream(400);
    this.#isLive = false;
    this.#currentlyPlaying = null;
    this.db = db;
    this.streamName = streamName;
    this.s3Client = new S3Client({ region: "us-east-1", });
    this.hlsMediaPath = path.resolve(
      __dirname, `../../../media/live/${streamName}/`
    );

    this.on(serverEmiters.CURRENTLY_PLAYING, (songData: SongDocument) => {
      io.emit(serverEmiters.CURRENTLY_PLAYING, songData);
    });
  };
      
      
  async startStream(): Promise<AudioStream>{
    if (this.#isLive){
      console.error('Streaming in progress, cannot start stream in this state');
      return this;
    };

    await this._clearHlsSegments();

    this.#isLive = true;
    this._queueAudio();

    ffmpeg(this.#stream)
      .inputOptions([
        '-re',
      ])
      .addOptions([
        '-c:a aac',
        '-b:a 128k',
        '-ar 44100',
        '-map 0:a',
        '-f hls',
        `-hls_time ${HLS_TIME}`,
        '-hls_list_size 4',
        '-hls_flags delete_segments', //+split_by_time',
      ])
      .output(path.join(this.hlsMediaPath, "index.m3u8"))
      .on('error', async (err, stdout, stderr) => {
        console.log('Error transcoding stream to HLS: ' + err.message);
        console.log('ffmpeg output:\n' + stdout);
        console.log('ffmpeg stderr:\n' + stderr);
        await this.initiateStreamTeardown();
      })
      .on('end', async () => {
        console.error("Streaming unexpectedly complete...");
        await this.initiateStreamTeardown();
      })
      .run();

    return this;
  };


  async initiateStreamTeardown(): Promise<void>{
    try {
      this.#isLive = false;
      this.#stream.destroy();
      if (this.#ffmpegCmd) {
        this.#ffmpegCmd.kill('SIGKILL');
      };
      await this._clearHlsSegments();
      this.emit(TEARDOWN_STREAM);
    } catch(e) {
      console.error(`Error trearingdown stream. Still firing teardown event. ${e}`);
      this.emit(TEARDOWN_STREAM);
    }
  };


  isLive(): boolean {
    return this.#isLive;
  };


  getCurrentlyPlaying(): SongDocument | null{
    return this.#currentlyPlaying;
  };


  private _createStream(
    bufferSize: number
  ): PassThrough{
    return new PassThrough({
      highWaterMark: bufferSize
    });
  };


  private async _clearHlsSegments(): Promise<void> {
    try {
      for (const file of await fs.readdir(this.hlsMediaPath)) {
        await fs.unlink(path.join(this.hlsMediaPath, file));
      }
    } catch(e) {
      console.error(`Error deleteing HLS segements. ${e}`);
    }
  };


  private async _queueAudio(): Promise<void>{
    while (this.#isLive){
      try {
        const song = await this._selectRandomSong();

        if (!song) continue;

        await this._pushSong(song);

        if (!song.has_been_played) this._flagAsPlayed(song);

      } catch (err){
        console.error(`Error queuing audio: ${err}`);
      };
    };
    this.#currentlyPlaying = null;
    this.emit(serverEmiters.CURRENTLY_PLAYING, null);
  };


  private _pushSong(
    songInfo: SongDocument
  ): Promise<void>{
    return new Promise<void>(async (resolve, reject) => {
      if (!songInfo.s3_file_data) {
        return reject('Song contains no audio data');
      }

      const rejectCallback = () => rejectQueue('Stream teardown initiated');
      this.on(TEARDOWN_STREAM, rejectCallback);
      const cleanup = () => {
        this.removeListener(TEARDOWN_STREAM, rejectCallback);
        passToDestination.unpipe();
        passToDestination.destroy();
      };

      // use extra passthorough to manually destroy stream, preventing 
      // memory leak caused by end option in call to pipe.
      const passToDestination = this._createStream(songInfo.s3_file_data.length);

      const command = new GetObjectCommand({
        Bucket: songInfo.s3_file_data.bucket,
        Key: songInfo.s3_file_data.key,
      });

      const tracker: streamProcessTracker = {
        startTime: Date.now(),
        downloaded: 0,
        processed: 0,
        passThroughFlowing: false,
        passToDestinationDone: false,
        debounceParse: false,
        debounceTimeout: undefined,
      };

      function resolveQueue(
        tracker: streamProcessTracker
      ): void {
        const completionTime = Math.round(
            ((Date.now() - tracker.startTime) / 60000) * 10
          ) / 10;
        console.log(`Completed processing in ${completionTime}m`);
        cleanup();
        resolve();
      };


      function rejectQueue(
        err: string
      ): void{
        cleanup();
        reject(err);
      };

      console.log(`Download started... ${songInfo.track_title || "untitled tune..."}`);

      const song = await this.s3Client.send(command);
      if (!song.Body) {
        return rejectQueue("File has no body");
      }
      
      passToDestination
        .on('data', async () => {
          if (!tracker.debounceParse) {
            tracker.debounceParse = true;
            this._validateM3u8Segments(this.hlsMediaPath);
          } else {
            clearTimeout(tracker.debounceTimeout);
          }
          tracker.debounceTimeout = setTimeout(() => {
            tracker.debounceParse = false;
          }, 1000);
          if (!tracker.passThroughFlowing){
            tracker.passThroughFlowing = true;
            this._queueDisplaySong(songInfo);
          };
        })
        .on('end', () => {
          resolveQueue(tracker);
        })
        .on('error', (err) => {
          rejectQueue(`Error in queueSong -> passToDestination: ${err}`);
        });

      const webStream = song.Body.transformToWebStream();
      const songStream = Readable.fromWeb(
        webStream as import("stream/web").ReadableStream<any>
      );

      songStream
        .pipe(passToDestination)
        .pipe(this.#stream, {
          end: false
        });
    });
  };


  private async _selectRandomSong(): Promise<SongDocument | null>{
    const posts = this.db.collection('gt_posts');
    const post = await posts.aggregate([
        { $match: { s3_file_data: { $exists: true } }},
        { $sample: { size: 1 }}
      ])
      .toArray();
  
    if (!post?.[0]){
      return null;
    };

    return post[0] as SongDocument;
  };


  private _flagAsPlayed(
    songInfo: SongDocument
  ): void{
    const posts = this.db.collection('gt_posts');
    posts.findOneAndUpdate(
      { _id: new ObjectId(songInfo._id), },
      { $set: {
          has_been_played: true,
          date_aired: new Date()
        }
      }
    );
  };

  private async _queueDisplaySong(
    songInfo: SongDocument
  ): Promise<void>{
    
    const segments = await this._getM3u8Segments(this.hlsMediaPath);

    if (!segments){
      this.#currentlyPlaying = songInfo;
      this.emit(serverEmiters.CURRENTLY_PLAYING, songInfo);
      return;
    };

    const leastRecentSegment = segments[segments.length - 1];
    const hlsWatcher = fs.watch(this.hlsMediaPath);

    for await (const { eventType, filename } of hlsWatcher){
      const filenameArr = filename.split('.');
      if (eventType === 'change' && filenameArr[filenameArr.length - 1] === 'ts'){
        const m3u8Manifest = await this._getM3u8Segments(this.hlsMediaPath);
        if (
          !m3u8Manifest ||
          m3u8Manifest[0] === leastRecentSegment ||
          !m3u8Manifest.includes(leastRecentSegment)
        ){
          this.#currentlyPlaying = songInfo;
          this.emit(serverEmiters.CURRENTLY_PLAYING, songInfo);
          return;
        };
      };
    };
  };


  private async _getM3u8Segments(
    mediaPath: string
  ): Promise<string[] | undefined>{
    try {
      const validSegments = await this._validateM3u8Segments(mediaPath);
      return validSegments?.map(s => s.uri);
    } catch (err) {
      console.warn(`Error getting m3u8 segments: ${err}`);
      return; 
    };
  };


  private async _validateM3u8Segments(
    mediaPath: string
  ): Promise<Record<string, string>[] | undefined> {
    try {
      const m3u8FilePath = `${mediaPath}/index.m3u8`;
      const fileStr = await fs.readFile(m3u8FilePath, {
        encoding: 'utf-8'
      });
      const { segments, targetDuration } = this._parseM3u8(fileStr);
      if (targetDuration && targetDuration !== HLS_TIME){
        console.warn(
          `\nindex.m3u8 target duration expected to be ${HLS_TIME} but is ${targetDuration}\n`
        );
        if (targetDuration > 20 || targetDuration <= 1){
          console.error('index.m3u8 target duration unstable. Tearing down stream...');
          await this.initiateStreamTeardown();
          return;
        }
      };
      return segments || [];
    } catch (err: any) {
      if (err?.code === 'ENOENT'){
       return;
      }
      console.warn(`Error parsing m3u8 segments: ${err}`);
    };
  }

  private _parseM3u8(file: string){
    const parser = new m3u8Parser();
    parser.push(file)
    parser.end();
    return parser.manifest;
  };
};

