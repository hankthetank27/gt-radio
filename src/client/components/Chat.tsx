import { useEffect, useRef, useState, useContext } from "react";
import { SocketContext } from "../context/socket";
import styles from '@/styles/Chat.module.css'
import { serverEmiters, clientEmiters } from "../../socketEvents";
import { chatMessage, chatError } from "../../@types";
import { Login } from "./Login";
import { v4 as uuid } from "uuid";


export const Chat = () => {

  const chatContentsEl = useRef<HTMLDivElement>(null);

  const { socket, isConnected } = useContext(SocketContext);
  const [ userId, setUserId ] = useState<string>('');
  const [ handleChange, setHandleChange ] = useState<string>('');
  const [ chatHistory, setChatHistory ] = useState<chatMessage[]>([]);
  const [ chatError, setChatError ] = useState<string>('');


  useEffect(() => {
    getChatHistory()
      .then(verifySession)
    
    socket.on(serverEmiters.CHAT_MESSAGE_ERROR, (error: chatError) => {
      console.log(error)
      setChatHistory(error.messages)
      setChatError(error.errorMsg);
    });

    socket.on(serverEmiters.RECEIVE_CHAT_MESSAGE, (messages: chatMessage[]) => {
      setChatHistory(messages);
    });

    return () => {
      socket.off(serverEmiters.RECEIVE_CHAT_MESSAGE);
      socket.off(serverEmiters.CHAT_MESSAGE_ERROR);
    };
  }, [ isConnected ]);


  useEffect(() => {
    if (chatContentsEl.current){
      chatContentsEl.current.scrollTop = chatContentsEl.current.scrollHeight;
    };
  }, [ chatHistory ]);


  async function getChatHistory(): Promise<void>{
    try {
      const res = await fetch('/api/chatHistory');
      if (!res.ok) return;
      const data = await res.json();
      setChatHistory(data);

    } catch (err) {
      console.error(`Error fetching chat history: ${err}`)
    };
  };


  async function verifySession(): Promise<void>{

    const session = window.localStorage.getItem('sessionJwt');
    if (!session) return;

    try {
      const res = await fetch('/api/verifySession/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session}`
        }
      });
      if (!res.ok) return;
      const { username } = await res.json();
      setUserId(username);

    } catch (err){
      console.error(`Error: could not verify session data ${err}`);
    };
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
      <div className={`${styles[messageType]} ${styles.chatItem}`}>
        <div className={styles.sender}> {senderId}</div>
        <div className={styles.messageContents}>{message}</div>
      </div>
    );
  };


  function handleNewMessage(): void{

    if (!handleChange) return;
    if (handleChange.length > 800){
      setChatError('Message cannot exceed 800 charaters.');
      return;
    };

    const sessionJwt = window.localStorage.getItem('sessionJwt');

    if (!sessionJwt){
      setChatError('You are not logged in.')
    };

    setChatError('');

    const newMessage = {
      userId: userId,
      message: handleChange,
      timeStamp: new Date()
    };
    
    setChatHistory([...chatHistory, newMessage]);
    socket.emit(clientEmiters.CHAT_MESSAGE, newMessage, sessionJwt);

    setHandleChange('');
  };


  function chatMsgForm(): JSX.Element{
    return (
      <form 
        className={styles.msgForm} 
        onSubmit={e => {
          e.preventDefault();
          handleNewMessage();
        }}
      >
        <input
          className={styles.msgFormInput}
          type="text" 
          value={handleChange} 
          onChange={e => 
            setHandleChange(e.target.value)
          }
        />
        <button 
          onSubmit={e => {
            e.preventDefault();
            handleNewMessage();
          }}
        >
          Send
        </button>
      </form>
    );
  };


  function logout(){
    return (
      <div className={styles.logoutContainer}>
        <span className={styles.loggedInAs}>Logged in as {userId}</span>
        <button 
          className={styles.logoutButton} 
          onClick={(e) => {
            e.preventDefault();
            window.localStorage.removeItem('sessionJwt');
            setUserId('');
          }}
        >
          Log out
        </button>
      </div>
    );
  };


  return(
    <div className={styles.outerChatContainer}>
      <div className={styles.chatContainer}>
        {userId
          ? null
          : <Login key={uuid()} setUserId={setUserId}/>
        }
        <div className={styles.chatContents} ref={chatContentsEl}>
          {chatHistory.map(({ userId , message }) => 
            makeMessage(message, userId))
          }
        </div>
        {userId
          ? chatMsgForm()
          : <div>Login to join chat.</div>
        }
        <div className={styles.chatError}>
          <span className={styles.chatErrorMsg}>{chatError}</span>
        </div>
      </div>
      {userId
        ? logout()
        : null
      } 
    </div>
  );
};