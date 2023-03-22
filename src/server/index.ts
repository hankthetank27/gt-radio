import express from "express";
import ffmpeg from 'fluent-ffmpeg';
import dotenv from 'dotenv';
import ViteExpress from "vite-express";
import NodeMediaServer from 'node-media-server';
import cookieParser from 'cookie-parser';
import { Server } from "socket.io";
import { AudioStream } from "./livestream/AudioStream";
import { configNms } from "./configNms";
import { initGtArchive } from "./db/gtArchive";
import { songInfo } from "../@types";
import { serverEmiters, clientEmiters } from "../socketEvents";


async function main(): Promise<void>{
  
  dotenv.config();
  const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
  ffmpeg.setFfmpegPath(ffmpegPath);
  
  const app = express();
  app.use(cookieParser())
  app.use(express.json());
  app.use(express.urlencoded({
    extended: true
  }));

  const nms = new NodeMediaServer(configNms(ffmpegPath));
  nms.run();

  const gtArchiveDB = await initGtArchive();

  if (gtArchiveDB){
    console.log('connected to mongoDb: gt_data');
  } else {
    throw new Error('Could not connect to mongoDb: gt_data');
  };
  
  const mainAudioStream = new AudioStream('main', gtArchiveDB);
  mainAudioStream.startStream();
  
  const server = ViteExpress.listen(app, 3000, () =>
    console.log("Server is listening on port 3000...")
  );
  
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });
  
  io.on('connection', (socket) => {
  
    mainAudioStream.on('currentlyPlaying', (songData: songInfo) => {
      socket.emit(serverEmiters.CURRENTLY_PLAYING, songData);
    });
  
    socket.on(clientEmiters.FETCH_CURRENTLY_PLAYING, () => {
      socket.emit(serverEmiters.CURRENTLY_PLAYING, mainAudioStream.getCurrentlyPlaying());
    });

    socket.on(clientEmiters.CHAT_MESSAGE, async (message: string[]) => {
      socket.broadcast.emit(serverEmiters.RECEIVE_CHAT_MESSAGE, message)
    });

    socket.on(clientEmiters.SET_SOCKET_ID, (setUserId: (userId: string) => void) => {
      setUserId(socket.id);
    });


  
  });
};

main();