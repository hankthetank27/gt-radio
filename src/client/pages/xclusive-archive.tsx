import { PostSearch } from "@/components/PostSearch";
import { PageWrapper } from "@/components/PageWrapper";
import { useForm } from "react-hook-form"
import { useEffect, useState } from "react";
import { BeatLoader } from 'react-spinners';


export default function ExploreFullArchive(): JSX.Element{

  const { register, handleSubmit, reset } = useForm();
  const [ isLoggedIn, setIsLoggedIn ] = useState<boolean>(false);
  const [ isFetching, setIsFetching ] = useState<boolean>(false);

  useEffect(() => {
    verifySession();
  }, []) 

  async function login(
    key: string
  ): Promise<void>{

    setIsFetching(true);

    try {
      const res = await fetch('api/memberLogin', {
        method: 'POST',
        headers: {
          'Content-Type' : 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
          member_key: key
        })
      });

      setIsFetching(false);

      if (res.ok){
        setIsLoggedIn(true);
        return;
      } else {
        //set error message on page here
        setIsLoggedIn(false);
        return;
      };

    } catch(err){
      setIsFetching(false);
    };
  };

  async function verifySession(): Promise<void>{
    try {
      const res = await fetch('api/verifyMemberSession')
      if (res.ok) setIsLoggedIn(true);
    } catch(err) {
      console.log('Error verifying session')
    };
  };

  return (
    <PageWrapper>
      {isLoggedIn
        ? <PostSearch
            fullArchive={true}
          />
        : <form
            id='login'
            onSubmit={handleSubmit(d => {
              login(d.key);
              reset();
            })}
          >
            <p>Enter Password</p>  
            <div>
              <input 
                className="defaultTextInput"
                type='password' 
                autoComplete="off" {...register('key')}
              />
              <input 
                className='defaultButton' 
                type='submit'
              />
            </div>
          </form>
      }
      {isFetching
        ? <BeatLoader
            size={13}
            color="#000000"
            cssOverride={{
              margin: "200px"
            }}
          />
        : <div/> 
      }
    </PageWrapper>
  );
};
