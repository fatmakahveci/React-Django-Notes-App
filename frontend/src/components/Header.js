import React, { useContext, useEffect } from "react";
import { NavLink } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const Header = ({ setIsLoggedIn }) => {
  let { user, logoutUser } = useContext(AuthContext);
  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [user]);

  if (user) {
    return (
      <div className="app-header">
        <NavLink to="/notes/">Notes</NavLink>
        <p onClick={logoutUser}>Logout</p>
      </div>
    );
  } else {
    return (
      <div className="app-header">
      </div>
    );
  }
};

export default Header;
