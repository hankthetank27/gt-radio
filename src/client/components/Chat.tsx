import { 
  useEffect,
  useRef, 
  useState, 
  useContext, 
  Dispatch, 
  SetStateAction, 
} from "react";
import { SocketContext } from "../context/socket";
import styles from '@/styles/Chat.module.css'
import { serverEmiters, clientEmiters } from "../../socketEvents";
import { chatMessage, chatError } from "../../@types";
import { Login, Logout } from "./Login";
import { v4 as uuid } from "uuid";
import TextareaAutosize from '@mui/base/TextareaAutosize';
import { BeatLoader } from "react-spinners";


export function Chat(): JSX.Element{

  const chatContentsEl = useRef<HTMLDivElement>(null);

  const { socket, isConnected } = useContext(SocketContext);
  const [ userId, setUserId ] = useState<string>('');
  const [ userColor, setUserColor ] = useState<string>("#4955af")
  const [ chatHistory, setChatHistory ] = useState<chatMessage[]>([]);
  const [ chatError, setChatError ] = useState<string | null>(null);
  const [ displayLoginWindow, setDisplayLoginWindow ] = useState<boolean>(false);
  const [ chatLoading, setChatLoading ] = useState<boolean>(false);


  useEffect(() => {
    setChatLoading(true);
    getChatHistory()
      .then(verifySession)
      .then(() => setChatLoading(false))
      .catch(() => setChatLoading(false))

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
  }, [ chatHistory, chatLoading ]);


  async function getChatHistory(): Promise<void>{
    try {
      const res = await fetch('/api/chatHistory');
      if (!res.ok) return;
      const data = await res.json();
      setChatHistory(data);

    } catch (err) {
      setChatError('Could not connect to server :(');
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
      const { username, chatColor } = await res.json();
      setUserId(username);
      setUserColor(chatColor);
      setDisplayLoginWindow(false);
    } catch (err){
      console.error(`Error: could not verify session data ${err}`);
    };
  };


  return(
    <div className={styles.outerChatContainer}>
      <div className={styles.chatContainer}>
        {displayLoginWindow && !userId
          ? <Login 
            setDisplayLoginWindow={setDisplayLoginWindow}
            key={uuid()} 
            setUserId={setUserId}
            setUserColor={setUserColor}
          />
          : null
        }
        <div className={styles.chatContents} ref={chatContentsEl}>
          {chatLoading
            ? <div className={styles.beatLoaderContainer}>
                <BeatLoader
                  size={13}
                  color="#000000"
                />
              </div>
            : chatHistory.map(m => 
                <Message
                  key={uuid()}
                  message={m.message}
                  senderId={m.userId}
                  color={m.color}
                  userId={userId}
                />
              )
          }
        </div>
        {userId
          ? <ChatMessageForm
              key={uuid()}
              userId={userId}
              userColor={userColor}
              chatHistory={chatHistory}
              setChatError={setChatError}
              setChatHistory={setChatHistory}
            />
          : <div>
              <button
                className="defaultButton"
                onClick={() => setDisplayLoginWindow(true)}
              >
                Join Chat
              </button>
            </div>
        }
        {chatError
          ? <div className={styles.chatError}>
            <span className={styles.chatErrorMsg}>{chatError}</span>
          </div>
          : null
        }
      </div>
      {userId
        ? <Logout
            setDisplayLoginWindow={setDisplayLoginWindow}
            userId={userId}
            setUserId={setUserId}
          />
        : null
      } 
    </div>
  );
};


interface chatFormProps {
  userId: string
  userColor: string
  chatHistory: chatMessage[]
  setChatError: Dispatch<SetStateAction<string | null>>
  setChatHistory: Dispatch<SetStateAction<chatMessage[]>>
};

function ChatMessageForm({
  userId,
  userColor,
  chatHistory,
  setChatError,
  setChatHistory
}: chatFormProps): JSX.Element{

  const { socket } = useContext(SocketContext);
  const [ handleChange, setHandleChange ] = useState<string>('');

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

    setChatError(null);

    const newMessage = {
      userId: userId,
      message: handleChange,
      timeStamp: new Date(),
      color: userColor
    };
    
    setChatHistory([...chatHistory, newMessage]);
    socket.emit(clientEmiters.CHAT_MESSAGE, newMessage, sessionJwt);

    setHandleChange('');
  };

  return (
    <form 
      className={styles.msgForm} 
      onSubmit={e => {
        e.preventDefault();
        handleNewMessage();
      }}
    >
      <TextareaAutosize
        autoFocus
        className={styles.msgFormInput}
        value={handleChange} 
        maxRows={4}
        onKeyDown={e => {
          if (e.key === "Enter" && e.shiftKey === false){
            e.preventDefault();
            handleNewMessage();
          };
        }}
        onChange={e => {
          setHandleChange(e.target.value)
        }}
      />
      <button 
        id={styles.sendButton}
        className="defaultButton"
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


interface messageProps{
  message: string
  color: string
  senderId: string
  userId: string
};

function Message({
  message,
  color,
  senderId,
  userId,
}: messageProps): JSX.Element{

  const messageType = 
    senderId === userId
      ? 'myMessage' 
      : 'opMessage'

  return (
    <div className={`${styles[messageType]} ${styles.chatItem}`}>
      <div 
        className={styles.sender}
        style={{
          color: messageType === 'opMessage'
            ? color 
            : "#c6a15b"
        }}
      > 
        {senderId}
      </div>
      <div className={styles.messageContents}>{message}</div>
    </div>
  );
};
