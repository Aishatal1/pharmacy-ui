// src/components/InvoiceForm.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'https://pharmacy-api-nig8.onrender.com';

interface Product {
  id: number;
  name: string;
  price: number;
}

interface Customer {
  id: number;
  name: string;
}

interface InvoiceFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onClose, onSuccess }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState({
    customerId: 0,
    items: [{ productId: 0, quantity: 1, priceAtSale: 0 }],
  });

  useEffect(() => {
    fetchCustomersAndProducts();
  }, []);

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
      setCustomers(customersRes.data.data);
      setProducts(productsRes.data.data);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: 0, quantity: 1, priceAtSale: 0 }]
    });
  };

  const handleRemoveItem = (index: number) => {
    const items = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const items = [...formData.items];
    items[index] = { ...items[index], [field]: value };
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

    try {
      await axios.post(
        `${API_URL}/invoices`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-content modal-large"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>📄 Create Invoice</h3>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="error">{error}</div>}

            <div className="form-group">
              <label>Customer *</label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: Number(e.target.value) })}
                required
              >
                <option value={0}>Select Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <h4>Invoice Items</h4>
            {formData.items.map((item, index) => (
              <div key={index} className="invoice-item-row">
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
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                  min="1"
                  required
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={item.priceAtSale}
                  onChange={(e) => handleItemChange(index, 'priceAtSale', Number(e.target.value))}
                  step="0.01"
                  min="0.01"
                  required
                />
                {formData.items.length > 1 && (
                  <button type="button" onClick={() => handleRemoveItem(index)}>✕</button>
                )}
              </div>
            ))}

            <button type="button" onClick={handleAddItem} className="btn-secondary">
              ➕ Add Item
            </button>

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <LoadingSpinner size={20} /> : 'Create Invoice'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InvoiceForm;