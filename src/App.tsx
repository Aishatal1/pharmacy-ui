// src/App.tsx

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import Customers from './pages/Customers';
import Products from './pages/Products';
import API_URL from './config/api';
import Invoices from './pages/Invoices';
import Dashboard from './pages/Dashboard';

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
// Renders login and registration forms and reports a successfully authenticated user upward.
function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [fullName, setFullName] = useState<string>('');
  const [role, setRole] = useState<string>('Admin');
  const [success, setSuccess] = useState<string>('');

  // Registers a new user, then switches the form back to login mode.
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
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Authenticates the user, saves the returned token, and starts the app session.
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
      setError('Login failed');
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

// --- Home Page ---
// Renders the simple landing page shown at the root route after login.
function HomePage() {
  return (
    <div className="home-page">
      <h1>🏠 Dashboard</h1>
      <p>Welcome to the Pharmacy Management System</p>
      <div className="dashboard-cards">
        <div className="dash-card">👥 Customers</div>
        <div className="dash-card">📦 Products</div>
        <div className="dash-card">📄 Invoices</div>
        <div className="dash-card">💰 Revenue</div>
      </div>
    </div>
  );
}

// --- MAIN APP ---
// Chooses between authentication and the protected application routes.
function App() {
  const [user, setUser] = useState<User | null>(null);

  // Stores the authenticated user in application state.
  const handleLogin = (user: User) => {
    setUser(user);
  };

  // Removes the saved token and returns the user to the login screen.
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // If not logged in, show login page
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Logged in: Show app with navigation
  return (
    <BrowserRouter>
      <div className="app">
        {/* Navigation */}
        <nav className="navbar">
          <div className="nav-brand">💊 Pharmacy</div>
          <div className="nav-links">
            <Link to="/">🏠 Home</Link>
            <Link to="/customers">👥 Customers</Link>
            <Link to="/products">📦 Products</Link>
            <Link to="/invoices">📄 Invoices</Link>
            <Link to="/dashboard">📊 Dashboard</Link>
          </div>
          <div className="nav-user">
            <span>👋 {user.fullName}</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        {/* Page Content */}
        <div className="page-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/products" element={<Products />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
