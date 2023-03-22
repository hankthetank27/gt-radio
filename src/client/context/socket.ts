import { io } from 'socket.io-client';
import { createContext } from 'react';


const URL = `${import.meta.env.VITE_API_URL}:3000`;

export const socket = io(URL, {
  transports: ['websocket']
});
export const SocketContext = createContext({
  socket: socket,
  isConnected: false 
});