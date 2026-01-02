import { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import axios from 'axios';

interface User {
    _id: string;
    email: string;
    role: string;
    token: string;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            if (parsedUser.token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
            }
        }
        setLoading(false);
    }, []);

    // Axios interceptor to handle 401s (token expiration)
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response: any) => response,
            (error: any) => {
                if (error.response?.status === 401) {
                    logout();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        if (userData.token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
