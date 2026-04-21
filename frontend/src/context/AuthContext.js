// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { setAuthToken } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const t = await SecureStore.getItemAsync('token');
      const u = await SecureStore.getItemAsync('user');
      if (t && u) {
        setToken(t);
        setUser(JSON.parse(u));
        setAuthToken(t);
      }
      setLoading(false);
    };
    load();
  }, []);

  const login = async (token, user) => {
    setToken(token);
    setUser(user);
    setAuthToken(token);
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
