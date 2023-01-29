import { createContext, useState, useEffect } from 'react';
import jwt_decode from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({children}) => {

    let [authTokens, setAuthTokens] = useState(null);
    let [user, setUser] = useState(null);

    const navigate = useNavigate();

    let loginUser = async (e) => {
        e.preventDefault();

        let response = await fetch('http://127.0.0.1:8000/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({'username': e.target.username.value, 'password': e.target.password.value})
        })

        let data = await response.json();

        if (response.status === 200) {
            setAuthTokens(data);
            setUser(jwt_decode(data.access));
            localStorage.setItem('authTokens', JSON.stringify(data));
            alert(JSON.stringify(data));
            navigate('/');
        } else {
            alert('Login info is not correct...');
        }
    }

    let contextData = {
        user: user,
        loginUser: loginUser
    }

    return(
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext;
