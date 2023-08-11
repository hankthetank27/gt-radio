import { AudioStream } from "./livestream/AudioStream";

export interface broadcast {
  id: string | null
  main: AudioStream
};

export interface nmsConfig {
    logType?: number;
    rtmp?: RtmpConfig;
    http: HttpConfig;
    https?: SslConfig;
    trans: TransConfig;
    relay?: RelayConfig;
    fission?: FissionConfig;
    auth?: AuthConfig;
}

interface RtmpConfig {
    port?: number;
    ssl?: SslConfig;
    chunk_size?: number;
    gop_cache?: boolean;
    ping?: number;
    ping_timeout?: number;
}

interface SslConfig {
    key: string;
    cert: string;
    port?: number;
}

interface HttpConfig {
    mediaroot: string;
    port?: number;
    allow_origin?: string;
}

interface AuthConfig {
    play?: boolean;
    publish?: boolean;
    secret?: string;
}

interface TransConfig {
    ffmpeg: string;
    tasks: TransTaskConfig[];
}

interface RelayConfig {
    tasks: RelayTaskConfig[];
    ffmpeg: string;
}

interface FissionConfig {
    ffmpeg: string;
    tasks: FissionTaskConfig[];
}

interface TransTaskConfig {
    app: string;
    hls?: boolean;
    hlsFlags: string;
    dash?: boolean;
    dashFlags?: string;
    vc?: string;
    vcParam?: string[];
    ac?: string;
    acParam?: string[];
    rtmp?: boolean;
    rtmpApp?: string;
    mp4?: boolean;
    mp4Flags?: string;
}

interface RelayTaskConfig {
    app: string;
    name?: string;
    mode: string;
    edge: string;
    rtsp_transport?: string;
    appendName?: boolean;
}

interface FissionTaskConfig {
    rule: string;
    model: FissionTaskModel[];
}

interface FissionTaskModel {
    ab: string;
    vb: string;
    vs: string;
    vf: string;
}
