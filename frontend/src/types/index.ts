export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  blocked: boolean;
  theme?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  parentId?: string;
  children?: Category[];
  _count?: { products: number };
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  stock: number;
  benefits: string;
  ingredients: string;
  usageInstructions: string;
  contraindications: string;
  featured: boolean;
  active: boolean;
  categoryId: string;
  category: Category;
  images: ProductImage[];
  averageRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  status: 'PENDING' | 'APPROVED' | 'HIDDEN';
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
  product?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    images: ProductImage[];
    slug: string;
    stock: number;
  };
}

export interface Order {
  id: string;
  userId: string;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'PAID';
  returnStatus: 'NONE' | 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
  returnReason?: string;
  returnRequestedAt?: string;
  createdAt: string;
  items: OrderItem[];
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface CartItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  imageId: string;
  imageUrl: string;
  slug: string;
  stock?: number;
}
