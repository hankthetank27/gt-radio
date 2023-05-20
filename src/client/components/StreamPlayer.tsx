import Hls from "hls.js";
import { useEffect, useState, createRef, RefObject, ChangeEvent } from "react";
import { v4 as uuid } from 'uuid'
import { CurrentSongDisplay } from "./CurrentSongDisplay";
import styles from '@/styles/StreamPlayer.module.css';


interface streamPlayerProps{
  src: string
};

export function StreamPlayer({
  src
}: streamPlayerProps){

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


  return(
    <div className={styles.streamContainer}>
      <div className={styles.playerContainer}>
        {Hls.isSupported()
          ? <AudioPlayer
              audioEl={audioElement}
              hlsAudio={hlsAudio}
            />
          : <AudioPlayer
              audioEl={audioElement}
              src={src}
            />
        }
      </div>
      <CurrentSongDisplay 
        key={uuid()} 
        hlsAudio={hlsAudio}
      />
    </div>
  );
};



interface audioPlayerProps{
  audioEl: RefObject<HTMLAudioElement>
  hlsAudio?: Hls | null
  src?: string
};

function AudioPlayer({
  audioEl,
  hlsAudio,
  src
}: audioPlayerProps): JSX.Element{

  const [ isPlaying, setIsPlaying ] = useState<boolean>(false);
  const [ volume, setVolume ] = useState<string>("100");

  function setAudioPlaybackPosition(
    audioElement: RefObject<HTMLAudioElement>
  ): void{
    if (audioElement.current && hlsAudio && hlsAudio.liveSyncPosition){
      audioElement.current.currentTime = hlsAudio.liveSyncPosition;
    };
  };

  if (audioEl.current){
    isPlaying
      ? audioEl.current.play()
      : audioEl.current.pause()
    audioEl.current.volume = Math.pow((Number(volume) / 100), 3);
  };

  return (
    <div>
      <audio
        ref={audioEl} 
        src={src || undefined}
        onPlay={hlsAudio 
          ? () => setAudioPlaybackPosition(audioEl) 
          : undefined
        }
      />
      <button
        onClick={() => setIsPlaying(p => !p)}
      >
        play/pause
      </button>
      <input 
        type="range"
        max="100"
        value={volume}
        onChange={(e) => setVolume(e.target.value)}
      />
    </div>
  ); 
};
