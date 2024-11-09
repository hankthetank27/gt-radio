import { Db } from "mongodb";
import { AudioStream, TEARDOWN_STREAM } from "./AudioStream";
import { Server } from "socket.io";

export class Broadcast {
  reinitTrys: number;
  main: AudioStream;
  db: Db;
  io: Server;
  constructor(
    db: Db,
    io: Server
  ) {
    this.reinitTrys = 0;
    this.db = db;
    this.io = io;
    this.main = new AudioStream('main', db, io);
  };

  async init() {
    try {
      await this.main.startStream();
      this.main.on(TEARDOWN_STREAM, async () => {
        console.error('Main audio stream failed. Attempting to reinitialize...');
        this.main = new AudioStream('main', this.db, this.io);
        await this.init();
      });
      this.reinitTrys = 0;
      return this;
    } catch (e) {
      console.error(`Error inititalizing braodcast: ${e}`);
      if (this.reinitTrys >= 3) {
        return;
      } else {
        console.log("Attempting to reinitalise Broadcast...");
        this.reinitTrys++;
        this.main.initiateStreamTeardown();
      }
    }
  }
}
