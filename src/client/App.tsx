import "./stylesheets/App.css";
import headerImg from './assets/header-image.jpg'
import { useEffect, useState } from "react";
import { configNms } from "../server/configNms";
import { v4 as uuid } from 'uuid'
import { socket, SocketContext } from "./context/socket";
import { StreamPlayer } from "./components/StreamPlayer";
import { Chat }  from "./components/Chat"
import { serverEmiters } from "../socketEvents";


const nmsPort = configNms('dummyInput').http.port;
const streamsListAPI = `${import.meta.env.VITE_API_URL}:${nmsPort}/api/streams`;

function App(): JSX.Element{

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
    return `${import.meta.env.VITE_API_URL}:${nmsPort}/live/${stream}/index.m3u8`;
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
    <SocketContext.Provider value={{ socket, isConnected }}>
      <div className="App">
        <div className="headerContainer">
          <img className="headerImg" src={headerImg}/>
        </div>
        <div className="mainContentContainer">
          { displayMainStream() }
          <Chat/>
        </div>
      </div>
    </SocketContext.Provider>
  );
};

export default App;
