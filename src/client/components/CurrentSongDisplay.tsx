import Hls from "hls.js";
import { useState, useEffect, useContext, Dispatch, SetStateAction } from "react";
import { SocketContext } from "../context/socket";
import { v4 as uuid } from 'uuid'
import { SongDocument } from "../../@types";
import styles from '@/styles/CurrentSongDisplay.module.css'
import { serverEmiters, clientEmiters } from "../../socketEvents";


interface currentSongDisplayProps{
  hlsAudio: Hls | null
  currentlyPlaying: SongDocument | null
  setCurrentlyPlaying: Dispatch<SetStateAction<SongDocument | null>>
};

export function CurrentSongDisplay({
  hlsAudio,
  currentlyPlaying,
  setCurrentlyPlaying
}: currentSongDisplayProps): JSX.Element{

  const { socket, isConnected } = useContext(SocketContext);
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
      } else {  
        //handle user has stream paused
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
  }, [ currentlyPlaying, hlsAudio, isConnected ]); 


  return(
    <div className={styles.currentlyPlayingContainer}>
      {currentlyPlaying
        ? <DisplaySongInfo currentlyPlaying={currentlyPlaying}/>
        : null
      }
    </div>
  );
};


interface displaySongInfoProps{
  currentlyPlaying: SongDocument
};

function DisplaySongInfo({
  currentlyPlaying,
}: displaySongInfoProps): JSX.Element{

  const {
    user_name,
    date_posted,
    text,
  } = currentlyPlaying

  return (
    <div className={styles.currentlyPlaying}>
      <ul key={uuid()} className={ styles.currentlyPlayingList }>
        <li className={ styles.listItem }>
          {user_name}
          {date_posted
            ? <span>
              {(user_name ? ", " : "") + new Date(date_posted)
                .toDateString()
                .split(' ')
                .slice(1)
                .join(' ')
              }
            </span>
            : null
          }
        </li>
        <li className={ styles.listItem }>
          {text
            ? <span>"{text}"</span>
            : null
          }
        </li>
      </ul>
    </div>
  );
};
