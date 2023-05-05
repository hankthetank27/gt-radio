import { post } from '../../@types';
import styles from '@/styles/PostSearch.module.css' 
import ytdl from 'ytdl-core';


interface postProps {
    post: post
};

export function Post({
    post
}: postProps): JSX.Element{
    return (
      <div className={ styles.post }>
        <ul>
          <li>{post.user_name}</li>
          { post.track_title 
              ? <li>{post.track_title}</li> 
              : null 
          }
          { post.link && post.link_source 
              ? <li>
                    <EmbedIframe
                        mediaSrc={post.link_source}
                        src={post.link}
                    />
                </li> 
              : null
          }
          { post.text ? <li>{post.text}</li> : null }
          <li>{new Date(post.date_posted).toDateString()}</li>
        </ul>
      </div>
    );
};


interface embedIframeProps{
    mediaSrc: string
    src: string
};

function EmbedIframe({
    mediaSrc,
    src,
}: embedIframeProps): JSX.Element{
    switch (mediaSrc){
        case('youtube'):
            try {
                const videoId = ytdl.getURLVideoID(src);
                return (
                    <div>
                        <iframe
                            width="500"
                            height="280"
                            src={`https://www.youtube.com/embed/${videoId}`} 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        >
                        <a href={src}>Youtube</a>
                        </iframe>
                    </div>
                );
            } catch (err){
                return <div><a href={src}>Youtube</a></div>;
            };
        case('bandcamp'):
            return (
                <div>
                    <a href={src}>Bandcamp</a>
                </div>
            );
        case('soundcloud'):
            return (
                <div>
                    <a href={src}>Soundcloud</a>
                </div>
            );
        default:
            return(
                <div>
                    <a href={src}>{src}</a>
                </div>
            );
    }
};
