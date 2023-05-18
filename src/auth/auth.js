import { signInWithEmailAndPassword } from "firebase/auth";
import { createContext, useContext, useState } from "react";
import { firebaseauth } from './firebaseauth';
import { useNavigate } from "react-router-dom";


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();


    const login = (email, password) => {
        signInWithEmailAndPassword(firebaseauth, email, password).then((res) => {
            setUser(res.user);
            navigate("/editor");
        }).catch((err) => {
            setUser(null);
        })
    }

    const logout = () => {
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    return useContext(AuthContext);
}