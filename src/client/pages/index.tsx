import Head from 'next/head'
import styles from '@/styles/Home.module.css';
import headerImg from '../public/header-image.jpg'
import { useEffect, useState } from "react";
import { v4 as uuid } from 'uuid'
import { socket, SocketContext } from "../context/socket";
import { StreamPlayer } from "./../components/StreamPlayer";
import { Chat }  from "./../components/Chat"
import { serverEmiters } from "../../socketEvents";

const nmsPort = 8000;
const streamsListAPI = `${process.env.NEXT_PUBLIC_HOST}:${nmsPort}/api/streams`;

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
          .map(stream => [String(nmsPort), stream]);
        setLiveStreams(hlsAPIs);
      };
    } catch (err) {
      console.error(
        `ERROR: could not get streams list from ${streamsListAPI}:  ${err}`
      );
    };
  };


  function makeStreamUrl(
    nmsPort: string,
    stream: string
  ): string{
    return `${process.env.NEXT_PUBLIC_HOST}:${nmsPort}/live/${stream}/index.m3u8`;
  };


  function displayMainStream(): JSX.Element[]{
    return liveStreams.reduce((acc: JSX.Element[], streamInfo) => {
      const [ nmsPort, stream ] = streamInfo;
      if (isConnected && stream === 'main'){
        acc.push(
          <StreamPlayer 
            key={uuid()} 
            src={makeStreamUrl(nmsPort, stream)}
          />
        );
      };
      return acc;
    }, [])
  };

  
  return (
    <>
      <Head>
        <title>Great Tunes Radio</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main id={styles.root}>
        <SocketContext.Provider value={{ socket, isConnected }}>
          <div className={styles.App}>
            <div className={styles.headerContainer}>
              <img className={styles.headerImg} src={headerImg.src}/>
            </div>
            <div className={styles.mainContentContainer}>
              { displayMainStream() }
              <Chat/>
            </div>
          </div>
        </SocketContext.Provider>
      </main>
    </>
  );
};
