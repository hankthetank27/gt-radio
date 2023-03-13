import "./App.css";
import { useEffect, useState } from "react";
import StreamPlayer from "./components/StreamPlayer";
import { configMainStream } from "../server/configMainStream";
import { v4 as uuid } from 'uuid'

const nmsPort = configMainStream('dummyInput').http.port;
const streamsListAPI = `http://localhost:${nmsPort}/api/streams`;

function App() {

  const [ liveStreams, setLiveStreams ] = useState<string[]>([])

  useEffect(() => {
    getLiveStreams()
  }, [])

  function getLiveStreams(){
    fetch(streamsListAPI)
      .then(res => res.json())
      .then(streams => {
        if (streams.live){
          const hlsAPIs = Object.keys(streams.live)
            .map(stream => `http://localhost:${nmsPort}/live/${stream}/index.m3u8`)
          setLiveStreams(hlsAPIs)
        }
      })
      .catch(err => 
        console.error(`ERROR: could not get streams list from ${streamsListAPI}:  ${err}`)
      )
  }

  return (
    <div className="App">
      {/* <audio controls>
        <source src={`http://localhost:${nmsPort}/live/main.flv`}  type="audio/mpeg"/>
      </audio> */}
      {liveStreams.map(stream =>
         <StreamPlayer key={uuid()} src={stream}/>
      )}
    </div>
  );
}

export default App;
