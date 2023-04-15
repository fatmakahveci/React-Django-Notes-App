import { useEffect, useRef, useState } from "react";

const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;

const Register = () => {
  const userRef = useRef();
  const errRef = useRef();

  const [user, setUser] = useState("");
  const [validName, setValidName] = useState(false);
  const [userFocus, setUserFocus] = useState(false);

  const [pwd, setPwd] = useState("");
  const [validPwd, setValidPwd] = useState(false);
  const [pwdFocus, setPwdFocus] = useState(false);

  const [matchPwd, setMatchPwd] = useState("");
  const [validMatch, setValidMatch] = useState(false);
  const [matchFocus, setMatchFocus] = useState(false);

  const [errMsg, setErrMsg] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const result = USER_REGEX.test(user);
    console.log(result);
    console.log(user);
    setValidName(result);
  }, [user]);

  useEffect(() => {
    const result = PWD_REGEX.test(pwd);
    console.log(result);
    console.log(pwd);
    setValidPwd(result);
    const match = pwd === matchPwd;
    setValidMatch(match);
  }, [pwd, matchPwd]);

  useEffect(() => {
    setErrMsg("");
  }, [user, pwd, matchPwd]);

  return (
    <div class="wrapper">
      <h1>Register</h1>
      <form>
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
        <div class="row mb-3">
          <label htmlFor="pwd2" class="col-sm-5 col-form-label">
            Re-enter password
          </label>
          <div class="col-sm-7">
            <input
              type="text"
              class="form-control"
              id="pwd2"
              name="password"
              autoComplete="off"
              required
              placeholder="Password"
            />
          </div>
        </div>
        <div class="col-sm-10 offset-sm-2">
            <button type="submit" class="btn btn-primary">Submit</button>
        </div>
      </form>
    </div>
  );
};

export default Register;
