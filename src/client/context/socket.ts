import { io } from 'socket.io-client';
import { createContext } from 'react';

const URL = 'http://localhost:3000';

export const socket = io(URL);
export const SocketContext = createContext(socket);