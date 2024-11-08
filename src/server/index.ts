import express, { 
  ErrorRequestHandler, 
  Request, 
  Response 
} from 'express';
import next from 'next';
import { createServer } from 'http';
import ffmpeg from 'fluent-ffmpeg';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { Server } from "socket.io";
import { apiRouter, streamRouter } from "./routes/api";
import { initDB } from "./db/initDB";
import { registerWebsocketEvents } from "./routes/websockets";
import rateLimit from 'express-rate-limit';
import { chat } from './db/chat';
import { Broadcast } from './livestream/Broadcast';

dotenv.config();

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

const PORT = process.env.PORT || 3000;
const nextApp = next({ 
  dev: process.env.NODE_ENV !== 'production',
  dir: './src/client'
});
const handle = nextApp.getRequestHandler();

const apiLimiter = rateLimit({
	windowMs: 2 * 60 * 1000,
	max: 100, 
	standardHeaders: true,
	legacyHeaders: false, 
});

async function main(): Promise<void>{

  await nextApp.prepare();

  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({
    extended: true
  }));

  const server = createServer(app);
  const gtArchiveDB = await initDB();

  if (gtArchiveDB){
    console.log('connected to mongoDb: gt_data');
  } else {
    throw new Error('Could not connect to mongoDb: gt_data');
  };

  chat.populateHistory(gtArchiveDB);

  app.locals.gtdb = gtArchiveDB;

  app.use('/api', apiLimiter, apiRouter);
  app.use('/stream', streamRouter);

  app.get('*', (req, res) => {
    return handle(req, res)
  });

  app.use((_, res) => res.status(404).send('page not found'));

  const errorHandler: ErrorRequestHandler = (
    err: any,
    _: Request,
    res: Response, 
  ) => {
    const defaultErr = {
      log: 'Express error handler caught unknown middleware error',
      status: 500,
      message: { err: 'An error occurred' },
    };

    const errorObj = Object.assign({}, defaultErr, err);
    console.log(errorObj.log);
    return res.status(errorObj.status).json(errorObj.message);
  };

  app.use(errorHandler);

  const io = new Server(server, {
    cors: {
      origin: `*`,
      methods: ['GET', 'POST']
    }
  });

  const broadcast = new Broadcast(gtArchiveDB, io);
  await broadcast.init();

  registerWebsocketEvents(
    io, 
    broadcast, 
    gtArchiveDB
  );

  server.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}.`)
  });
};

main();
