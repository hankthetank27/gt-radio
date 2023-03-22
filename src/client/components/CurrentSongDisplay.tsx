import Hls from "hls.js";
import { useState, useEffect, useContext } from "react";
import { SocketContext } from "../context/socket";
import { v4 as uuid } from 'uuid'
import { songInfo } from "../../@types";
import '../stylesheets/CurrentSongDisplay.css'


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
      <div className="currentlyPlaying">
        <ul key={uuid()}>
          {
            Object.entries(currentlyPlaying)
              .filter(([key, val]) => 
                val &&
                key !== 'itag' && 
                key !== 'length' && 
                key !== 'duration' && 
                key !== 'channel'
              ) 
              .map(entry =>{
                const [ key, val ] = translateInfo(entry);
                return <li key={uuid()}>{ `${key ? key + ':' : ''} ${val}` }</li>;
              })
          }
        </ul>
      </div>
    );
  };

  function translateInfo([
    key,
    val
  ]: string[]){
    switch (key){
      case 'title':
        return ['', val];
      case 'memberPosted':
        return ['Posted By', val];
      case 'postText':
        return [null, `"${val}"`];
      case 'datePosted':
        return ['Posted On', new Date(val).toDateString()];
      case 'src':
        return ['Source', val];
      default:
        return [key, val];
    };
  };

  return(
    <div className="currentlyPlayingContainer">
      {currentlyPlaying
        ? displaySongInfo(currentlyPlaying)
        : null
      }
    </div>
  );
};