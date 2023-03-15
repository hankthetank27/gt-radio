import { useEffect, useState, createRef, RefObject } from "react";
import Hls from "hls.js";
import { CurrentSongDisplay } from "./CurrentSongDisplay";

interface props{
  src: string
};

function StreamPlayer({
  src
}: props){

  const audioElement = createRef<HTMLAudioElement>()
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
  }, [src])


  function _initPlayer(hls: Hls | null) {
    if (hls){
      hls.destroy()
    };

    const newHls = new Hls({
      enableWorker: false,
      lowLatencyMode: true,
      liveSyncDuration: 3,
      liveDurationInfinity: true,
      backBufferLength: 0
    });

    if (audioElement.current){
      newHls.attachMedia(audioElement.current);
    };

    newHls.on(Hls.Events.MEDIA_ATTACHED, () => {
      console.log('Media attached');
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
            _initPlayer(hls)
            break;
        }
      }
    })

    return newHls;
  };


  function setAudioPlaybackPosition(audioElement: RefObject<HTMLAudioElement>){
    if (audioElement.current && hlsAudio && hlsAudio.liveSyncPosition){
      audioElement.current.currentTime = hlsAudio.liveSyncPosition;
    };
  };


  function renderAudioElement(){
    if (Hls.isSupported()){
      return (
        <audio
          ref={audioElement} 
          onPlay={() => setAudioPlaybackPosition(audioElement)} 
          controls autoPlay
        />
      );
    } else {
      return (
        <audio 
          ref={audioElement} 
          src={src} 
          controls autoPlay
        />
      )
    };
  };

  return(
    <div className="player">
      <CurrentSongDisplay hlsAudio={hlsAudio}/>
      { renderAudioElement() }
    </div>
  );
};

export default StreamPlayer;