import styles from '@/styles/PostSearch.module.css';
import { dbQueryFilters, post } from "@/../@types";
import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuid } from "uuid";
import ReactPaginate from 'react-paginate';
import { BeatLoader } from 'react-spinners';
import { Post } from '../components/Post';


interface posts {
  posts: post[]
  queryPages: number
};

interface postSearchProps{
  fullArchive: boolean
};

export function PostSearch({
  fullArchive
}: postSearchProps): JSX.Element{

  const { register, handleSubmit } = useForm();
  const [ postsData, setPostsData ] = useState<posts>({posts: [], queryPages: 0});
  const [ userList, setUserList ] = useState<{_id: string, posts: number}[]>([]);
  const [ searchData , setSearchData ] = useState<dbQueryFilters | null>(null);
  const [ loadingPosts, setLoadingPosts ] = useState<boolean>(false);

  useEffect(() => {
    getUsers();
    setSearchData({
      page: 0,
      sort_by: fullArchive ? 'date_posted' : 'date_aired',
      sort_dir: fullArchive ? 1 : -1
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
      const endpoint = fullArchive
        ? `api/getAllPosts?${query}`
        : `api/getPosts?${query}`
      const res = await fetch(endpoint);
      setLoadingPosts(false);
      if (!res.ok) return;
      const data = await res.json();
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
        <div className={styles.formSearch}>
          <div className={styles.formSubcontainer}>
            <input 
              className={`defaultTextInput ${styles.searchTextInput}`}
              type='text' 
              list='userlist' 
              autoComplete="off" 
              placeholder="Posted by..." 
              {...register('user_name')}
            />
            <datalist id='userlist'>
              { userList.map(user => <option key={uuid()} value={user._id}/>) }
            </datalist>
            <input 
              className={`defaultTextInput ${styles.searchTextInput}`}
              type='text' 
              autoComplete="off" 
              placeholder="Track title..." 
              {...register('track_title')}
            />
          </div>
          <div className={styles.formSubcontainer}>
            <input 
              className={`defaultTextInput ${styles.searchTextInput}`}
              type='text' 
              autoComplete="off" 
              placeholder="Post text..." 
              {...register('entry_contains_text')}
            /> 
            <div className={styles.formSort}>
              <select 
                className='defaultSelect'
                form='searchform' {...register('sort_by')}
              >
                <option value='date_aired'>Sort...</option>
                <option value='date_aired'>Date aired</option>
                <option value='date_posted'>Date posted</option>
                <option value='reacts'>Likes</option>
                <option value='user_name'>User name</option>
              </select>
              <select 
                className={`defaultSelect ${styles.searchSelect}`}
                form='searchform' {...register('sort_dir')}
              >
                <option value={-1}>Order...</option>
                <option value={-1}>Asc</option>
                <option value={1}>Dec</option>
              </select>
            </div>
          </div>
          <input 
            id={styles.searchButton}
            className="defaultButton" 
            type='submit'
            value="Search"
          />
        </div>
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
          : postsData.posts.map((post: post) => <Post key={uuid()}post={post}/>)
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
          nextLabel="Next"
          previousLabel="Prev"
          onPageChange={handlePageClick}
          pageRangeDisplayed={3}
          pageCount={postsData.queryPages}
          renderOnZeroPageCount={null}
          className={styles.pageNav}
          activeClassName={styles.activePage}
        />
      : null
    }
  </>);
};
