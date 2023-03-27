import express from "express";
import ffmpeg from 'fluent-ffmpeg';
import dotenv from 'dotenv';
import ViteExpress from "vite-express";
import NodeMediaServer from 'node-media-server';
import cookieParser from 'cookie-parser';
import { Server } from "socket.io";
import { AudioStream } from "./livestream/AudioStream";
import { configNms } from "./configNms";
import { apiRouter } from "./routes/api";
import { initDB } from "./db/initDB";
import { connectWebsockets } from "./routes/websockets";


async function main(): Promise<void>{
  
  dotenv.config();
  const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
  ffmpeg.setFfmpegPath(ffmpegPath);

  const gtArchiveDB = await initDB();
  
  if (gtArchiveDB){
    console.log('connected to mongoDb: gt_data');
  } else {
    throw new Error('Could not connect to mongoDb: gt_data');
  };
  
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({
    extended: true
  }));

  app.locals.gtdb = gtArchiveDB;
  app.use('/api', apiRouter);
  
  const nms = new NodeMediaServer(configNms(ffmpegPath));
  nms.run();
  
  
  const mainAudioStream = new AudioStream('main', gtArchiveDB).startStream();
    
  const server = ViteExpress.listen(app, 3000, () =>
    console.log("Server is listening on port 3000...")
  ); 
  
  const io = new Server(server, {
      cors: {
      origin: `*`,
      methods: ['GET', 'POST']
    }
  });

  connectWebsockets(io, {
    mainAudioStream: mainAudioStream
  });
};

main();