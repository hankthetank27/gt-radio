import { dbQueryFilters, post } from "@/../@types"
import { useState } from "react"
import { useForm } from "react-hook-form"

export function PostSearch(){

  const { register, handleSubmit, formState: { errors }} = useForm();
  const [ posts, setPosts ] = useState([])

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
  }

  return (
    <div>
      <form onSubmit={handleSubmit((data) => getPosts(data))}>
        <input type='text' placeholder="Posted by..." {...register('user_name')}/>
        <input type='text' placeholder="Track title..." {...register('track_title')}/>
        <input type='text' placeholder="Post content..." {...register('text')}/>
        <input type='text' placeholder="Link source..." {...register('link_source')}/> 
        <input type='text' placeholder="Contains..." {...register('entry_contains_text')}/> 
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