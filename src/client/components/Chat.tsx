import { useEffect, useRef, useState, useContext } from "react";
import { SocketContext } from "../context/socket";
import '../stylesheets/Chat.css';
import { serverEmiters, clientEmiters } from "../../socketEvents";
import { chatMessage } from "../../@types";


interface Props{
  userId: string;
};

export const Chat = ({
  userId
}: Props) => {

  const chatContentsEl = useRef<HTMLDivElement>(null);

  const { socket, isConnected } = useContext(SocketContext);
  const [ handleChange, setHandleChange ] = useState<string>('');
  const [ chatHistory, setChatHistory ] = useState<chatMessage[]>([]);

  useEffect(() => {

    getChatHistory();

    const callback = (message: chatMessage) => {
      setChatHistory(prevHistory => {
        return [...prevHistory, message];
      });
    };

    socket.on(serverEmiters.RECEIVE_CHAT_MESSAGE, callback);

    return () => {
      socket.off(serverEmiters.RECEIVE_CHAT_MESSAGE);
    };
  }, [isConnected]);


  useEffect(() => {
    if (chatContentsEl.current){
      chatContentsEl.current.scrollTop = chatContentsEl.current.scrollHeight;
    };
  }, [chatHistory]);


  function getChatHistory(){
    fetch('/api/chatHistory')
    .then(res => res.json())
    .then(data => {
      setChatHistory(data)
    })
    .catch(err => {
      console.log(err);
    })
  };
  

  function makeMessage(
    message: string,
    senderId: string
  ): JSX.Element{
    const messageType = 
      senderId === userId
        ? 'myMessage' 
        : 'opMessage'
    return (
      <div className={`${messageType} chatItem`}>
        <div className="sender"> {senderId}</div>
        <div className="messageContents">{message}</div>
      </div>
    );
  };


  function handleNewMessage(
    e: React.FormEvent<HTMLFormElement>
  ): void{
    e.preventDefault();

    const newMessage = {
      userId: userId,
      message: handleChange,
      timeStamp: new Date()
    };
    
    setChatHistory([...chatHistory, newMessage]);
    socket.emit(clientEmiters.CHAT_MESSAGE, newMessage);

    setHandleChange('');
  };


  return(
    <div className="chatContainer">
      <div className="chatContents" ref={chatContentsEl}>
        {chatHistory.map(({ userId , message }) => 
          makeMessage(message, userId))
        }
      </div>
      <form className="msgForm" onSubmit={handleNewMessage}>
        <div>Chat</div>
        <input 
          type="text" 
          value={handleChange} 
          onChange={e => setHandleChange(e.target.value)}
        />
      </form>
    </div>
  );
};