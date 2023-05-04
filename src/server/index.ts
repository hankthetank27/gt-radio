import express, { 
    ErrorRequestHandler, 
    Request, 
    Response 
} from 'express';
import next from 'next';
import { createServer } from 'http';
import ffmpeg from 'fluent-ffmpeg';
import dotenv from 'dotenv';
import NodeMediaServer from 'node-media-server';
import cookieParser from 'cookie-parser';
import { Server } from "socket.io";
import { AudioStream } from "./livestream/AudioStream";
import { configNms } from "./configNms";
import { apiRouter } from "./routes/api";
import { initDB } from "./db/initDB";
import { registerWebsocketEvents } from "./routes/websockets";

dotenv.config();

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

const PORT = process.env.PORT || 3000;
const nextApp = next({ 
    dev: process.env.NODE_ENV !== 'production',
    dir: './src/client'
});
const handle = nextApp.getRequestHandler();


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

    app.locals.gtdb = gtArchiveDB;

    app.use('/api', apiRouter);

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

    const broadast = {
        main: new AudioStream('main', gtArchiveDB)
    };

    const nms = new NodeMediaServer(configNms(ffmpegPath));

    // reboot stream on interrupt
    nms.on('donePublish', (_, StreamPath) => {
        if (StreamPath === '/live/main'){
            broadast.main
                .initiateStreamTeardown();
            broadast.main = new AudioStream('main', gtArchiveDB)
                .startStream();
        };
    });

    nms.run();

    broadast.main
        .startStream();

    registerWebsocketEvents(io, broadast);

    server.listen(PORT, () => {
        console.log(`Server listening on port: ${PORT}.`)
    });
};

main();
