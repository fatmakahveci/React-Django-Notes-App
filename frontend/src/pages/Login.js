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
  const usernameInstruction = `
    4 to 24 characters.
    It must begin with a letter.
    Letters, numbers, underscores, hyphens allowed.`;

  useEffect(() => {
    setValidName(USER_REGEX.test(user));
  }, [user]);

  const handleUsernameChange = (e) => {
    setUser(e.target.value);
  };

  const [pwd, setPwd] = useState("");
  const [validPwd, setValidPwd] = useState(false);
  const [pwdFocus, setPwdFocus] = useState(false);
  const pwdInstruction = `
    8 to 24 characters.
    It must include uppercase and lowercase letters,
    a number and a special character (!@#$%).`;

  useEffect(() => {
    setValidPwd(PWD_REGEX.test(pwd));
  }, [pwd]);

  const handlePwdChange = (e) => {
    setPwd(e.target.value);
  };

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
              onChange={handleUsernameChange}
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
              <FontAwesomeIcon icon={faInfoCircle} /> {usernameInstruction}
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
              onChange={handlePwdChange}
              onFocus={() => setPwdFocus(true)}
              onBlur={() => setPwdFocus(false)}
              placeholder="Password"
            />
            <p
              id="pwdnote"
              className={pwdFocus && !validPwd ? "instructions" : "offscreen"}
            >
              <FontAwesomeIcon icon={faInfoCircle} /> {pwdInstruction}
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
