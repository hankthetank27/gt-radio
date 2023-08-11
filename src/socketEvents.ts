export const serverEmiters = {
  CONNECT : 'connect',
  DISCONNECT: 'disconnect',
  CURRENTLY_PLAYING: 'currently-playing',
  RECEIVE_CHAT_MESSAGE: 'receive-chat-message',
  CHAT_MESSAGE_ERROR: 'chat-message-error',
  STREAM_DISCONNECT: 'stream-disconnect',
  STREAM_REBOOT: 'stream-reboot'
};

export const clientEmiters = {
  CHAT_MESSAGE: 'chat-message',
  FETCH_CURRENTLY_PLAYING: 'fetch-currently-playing',
  SET_SOCKET_ID: 'set-socket-id'
};
