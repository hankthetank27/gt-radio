import express from "express";
import ffmpeg from 'fluent-ffmpeg';
import dotenv from 'dotenv';
import ViteExpress from "vite-express";
import NodeMediaServer from 'node-media-server';
import cookieParser from 'cookie-parser';
import { Server } from "socket.io";
import { AudioStream } from "./livestream/AudioStream";
import { configNms } from "./configNms";
import { chat } from "./db/chat";
import { initGtArchive } from "./db/gtArchive";
import { songInfo, chatMessage } from "../@types";
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
  
  // app.use((req, res, next) => {
    //   const error = new Error(`Page not found - ${req.originalUrl}`)
    //   res.status(404)
    //   next(error)
    // });
  app.get('/api/chatHistory', (_, res) => {
    res.json(chat.messages);
  })
    
  const server = ViteExpress.listen(app, 3000, () =>
    console.log("Server is listening on port 3000...")
  );
  
  const io = new Server(server, {
      cors: {
      origin: `*`,
      methods: ['GET', 'POST']
    }
  });
  
  const mainAudioStream = new AudioStream('main', gtArchiveDB);
  mainAudioStream.startStream();

  mainAudioStream.on('currentlyPlaying', (songData: songInfo) => {
    io.emit(serverEmiters.CURRENTLY_PLAYING, songData);
  });
  

  io.on('connection', (socket) => {
  
    // stream related ~~~~~~~~~~~~~~~~~~
    socket.on(clientEmiters.FETCH_CURRENTLY_PLAYING, () => {
      socket.emit(serverEmiters.CURRENTLY_PLAYING, mainAudioStream.getCurrentlyPlaying());
    });

    // chat related ~~~~~~~~~~~~~~~~~~~~
    socket.on(clientEmiters.SET_SOCKET_ID, (setUserId: (userId: string) => void) => {
      setUserId(socket.id);
    });
    
    socket.on(clientEmiters.CHAT_MESSAGE, (message: chatMessage) => {
      socket.broadcast.emit(serverEmiters.RECEIVE_CHAT_MESSAGE, chat.addMessage(message));
    });
  });
};

main();