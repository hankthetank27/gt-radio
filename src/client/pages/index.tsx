import { useEffect, useState } from "react";
import { v4 as uuid } from 'uuid'
import { socket, SocketContext } from "../context/socket";
import { StreamPlayer } from "./../components/StreamPlayer";
import { Chat }  from "./../components/Chat"
import { serverEmiters } from "../../socketEvents";
import { PageWrapper } from '@/components/PageWrapper';
import { BeatLoader } from "react-spinners";
import styles from '@/styles/Home.module.css'

const NMS_PORT = 8000;
const streamsListAPI = `${process.env.NEXT_PUBLIC_HOST}:${NMS_PORT}/api/streams`;

export default function Home(): JSX.Element{

  const [ liveStreams, setLiveStreams ] = useState<string[][]>([]);
  const [ isConnected, setIsConnected ] = useState(socket.connected);
  const [ streamLoaded, setStreamLoaded ] = useState<boolean>(false);

  useEffect(() => {
    socket.on(serverEmiters.CONNECT, () => {
      setIsConnected(true);
    });
    socket.on(serverEmiters.DISCONNECT, () => {
      setIsConnected(false);
    });
    return () => {
      socket.off(serverEmiters.CONNECT);
      socket.off(serverEmiters.DISCONNECT);
    };
  }, []);


  useEffect(() => {
    if (isConnected){
      getLiveStreams();
    };
  }, [ isConnected ]);


  async function getLiveStreams(): Promise<void>{
    try {
      const res = await fetch(streamsListAPI);
      if (!res.ok) return;
      const streams = await res.json();
      if (streams.live){
        const hlsAPIs: string[][] = Object.keys(streams.live)
          .map(stream => [String(NMS_PORT), stream]);
        setLiveStreams(hlsAPIs);
        setStreamLoaded(true);
      };
    } catch (err) {
      console.error(
        `ERROR: could not get streams list from ${streamsListAPI}:  ${err}`
      );
    };
  };


  function makeStreamUrl(
    NMS_PORT: string,
    stream: string
  ): string{
    return `${process.env.NEXT_PUBLIC_HOST}:${NMS_PORT}/live/${stream}/index.m3u8`;
  };


  function displayMainStream(): JSX.Element[]{
    return liveStreams.reduce((acc: JSX.Element[], streamInfo) => {
      const [ NMS_PORT, stream ] = streamInfo;
      if (isConnected && stream === 'main'){
        acc.push(
          <StreamPlayer 
            key={uuid()} 
            src={makeStreamUrl(NMS_PORT, stream)}
          />
        );
      };
      return acc;
    }, [])
  };

  
  return (
    <PageWrapper>
      <SocketContext.Provider value={{ socket, isConnected }}>
        <div className={styles.radioContainer}>
          {streamLoaded
            ? displayMainStream()
            : <BeatLoader 
                size={13}
                color="#000000"
                cssOverride={{
                    margin: "200px"
                }}
              />
          }
          <Chat/>
        </div>
      </SocketContext.Provider>
    </PageWrapper>
  );
};
