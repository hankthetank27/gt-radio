import Head from 'next/head'
import styles from '@/styles/Home.module.css';
import { useEffect, useState } from "react";
import { v4 as uuid } from 'uuid'
import { socket, SocketContext } from "../context/socket";
import { StreamPlayer } from "./../components/StreamPlayer";
import { Chat }  from "./../components/Chat"
import { Header } from '@/components/Header';
import { serverEmiters } from "../../socketEvents";
import { PageWrapper } from '@/components/PageWrapper';


const NMS_PORT = 8000;
const streamsListAPI = `${process.env.NEXT_PUBLIC_HOST}:${NMS_PORT}/api/streams`;

export default function Home() {


  const [ liveStreams, setLiveStreams ] = useState<string[][]>([]);
  const [ isConnected, setIsConnected ] = useState(socket.connected);


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
      getLiveStreams()
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
        { displayMainStream() }
        <Chat/>
      </SocketContext.Provider>
    </PageWrapper>
  );
};
