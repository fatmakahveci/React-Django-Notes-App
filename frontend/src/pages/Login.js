import {
  faCheck,
  faInfoCircle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";

const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%.]).{8,24}$/;

const Login = () => {
  const { loginUser } = useContext(AuthContext);

  const [user, setUser] = useState("");
  const [validName, setValidName] = useState(false);
  const [userFocus, setUserFocus] = useState(false);

  const [pwd, setPwd] = useState("");
  const [validPwd, setValidPwd] = useState(false);
  const [pwdFocus, setPwdFocus] = useState(false);

  useEffect(() => {
    setValidName(USER_REGEX.test(user));
  }, [user]);

  useEffect(() => {
    setValidPwd(PWD_REGEX.test(pwd));
  }, [pwd]);

  return (
    <div className="wrapper">
      <h1>Login</h1>
      <form onSubmit={loginUser}>
        <div className="row mb-3">
          <label className="col-sm-5 col-form-label" htmlFor="username">
            Username
            <FontAwesomeIcon
              icon={faCheck}
              className={userFocus && validName ? "valid" : "hide"}
            />
            <FontAwesomeIcon
              icon={faTimes}
              className={userFocus && !validName ? "invalid" : "hide"}
            />
          </label>
          <div className="col-sm-7">
            <input
              type="text"
              className="form-control"
              id="username"
              onChange={(e) => setUser(e.target.value)}
              value={user}
              name="username"
              autoComplete="off"
              required
              aria-invalid={validName ? "false" : "true"}
              aria-describedby="uidnote"
              onFocus={() => setUserFocus(true)}
              onBlur={() => setUserFocus(false)}
              placeholder="Username"
            />
            <p
              id="uidnote"
              className={userFocus && !validName ? "instructions" : "offscreen"}
            >
              <FontAwesomeIcon icon={faInfoCircle} />
              4 to 24 characters.
              <br />
              It must begin with a letter.
              <br />
              Letters, numbers, underscores, hyphens allowed.
            </p>
          </div>
        </div>
        <div className="row mb-3">
          <label htmlFor="pwd" className="col-sm-5 col-form-label">
            Password
            <FontAwesomeIcon
              icon={faCheck}
              className={pwdFocus && validPwd ? "valid" : "hide"}
            />
            <FontAwesomeIcon
              icon={faTimes}
              className={pwdFocus && !validPwd ? "invalid" : "hide"}
            />
          </label>
          <div className="col-sm-7">
            <input
              type="password"
              className="form-control"
              id="pwd"
              value={pwd}
              name="password"
              autoComplete="off"
              required
              aria-invalid={validPwd ? "false" : "true"}
              aria-describedby="upassnote"
              onChange={(e) => setPwd(e.target.value)}
              onFocus={() => setPwdFocus(true)}
              onBlur={() => setPwdFocus(false)}
              placeholder="Password"
            />
            <p
              id="pwdnote"
              className={pwdFocus && !validPwd ? "instructions" : "offscreen"}
            >
              <FontAwesomeIcon icon={faInfoCircle} />
              8 to 24 characters.
              <br />
              It must include uppercase and lowercase letters, a number and a
              special character (!@#$%).
            </p>
          </div>
        </div>
        <div className="form-group">
          <div className="col-sm-offset-2 col-sm-10">
            <button type="submit" className="btn btn-primary">
              Submit
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Login;
