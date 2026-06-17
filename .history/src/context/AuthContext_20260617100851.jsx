import { createContext, useContext, useState, useEffect } from 'react';
import apiInstance from '../config/apiInstance';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, name, role, language } = res.data.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ name, role, language }));
    setUser({ name, role, language });

    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
        console.log(err);
        
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isLoggedIn = () => !!localStorage.getItem('token');

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}