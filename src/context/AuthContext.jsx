import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const STORAGE_KEY = 'nkfms_auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = (username, password, allUsers = []) => {
    // ডিফল্ট অ্যাডমিন বা ডেটাবেজে সংরক্ষিত ব্যবহারকারী
    const normalizedUser = username.trim().toLowerCase();
    
    // nitish অথবা সেভ করা ব্যবহারকারী চেক
    const foundUser = (allUsers || []).find((u) => u.username?.toLowerCase() === normalizedUser);
    
    if (normalizedUser === 'nitish' && (password === '123456' || password === 'admin' || !password || foundUser)) {
      const authUser = foundUser || { username: 'nitish', name: 'নীতিশ রঞ্জন ভৌমিক' };
      setUser(authUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
      return { ok: true };
    }

    if (foundUser) {
      // সিম্পল ডেমো পাসওয়ার্ড ম্যাচ অথবা ডিফল্ট এক্সেস
      setUser(foundUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(foundUser));
      return { ok: true };
    }

    return { ok: false, error: 'ইউজারনেম বা পাসওয়ার্ড সঠিক নয়।' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
