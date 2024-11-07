import { useEffect, useState } from "react";
import { v4 as uuid } from 'uuid';
import { socket, SocketContext } from "../context/socket";
import { StreamPlayer } from "./../components/StreamPlayer";
import { Chat }  from "./../components/Chat"
import { serverEmiters } from "../../socketEvents";
import { PageWrapper } from '@/components/PageWrapper';
import styles from '@/styles/Home.module.css'

export default function Home(): JSX.Element{

  const [ isConnected, setIsConnected ] = useState(socket.connected);
  const [ streamError, setStreamError ] = useState<boolean>(false);

  useEffect(() => {
    socket.on(serverEmiters.CONNECT, () => {
      setIsConnected(true);
    });
    socket.on(serverEmiters.DISCONNECT, () => {
      setIsConnected(false);
    });
    socket.on(serverEmiters.STREAM_DISCONNECT, hanldeStreamError);
    return () => {
      socket.off(serverEmiters.CONNECT);
      socket.off(serverEmiters.DISCONNECT);
      socket.off(serverEmiters.STREAM_REBOOT);
      socket.off(serverEmiters.STREAM_DISCONNECT);
    };
  }, []);

  function hanldeStreamError(): void{
    setStreamError(true);
  };

  return (
    <PageWrapper>
      <SocketContext.Provider value={{ socket, isConnected }}>
        <div className={styles.radioContainer}>
          <div className={styles.radio}>
            {streamError
              ? <div>
                  <p>Error connecting to stream :(</p>
                  <p>Please wait to reconnect or try reloading page.</p>
                </div>
              : <StreamPlayer 
                  key={uuid()} 
                  src={`/stream/main/index.m3u8`}
                />
            }
          </div>
          <Chat/>
        </div>
      </SocketContext.Provider>
    </PageWrapper>
  );
};
