import { dbQueryFilters, post } from "@/../@types"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { v4 as uuid } from "uuid";
import ytdl from 'ytdl-core';

export function PostSearch(): JSX.Element{

  const { register, handleSubmit, formState: { errors }} = useForm();
  const [ posts, setPosts ] = useState<post[]>([]);
  const [ userList, setUserList ] = useState<{_id: string, posts: number}[]>([]);

  useEffect(() => {
    getUsers()
  }, []);


  async function getPosts(
    formData: dbQueryFilters
  ): Promise<void>{

    const query = Object.entries(formData)
      .filter(([_, val]) => val)
      .map(([key, val]) => `${key}=${val}&`)
      .join('');

    if (!query) return;

    try{
      const res = await fetch(`api/getPosts?${query}`);
      if (!res.ok) return;
      const data = await res.json();
      setPosts(data.posts);
    } catch(err){
      console.error(`Error getting posts: ${err}`)
    };
  };


  async function getUsers(): Promise<void>{
    try{
      const res = await fetch('/api/listArchiveUsers');
      if (!res.ok) return;
      const data = await res.json();
      setUserList(data.users);
    } catch (err){
      console.error(`Error getting users: ${err}`)
    };
  };


  function makePost(post: post){
    return (
      <div>
        <ul>
          <li>{post.user_name}</li>
          { post.track_title ? <li>{post.track_title}</li> : null }
          { post.link && post.link_source 
              ? <li>{hanldeIframeEmbed(post.link_source, post.link)}</li> 
              : null
          }
          { post.text ? <li>{post.text}</li> : null }
          <li>{new Date(post.date_posted).toDateString()}</li>
        </ul>
      </div>
    )  
  };
  

  function hanldeIframeEmbed(mediaSrc: string, src: string){
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
            {/* <iframe 
              src="https://bandcamp.com/EmbeddedPlayer/album=976546489/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/transparent=true/" seamless
            > */}
              <a href={src}>Bandcamp</a>
            {/* </iframe> */}
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

  
  return (
    <div>
      <form id="searchform" onSubmit={handleSubmit((data) => getPosts(data))}>
        <input type='text' list='userlist' autoComplete="off" placeholder="Posted by..." {...register('user_name')}/>
        <datalist id='userlist'>
          { userList.map(user => <option key={uuid()} value={user._id}/>) }
        </datalist>
        <input type='text' autoComplete="off" placeholder="Track title..." {...register('track_title')}/>
        <input type='text' autoComplete="off" placeholder="Post text..." {...register('text')}/>
        <input type='text' autoComplete="off" placeholder="Contains anywhere..." {...register('entry_contains_text')}/> 
        <select form='searchform' {...register('link_source')}>
          <option value=''>Media source...</option>
          <option value=''>Any</option>
          <option value='youtube'>Youtube</option>
          <option value='bandcamp'>Bandcamp</option>
          <option value='soundcloud'>Soundcloud</option>
          <option value='other'>All Others</option>
        </select>
        <select form='searchform' {...register('sort_by')}>
          <option value='date_posted'>Sort By...</option>
          <option value='date_posted'>Date posted</option>
          <option value='reacts'>Likes</option>
          <option value='user_name'>User name</option>
        </select>
        <select form='searchform' {...register('sort_dir')}>
          <option value={-1}>Order...</option>
          <option value={-1}>Asc</option>
          <option value={1}>Dec</option>
        </select>
        <input type='submit'/>
      </form>
      <div>
        { posts.map((post: post) => makePost(post)) }
      </div>
    </div>
  )
};