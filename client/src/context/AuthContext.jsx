import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // Configure default headers
                axios.defaults.headers.common['x-auth-token'] = token;
                const res = await axios.get('http://localhost:5000/api/auth');
                setUser(res.data);
                setIsAuthenticated(true);
            } catch (err) {
                localStorage.removeItem('token');
                delete axios.defaults.headers.common['x-auth-token'];
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = async (username, password) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
            localStorage.setItem('token', res.data.token);
            axios.defaults.headers.common['x-auth-token'] = res.data.token;
            setUser(res.data.user);
            setIsAuthenticated(true);
            return { success: true };
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.msg || 'Login failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['x-auth-token'];
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
