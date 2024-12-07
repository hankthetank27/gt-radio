import Hls from "hls.js";
import { useEffect, useState, createRef, RefObject } from "react";
import { v4 as uuid } from 'uuid'
import { CurrentSongDisplay } from "./CurrentSongDisplay";
import { SongDocument } from "../../@types";
import styles from '@/styles/StreamPlayer.module.css';

interface streamPlayerProps{
  src: string
};

export function StreamPlayer({
  src
}: streamPlayerProps): JSX.Element{

  const audioElement = createRef<HTMLAudioElement>();
  const [ hlsAudio, setHlsAudio ] = useState<Hls | null>(null);
  const [ currentlyPlaying, setCurrentlyPlaying ] = useState<SongDocument | null>(null);

  useEffect(() => {
    if (Hls.isSupported()) {
      setHlsAudio(_initPlayer(hlsAudio));
    } else {
      audioElement.current?.load();
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
              audioElement={audioElement}
              hlsAudio={hlsAudio}
            />
          : <AudioPlayer
              audioElement={audioElement}
            />
        }
        <div className={styles.volumeControlContainer}>
          <div className={styles.volumeHover}>
            <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M11.002 2.999a.81.81 0 0 0-.593.25L6.028 7.63H2.581a.81.81 0 0 0-.593.25.81.81 0 0 0-.25.593v5.051c0 .228.084.426.25.592a.81.81 0 0 0 .593.25h3.447l4.381 4.382a.81.81 0 0 0 .592.25.81.81 0 0 0 .593-.25.809.809 0 0 0 .25-.592V3.841a.81.81 0 0 0-.25-.593.81.81 0 0 0-.592-.25M16.338 12.861a3.39 3.39 0 0 0 0-3.73 3.025 3.025 0 0 0-1.48-1.224.734.734 0 0 0-.33-.066.82.82 0 0 0-.592.243.805.805 0 0 0-.25.6c0 .183.053.339.158.466.105.128.233.237.382.33.149.091.298.192.447.302.15.11.276.265.382.467.105.202.158.452.158.75s-.053.548-.158.75a1.328 1.328 0 0 1-.382.468c-.15.11-.298.21-.447.302-.15.092-.277.202-.382.329a.709.709 0 0 0-.158.467c0 .237.084.437.25.599a.823.823 0 0 0 .592.243.736.736 0 0 0 .33-.065 3.112 3.112 0 0 0 1.48-1.23"></path><path d="M19.146 14.717a6.638 6.638 0 0 0 1.119-3.718 6.642 6.642 0 0 0-1.119-3.718 6.495 6.495 0 0 0-2.96-2.48.948.948 0 0 0-.343-.066.81.81 0 0 0-.592.25.81.81 0 0 0-.25.592c0 .343.171.601.514.777.49.254.824.447 1 .579a4.969 4.969 0 0 1 1.52 1.783c.363.715.545 1.476.545 2.283 0 .807-.182 1.568-.546 2.284a4.969 4.969 0 0 1-1.52 1.783c-.175.132-.508.325-1 .579-.342.175-.513.434-.513.776a.81.81 0 0 0 .25.592c.167.167.368.25.605.25a.92.92 0 0 0 .33-.065 6.493 6.493 0 0 0 2.96-2.48"></path>
            </svg>
          </div>
          <AudioVolume 
            audioElement={audioElement}
          />
        </div>
        <h4 className={styles.songTitle}>
          <a
            target="_blank"
            href={currentlyPlaying?.link}
          >
            {currentlyPlaying?.track_title}
          </a>
        </h4>
      </div>
      <CurrentSongDisplay 
        currentlyPlaying={currentlyPlaying}
        setCurrentlyPlaying={setCurrentlyPlaying}
        key={uuid()} 
        hlsAudio={hlsAudio}
      />
    </div>
  );
};



interface audioPlayerProps{
  audioElement: RefObject<HTMLAudioElement>
  hlsAudio?: Hls | null
  src?: string
};

function AudioPlayer({
  audioElement,
  hlsAudio,
  src
}: audioPlayerProps): JSX.Element{

  const [ isPlaying, setIsPlaying ] = useState<boolean>(false);

  function setAudioPlaybackPosition(
    audioElement: RefObject<HTMLAudioElement>
  ): void{
    if (audioElement.current && hlsAudio && hlsAudio.liveSyncPosition){
      audioElement.current.currentTime = hlsAudio.liveSyncPosition;
    };
  };

  if (audioElement.current){
    isPlaying
      ? audioElement.current.play()
      : audioElement.current.pause()
  };

  return (
    <>
      <audio
        ref={audioElement} 
        src={src || undefined}
        onPlay={hlsAudio 
          ? () => setAudioPlaybackPosition(audioElement) 
          : undefined
        }
      />
      <button
        className={styles.playStopButton}
        onClick={() => {
          const audioReadyState = audioElement?.current?.readyState;
          if ((audioReadyState && audioReadyState >= 2) || isPlaying){
            setIsPlaying(p => !p);
          } else {
            console.error("Could not playback audio!");
            console.error("isPlaying: ", isPlaying);
            console.error("audioElement: ", audioElement);
            console.error("audioElement.current: ", audioElement.current);
            console.error("audioReadyState: ", audioReadyState);
          };
        }}
      >
        {isPlaying
          ? <svg 
              fill="currentColor" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="20 20 480 480"
            >
              <title>Stop</title>
              <path 
                d="M446.4 145H153.6c-4.7 0-8.6 3.9-8.6 8.6v292.8c0 4.7 3.9 8.6 8.6 8.6h292.8c4.7 0 8.6-3.9 8.6-8.6V153.6c0-4.7-3.9-8.6-8.6-8.6z" 
              />
            </svg> 
          : <svg 
              fill="currentColor" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 -20 480 480"
            >
              <title>Play</title>
              <g 
                id="_x33_--Hidden-_x28_closing-up_x29_-" 
                transform="translate(-772 -385)"
              >
                <path 
                  d="M1260.4 651.3L882.8 861.2c-4.4 2.4-8.2 2.7-11.2 1-3.1-1.7-4.6-5.1-4.6-10.2V433.2c0-4.8 1.5-8.2 4.6-10.2 3.1-2 6.8-1.7 11.2 1l377.6 210c4.4 2.4 6.6 5.3 6.6 8.7 0 3.3-2.2 6.2-6.6 8.6z"
                />
              </g>
            </svg>
        }
      </button>
    </>
  ); 
};



interface audioVolumeProps{
  audioElement: RefObject<HTMLAudioElement>
};

function AudioVolume({
  audioElement
}: audioVolumeProps): JSX.Element{

  const [ volume, setVolume ] = useState<string>("100");

  if (audioElement.current){
    audioElement.current.volume = Math.pow((Number(volume) / 100), 2);
  };

  return(
    <input
      className={styles.volumeControl}
      type="range"
      max="100"
      value={volume}
      onChange={(e) => setVolume(e.target.value)}
    />
  );
};
