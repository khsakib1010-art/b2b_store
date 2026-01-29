// Product types
export interface Product {
  id: string;
  name: string;
  styleNumber: string;
  description?: string;
  colors: string[];
  sizes: string[];
  sizesInNumber?: number[];
  imageUrl?: string;
  price?: number;
  createdAt: Date;
}

// Order types
export interface OrderItem {
  productId: string;
  productName: string;
  styleNumber: string;
  color: string;
  size: string;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  poNumber: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered';
  totalItems: number;
  createdAt: Date;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  role: 'admin' | 'customer';
  createdAt: Date;
}

// Cart types for customer ordering
export interface CartItem {
  productId: string;
  productName: string;
  styleNumber: string;
  color: string;
  size: string;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
}
