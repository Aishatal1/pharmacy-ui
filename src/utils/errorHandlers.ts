// src/utils/errorHandler.ts

export interface ApiError {
  status?: number;
  message?: string;
  errors?: Record<string, string[]>;
  error?: string;
}

export const getErrorMessage = (error: any): string => {
  // Network error
  if (!error.response) {
    return '🌐 Cannot connect to the server. Please check your internet connection.';
  }

  const { status, data } = error.response;

  // Handle validation errors (400)
  if (status === 400 && data?.errors) {
    const errorMessages: string[] = [];
    
    if (typeof data.errors === 'object') {
      Object.entries(data.errors).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          errorMessages.push(`${field}: ${messages.join(', ')}`);
        } else {
          errorMessages.push(`${field}: ${messages}`);
        }
      });
    }
    
    return errorMessages.length > 0 
      ? errorMessages.join('\n')
      : 'Invalid data provided. Please check your input.';
  }

  // Unauthorized (401)
  if (status === 401) {
    if (data?.error?.toLowerCase().includes('username') || data?.error?.toLowerCase().includes('password')) {
      return '❌ Invalid username or password. Please try again.';
    }
    return '🔒 Your session has expired. Please log in again.';
  }

  // Forbidden (403)
  if (status === 403) {
    return '🚫 You do not have permission to perform this action.';
  }

  // Not found (404)
  if (status === 404) {
    if (data?.error?.includes('Customer')) {
      return '👤 Customer not found. Please select a valid customer.';
    }
    if (data?.error?.includes('Product')) {
      return '📦 Product not found. Please select a valid product.';
    }
    if (data?.error?.includes('Invoice')) {
      return '📄 Invoice not found.';
    }
    return '🔍 The requested resource was not found.';
  }

  // Conflict (409)
  if (status === 409) {
    if (data?.error?.includes('Barcode')) {
      return '📋 Barcode already exists. Please use a different barcode.';
    }
    if (data?.error?.includes('Phone')) {
      return '📱 Phone number already exists. Please use a different phone number.';
    }
    if (data?.error?.includes('Username')) {
      return '👤 Username already exists. Please choose a different username.';
    }
    return data?.error || data?.message || '⚠️ This item already exists.';
  }

  // Server error (500)
  if (status >= 500) {
    return '💥 Server error. Please try again later.';
  }

  // Default
  return data?.error || data?.message || '❌ An unexpected error occurred.';
};