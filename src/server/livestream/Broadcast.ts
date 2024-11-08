import { Db } from "mongodb";
import { AudioStream, TEARDOWN_STREAM } from "./AudioStream";
import { Server } from "socket.io";

export class Broadcast {
  main: AudioStream;
  db: Db;
  io: Server;
  constructor(
    db: Db,
    io: Server
  ) {
    this.db = db;
    this.io = io;
    this.main = new AudioStream('main', db, io);
  };

  async init() {
    await this.main.startStream();
    this.main.on(TEARDOWN_STREAM, async () => {
      console.error('Main audio stream failed. Attempting to reinitialize...');
      this.main = new AudioStream('main', this.db, this.io);
      await this.init();
    });
    return this;
  }
}
