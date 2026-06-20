import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flashMessages, setFlashMessages] = useState([]);

  const addFlash = (message) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setFlashMessages((prev) => [...prev, { id, text: message }]);
    setTimeout(() => {
      setFlashMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, 4000);
  };

  const checkAuth = async () => {
    try {
      const res = await apiFetch('/api/auth/me');
      const data = await res.json();
      if (data.logged_in) {
        setUser({
          username: data.username,
          email: data.email,
          isAdmin: data.is_admin
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to check auth:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setUser({
          username: data.user.name,
          email: data.user.email,
          isAdmin: data.user.isAdmin
        });
        addFlash(`Welcome back, ${data.user.name}!`);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed.' };
      }
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        addFlash(data.message || 'Account created! Please log in.');
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Registration failed.' };
      }
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      const res = await apiFetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        addFlash('You have been logged out.');
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, flashMessages, addFlash, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
