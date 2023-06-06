import { useState, Dispatch, SetStateAction } from 'react';
import styles from '@/styles/LoginLogout.module.css'
import { BeatLoader } from 'react-spinners';
import makeColor from '../../utils/makeColor'


interface loginProps{
  setDisplayLoginWindow: Dispatch<SetStateAction<boolean>>
  setUserId: Dispatch<SetStateAction<string>>
  setUserColor: Dispatch<SetStateAction<string>>
};

export function Login({
  setUserId,
  setUserColor,
  setDisplayLoginWindow
}: loginProps): JSX.Element{

  const [ isFetching, setIsFetching ] = useState<boolean>(false);
  const [ loginError, setLoginError ] = useState<string>('');
  const [ loginOrCreate, setLoginOrCreate ] = useState<'login' | 'create'>('login');
  const [ hanldleUnChange, setHanldleUnChange ] = useState<string>('');
  const [ handlePwChange, setHandlePwChange ] = useState<string>('');


  async function submitCredentials(): Promise<void>{

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
    
    const res = await sendRequest();
    
    setHanldleUnChange('');
    setHandlePwChange('');

    if (!res) return;

    setUserId(res.username);
    setUserColor(res.chatColor || makeColor());
    setDisplayLoginWindow(false);

    localStorage.setItem('sessionJwt', res.jwt);
  };

  
  async function sendRequest(): Promise<any>{

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
          'User already exists'
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


  function handleSwapModes(): void{
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
    <div className={styles.loginWindow}>
      <button 
        onClick={() => setDisplayLoginWindow(false)}
        className={styles.closeWindowButton}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="currentColor"  
          viewBox="0 0 15 15"
        > 
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      </button>
      <h4>{loginOrCreateOpts('Log in', 'Sign Up')}</h4>
      <form 
        className={styles.submitLogin} 
        onSubmit={(e) => {
          e.preventDefault();
          submitCredentials();
        }}
      >
        <input
          className={styles.usernameFormInput}
          type="text"
          placeholder='Username'
          value={hanldleUnChange} 
          onChange={(e) => setHanldleUnChange(e.target.value)}
        />
        <input
          className={styles.passwordFormInput}
          type="password"
          placeholder='Password'
          value={handlePwChange} 
          onChange={e => setHandlePwChange(e.target.value)}
        />
        <button  
          id={styles.submitButton}
          className="defaultButton"
          onSubmit={(e) => {
            e.preventDefault();
            submitCredentials();
          }}
        >
          Submit
        </button>
      </form>
      <button 
        className={styles.createOrAlreadyHaveAccBtn}
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
      <div className={styles.loginErrorContainer}>
        <span className={styles.loginErrorMsg}>{loginError}</span>
      </div>
      <span className={styles.loading}>
        {isFetching
          ? <BeatLoader
              size={8}
              color= "#000000"
            />
          : null
        }
      </span>
    </div>
  );
};


interface logoutProps{
  userId: string
  setUserId: Dispatch<SetStateAction<string>>
  setDisplayLoginWindow: Dispatch<SetStateAction<boolean>>
};

export function Logout({
  userId,
  setUserId,
  setDisplayLoginWindow
}: logoutProps): JSX.Element{
  return (
    <div className={styles.logoutContainer}>
      <span className={styles.loggedInAs}>Logged in as {userId}</span>
      <button 
        className="defaultButton" 
        onClick={(e) => {
          e.preventDefault();
          window.localStorage.removeItem('sessionJwt');
          setUserId('');
          setDisplayLoginWindow(false);
        }}
      >
        Log out
      </button>
    </div>
  );
};
