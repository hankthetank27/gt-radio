import express from "express";
import ViteExpress from "vite-express";
import { Server } from "socket.io";
import ffmpeg from 'fluent-ffmpeg';
import { startAudioStream } from "./audioStream";
import { configMainStream } from "./configMainStream";
import NodeMediaServer from 'node-media-server';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

const RTMPconfig = configMainStream(ffmpegPath);
const nms = new NodeMediaServer(RTMPconfig);
nms.run();

const app = express();
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({
  extended: true 
}));

const server = ViteExpress.listen(app, 3000, () =>
console.log("Server is listening on port 3000...")
);

const io = new Server(server);
const songDisplayer = startAudioStream('main');

io.on('connection', (socket) => {
  console.log('A client connected');

  socket.emit('currentlyPlaying', songDisplayer.currentlyPlaying);

  songDisplayer.on('currentlyPlaying', (songData) => {
    socket.emit('currentlyPlaying', songData);
  });

  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });
});