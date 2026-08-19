// src/pages/Invoices.tsx

import { useState, useEffect } from 'react';
import axios from 'axios';
//import { useNavigate } from 'react-router-dom';
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

// Displays invoices and coordinates invoice creation and payment actions.
function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<number | null>(null);
 // const navigate = useNavigate(); 
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Retrieves the latest invoice list from the authenticated API.
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

  // Closes the creation modal and refreshes invoices after a new invoice is saved.
  const handleFormSuccess = () => {
    setShowForm(false);
    fetchInvoices();
  };

  // ✅ NEW: Handle payment
  // Submits a payment for the full outstanding invoice amount.
  const handlePay = async (invoiceId: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first');
      return;
    }

    setPayingInvoiceId(invoiceId);
    try {
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) return;

      // Send the full amount (or use a custom amount)
      await axios.post(
        `${API_URL}/invoices/${invoiceId}/pay`,
        invoice.totalAmount, // Pay full amount
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      await fetchInvoices();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process payment');
    } finally {
      setPayingInvoiceId(null);
    }
  };

  // ✅ NEW: Handle partial payment
  // Submits the amount entered in the partial-payment modal for an invoice.
  const handlePartialPay = async (invoiceId: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first');
      return;
    }

    if (paymentAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setPayingInvoiceId(invoiceId);
    try {
      await axios.post(
        `${API_URL}/invoices/${invoiceId}/pay`,
        paymentAmount,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setShowPaymentModal(false);
      setPaymentAmount(0);
      await fetchInvoices();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process payment');
    } finally {
      setPayingInvoiceId(null);
    }
  };

  if (loading) return <LoadingSpinner size={60} />;

  return (
    <AnimatedPage className="invoices-container">
      <div className="invoices-header">
        <h2>📄 Invoices</h2>
         <button 
            className="btn-primary" 
            onClick={() => {
              if (currentInvoiceId) {
                handlePartialPay(currentInvoiceId);
              }
            }}
            disabled={!currentInvoiceId}
          >
            Pay ${paymentAmount.toFixed(2)}
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
            
            {/* ✅ NEW: Pay button */}
            {!invoice.isPaid && (
              <div className="invoice-actions">
                <button 
                  className="btn-pay"
                  onClick={() => handlePay(invoice.id)}
                  disabled={payingInvoiceId === invoice.id}
                >
                  {payingInvoiceId === invoice.id ? 'Processing...' : '💳 Pay Full'}
                </button>
                <button 
                  className="btn-partial"
                  onClick={() => {
                    setCurrentInvoiceId(invoice.id);  // ← Store the invoice ID
                    setPaymentAmount(invoice.totalAmount);
                    setShowPaymentModal(true);
                  }}
                >
                  💰 Partial Pay
                </button>
              </div>
            )}
          </AnimatedCard>
        ))}
      </div>

      {showForm && (
        <InvoiceForm onClose={() => setShowForm(false)} onSuccess={handleFormSuccess} />
      )}

      {/* ✅ NEW: Partial Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💰 Partial Payment</h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <label>Enter Amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="payment-input"
              />
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={() => handlePartialPay(showPaymentModal ? 1 : 0)}
                >
                  Pay ${paymentAmount.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AnimatedPage>
  );
}

export default Invoices;
