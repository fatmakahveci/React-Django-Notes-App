import {
  faCheck,
  faInfoCircle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(.\w{2,3})+$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%.]).{8,24}$/;

const Login = () => {
  const { loginUser } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [validEmail, setValidEmail] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const emailInstruction = `E-mail is invalid.`;

  useEffect(() => {
    setValidEmail(EMAIL_REGEX.test(email));
  }, [email]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
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
          <label className="col-sm-5 col-form-label" htmlFor="email">
            E-mail address
            <FontAwesomeIcon
              icon={faCheck}
              className={emailFocus && validEmail ? "valid" : "hide"}
            />
            <FontAwesomeIcon
              icon={faTimes}
              className={emailFocus && !validEmail ? "invalid" : "hide"}
            />
          </label>
          <div className="col-sm-7">
            <input
              type="text"
              className="form-control"
              id="email"
              onChange={handleEmailChange}
              value={email}
              name="email"
              autoComplete="off"
              required
              aria-invalid={validEmail ? "false" : "true"}
              aria-describedby="uidnote"
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
              placeholder="E-mail address"
            />
            <p
              id="uidnote"
              className={
                emailFocus && !validEmail ? "instructions" : "offscreen"
              }
            >
              <FontAwesomeIcon icon={faInfoCircle} /> {emailInstruction}
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
            <span className="register-screen__subtext">
              &nbsp;&nbsp;&nbsp;Don't you have an account?{" "}
              <NavLink to="/register">Register</NavLink>
            </span>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Login;
