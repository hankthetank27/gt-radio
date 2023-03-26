import { chatMessage } from "../../@types";

interface chat{
  messages: chatMessage[];
  addMessage: (m: chatMessage) => chatMessage[];
};

export const chat: chat = {
  messages: [],
  addMessage: (message: chatMessage) => {
    chat.messages.push(message);
    if (chat.messages.length > 50){
      chat.messages.shift();
    };
    return chat.messages;
  }
};
