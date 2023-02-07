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

  if (user) {
    return (
      <div className='app-header'>
        <Link to="/">Home</Link>
        <Link to="/notes/">Notes</Link>
        <p onClick={logoutUser}>Logout</p>
      </div>
    )
  } else {
    return (
      <div className='app-header'>
        <Link to="/">Home</Link>
        <Link to="/register">Register</Link>
        <Link to='/login'>Login</Link>
      </div>
    )
  }
}

export default Header