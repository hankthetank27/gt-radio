import { chat } from "../db/chat";
import { Server } from "socket.io";
import { songInfo, chatMessage } from "../../@types";
import { serverEmiters, clientEmiters } from "../../socketEvents";
import { AudioStream } from "../livestream/AudioStream";
import jwt from 'jsonwebtoken';
import { Socket } from "socket.io-client";

interface imports{
  mainAudioStream: AudioStream;
}

export function connectWebsockets(
  io: Server, {
    mainAudioStream
  }: imports
): void{

  function emitChatError(recipient: string, errorMsg: string){
    io.to(recipient).emit(serverEmiters.CHAT_MESSAGE_ERROR, {
      errorMsg: errorMsg,
      messages: chat.messages
    });
  };

  mainAudioStream.on(serverEmiters.CURRENTLY_PLAYING, (songData: songInfo) => {
    io.emit(serverEmiters.CURRENTLY_PLAYING, songData);
  });
  
  io.on('connection', (socket) => {
    
    // stream related ~~~~~~~~~~~~~~~~~~
    socket.on(clientEmiters.FETCH_CURRENTLY_PLAYING, () => {
      socket.emit(
        serverEmiters.CURRENTLY_PLAYING, mainAudioStream.getCurrentlyPlaying()
        );
      });
      
      // chat related ~~~~~~~~~~~~~~~~~~~~
      
    socket.on(clientEmiters.SET_SOCKET_ID, (setUserId: (userId: string) => void) => {
      setUserId(socket.id);
    });
    
    socket.on(clientEmiters.CHAT_MESSAGE, (message: chatMessage, token: string) => {
      try {
        if (message.message.length > 500) {
          return emitChatError(
            socket.id,
            'Message cannot exceed 500 charaters'
          );
        };

        if (!process.env.JWT_KEY) {
          return emitChatError(
            socket.id,
            'Server error'
          );
        };
  
        const { username } = jwt.verify(
          token, 
          process.env.JWT_KEY
        ) as jwt.JwtPayload;
        
        if (username !== message.userId) {
          return emitChatError(
            socket.id, 
            'Please login to post a message'
          );
        };

        socket.broadcast.emit(
          serverEmiters.RECEIVE_CHAT_MESSAGE, chat.addMessage(message)
        );

      } catch (err) {
        return emitChatError(
          socket.id, 
          'Please login to post a message'
        );
      }
    });
  });
};
