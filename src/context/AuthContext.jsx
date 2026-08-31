import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();
const STORAGE_KEY = 'nkfms_auth_user_v2';

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
    const normalizedUser = (username || '').trim().toLowerCase();

    // 1. Viewer / View Mode Account (Read Only)
    if (normalizedUser === 'viewer' || normalizedUser === 'view' || normalizedUser === 'guest') {
      const viewerUser = {
        id: 'u-viewer',
        username: 'viewer',
        name: 'ভিউয়ার (শুধুমাত্র প্রদর্শন)',
        role: 'viewer'
      };
      setUser(viewerUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(viewerUser));
      return { ok: true };
    }

    // 2. Admin Account (Nitish / Full Edit Access)
    if (normalizedUser === 'nitish' || normalizedUser === 'admin') {
      const adminUser = {
        id: 'u-admin',
        username: 'nitish',
        name: 'নীতিশ রঞ্জন ভৌমিক (অ্যাডমিন)',
        role: 'admin'
      };
      setUser(adminUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser));
      return { ok: true };
    }

    // 3. Check any custom saved user in database
    const foundUser = (allUsers || []).find((u) => u.username?.toLowerCase() === normalizedUser);
    if (foundUser) {
      const authUser = {
        ...foundUser,
        role: foundUser.role || 'viewer'
      };
      setUser(authUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
      return { ok: true };
    }

    return { ok: false, error: 'ইউজারনেম সঠিক নয়। অ্যাডমিনের জন্য "nitish" বা ভিউ মুডের জন্য "viewer" দিন।' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const isReadOnly = user?.role === 'viewer';

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isReadOnly,
        isAdmin: !isReadOnly
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
