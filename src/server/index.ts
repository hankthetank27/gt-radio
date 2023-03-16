import express from "express";
import ViteExpress from "vite-express";
import { Server } from "socket.io";
import ffmpeg from 'fluent-ffmpeg';
import { startAudioStream } from "./livestream/audioStream";
import { configMainStream } from "./nmsConfig";
import NodeMediaServer from 'node-media-server';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { initGtArchive } from "./db/gtArchive";
import { songInfo } from "../@types";


async function main(){
  dotenv.config();
  const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
  ffmpeg.setFfmpegPath(ffmpegPath);
  
  const app = express();
  app.use(cookieParser())
  app.use(express.json());
  app.use(express.urlencoded({
    extended: true 
  }));

  const gtArchiveDB = await initGtArchive();

  if (gtArchiveDB){
    console.log('connected to mongoDb: gt_data');
  } else {
    throw new Error('Could not connect to mongoDb: gt_data');
  };

  const songDisplayer = startAudioStream('main', gtArchiveDB);
  
  const RTMPconfig = configMainStream(ffmpegPath);
  const nms = new NodeMediaServer(RTMPconfig);
  nms.run();
  
  const server = ViteExpress.listen(app, 3000, () =>
    console.log("Server is listening on port 3000...")
  );
  
  const io = new Server(server);
  
  io.on('connection', (socket) => {
    console.log('A client connected');
  
    songDisplayer.on('currentlyPlaying', (songData: songInfo) => {
      socket.emit('currentlyPlaying', songData);
    });
  
    socket.on('fetchCurrentlyPlaying', () => {
      socket.emit('currentlyPlaying', songDisplayer.currentlyPlaying);
    })
  
    socket.on('disconnect', () => {
      console.log('A client disconnected');
    });
  });
}

main();