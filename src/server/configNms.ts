export function configNms(ffmpegPath: string){
  const config = {
    logType: 3,
    rtmp: {
      port: 1935,
      chunk_size: 30,
      gop_cache: false,
      ping: 60,
      ping_timeout: 120
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
          ac: "aac",
          acParam: ['-ab', '128k', '-ac', '2', '-ar', '44100'],
          rtmp:true,
          rtmpApp:'live2',
          hls: true,
          hlsFlags: '[hls_time=3:hls_list_size=4:hls_flags=delete_segments]',
          hlsKeep: false
        }
      ]
    },
    mediaServer: {
      idleTimeout: 30
    },
  };
  return config;
};
