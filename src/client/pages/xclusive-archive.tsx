import { PostSearch } from "@/components/PostSearch";
import { PageWrapper } from "@/components/PageWrapper";
import { useForm } from "react-hook-form"
import { cache, useEffect, useState } from "react";


export default function ExploreFullArchive(): JSX.Element{

  const [ isLoggedIn, setIsLoggedIn ] = useState<boolean>(false);
  const [ isFetching, setIsFetching ] = useState<boolean>(false);

  useEffect(() => {
    verifySession()
  }, []) 

  async function login(){

    setIsFetching(true);

    try {
      const res = await fetch('api/memberLogin', {
        method: 'POST',
        headers: {
          'Content-Type' : 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
          member_key: 'takedrugseverydrug!'
        })
      });

      setIsFetching(false);

      if (!res.ok){
        //set error message on page here
        setIsLoggedIn(false);
        return;
      } else {
        setIsLoggedIn(true);
      };

    } catch(err){
      setIsFetching(false);
    }
  };

  async function verifySession(){
    try {
      const res = await fetch('api/verifyMemberSession')
      if (res.ok) setIsLoggedIn(true);
    } catch(err) {
      console.log('Error verifying session')
    }
  }

  return (
    <PageWrapper>
      {isLoggedIn
        ? <PostSearch
          fullArchive={true}
        />
        : <button onClick={() => login()}>
            testlogin
          </button>
      }
    </PageWrapper>
  );
};
