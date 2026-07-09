import { io } from 'socket.io-client';
import { API_BASE_URL } from './api';

let socket = null;

export const initSocket = (userId) => {
  const socketUrl = API_BASE_URL.replace('/api', '');
  socket = io(socketUrl, { withCredentials: true });
  socket.on('connect', () => { if (userId) socket.emit('join', userId); });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};
