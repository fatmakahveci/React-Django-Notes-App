import { useState } from "react";

function Register() {
  const [loginFormData, setloginFormData] = useState({
    username: "",
    password: "",
    password2: "",
  });

  const inputHandler = (e) => {
    setloginFormData({
      ...loginFormData,
      [e.target.name]: e.target.value,
    });
  };

  const submitHandler = (e) => {
    const formData = new FormData();
    formData.append("username", loginFormData.username);
    formData.append("password", loginFormData.password);
    formData.append("password2", loginFormData.password2);
  };

  const buttonEnable =
    loginFormData.username !== "" &&
    loginFormData.password !== "" &&
    loginFormData.password2 !== "";

  return (
    <div className="wrapper">
      <form>
        <div className="form-group">
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <input
            type="text"
            name="username"
            value={loginFormData.username}
            onChange={inputHandler}
            className="form-control"
            id="username"
          />
        </div>
        <div className="form-group">
          <label htmlFor="pwd" className="form-label">
            Password
          </label>
          <input
            type="text"
            name="password"
            value={loginFormData.password}
            onChange={inputHandler}
            className="form-control"
            id="pwd"
          />
        </div>
        <div className="form-group">
          <label htmlFor="pwd2" className="form-label">
            Repeat password
          </label>
          <input
            type="text"
            name="password2"
            value={loginFormData.password2}
            onChange={inputHandler}
            className="form-control"
            id="pwd2"
          />
        </div>
        <div className="form-group">
          <button
            type="button"
            disabled={!buttonEnable}
            onClick={submitHandler}
            className="btn btn-success btn-block"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}

export default Register;
