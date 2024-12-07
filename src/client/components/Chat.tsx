import { 
  useEffect,
  useRef, 
  useState, 
  useContext, 
  memo,
  useCallback, 
} from "react";
import { SocketContext } from "../context/socket";
import styles from '@/styles/Chat.module.css'
import { serverEmiters, clientEmiters } from "../../socketEvents";
import { chatMessage, chatError } from "../../@types";
import { Login, Logout } from "./Login";
import { v4 as uuid } from "uuid";
import TextareaAutosize from '@mui/base/TextareaAutosize';
import { BeatLoader } from "react-spinners";
import Throttle from "lodash.throttle";

const QUANT_UPDATE = 25;

export function Chat(): JSX.Element{

  const { socket, isConnected } = useContext(SocketContext);
  const [ chatLength, setChatLength ] = useState(100);
  const [ userId, setUserId ] = useState<string>('');
  const [ userColor, setUserColor ] = useState<string>("#4955af")
  const [ chatHistory, setChatHistory ] = useState<chatMessage[]>([]);
  const [ chatError, setChatError ] = useState<string | null>(null);
  const [ displayLoginWindow, setDisplayLoginWindow ] = useState<boolean>(false);
  const [ chatLoading, setChatLoading ] = useState<boolean>(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatOldestMessageRef = useRef(chatHistory[0]);
  const hasAllMessagesRef = useRef(false);

  function filterMessage(target: chatMessage) {
    setChatHistory((chatHistory) => {
      return chatHistory.filter(msg => 
         msg._id || (msg.userId !== target.userId && msg.timeStamp !== target.timeStamp)
      )
    });
  }

  function mapMessage(target: chatMessage) {
    setChatHistory((chatHistory) => {
      return chatHistory.map(msg => 
         msg._id || (msg.userId !== target.userId && msg.timeStamp !== target.timeStamp)
          ? msg
          : target
      )
    });
  }
  
  function handleScroll() {
    if (chatContainerRef.current && !hasAllMessagesRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      if (Math.abs(scrollTop) + clientHeight >= scrollHeight - 1) {
        setChatLength((prevLength) => prevLength + QUANT_UPDATE);
      }
    }
  };

  const handleUpdateChatHistory = (newMessage: chatMessage) => {
    setChatHistory((chatHistory) => {
      if (chatHistory.length >= chatLength) {
        const newChat = chatHistory.slice(1);
        newChat.push(newMessage);
        return newChat;
      } else {
        return [...chatHistory, newMessage];
      }
    });
  }

  const handleUpdateChatError = useCallback((err: string | null) => {
    setChatError(err);
  }, []);

  const handleUpdateChat = useCallback(
    Throttle(async () => {
      if (!hasAllMessagesRef.current) {
        const chatContainer = chatContainerRef?.current;
        if (!chatContainer){
          return 
        };
        await getNextMessages(chatOldestMessageRef.current);
      }
    }, 800),
    []
  );

  async function getChatHistory(): Promise<void>{
    try {
      const res = await fetch('/api/chatHistory');
      if (!res.ok) {
        setChatError('Could not get chat history');
        return;
      };
      const data = await res.json();
      setChatHistory(data);
    } catch (err) {
      setChatError('Could not connect to server :(');
      console.error(`Error fetching chat history: ${err}`)
    };
  };

  async function getNextMessages(lastMessage: chatMessage | undefined): Promise<void> {
    try {
      if (!lastMessage?._id) {
        return;
      }
      const res = await fetch(`/api/chatMessageRange?startId=${lastMessage._id}&amount=${QUANT_UPDATE}`);
      if (!res.ok) {
        return;
      };
      const data = await res.json();
      if (data.length === 0) {
        hasAllMessagesRef.current = true;
      } else {
        setChatHistory((chatHistory) => [...data, ...chatHistory]);
      }
    } catch {
      return;
    };
  }

  async function verifySession(): Promise<void>{
    const session = window.localStorage.getItem('sessionJwt');
    if (!session) {
      return;
    }
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

  useEffect(() => {
    setChatLoading(true);
    getChatHistory()
      .then(verifySession)
      .then(() => setChatLoading(false))
      .catch(() => setChatLoading(false))
    socket.on(serverEmiters.RECEIVE_CHAT_MESSAGE, handleUpdateChatHistory);
    socket.on(serverEmiters.CHAT_MESSAGE_ERROR, (error: chatError) => {
      filterMessage(error.message);
      setChatError(error.errorMsg);
    });
    return () => {
      socket.off(serverEmiters.RECEIVE_CHAT_MESSAGE);
      socket.off(serverEmiters.CHAT_MESSAGE_ERROR);
    };
  }, [ isConnected ]);

  useEffect(() => {
    if (!hasAllMessagesRef.current) {
      handleUpdateChat();
    }
  }, [ chatLength ]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (chatContainerRef.current) {
        chatContainerRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, [ chatContainerRef ]);

  useEffect(() => {
    chatOldestMessageRef.current = chatHistory[0];
    hasAllMessagesRef.current = false;
  }, [ chatHistory ]);

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
        <div className={styles.chatContents} ref={chatContainerRef}>
          {chatLoading
            ? <div className={styles.beatLoaderContainer}>
              <BeatLoader
                size={13}
                color="#000000"
              />
            </div>
            : <div>
              {chatHistory.map(m => {
                const key = m._id || m.message + m.timeStamp.toString() + m.userId;
                 return <Message
                    key={key}
                    message={m.message}
                    senderId={m.userId}
                    color={m.color}
                    userId={userId}
                  />
              })}
            </div>
          }
        </div>
        {userId
          ? <ChatMessageForm
              userId={userId}
              userColor={userColor}
              setChatError={handleUpdateChatError}
              setChatHistory={handleUpdateChatHistory}
              mapMessage={mapMessage}
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
  userId: string;
  userColor: string;
  setChatError: (err: string | null) => void;
  setChatHistory: (mesage: chatMessage) => void;
  mapMessage: (message: chatMessage) => void;
};

const ChatMessageForm = memo(({
  userId,
  userColor,
  setChatError,
  setChatHistory,
  mapMessage,
}: chatFormProps): JSX.Element => {

    const { socket } = useContext(SocketContext);
    const [ handleNewMessageChange, setHandleNewMessageChange ] = useState<string>('');

    function submitMessage(): void{

      if (!handleNewMessageChange) return;
      
      if (handleNewMessageChange.length > 800){
        setChatError('Message cannot exceed 800 charaters.');
        return;
      };

      const sessionJwt = window.localStorage.getItem('sessionJwt');

      if (!sessionJwt){
        setChatError('You are not logged in.')
      };

      setChatError(null);

      const newMessage = {
        _id: null,
        userId: userId,
        message: handleNewMessageChange,
        timeStamp: new Date(),
        color: userColor
      };

      setChatHistory(newMessage);
      socket.emit(
        clientEmiters.CHAT_MESSAGE, 
        newMessage, sessionJwt, 
        (updatedMessage: chatMessage) => {
          mapMessage(updatedMessage);
        });

      setHandleNewMessageChange('');
    };

    return (
      <form 
        className={styles.msgForm} 
        onSubmit={e => {
          e.preventDefault();
          submitMessage();
        }}
      >
        <TextareaAutosize
          autoFocus
          className={styles.msgFormInput}
          value={handleNewMessageChange} 
          maxRows={4}
          onKeyDown={e => {
            if (e.key === "Enter" && e.shiftKey === false){
              e.preventDefault();
              submitMessage();
            };
          }}
          onChange={e => {
            setHandleNewMessageChange(e.target.value)
          }}
        />
        <button 
          id={styles.sendButton}
          className="defaultButton"
          onSubmit={e => {
            e.preventDefault();
            submitMessage();
          }}
        >
          Send
        </button>
      </form>
    );
  });


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

