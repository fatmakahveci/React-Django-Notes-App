import {
  faCheck,
  faInfoCircle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";
import { Link } from "react-router-dom";

const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%.]).{8,24}$/;

const Register = () => {
  const { registerUser } = useContext(AuthContext);

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

  const [matchPwd, setMatchPwd] = useState("");
  const [validMatchPwd, setValidMatchPwd] = useState(false);
  const [matchPwdFocus, setMatchPwdFocus] = useState(false);

  useEffect(() => {
    setValidMatchPwd(pwd === matchPwd);
  }, [pwd, matchPwd]);

  const handleMatchPwdChange = (e) => {
    setMatchPwd(e.target.value);
  };

  return (
    <div className="wrapper">
      <h1>Register</h1>
      <form onSubmit={registerUser}>
        <div className="row mb-3">
          <label className="col-sm-5 col-form-label" htmlFor="Email">
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
              placeholder="Email"
            />
            <p
              id="uidnote"
              className={emailFocus && !validEmail ? "instructions" : "offscreen"}
            >
              <FontAwesomeIcon icon={faInfoCircle} />{emailInstruction}
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
              <FontAwesomeIcon icon={faInfoCircle} />{pwdInstruction}
            </p>
          </div>
        </div>
        <div className="row mb-3">
          <label htmlFor="matchPwd" className="col-sm-5 col-form-label">
            Re-enter password
            <FontAwesomeIcon
              icon={faCheck}
              className={matchPwdFocus && validMatchPwd ? "valid" : "hide"}
            />
            <FontAwesomeIcon
              icon={faTimes}
              className={matchPwdFocus && !validMatchPwd ? "invalid" : "hide"}
            />
          </label>
          <div className="col-sm-7">
            <input
              type="password"
              className="form-control"
              id="matchPwd"
              value={matchPwd}
              name="matchPassword"
              autoComplete="off"
              required
              aria-invalid={validMatchPwd ? "false" : "true"}
              aria-describedby="umatchpwdnote"
              onChange={handleMatchPwdChange}
              onFocus={() => setMatchPwdFocus(true)}
              onBlur={() => setMatchPwdFocus(false)}
              placeholder="Re-enter password"
            />
            <p
              id="matchpwdnote"
              className={
                matchPwdFocus && !validMatchPwd ? "instructions" : "offscreen"
              }
            >
              <FontAwesomeIcon icon={faInfoCircle} />
              Passwords don't match.
            </p>
          </div>
        </div>
        <div className="form-group">
          <div className="col-sm-offset-2 col-sm-10">
            <button type="submit" className="btn btn-primary">
              Submit
            </button>
            <span className="register-screen__subtext">
              &nbsp;&nbsp;&nbsp;Already have an account? <Link to="/login">Login</Link>
            </span>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Register;
