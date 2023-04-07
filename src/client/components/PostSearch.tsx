import { dbQueryFilters, post } from "@/../@types"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { v4 as uuid } from "uuid";


export function PostSearch(){

  const { register, handleSubmit, formState: { errors }} = useForm();
  const [ posts, setPosts ] = useState([]);
  const [ userList, setUserList ] = useState<{_id: string, posts: number}[]>([]);

  useEffect(() => {
    getUsers()
  }, [])

  async function getPosts(formData: dbQueryFilters){
    const query = `/api/getPosts?${
      Object.entries(formData)
        .filter(([_, val]) => val)
        .map(([key, val]) => `${key}=${val}&`)
        .join('')
      }`; 

    const res = await fetch(query);
    const data = await res.json();
    setPosts(data.posts);
  };

  async function getUsers(){
    const query = `/api/listArchiveUsers`;
    const res = await fetch(query);
    const data = await res.json();
    setUserList(data.users);
  };
  
  return (
    <div>
      <form onSubmit={handleSubmit((data) => getPosts(data))}>
        <input type='text' list='userlist' autoComplete="off" placeholder="Posted by..." {...register('user_name')}/>
        <datalist id='userlist'>
          { userList.map(user => <option key={uuid()} value={user._id}/>) }
        </datalist>
        <input type='text' autoComplete="off" placeholder="Track title..." {...register('track_title')}/>
        <input type='text' autoComplete="off" placeholder="Post content..." {...register('text')}/>
        <input type='text' autoComplete="off" placeholder="Link source..." {...register('link_source')}/> 
        <input type='text' autoComplete="off" placeholder="Contains..." {...register('entry_contains_text')}/> 
        <input type='submit'/>
      </form>
      <div>
        { posts.map((post: post) => {
          return (
            <div>
              <ul>
                {Object.entries(post)
                  .map(([key, val]) => 
                    <li>{key} : {val}</li>)
                }      
              </ul>
            </div>
          )
        }) }
      </div>
    </div>
  )
};