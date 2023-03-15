import { useState, useEffect, useContext } from "react";
import { SocketContext } from "../context/socket";
import Hls from "hls.js";

interface props{
  hlsAudio: Hls | null
};

export function CurrentSongDisplay({
  hlsAudio
}: props): JSX.Element{

  const socket = useContext(SocketContext);
  const [ currentlyPlaying, setCurrentlyPlaying ] = useState('');

  useEffect(() => {
    socket.on('currentlyPlaying', (songData) => {

      if (!currentlyPlaying){
        return setCurrentlyPlaying(songData)
      };

      if (hlsAudio){
        setTimeout(() => {
          setCurrentlyPlaying(songData)
        }, hlsAudio.latency * 1000);
      };
    });

    if (!currentlyPlaying){
      socket.emit('fetchCurrentlyPlaying')
    };

    return () => {
      socket.off('currentlyPlaying')
    };
  }, [ currentlyPlaying, hlsAudio ]);


  return(
    <div className="currentlyPlaying">
      {currentlyPlaying
        ?`Currently playing: ${currentlyPlaying}`
        : null
      }
    </div>
  );
};