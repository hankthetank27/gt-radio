import "./App.css";
import { useEffect, useState } from "react";
import StreamPlayer from "./components/StreamPlayer";
import { configMainStream } from "../server/configMainStream";
import { v4 as uuid } from 'uuid'
import { socket } from "./socket";

const nmsPort = configMainStream('dummyInput').http.port;
const streamsListAPI = `http://localhost:${nmsPort}/api/streams`;

function App() {

  const [ streamsConnectedTo, setStreamsConnectedTo ] = useState<Set<string>>(new Set())
  const [ liveStreams, setLiveStreams ] = useState<string[][]>([]);
  const [ isConnected, setIsConnected ] = useState(socket.connected);
  const [ currentlyPlaying, setCurrentlyPlaying ] = useState('')

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
    socket.on('currentlyPlaying', (songData) => {
      console.log(songData)
      setCurrentlyPlaying(songData)
    });
    return () => {
      socket.off('connect')
      socket.off('disconnect')
    };
  }, [])

  useEffect(() => {
    if (isConnected){
      getLiveStreams();
    };
  }, [isConnected])

  function getLiveStreams(){
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
      )
  }

  function makeStreamUrl(nmsPort: string, stream: string){
    return `http://localhost:${nmsPort}/live/${stream}/index.m3u8`;
  };

  return (
    <div className="App">
      {/* <audio controls>
        <source src={`http://localhost:${nmsPort}/live/main.flv`}  type="audio/mpeg"/>
      </audio> */}
      <div>{currentlyPlaying}</div>
      {liveStreams.reduce((acc: JSX.Element[], streamInfo) => {
          const [ nmsPort, stream ] = streamInfo;
          // if (isConnected && stream in streamsConnectedTo){
            acc.push(<StreamPlayer key={uuid()} src={makeStreamUrl(nmsPort, stream)}/>);
          // };
          return acc;
        }, [])
      }
    </div>
  );
}

export default App;
