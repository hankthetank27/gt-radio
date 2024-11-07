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

  init() {
    this.main.on(TEARDOWN_STREAM, () => {
      this.main = new AudioStream('main', this.db, this.io);
      this.init();
    })
    this.main.startStream();
    return this;
  }
}
