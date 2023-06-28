import { chatMessage } from "../../@types";
import { Db } from 'mongodb';

interface chat{
  messages: chatMessage[];
  populateHistory: (db: Db) => Promise<void>
  addMessage: (m: chatMessage, db: Db) => chatMessage[] | undefined;
};

export const chat: chat = {

  messages: [],


  populateHistory: async (db: Db) => {
    try{
      const chatHistory = await db
        .collection('chat_history')
        .find()
        .sort({ timeStamp: -1 })
        .limit(100)
        .toArray();

      if (chatHistory.length){
        chat.messages = chatHistory
          .map(m => {
            return {
              userId: m.userId,
              message: m.message,
              timeStamp: m.timeStamp,
              color: m.color
            }
          })
          .reverse();
      };
    } catch(err){
      console.error(`Could not retrive chat history: ${err}`);
    };
  },


  addMessage: (message: chatMessage, db: Db) => {
    try{
      db
        .collection('chat_history')
        .insertOne({
          userId: message.userId,
          message: message.message,
          timeStamp: message.timeStamp,
          color: message.color
        });

      chat.messages.push(message);

      if (chat.messages.length > 100){
        chat.messages.shift();
      };

      return chat.messages;
    } catch(err){
      console.error(`Could not update chat history: ${err}`);
    }
  }
};
