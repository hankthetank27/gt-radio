import Hls from "hls.js";
import { useState, useEffect, useContext } from "react";
import { SocketContext } from "../context/socket";
import { v4 as uuid } from 'uuid'
import { songInfo } from "../../@types";
import '../stylesheets/CurrentSongDisplay.css'
import { serverEmiters, clientEmiters } from "../../socketEvents";


interface props{
  hlsAudio: Hls | null
};

export function CurrentSongDisplay({
  hlsAudio
}: props): JSX.Element{

  const { socket, isConnected } = useContext(SocketContext);
  const [ currentlyPlaying, setCurrentlyPlaying ] = useState<songInfo | null>(null);
  const [ avrgHlsLatency, setAvrgHlsLatency ] = useState<number>(6); // estimation based on average


  useEffect(() => {
    socket.on(serverEmiters.CURRENTLY_PLAYING, (songData) => {

      if (!currentlyPlaying){
        return setCurrentlyPlaying(songData);
      };

      if (hlsAudio && hlsAudio.latency < avrgHlsLatency * 2){
        setTimeout(() => {
          setCurrentlyPlaying(songData);
          if (hlsAudio.latency !== 0){
            setAvrgHlsLatency((prevAvrg) => 
              (prevAvrg + hlsAudio.latency) / 2);
          };
        }, hlsAudio.latency * 1000);
      } else {   //handle user has stream paused
        setTimeout(() => {
          setCurrentlyPlaying(songData);
        }, avrgHlsLatency * 1000);
      };
    });

    if (!currentlyPlaying){
      socket.emit(clientEmiters.FETCH_CURRENTLY_PLAYING);
    };

    return () => {
      socket.off(serverEmiters.CURRENTLY_PLAYING);
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
                return <li key={uuid()}>{ `${key} ${val}` }</li>;
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
        return ['Posted by', val];
      case 'datePosted':
        return ['', new Date(val).toDateString()];
      case 'postText':
        return ['', `"${val}"`];
      case 'src':
        return ['Source:', val];
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