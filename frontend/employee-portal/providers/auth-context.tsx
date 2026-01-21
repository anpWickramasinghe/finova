import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

type User = {
    _id: string;
    name: string;
    email: string;
    role: string;
    token: string;
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    signIn: (user: User) => void;
    signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    signIn: () => { },
    signOut: () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for stored session
        const loadUser = async () => {
            try {
                const storedUser = await SecureStore.getItemAsync('user');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    // Re-apply token to axios headers
                    axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
                }
            } catch (e) {
                console.error('Failed to load user', e);
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, []);

    // Set up Axios interceptor for 401s
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 401) {
                    await signOut();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);


    const signIn = async (userData: User) => {
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
        await SecureStore.setItemAsync('user', JSON.stringify(userData));
    };

    const signOut = async () => {
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
        await SecureStore.deleteItemAsync('user');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                signIn,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
