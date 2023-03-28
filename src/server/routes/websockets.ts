import { chat } from "../db/chat";
import { Server } from "socket.io";
import { songInfo, chatMessage } from "../../@types";
import { serverEmiters, clientEmiters } from "../../socketEvents";
import { AudioStream } from "../livestream/AudioStream";
import jwt from 'jsonwebtoken';

interface imports{
  mainAudioStream: AudioStream;
}

export function connectWebsockets(
  io: Server, {
    mainAudioStream
  }: imports
): void{

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
      // TODO: emit error event back to sender on all 
      // currently undefined returns (event: CHAT_MESSAGE_ERROR)
      try {
        if (message.message.length > 500) return;
        if (!process.env.JWT_KEY) return;
  
        const { username } = jwt.verify(
          token, 
          process.env.JWT_KEY
        ) as jwt.JwtPayload;
  
        if (username !== message.userId) return;
  
        socket.broadcast.emit(
          serverEmiters.RECEIVE_CHAT_MESSAGE, chat.addMessage(message)
        );
      } catch (err) {
        return;
      }
    });
  });
};
