import { io } from 'socket.io-client';
import { createContext } from 'react';


export const socket = io('/', {
  transports: ['websocket']
});
export const SocketContext = createContext({
  socket: socket,
  isConnected: false 
});