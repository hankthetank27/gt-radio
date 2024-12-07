import { Response, Request, NextFunction } from "express";
import { chatMessage } from "../../@types";
import { Db, ObjectId } from 'mongodb';

interface Chat{
  getMessageRange: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getHistory: (db: Db) => Promise<chatMessage[] | undefined>
  addMessage: (m: chatMessage, db: Db) => Promise<chatMessage | undefined>;
};

export const chat: Chat = {

  getMessageRange: async (req, res, next) => {
    try{
      const startIdStr = req.query.startId;
      const amount = req.query.amount;
      if (!startIdStr || !amount) {
        return next("invalid queries");
      }
      const startId = new ObjectId(startIdStr as string);
      const messages = await req.app.locals.gtdb
        .collection("chat_history")
        .find({ _id: { $lt: startId } })
        .sort({ _id: -1 })       
        .limit(parseInt(amount as string))
        .toArray();
      if (!messages) {
        return next("Couldn't find messages");
      }
      messages.reverse();
      res.locals.messages = messages;
      return next();
    } catch(err) {
      console.error(`Error getting range: ${err}`);
      return next("Error getting messages");
    }
  },

  getHistory: async (db: Db) => {
    try{
      const chatHistory = await db
        .collection('chat_history')
        .find()
        .sort({ _id: -1 })
        .limit(40)
        .toArray();
      const res = chatHistory
        .map(m => {
          return {
            _id: m._id.toHexString(),
            userId: m.userId,
            message: m.message,
            timeStamp: m.timeStamp,
            color: m.color
          }
        });
      res.reverse();
      return res;
    } catch(err){
      console.error(`Could not retrive chat history: ${err}`);
      return undefined;
    };
  },


  addMessage: async (message: chatMessage, db: Db) => {
    try{
      const res = await db
        .collection('chat_history')
        .insertOne({
          userId: message.userId,
          message: message.message,
          timeStamp: message.timeStamp,
          color: message.color
        });

      if (!res.insertedId) {
        throw new Error("Could not insert message");
      }

      return {
        _id: res.insertedId.toHexString(),
        userId: message.userId,
        message:message.message,
        timeStamp: message.timeStamp,
        color: message.color
      };

    } catch(err){
      console.error(`Could not update chat history: ${err}`);
    }
  }
};
