// src/pages/Products.tsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import AnimatedPage from '../components/AnimatedPage';
import AnimatedCard from '../components/AnimatedCard';
import ProductForm from '../components/ProductForm';
import API_URL from '../config/api';
import './Products.css';

interface Product {
  id: number;
  barcode: string;
  name: string;
  companyName: string;
  productionDate: string;
  expirationDate: string;
  price: number;
  createdAt: string;
  createdByUsername: string;
}

interface ProductsResponse {
  data: Product[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

// Displays paginated products and coordinates product CRUD actions.
function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

  // Retrieves one page of products from the authenticated API.
  const fetchProducts = async (page: number = 1) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get<ProductsResponse>(
        `${API_URL}/products?page=${page}&pageSize=20`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setProducts(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
      setLoading(false);
    }
  };

  // Confirms and deletes a product, then reloads the current page.
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    setIsDeleting(id);
    const token = localStorage.getItem('token');
    
     {
      setIsDeleting(null);
    }
  };

  // Opens the form modal pre-filled with the product being edited.
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  // Closes the form modal and clears any selected product.
  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  // Closes the form modal and reloads products after a successful save.
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProduct(null);
    fetchProducts(currentPage);
  };

  if (loading) {
    return (
      <AnimatedPage className="products-container">
        <LoadingSpinner size={60} color="#4CAF50" />
      </AnimatedPage>
    );
  }

  if (error) {
    return (
      <AnimatedPage className="products-container">
        <div className="error">{error}</div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="products-container">
      <div className="products-header">
        <div>
          <h2 className="fade-in">📦 Products</h2>
          <p className="fade-in" style={{ animationDelay: '0.2s' }}>
            Total: {products.length} products
          </p>
        </div>
        <button 
          className="btn-primary btn-animated"
          onClick={() => setShowForm(true)}
        >
          ➕ Add Product
        </button>
      </div>
      
      <div className="products-grid">
        {products.map((product, index) => (
          <AnimatedCard key={product.id} delay={index * 0.05} className="product-card">
            <div className="product-header">
              <h3>{product.name}</h3>
              <span className="product-price">${product.price.toFixed(2)}</span>
            </div>
            <p className="product-barcode">🔖 {product.barcode}</p>
            <p className="product-company">🏢 {product.companyName || 'N/A'}</p>
            <div className="product-dates">
              <span>📅 Prod: {product.productionDate || 'N/A'}</span>
              <span>⏳ Exp: {product.expirationDate || 'N/A'}</span>
            </div>
            <p className="small">Created: {new Date(product.createdAt).toLocaleDateString()}</p>
            <p className="small">By: {product.createdByUsername}</p>
            <div className="card-actions">
              <button 
                className="btn-edit"
                onClick={() => handleEdit(product)}
              >
                ✏️ Edit
              </button>
              <button 
                className="btn-delete"
                onClick={() => handleDelete(product.id)}
                disabled={isDeleting === product.id}
              >
                {isDeleting === product.id ? 'Deleting...' : '🗑️ Delete'}
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
        <ProductForm
          product={editingProduct}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </AnimatedPage>
  );
}

export default Products;
