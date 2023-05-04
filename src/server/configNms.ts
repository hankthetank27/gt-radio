export function configNms(ffmpegPath: string){
  const config = {
    logType: 1,
    rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: false,
        ping: 30,
        ping_timeout: 60
    },
    http: {
        port: 8000,
        mediaroot: './media',
        allow_origin: '*'
    },
    trans: {
      ffmpeg: ffmpegPath,
      tasks: [
        {
          app: 'live',
          vc: "copy",
          vcParam: [],
          ac: "aac",
          acParam: ['-ab', '64k', '-ac', '1', '-ar', '44100'],
          rtmp:true,
          rtmpApp:'live2',
          hls: true,
          hlsFlags: '[hls_time=3:hls_list_size=4:hls_flags=delete_segments]',
          hlsKeep: false
        }
      ]
    },
    mediaServer: {
      idleTimeout: 10
    }
  };
  return config;
};
