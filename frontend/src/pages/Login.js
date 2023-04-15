import { useContext, useEffect, useRef, useState } from "react";
import AuthContext from "../context/AuthContext";

const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;

function Login({ setIsLoggedIn }) {
  const { user, loginUser } = useContext(AuthContext);
  const [validName, setValidName] = useState(false);
  const [userFocus, setUserFocus] = useState(false);

  const [validPwd, setValidPwd] = useState(false);
  const [pwdFocus, setPwdFocus] = useState(false);

  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [user]);

  return (
    <div class="wrapper">
      <h1>Login</h1>
      <form onSubmit={loginUser}>
        <div class="row mb-3">
          <label class="col-sm-5 col-form-label" htmlFor="username">
            Username
          </label>
          <div class="col-sm-7">
            <input
              type="text"
              class="form-control"
              id="username"
              name="username"
              autoComplete="off"
              required
              placeholder="Username"
            />
          </div>
        </div>
        <div class="row mb-3">
          <label htmlFor="pwd" class="col-sm-5 col-form-label">
            Password
          </label>
          <div class="col-sm-7">
            <input
              type="text"
              class="form-control"
              id="pwd"
              name="password"
              autoComplete="off"
              required
              placeholder="Password"
            />
          </div>
        </div>
        <div class="form-group">

    <div class="col-sm-offset-2 col-sm-10">
            <button type="submit" class="btn btn-primary">Submit</button>
            </div>
        </div>
      </form>
    </div>
  );
}

export default Login;
