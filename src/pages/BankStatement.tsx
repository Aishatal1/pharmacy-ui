// src/pages/BankStatement.tsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import AnimatedPage from '../components/AnimatedPage';
import { getErrorMessage } from '../utils/errorHandlers';
import './BankStatement.css';

const API_URL = 'https://pharmacy-api-nig8.onrender.com';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  date: string;
  balance: number;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  isPaid: boolean;
  createdAt: string;
}

function BankStatement() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [totalUnpaid, setTotalUnpaid] = useState<number>(0);
  const [period, setPeriod] = useState<string>('month');

  useEffect(() => {
    fetchStatementData();
  }, [period]);

  const fetchStatementData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first');
      setLoading(false);
      return;
    }

    try {
      // Fetch all invoices
      const invoicesRes = await axios.get(
        `${API_URL}/invoices?page=1&pageSize=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const invoiceData = invoicesRes.data.data || [];
      setInvoices(invoiceData);

      // Calculate totals
      const paid = invoiceData.filter((inv: Invoice) => inv.isPaid);
      const unpaid = invoiceData.filter((inv: Invoice) => !inv.isPaid);
      
      const totalPaidAmount = paid.reduce((sum: number, inv: Invoice) => sum + inv.totalAmount, 0);
      const totalUnpaidAmount = unpaid.reduce((sum: number, inv: Invoice) => sum + inv.totalAmount, 0);
      const totalRevenueAmount = invoiceData.reduce((sum: number, inv: Invoice) => sum + inv.totalAmount, 0);

      setTotalPaid(totalPaidAmount);
      setTotalUnpaid(totalUnpaidAmount);
      setTotalRevenue(totalRevenueAmount);

      // Build transactions list
      const transactionList: Transaction[] = invoiceData.map((inv: Invoice) => ({
        id: inv.id,
        type: inv.isPaid ? 'Payment' : 'Invoice',
        amount: inv.isPaid ? inv.totalAmount : -inv.totalAmount,
        description: `Invoice ${inv.invoiceNumber} - ${inv.customerName}`,
        date: inv.createdAt,
        balance: 0, // Calculated below
      }));

      // Sort by date (oldest first for running balance)
      transactionList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate running balance
      let runningBalance = 0;
      transactionList.forEach((t) => {
        runningBalance += t.amount;
        t.balance = runningBalance;
      });

      setTransactions(transactionList);
      setLoading(false);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  const getPeriodText = () => {
    switch (period) {
      case 'month': return 'This Month';
      case 'quarter': return 'This Quarter';
      case 'year': return 'This Year';
      default: return 'All Time';
    }
  };

  if (loading) return <LoadingSpinner size={60} />;

  return (
    <AnimatedPage className="bank-statement-container">
      <div className="statement-header">
        <h2>🏦 Bank Statement</h2>
        <div className="period-selector">
          <button 
            className={period === 'month' ? 'active' : ''} 
            onClick={() => setPeriod('month')}
          >
            Month
          </button>
          <button 
            className={period === 'quarter' ? 'active' : ''} 
            onClick={() => setPeriod('quarter')}
          >
            Quarter
          </button>
          <button 
            className={period === 'year' ? 'active' : ''} 
            onClick={() => setPeriod('year')}
          >
            Year
          </button>
          <button 
            className={period === 'all' ? 'active' : ''} 
            onClick={() => setPeriod('all')}
          >
            All
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card revenue">
          <h3>💰 Total Revenue</h3>
          <p className="amount">${totalRevenue.toFixed(2)}</p>
          <span className="period-label">{getPeriodText()}</span>
        </div>
        <div className="summary-card paid">
          <h3>✅ Collected</h3>
          <p className="amount">${totalPaid.toFixed(2)}</p>
          <span className="period-label">{getPeriodText()}</span>
        </div>
        <div className="summary-card unpaid">
          <h3>⏳ Pending</h3>
          <p className="amount">${totalUnpaid.toFixed(2)}</p>
          <span className="period-label">{getPeriodText()}</span>
        </div>
      </div>

      {/* Statement Table */}
      <div className="statement-table-wrapper">
        <table className="statement-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction ID</th>
              <th>Description</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="no-data">No transactions found</td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{new Date(transaction.date).toLocaleDateString()}</td>
                  <td className="id-cell">#{transaction.id}</td>
                  <td>{transaction.description}</td>
                  <td>
                    <span className={`type-badge ${transaction.type.toLowerCase()}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className={`amount-cell ${transaction.amount >= 0 ? 'positive' : 'negative'}`}>
                    ${transaction.amount.toFixed(2)}
                  </td>
                  <td className="balance-cell">${transaction.balance.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AnimatedPage>
  );
}

export default BankStatement;