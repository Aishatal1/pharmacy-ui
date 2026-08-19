// src/pages/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import LoadingSpinner from '../components/LoadingSpinner';
import AnimatedPage from '../components/AnimatedPage';
import AnimatedCard from '../components/AnimatedCard';
import { getErrorMessage } from '../utils/errorHandlers';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_URL = 'https://pharmacy-api-nig8.onrender.com';

interface SalesSummary {
  date: string;
  totalInvoices: number;
  totalItemsSold: number;
  totalRevenue: number;
  averageInvoiceValue: number;
  topProducts: TopProduct[];
  salesByHour: SalesByHour[];
  isValid: boolean;
  validationMessages: string[];
}

interface TopProduct {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
}

interface SalesByHour {
  hour: number;
  invoices: number;
  revenue: number;
}

interface SalesRange {
  date: string;
  totalInvoices: number;
  totalRevenue: number;
  totalItems: number;
}

function Dashboard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [todaySales, setTodaySales] = useState<SalesSummary | null>(null);
  const [rangeSales, setRangeSales] = useState<SalesRange[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchMonthlyData(selectedMonth);
    }
  }, [selectedMonth]);

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

      // Get monthly data
      await fetchMonthlyData(selectedMonth);
      
      setLoading(false);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  const fetchMonthlyData = async (month: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const [year, monthNum] = month.split('-');
      const startDate = `${year}-${monthNum}-01`;
      const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
      const endDate = `${year}-${monthNum}-${String(lastDay).padStart(2, '0')}`;

      const rangeRes = await axios.get(
        `${API_URL}/sales/range?startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Process data for chart (daily aggregation)
      const dailyData: Record<string, SalesRange> = {};
      rangeRes.data.forEach((item: SalesRange) => {
        const date = item.date.split('T')[0];
        dailyData[date] = item;
      });

      // Fill in missing days
      const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
      const completeData: SalesRange[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${monthNum}-${String(day).padStart(2, '0')}`;
        completeData.push({
          date: dateStr,
          totalInvoices: dailyData[dateStr]?.totalInvoices || 0,
          totalRevenue: dailyData[dateStr]?.totalRevenue || 0,
          totalItems: dailyData[dateStr]?.totalItems || 0,
        });
      }

      setRangeSales(completeData);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <LoadingSpinner size={60} />;

  const totalRevenue = todaySales?.totalRevenue || 0;
  const totalInvoices = todaySales?.totalInvoices || 0;
  const totalItems = todaySales?.totalItemsSold || 0;

  // Chart data
  const chartData = {
    labels: rangeSales.map(d => d.date.slice(5)),
    datasets: [
      {
        label: 'Revenue ($)',
        data: rangeSales.map(d => d.totalRevenue),
        backgroundColor: 'rgba(76, 175, 80, 0.6)',
        borderColor: '#4CAF50',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Invoices',
        data: rangeSales.map(d => d.totalInvoices),
        backgroundColor: 'rgba(52, 152, 219, 0.6)',
        borderColor: '#3498db',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Daily Sales for ${selectedMonth}`,
        font: { size: 16 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

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

      {/* Monthly Chart */}
      <AnimatedCard className="chart-card" delay={0.4}>
        <div className="chart-header">
          <h3>📈 Monthly Sales</h3>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-picker"
          />
        </div>
        <div className="chart-container">
          <Bar options={chartOptions} data={chartData} />
        </div>
      </AnimatedCard>

      {/* Top Products */}
      {todaySales?.topProducts && todaySales.topProducts.length > 0 && (
        <AnimatedCard className="top-products" delay={0.5}>
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
    </AnimatedPage>
  );
}

export default Dashboard;