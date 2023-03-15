import { useState, useEffect, useContext } from "react";
import { SocketContext } from "../context/socket";
import Hls from "hls.js";

interface props{
  hlsAudio: Hls | null
};

export function DisplaySongPlaying({
  hlsAudio
}: props): JSX.Element{

  const socket = useContext(SocketContext);
  const [ currentlyPlaying, setCurrentlyPlaying ] = useState('');

  useEffect(() => {
    socket.on('currentlyPlaying', (songData) => {
      if (hlsAudio){
        setTimeout(() => {
          setCurrentlyPlaying(songData)
        }, hlsAudio.latency * 1000)
      }
    });
  }, [ hlsAudio ]);


  // function changeSongDisplay(songData){

  // }

  return(
    <div className="currentlyPlaying">
      {currentlyPlaying
        ?`Currently playing: ${currentlyPlaying}`
        : null
      }
    </div>
  );
};