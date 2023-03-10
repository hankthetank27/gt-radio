import express from "express";
import ViteExpress from "vite-express";
import { Server } from "socket.io";
import ffmpeg from 'fluent-ffmpeg';
import { startAudioStream } from "./audioStream";
import { configMediaServer } from "./configMediaServer";
import NodeMediaServer from 'node-media-server';
import cookieParser from 'cookie-parser'

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const RTMPconfig = configMediaServer(ffmpegPath);
const nms = new NodeMediaServer(RTMPconfig);
nms.run();

startAudioStream();

const server = ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000...")
);

const io = new Server(server);

io.on('connection', (socket) => {
  console.log('A client connected');

  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });
});