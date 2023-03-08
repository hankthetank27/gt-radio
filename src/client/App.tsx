import "./App.css";
import { useState } from "react";
import StreamPlayer from "./components/StreamPlayer";


function App() {
  const [ src, setSrc ] = useState('http://localhost:8000/live/main/index.m3u8')

  return (
    <div className="App">
      <StreamPlayer src={src}/>
    </div>
  );
}

export default App;
