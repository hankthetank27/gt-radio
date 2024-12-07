import { chatMessage } from "../../@types";
import { Db } from 'mongodb';

interface Chat{
  getHistory: (db: Db) => Promise<chatMessage[] | undefined>
  addMessage: (m: chatMessage, db: Db) => Promise<chatMessage | undefined>;
};

export const chat: Chat = {

  getHistory: async (db: Db) => {
    try{
      const chatHistory = await db
        .collection('chat_history')
        .find()
        .sort({ _id: -1 })
        .limit(100)
        .toArray();
      const res = chatHistory
        .map(m => {
          return {
            _id: m._id,
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
        _id: res.insertedId,
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
