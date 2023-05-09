import styles from '@/styles/PostSearch.module.css' 
import { dbQueryFilters, post } from "@/../@types"
import { useEffect, useState, Dispatch, SetStateAction } from "react"
import { useForm } from "react-hook-form"
import { v4 as uuid } from "uuid";
import ReactPaginate from 'react-paginate';
import { BeatLoader } from 'react-spinners';
import { Post } from '../components/Post'


interface posts {
  posts: post[]
  queryPages: number
};

export function PostSearch(): JSX.Element{

  const { register, handleSubmit } = useForm();
  const [ postsData, setPostsData ] = useState<posts>({posts: [], queryPages: 0});
  const [ userList, setUserList ] = useState<{_id: string, posts: number}[]>([]);
  const [ searchData , setSearchData ] = useState<dbQueryFilters | null>(null);
  const [ loadingPosts, setLoadingPosts ] = useState<boolean>(false);

  useEffect(() => {
    getUsers();
    setSearchData({
      page: 0,
      link_source: 'youtube'
    })
  }, []);

  useEffect(() => {
    handleUpdatePosts();
  }, [ searchData ]);


  async function handleUpdatePosts(): Promise<void>{
    if (!searchData) return;
    const newPosts = await getPosts(searchData);
    if (!newPosts) return;
    setPostsData(newPosts);
  };


  async function getPosts(
    formData: dbQueryFilters
  ): Promise<posts | void>{

    setLoadingPosts(true);

    const query = Object.entries(formData)
      .filter(([_, val]) => val)
      .map(([key, val]) => `${key}=${val}&`)
      .join('');

    if (!query){
      setLoadingPosts(false);
      return;
    };

    try{
      const res = await fetch(`api/getPosts?${query}`);
      if (!res.ok) return;
      const data = await res.json();
      setLoadingPosts(false);
      return data.posts;
    } catch(err){
      setLoadingPosts(false);
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


  return (
    <div className={styles.searchContainer}>
      <form 
        id="searchform" 
        onSubmit={handleSubmit(async (data) => {
          data.page = 0;
          setSearchData(data as dbQueryFilters);
        })}
      >
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
      <div className={styles.searchResults}>
        {loadingPosts
          ? <BeatLoader 
              size={13}
              color="#000000"
              cssOverride={{
                margin: "200px"
              }}
            /> 
          : postsData.posts.map((post: post) => <Post post={post}/>)
        }
      </div>
      <PaginatePosts
        postsData={postsData}
        searchData={searchData}
        setSearchData={setSearchData}
      />
    </div>
  );
};


interface pageinateProps{
  postsData: posts
  searchData: dbQueryFilters | null
  setSearchData: Dispatch<SetStateAction<dbQueryFilters | null>>
};

function PaginatePosts({
  postsData,
  searchData,
  setSearchData,
}: pageinateProps): JSX.Element{

  async function handlePageClick(
    event: {selected: number}
  ): Promise<void>{
    const pageNum = event.selected; 
    if (!searchData) return;
    setSearchData((prev) => {
      return {...prev, page : pageNum};
    });
    window.scrollTo(0, 0);
  };

  return (<>  
    {postsData.posts.length 
      ? <ReactPaginate
          nextLabel="next"
          previousLabel="prev"
          onPageChange={handlePageClick}
          pageRangeDisplayed={5}
          pageCount={postsData.queryPages}
          renderOnZeroPageCount={null}
          className={styles.pageNav}
          activeClassName={styles.activePage}
        />
      : null
    }
  </>);
};
