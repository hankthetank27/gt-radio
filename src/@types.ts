export interface songInfo{
  title: string;
  memberPosted: string | undefined;
  postText: string | undefined;
  datePosted: Date | undefined;
  src: string;
  duration: string;
  channel: string;
  itag: number;
  length: number;
};

export interface streamProcessTracker {
  startTime: number;
  downloaded: number;
  processed: number;
  passThroughFlowing: boolean;
  ytdlDone: boolean;
  transcodeAudioDone: boolean;
  passToDestinationDone: boolean;
};

export interface chatMessage{
  userId: string;
  message: string;
  timeStamp: Date;
  color: string;
};

export interface chatError{
  errorMsg: string;
  messages: chatMessage[];
};

export interface dbQueryFilters {
  user_name?: string; 
  track_title?: string;
  text?: string;
  link_source?: 'youtube' | 'bandcamp' | 'soundcloud' | 'other';
  entry_contains_text?: string;
  sort_by?: 'date_posted' | 'reacts' | 'user_name'; 
  sort_dir?: -1 | 1; 
  page: number;
};

export interface post{
  user_name?: string; 
  track_title?: string;
  text?: string;
  link?: string;
  link_source?: string;
  date_posted: string;
  reacts?: string;
};
