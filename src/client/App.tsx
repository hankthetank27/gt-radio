import "./App.css";
import { useEffect, useState } from "react";
import StreamPlayer from "./components/StreamPlayer";
import { configMediaServer } from "../server/configMediaServer";
import { v4 as uuid } from 'uuid'

const nmsPort = configMediaServer('dummyInput').http.port;

function App() {

  const [ liveStreams, setLiveStreams ] = useState<string[]>([])

  useEffect(() => {
    getLiveStreams()
  }, [])

  function getLiveStreams(){
    fetch(`http://localhost:${nmsPort}/api/streams`)
      .then(res => res.json())
      .then(streams => {
        if (streams.live){
          const hlsAPIs = Object.keys(streams.live)
            .map(stream => `http://localhost:${nmsPort}/live/${stream}/index.m3u8`)
          setLiveStreams(hlsAPIs)
        }
      })
      .catch(err => console.log(err))
  }

  return (
    <div className="App">
      {liveStreams.map(stream =>
         <StreamPlayer key={uuid()} src={stream}/>
      )}
    </div>
  );
}

export default App;
