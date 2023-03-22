import { useEffect, useRef, useState, useContext } from "react";
import { SocketContext } from "../context/socket";
import '../stylesheets/Chat.css';


interface Props{
  userId: string;
};

export const Chat = ({
  userId
}: Props) => {

  const chatContentsEl = useRef<HTMLDivElement>(null);

  const { socket, isConnected } = useContext(SocketContext);
  const [ handleChange, setHandleChange ] = useState<string>('');
  const [ chatHistory, setChatHistory ] = useState<string[][]>([]);

  useEffect(() => {
    const callback = (message: string[]) => {
      setChatHistory(prevHistory => {
        return [...prevHistory, message];
      });
    };

    socket.on('receive-chat-message', callback);

    return () => {
      socket.off('receive-chat-message');
    };
  }, [isConnected]);


  useEffect(() => {
    if (chatContentsEl.current){
      chatContentsEl.current.scrollTop = chatContentsEl.current.scrollHeight;
    };
  }, [chatHistory]);


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


  return(
    <div className="chatContainer">
      <div className="chatContents" ref={chatContentsEl}>
        {chatHistory.map(([ senderId, message ]) => 
          makeMessage(message, senderId))
        }
      </div>
      <form className="msgForm" onSubmit={(e) => {
        e.preventDefault();
        setChatHistory([...chatHistory, [userId, handleChange]]);
        socket.emit('chat-message', [userId, handleChange]);
        setHandleChange('');
      }}>
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