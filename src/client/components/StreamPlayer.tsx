import { createRef } from "react";
import Hls from "hls.js";
import { useEffect, useState } from "react";

interface props{
  src: string
}

function StreamPlayer({
  src 
}: props){

  const hlsVideo = createRef<HTMLVideoElement>()

  const [ testTearDown, setTestTearDown ] = useState(0)
  const [ metaDataDisplay, setMetaDataDisplay ] = useState('')

  useEffect(() => {
    let hls: Hls;
    
    function _initPlayer() {
      if (hls){
        hls.destroy()
      }
  
      const newHls = new Hls({
        enableWorker: false
      })

      if (hlsVideo.current){
        newHls.attachMedia(hlsVideo.current)
      }

      newHls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log('Media attached')
        newHls.loadSource(src)
  
        newHls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          hlsVideo.current?.play()
        })

      })

      newHls.on(Hls.Events.FRAG_PARSING_METADATA, (event, data) => {
        // Access the metadata
        console.log('Metadata:', data);
      });

      newHls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              newHls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              newHls.recoverMediaError();
              break;
            default:
              _initPlayer()
              break;
          }
        }
      })

      hls = newHls
    }

    if (Hls.isSupported()) {
      _initPlayer();
    }
    
    return () => {
      if (hls != null) {
        hls.destroy();
      }
    };
  }, [ testTearDown ])

  function checkHlsSupport(){
    if (Hls.isSupported()){
      return (
        <video ref={hlsVideo} />
      );
    } else {
      return (
        <video ref={hlsVideo} src={src}/>
      )
    }
  }

  return(
    <div>
      <button onClick={() => setTestTearDown(testTearDown + 1)}>Play</button>
      { checkHlsSupport() }
    </div>
  )
}

export default StreamPlayer;
