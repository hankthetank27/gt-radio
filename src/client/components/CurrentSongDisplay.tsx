import Hls from "hls.js";
import { useState, useEffect, useContext } from "react";
import { SocketContext } from "../context/socket";
import { v4 as uuid } from 'uuid'
import { songInfo } from "../../@types";


interface props{
  hlsAudio: Hls | null
};

export function CurrentSongDisplay({
  hlsAudio
}: props): JSX.Element{

  const { socket, isConnected } = useContext(SocketContext);
  const [ currentlyPlaying, setCurrentlyPlaying ] = useState<songInfo | null>(null);

  useEffect(() => {
    socket.on('currentlyPlaying', (songData) => {

      if (!currentlyPlaying){
        return setCurrentlyPlaying(songData);
      };

      if (hlsAudio){
        setTimeout(() => {
          setCurrentlyPlaying(songData);
        }, hlsAudio.latency * 1000);
      };
    });

    if (!currentlyPlaying){
      socket.emit('fetchCurrentlyPlaying');
    };

    return () => {
      socket.off('currentlyPlaying');
    };
  }, [ currentlyPlaying, hlsAudio, isConnected ]); // Do I need isConnected here?


  function displaySongInfo(
    currentlyPlaying: songInfo
  ): JSX.Element{
    return (
      <ul key={uuid()}>
        {
          Object.entries(currentlyPlaying)
            .filter(([key, val]) => val && key !== 'itag' && key !== 'length') 
            .map(([key, val]) => <li key={uuid()}>{ `${key}: ${val}` }</li>)
        }
      </ul>
    );
  };

  return(
    <div className="currentlyPlaying">
      {currentlyPlaying
        ? displaySongInfo(currentlyPlaying)
        : null
      }
    </div>
  );
};