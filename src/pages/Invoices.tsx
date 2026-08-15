// src/pages/Invoices.tsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import AnimatedPage from '../components/AnimatedPage';
import AnimatedCard from '../components/AnimatedCard';
import InvoiceForm from '../components/InvoiceForm';
import './Invoices.css';

const API_URL = 'https://pharmacy-api-nig8.onrender.com';

interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  isPaid: boolean;
  createdAt: string;
  createdByUsername: string;
  items: any[];
}

function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/invoices?page=1&pageSize=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load invoices');
      setLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchInvoices();
  };

  if (loading) return <LoadingSpinner size={60} />;

  return (
    <AnimatedPage className="invoices-container">
      <div className="invoices-header">
        <h2>📄 Invoices</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          ➕ Create Invoice
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="invoices-grid">
        {invoices.map((invoice, index) => (
          <AnimatedCard key={invoice.id} delay={index * 0.05} className="invoice-card">
            <div className="invoice-header">
              <h4>{invoice.invoiceNumber}</h4>
              <span className={`status ${invoice.isPaid ? 'paid' : 'unpaid'}`}>
                {invoice.isPaid ? '✅ Paid' : '⏳ Unpaid'}
              </span>
            </div>
            <p>👤 {invoice.customerName}</p>
            <p>💰 ${invoice.totalAmount.toFixed(2)}</p>
            <p className="small">Created: {new Date(invoice.createdAt).toLocaleDateString()}</p>
            <p className="small">By: {invoice.createdByUsername}</p>
          </AnimatedCard>
        ))}
      </div>

      {showForm && (
        <InvoiceForm onClose={() => setShowForm(false)} onSuccess={handleFormSuccess} />
      )}
    </AnimatedPage>
  );
}

export default Invoices;
