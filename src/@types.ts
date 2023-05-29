export interface songInfo{
  post_id: string;
  title: string;
  memberPosted?: string;
  postText?: string;
  datePosted?: Date;
  src: string;
  duration: string;
  channel: string;
  itag: number;
  length: number;
  hasBeenPlayed?: boolean;
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
  sort_by?: 'date_posted' | 'reacts' | 'user_name' | 'date_aired';
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
  has_been_played?: boolean;
};
