import { useContext, useEffect } from 'react';
import AuthContext from '../context/AuthContext';

function Login ({ setIsLoggedIn }) {

    const INITIAL_STATE = {username: '', password: ''};

    const { user, loginUser } = useContext(AuthContext);

    useEffect(() => {
        if (user) {
            setIsLoggedIn(true)
        } else {
            setIsLoggedIn(false)
        }
    }, [user]);

    return (
        <div className="wrapper">
        <form onSubmit={loginUser}>
            <div className="form-group">
                <label htmlFor="username" className="form-label">Username</label>
                <input type="text" name="username" className="form-control" id="username" />
            </div>
            <div className="form-group">
                <label htmlFor="pwd" className="form-label">Password</label>
                <input type="text" name="password" className="form-control" id="pwd" />
            </div>
            <input type='submit' />
        </form>
    </div>
    )
}

export default Login
