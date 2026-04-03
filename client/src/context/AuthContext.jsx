import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Load user from token on mount
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await api.get('/api/auth');
                setUser(res.data);
                setIsAuthenticated(true);
            } catch (err) {
                localStorage.removeItem('token');
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
            const res = await api.post('/api/auth/login', { username, password });
            localStorage.setItem('token', res.data.token);
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
        setUser(null);
        setIsAuthenticated(false);
    };

    /**
     * updateUser — Re-fetches fresh user data from /api/auth 
     * and updates the context immediately. Call this after profile
     * changes (picture, name, etc.) so ALL components get the 
     * new data instantly without a page reload.
     * 
     * Optionally accepts partial user data to merge immediately
     * for an optimistic update before the server response arrives.
     */
    const updateUser = useCallback(async (partialData = null) => {
        // Optimistic update: merge partial data immediately
        if (partialData) {
            setUser(prev => prev ? { ...prev, ...partialData } : prev);
        }

        // Then fetch the canonical data from the server
        try {
            const res = await api.get('/api/auth');
            setUser(res.data);
            return res.data;
        } catch (err) {
            console.error('Failed to refresh user data:', err);
            return null;
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading, isAuthenticated, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
