import express from "express";
import ViteExpress from "vite-express";
import { Server } from "socket.io"
import ffmpeg from 'fluent-ffmpeg'
import { handleAudioStream } from "./audioStream";
import { configMediaServer } from "./configMediaServer";
import NodeMediaServer from 'node-media-server'

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

handleAudioStream()

const RTMPconfig = configMediaServer(ffmpegPath)
const nms = new NodeMediaServer(RTMPconfig)
nms.run()

// app.get('/stream', (_, res) => {
//   res.set('Content-Type', 'audio/mpeg')
//   return audioStream.pipe(res)
// })

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