import axios from "axios";
import jwt_decode from "jwt-decode";
import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(
    localStorage.getItem("authTokens")
      ? JSON.parse(localStorage.getItem("authTokens"))
      : null
  );

  const [user, setUser] = useState(
    localStorage.getItem("user")
      ? jwt_decode(localStorage.getItem("user"))
      : null
  );

  const navigate = useNavigate();

  const registerUser = async (e) => {
    e.preventDefault();

    axios.defaults.xsrfCookieName = "csrftoken";
    axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";

    await axios
      .post(
        "/register",
        {
          user_name: e.target.user_name.value,
          email: e.target.email.value,
          password: e.target.password.value,
          match_password: e.target.match_password.value,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then(navigate("/login"));
  };

  const loginUser = async (e) => {
    e.preventDefault();

    await axios
      .post(
        "token/",
        {
          email: e.target.email.value,
          password: e.target.password.value,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      )
      .then((response) => {
        setAuthTokens(response.data);
        setUser(jwt_decode(response.data.access));
        localStorage.setItem("authTokens", JSON.stringify(response.data));
        navigate("/");
      });
  };

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem("authTokens");
    navigate("login/");
  };

  const contextData = {
    user: user,
    authTokens: authTokens,
    loginUser: loginUser,
    registerUser: registerUser,
    logoutUser: logoutUser,
  };

  return (
    <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>
  );
};

export default AuthContext;
