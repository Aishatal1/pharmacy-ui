// src/types/index.ts

export interface Customer {
  id: number;
  name: string;
  emailAddress: string;
  phoneNumber: string;
  createdAt: string;
  createdByUsername: string;
}

export interface Product {
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

export interface InvoiceItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  priceAtSale: number;
  total: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  totalAmount: number;
  isPaid: boolean;
  createdAt: string;
  createdByUsername: string;
  items: InvoiceItem[];
}

export interface InvoiceDetail extends Invoice {
  customer: Customer;
  createdBy: {
    id: number;
    fullName: string;
    username: string;
  };
  paymentSummary: {
    totalPaid: number;
    remainingBalance: number;
    isFullyPaid: boolean;
    payments: any[];
  };
}