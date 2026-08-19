// src/pages/CreateInvoice.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import AnimatedPage from '../components/AnimatedPage';
import { getErrorMessage } from '../utils/errorHandlers';
import './CreateInvoice.css';

const API_URL = 'https://pharmacy-api-nig8.onrender.com';

interface Product {
  id: number;
  name: string;
  price: number;
}

interface Customer {
  id: number;
  name: string;
  emailAddress: string;
  phoneNumber: string;
}

function CreateInvoice() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false);
  
  const [formData, setFormData] = useState({
    customerId: 0,
    customerName: '',
    invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentTerm: 'Due end of month',
    remarks: '',
    items: [{ productId: 0, productName: '', quantity: 1, priceAtSale: 0, total: 0 }],
  });

  useEffect(() => {
    fetchCustomersAndProducts();
    generateInvoiceNumber();
  }, []);

  const generateInvoiceNumber = () => {
    const num = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    setFormData(prev => ({ ...prev, invoiceNumber: `INV-${num}` }));
  };

  const fetchCustomersAndProducts = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const [customersRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/customers?page=1&pageSize=100`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/products?page=1&pageSize=100`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setCustomers(customersRes.data.data || []);
      setProducts(productsRes.data.data || []);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setFormData({
      ...formData,
      customerId: customer.id,
      customerName: customer.name,
    });
    setShowCustomerDropdown(false);
    setSearchTerm('');
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: 0, productName: '', quantity: 1, priceAtSale: 0, total: 0 }]
    });
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) return;
    const items = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const items = [...formData.items];
    const item = { ...items[index], [field]: value };
    
    if (field === 'quantity' || field === 'priceAtSale') {
      const qty = field === 'quantity' ? Number(value) : item.quantity;
      const price = field === 'priceAtSale' ? Number(value) : item.priceAtSale;
      item.total = qty * price;
    }
    
    if (field === 'productId') {
      const product = products.find(p => p.id === Number(value));
      item.productName = product?.name || '';
      item.priceAtSale = product?.price || 0;
      item.total = item.quantity * item.priceAtSale;
    }
    
    items[index] = item;
    setFormData({ ...formData, items });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first');
      setLoading(false);
      return;
    }

    // Validate
    if (!formData.customerId || formData.customerId === 0) {
      setError('👤 Please select a customer.');
      setLoading(false);
      return;
    }

    const hasValidItems = formData.items.some(item => item.productId > 0 && item.quantity > 0);
    if (!hasValidItems) {
      setError('📦 Please add at least one item with a valid product and quantity.');
      setLoading(false);
      return;
    }

    const invoiceData = {
      customerId: formData.customerId,
      date: formData.date,
      dueDate: formData.dueDate,
      paymentTerm: formData.paymentTerm,
      remarks: formData.remarks,
      items: formData.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        priceAtSale: item.priceAtSale
      }))
    };

    try {
      await axios.post(
        `${API_URL}/invoices`,
        invoiceData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/invoices');
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.emailAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);

  if (loading) return <LoadingSpinner size={60} />;

  return (
    <AnimatedPage className="create-invoice-page">
      <div className="invoice-page-header">
        <h2>📄 Create New Invoice</h2>
        <button className="btn-secondary" onClick={() => navigate('/invoices')}>
          ← Back to Invoices
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit} className="invoice-form">
        {/* Customer Section */}
        <div className="customer-section">
          <label>Customer *</label>
          <div className="customer-select-wrapper">
            <div 
              className="customer-select"
              onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
            >
              {formData.customerName || 'Select Customer ▼'}
            </div>
            {showCustomerDropdown && (
              <div className="customer-dropdown">
                <input
                  type="text"
                  placeholder="Search Customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="customer-list">
                  {filteredCustomers.map(c => (
                    <div 
                      key={c.id}
                      className="customer-item"
                      onClick={() => handleCustomerSelect(c)}
                    >
                      <span className="customer-name">{c.name}</span>
                      <span className="customer-email">{c.emailAddress}</span>
                    </div>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <div className="no-customer">No customers found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Header */}
        <div className="invoice-header-grid">
          <div className="invoice-field">
            <label>Invoice #</label>
            <input
              type="text"
              value={formData.invoiceNumber}
              readOnly
              className="invoice-number"
            />
          </div>
          <div className="invoice-field">
            <label>Created At</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div className="invoice-field">
            <label>Payment Term</label>
            <select
              value={formData.paymentTerm}
              onChange={(e) => setFormData({ ...formData, paymentTerm: e.target.value })}
            >
              <option>Due end of month</option>
              <option>Net 15</option>
              <option>Net 30</option>
              <option>Due on receipt</option>
            </select>
          </div>
          <div className="invoice-field">
            <label>Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>
        </div>

        {/* Items Table */}
        <div className="items-table-wrapper">
          <table className="items-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Product</th>
                <th style={{ width: '15%' }}>Quantity</th>
                <th style={{ width: '20%' }}>Price</th>
                <th style={{ width: '15%' }}>VAT %</th>
                <th style={{ width: '15%' }}>Total</th>
                <th style={{ width: '5%' }}></th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, 'productId', Number(e.target.value))}
                      required
                    >
                      <option value={0}>Select Product</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                      min="1"
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.priceAtSale}
                      onChange={(e) => handleItemChange(index, 'priceAtSale', Number(e.target.value))}
                      step="0.01"
                      min="0"
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={0}
                      readOnly
                      className="vat-input"
                    />
                  </td>
                  <td className="total-cell">
                    ${(item.total || 0).toFixed(2)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="remove-item-btn"
                      onClick={() => handleRemoveItem(index)}
                      disabled={formData.items.length <= 1}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="button" className="add-item-btn" onClick={handleAddItem}>
          + Add Item
        </button>

        {/* Remarks Field */}
        <div className="remarks-field">
          <label>Remarks</label>
          <textarea
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="Enter any additional notes or remarks..."
            rows={2}
          />
        </div>

        {/* Totals */}
        <div className="totals-section">
          <div className="totals-row">
            <span>Sub Total(s)</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="totals-row total-final">
            <span>Total ($)</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/invoices')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <LoadingSpinner size={20} /> : 'Create Invoice'}
          </button>
        </div>
      </form>
    </AnimatedPage>
  );
}

export default CreateInvoice;