import "./stylesheets/App.css";
import headerImg from './assets/header-image.jpg'
import { useEffect, useState } from "react";
import { configNms } from "../server/configNms";
import { v4 as uuid } from 'uuid'
import { socket, SocketContext } from "./context/socket";
import { StreamPlayer } from "./components/StreamPlayer";
import { Chat }  from "./components/Chat"
import { serverEmiters, clientEmiters } from "../socketEvents";

console.log(socket, SocketContext)

const nmsPort = configNms('dummyInput').http.port;
const streamsListAPI = `${import.meta.env.VITE_API_URL}:${nmsPort}/api/streams`;

function App(): JSX.Element{

  // dummy value
  const [ userID, setUserId ] = useState('');
  const [ streamsConnectedTo, setStreamsConnectedTo ] = useState<Set<string>>(new Set());
  const [ liveStreams, setLiveStreams ] = useState<string[][]>([]);
  const [ isConnected, setIsConnected ] = useState(socket.connected);


  useEffect(() => {
    socket.on(serverEmiters.CONNECT, () => {
      // socket.emit('joinStream', 'main');
      setIsConnected(true);
      // setStreamsConnectedTo((prevState) => 
      //   new Set([...prevState, 'main'])
      // );
    });
    socket.on(serverEmiters.DISCONNECT, () => {
      setIsConnected(false);
    });
    return () => {
      socket.off(serverEmiters.CONNECT)
      socket.off(serverEmiters.DISCONNECT)
    };
  }, []);


  useEffect(() => {
    if (isConnected){
      getLiveStreams();
      
      socket.emit(clientEmiters.SET_SOCKET_ID, (socketId: string) => {
        setUserId(socketId);
      });
    };
  }, [ isConnected ]);


  function getLiveStreams(): void{
    fetch(streamsListAPI)
      .then(res => res.json())
      .then(streams => {
        if (streams.live){
          const hlsAPIs: string[][] = Object.keys(streams.live)
            .map(stream => [String(nmsPort), stream])
          setLiveStreams(hlsAPIs)
        }
      })
      .catch(err => 
        console.error(`ERROR: could not get streams list from ${streamsListAPI}:  ${err}`)
      );
  };


  function makeStreamUrl(
    nmsPort: string,
    stream: string
  ): string{
    return `${import.meta.env.VITE_API_URL}:${nmsPort}/live/${stream}/index.m3u8`;
  };


  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      <div className="App">
        <img className="headerImg" src={headerImg}/>
        <div className="mainContentContainer">
          {/* <div className="streamContainer"> */}
            {liveStreams.reduce((acc: JSX.Element[], streamInfo) => {
                const [ nmsPort, stream ] = streamInfo;
                // if (isConnected && stream in streamsConnectedTo){
                  acc.push(
                    <StreamPlayer 
                      key={uuid()} 
                      src={makeStreamUrl(nmsPort, stream)}
                    />
                  );
                // };
                return acc;
              }, [])
            }
          {/* </div> */}
          {userID
            ?<Chat userId={userID}/>
            : null 
          }
        </div>
      </div>
    </SocketContext.Provider>
  );
};

export default App;
