import { useState, useEffect, useContext } from "react";
import { SocketContext } from "../context/socket";
import Hls from "hls.js";
import { songInfo } from "../../@types";

interface props{
  hlsAudio: Hls | null
};

export function CurrentSongDisplay({
  hlsAudio
}: props): JSX.Element{

  const socket = useContext(SocketContext);
  const [ currentlyPlaying, setCurrentlyPlaying ] = useState<songInfo | null>(null);

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


  function displaySongInfo(currentlyPlaying: songInfo){
    return (
      <ul>
        {
          Object.entries(currentlyPlaying)
            .map(([key, val]) => <li>{ `${key}: ${val}` }</li>)
        }
      </ul>
    )
  }


  return(
    <div className="currentlyPlaying">
      {currentlyPlaying
        ? displaySongInfo(currentlyPlaying)
        : null
      }
    </div>
  );
};