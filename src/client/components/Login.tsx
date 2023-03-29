import { useState } from 'react';
import '../stylesheets/Login.css';


interface props{
  setUserId: React.Dispatch<React.SetStateAction<string>>
};

export function Login({
  setUserId
}: props){

  const [ isFetching, setIsFetching ] = useState<boolean>(false);
  const [ loginError, setLoginError ] = useState<string>('');
  const [ loginOrCreate, setLoginOrCreate ] = useState<'login' | 'create'>('login');
  const [ hanldleUnChange, setHanldleUnChange ] = useState<string>('');
  const [ handlePwChange, setHandlePwChange ] = useState<string>('');


  async function submitCredentials(){

    if (!hanldleUnChange || !handlePwChange){
      return;
    };

    if (hanldleUnChange.length > 25){
      setLoginError('Username cannot exceed 25 charaters');
      return;
    };

    if (handlePwChange.length < 6){
      setLoginError('Password cannot be less than 6 charaters')
      return;
    };

    setLoginError('');

    const {username, jwt} = await sendRequest();

    setHanldleUnChange('');
    setHandlePwChange('');
    setUserId(username);

    localStorage.setItem('sessionJwt', jwt);
  };

  
  async function sendRequest(){

    setIsFetching(true);

    try{
      const endpoint = 
        loginOrCreate === 'login' 
          ? 'api/login' 
          : 'api/createUser';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type' : 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
          username: hanldleUnChange,
          password: handlePwChange
        })
      });
      
      if (!res.ok){
        const errorMsg = loginOrCreateOpts(
          'Inncorrect username or password',
          'User alredy exists'
        );
        setIsFetching(false);
        setLoginError(errorMsg);
        return;
      };

      const data = await res.json();
      setIsFetching(false);
      return data;

    } catch (err) {
      setIsFetching(false);
      console.error(`Could not submit login form ${err}`);
    };
  };


  function handleSwapModes(){
    const swap = loginOrCreateOpts('create', 'login');
    setHanldleUnChange('');
    setHandlePwChange('');
    setLoginError('');
    setLoginOrCreate(swap);
  };

  
  function loginOrCreateOpts<T>(
    loginOpt: T, 
    createOpt: T
  ): T{
    return loginOrCreate === 'login'
      ? loginOpt
      : createOpt
  };


  return (
    <div className="loginWindow">
      <h4>{loginOrCreateOpts('Log in', 'Sign Up')}</h4>
      <form 
        className="submitLogin" 
        onSubmit={(e) => {
          e.preventDefault();
          submitCredentials();
        }}
      >
        <input
          className="usernameFormInput"
          type="text"
          placeholder='Username'
          value={hanldleUnChange} 
          onChange={(e) => setHanldleUnChange(e.target.value)}
        />
        <input
          className="passwordFormInput"
          type="text"
          placeholder='Password'
          value={handlePwChange} 
          onChange={e => setHandlePwChange(e.target.value)}
        />
        <button 
          onSubmit={(e) => {
            e.preventDefault();
            submitCredentials();
          }}
        >
          Submit
        </button>
      </form>
      <button 
        onClick={(e) =>{
          e.preventDefault();
          handleSwapModes();
        }}
      >
        {loginOrCreateOpts(
          `Don't have an account?`, 
          `Already have an account?`
        )}
      </button>
      <div className='loginError'>
        <span className='loginErrorMsg'>{loginError}</span>
      </div>
      <span className='loading'>
        {isFetching
          ? 'Loading...'
          : null
        }
      </span>
    </div>
  )
}