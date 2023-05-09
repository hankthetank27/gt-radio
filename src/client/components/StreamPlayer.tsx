import Hls from "hls.js";
import { useEffect, useState, createRef, RefObject } from "react";
import { v4 as uuid } from 'uuid'
import { CurrentSongDisplay } from "./CurrentSongDisplay";
import styles from '@/styles/StreamPlayer.module.css';


interface props{
  src: string
};

export function StreamPlayer({
  src
}: props){

  const audioElement = createRef<HTMLAudioElement>();
  const [ hlsAudio, setHlsAudio ] = useState<Hls | null>(null);

  useEffect(() => {
    if (Hls.isSupported()) {
      setHlsAudio(_initPlayer(hlsAudio));
    };
    
    return () => {
      if (hlsAudio != null) {
        hlsAudio.destroy();
      };
    };
  }, [src]);


  function _initPlayer(
    hls: Hls | null
  ): Hls{

    if (hls){
      hls.destroy();
    };

    const newHls = new Hls({
      enableWorker: false,
      lowLatencyMode: true,
      liveSyncDuration: 6, // Might be better to keep this at default...
      liveDurationInfinity: true,
      backBufferLength: 0
    });

    if (audioElement.current){
      newHls.attachMedia(audioElement.current);
    };

    newHls.on(Hls.Events.MEDIA_ATTACHED, () => {
      newHls.loadSource(src);
    });

    newHls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            newHls.startLoad();
           break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            newHls.recoverMediaError();
            break;
          default:
            _initPlayer(hls);
            break;
        };
      };
    });

    return newHls;
  };


  function setAudioPlaybackPosition(
    audioElement: RefObject<HTMLAudioElement>
  ): void{
    if (audioElement.current && hlsAudio && hlsAudio.liveSyncPosition){
      audioElement.current.currentTime = hlsAudio.liveSyncPosition;
    };
  };


  function renderAudioElement(): JSX.Element{
    if (Hls.isSupported()){
      return (
        <audio
          className={styles.player}
          ref={audioElement} 
          onPlay={() => setAudioPlaybackPosition(audioElement)} 
          controls
        />
      );
    } else {
      return (
        <audio 
          className={styles.player} 
          ref={audioElement} 
          src={src} 
          controls
        />
      );
    };
  };


  return(
    <div className={styles.streamContainer}>
      <div className={styles.playerContainer}>
        {renderAudioElement()}
      </div>
      <CurrentSongDisplay 
        key={uuid()} 
        hlsAudio={hlsAudio}
      />
    </div>
  );
};
