import { useState, Dispatch, SetStateAction } from 'react';
import styles from '@/styles/Login.module.css'
import { BeatLoader } from 'react-spinners';
import makeColor from '../../utils/makeColor'


interface props{
  setUserId: Dispatch<SetStateAction<string>>
  setUserColor: Dispatch<SetStateAction<string>>
};

export function Login({
  setUserId,
  setUserColor
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
    
    const res = await sendRequest();
    
    setHanldleUnChange('');
    setHandlePwChange('');

    if (!res) return;

    setUserId(res.username);
    setUserColor(res.chatColor || makeColor());

    localStorage.setItem('sessionJwt', res.jwt);
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
    <div className={styles.loginWindow}>
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
  )
}
