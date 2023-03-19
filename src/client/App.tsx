import "./stylesheets/App.css";
import { useEffect, useState } from "react";
import { configNms } from "../server/configNms";
import { v4 as uuid } from 'uuid'
import { socket, SocketContext } from "./context/socket";
import StreamPlayer from "./components/StreamPlayer";


const nmsPort = configNms('dummyInput').http.port;
const streamsListAPI = `http://localhost:${nmsPort}/api/streams`;

function App(): JSX.Element{

  const [ streamsConnectedTo, setStreamsConnectedTo ] = useState<Set<string>>(new Set());
  const [ liveStreams, setLiveStreams ] = useState<string[][]>([]);
  const [ isConnected, setIsConnected ] = useState(socket.connected);


  useEffect(() => {
    socket.on('connect', () => {
      // socket.emit('joinStream', 'main');
      setIsConnected(true);
      // setStreamsConnectedTo((prevState) => 
      //   new Set([...prevState, 'main'])
      // );
    });
    socket.on('disconnect', () => {
      setIsConnected(false);
    });
    return () => {
      socket.off('connect')
      socket.off('disconnect')
    };
  }, []);


  useEffect(() => {
    if (isConnected){
      getLiveStreams();
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


  function makeStreamUrl(nmsPort: string, stream: string): string{
    return `http://localhost:${nmsPort}/live/${stream}/index.m3u8`;
  };


  return (
    <SocketContext.Provider value={socket}>      
      <div className="App">
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
      </div>
    </SocketContext.Provider>
  );
}



export default App;
