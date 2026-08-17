// src/pages/Dashboard.tsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import AnimatedPage from '../components/AnimatedPage';
import AnimatedCard from '../components/AnimatedCard';
import type { SalesSummary, SalesRange } from '../types';import './Dashboard.css';

const API_URL = 'https://pharmacy-api-nig8.onrender.com';

// Fetches and presents current sales totals, top products, and recent sales trends.
function Dashboard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [todaySales, setTodaySales] = useState<SalesSummary | null>(null);
  const [rangeSales, setRangeSales] = useState<SalesRange[]>([]);
  const [selectedRange, setSelectedRange] = useState<'week' | 'month'>('week');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Loads today's sales summary and the sales range used for the trend chart.
  const fetchDashboardData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first');
      setLoading(false);
      return;
    }

    try {
      // Get today's sales
      const today = new Date().toISOString().split('T')[0];
      const todayRes = await axios.get(
        `${API_URL}/sales/daily-validation?date=${today}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTodaySales(todayRes.data);

      // Get sales range
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const start = startDate.toISOString().split('T')[0];
      
      const rangeRes = await axios.get(
        `${API_URL}/sales/range?startDate=${start}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRangeSales(rangeRes.data);

      setLoading(false);
    } catch (err) {
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size={60} />;

  const totalRevenue = todaySales?.totalRevenue || 0;
  const totalInvoices = todaySales?.totalInvoices || 0;
  const totalItems = todaySales?.totalItemsSold || 0;

  return (
    <AnimatedPage className="dashboard-container">
      <h2>📊 Revenue Dashboard</h2>

      {/* Stats Cards */}
      <div className="stats-grid">
        <AnimatedCard className="stat-card revenue">
          <h3>💰 Revenue</h3>
          <p className="stat-number">${totalRevenue.toFixed(2)}</p>
          <span className="stat-label">Today</span>
        </AnimatedCard>

        <AnimatedCard className="stat-card invoices" delay={0.1}>
          <h3>📄 Invoices</h3>
          <p className="stat-number">{totalInvoices}</p>
          <span className="stat-label">Today</span>
        </AnimatedCard>

        <AnimatedCard className="stat-card items" delay={0.2}>
          <h3>📦 Items Sold</h3>
          <p className="stat-number">{totalItems}</p>
          <span className="stat-label">Today</span>
        </AnimatedCard>

        <AnimatedCard className="stat-card average" delay={0.3}>
          <h3>📊 Avg Invoice</h3>
          <p className="stat-number">${todaySales?.averageInvoiceValue.toFixed(2) || '0.00'}</p>
          <span className="stat-label">Today</span>
        </AnimatedCard>
      </div>

      {/* Top Products */}
      {todaySales?.topProducts && todaySales.topProducts.length > 0 && (
        <AnimatedCard className="top-products" delay={0.4}>
          <h3>🏆 Top Selling Products</h3>
          <div className="product-list">
            {todaySales.topProducts.map((product, index) => (
              <div key={product.productId} className="product-item">
                <span className="rank">#{index + 1}</span>
                <span className="product-name">{product.productName}</span>
                <span className="product-qty">Qty: {product.quantitySold}</span>
                <span className="product-revenue">${product.revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </AnimatedCard>
      )}

      {/* Sales Range */}
      {rangeSales.length > 0 && (
        <AnimatedCard className="sales-range" delay={0.5}>
          <h3>📈 Sales Trend (Last 30 Days)</h3>
          <div className="range-bars">
            {rangeSales.map((day) => (
              <div key={day.date} className="bar-container">
                <div 
                  className="bar" 
                  style={{ 
                    height: `${Math.max(5, (day.totalRevenue / Math.max(...rangeSales.map(d => d.totalRevenue))) * 100)}%` 
                  }}
                />
                <span className="bar-label">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </AnimatedCard>
      )}
    </AnimatedPage>
  );
}

export default Dashboard;
