// src/pages/Customers.tsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import AnimatedPage from '../components/AnimatedPage';
import AnimatedCard from '../components/AnimatedCard';
import CustomerForm from '../components/CustomerForm';
import API_URL from '../config/api';
import './Customers.css';

interface Customer {
  id: number;
  name: string;
  emailAddress: string;
  phoneNumber: string;
  createdAt: string;
  createdByUsername: string;
}

interface CustomersResponse {
  data: Customer[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

// Displays paginated customers and coordinates customer CRUD actions.
function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCustomers(currentPage);
  }, [currentPage]);

  // Retrieves one page of customers from the authenticated API.
  const fetchCustomers = async (page: number = 1) => {
    setLoading(true);
    if (!token) {
      setError('Please login first');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get<CustomersResponse>(
        `${API_URL}/customers?page=${page}&pageSize=20`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setCustomers(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers');
      setLoading(false);
    }
  };

  // Confirms and deletes a customer, then reloads the current page.
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    
    setIsDeleting(id);
    
 {
      setIsDeleting(null);
    }
  };

  // Opens the form modal pre-filled with the customer being edited.
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  // Closes the form modal and clears any selected customer.
  const handleFormClose = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  // Closes the form modal and reloads customers after a successful save.
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCustomer(null);
    fetchCustomers(currentPage);
  };

  if (loading) {
    return (
      <AnimatedPage className="customers-container">
        <LoadingSpinner size={60} color="#4CAF50" />
      </AnimatedPage>
    );
  }

  if (error) {
    return (
      <AnimatedPage className="customers-container">
        <div className="error">{error}</div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="customers-container">
      <div className="customers-header">
        <div>
          <h2 className="fade-in">👥 Customers</h2>
          <p className="fade-in" style={{ animationDelay: '0.2s' }}>
            Total: {customers.length} customers
          </p>
        </div>
        <button 
          className="btn-primary btn-animated"
          onClick={() => setShowForm(true)}
        >
          ➕ Add Customer
        </button>
      </div>
      
      <div className="customers-grid">
        {customers.map((customer, index) => (
          <AnimatedCard key={customer.id} delay={index * 0.05} className="customer-card">
            <h3>{customer.name}</h3>
            <p>📧 {customer.emailAddress}</p>
            <p>📞 {customer.phoneNumber}</p>
            <p className="small">Created: {new Date(customer.createdAt).toLocaleDateString()}</p>
            <p className="small">By: {customer.createdByUsername}</p>
            <div className="card-actions">
              <button 
                className="btn-edit"
                onClick={() => handleEdit(customer)}
              >
                ✏️ Edit
              </button>
              <button 
                className="btn-delete"
                onClick={() => handleDelete(customer.id)}
                disabled={isDeleting === customer.id}
              >
                {isDeleting === customer.id ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </AnimatedPage>
  );
}

export default Customers;
