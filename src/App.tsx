// src/App.tsx

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Invoices from './pages/Invoices';
import Dashboard from './pages/Dashboard';
import { getErrorMessage } from './utils/errorHandlers';
import CreateInvoice from './pages/CreateInvoice';

const API_URL = 'https://pharmacy-api-nig8.onrender.com';

// --- TYPES ---
interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

// --- Login Component ---
function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [fullName, setFullName] = useState<string>('');
  const [role, setRole] = useState<string>('Admin');
  const [success, setSuccess] = useState<string>('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(`${API_URL}/auth/register`, {
        username,
        password,
        fullName,
        role
      });
      setSuccess('✅ Registered! Please login.');
      setIsLogin(true);
      setUsername('');
      setPassword('');
      setFullName('');
      setRole('Admin');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, {
        username,
        password
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      onLogin(user);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <form className="login-box" onSubmit={isLogin ? handleLogin : handleRegister}>
        <h2>{isLogin ? '🔐 Login' : '📝 Register'}</h2>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        {!isLogin && (
          <>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Cashier">Cashier</option>
            </select>
          </>
        )}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
        </button>

        <p className="toggle-link" onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}>
          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
        </p>
      </form>
    </div>
  );
}

// --- MAIN APP ---
function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className="app">
        {/* ✅ SINGLE NAVBAR - THE NEW ONE */}
        <nav className="navbar">
          <div className="nav-brand">
            <span className="brand-icon">💊</span>
            <span className="brand-text">Pharmacy</span>
          </div>
          <div className="nav-links">
            <NavLink 
              to="/" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="nav-icon">📊</span> Dashboard
            </NavLink>
            <NavLink 
              to="/customers" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="nav-icon">👥</span> Customers
            </NavLink>
            <NavLink 
              to="/products" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="nav-icon">📦</span> Products
            </NavLink>
            <NavLink 
              to="/invoices" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="nav-icon">📄</span> Invoices
            </NavLink>
          </div>
          <div className="nav-user">
            <span className="user-name">👋 {user.fullName}</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        {/* Page Content */}
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/products" element={<Products />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/create" element={<CreateInvoice />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;