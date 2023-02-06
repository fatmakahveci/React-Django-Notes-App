import React, { useContext, useEffect} from 'react';
import { Link } from 'react-router-dom';
import AuthContext from "../context/AuthContext";

const Header = ({ setIsLoggedIn }) => {
  let { user, logoutUser } = useContext(AuthContext);
  useEffect(() => {
      if (user) {
          setIsLoggedIn(true)
      } else {
          setIsLoggedIn(false)
      }
  }, [user]);

  return (
    <div className='app-header'>
      <Link to="/">Home</Link>
      <Link to="/register">Register</Link>
      <Link to="/notes/">Notes</Link>
      {user ?
        (<p onClick={logoutUser}>Logout</p>)
        :
        (<Link to='/login'>Login</Link>)
      }
      {user && <p>Hello {user.username}</p>}
    </div>
  )
}

export default Header