
export enum UrgencyLevel {
  LOW = 'Faible',
  URGENT = 'Urgent',
  VERY_URGENT = 'Très Urgent'
}

export enum PaymentMethodType {
  COD = 'Paiement à la livraison',
  WALLET = 'Portefeuille Interne (MSN)',
  CRYPTO = 'Crypto',
  MOBILE_MONEY = 'Mobile Money'
}

export enum OrderStatus {
  PENDING = 'En attente',
  APPROVED = 'Approuvé',
  REJECTED = 'Rejeté',
  DELIVERED = 'Livré'
}

export interface PaymentGateway {
  id: string;
  name: string;
  type: PaymentMethodType;
  logoUrl?: string;
  actionUrl?: string; // URL for redirect or API endpoint
  isActive: boolean;
  order: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
}

export interface Order {
  id: string;
  productName: string;
  description: string;
  price: number;
  cryptoAmount?: string;
  clientName: string;
  clientContact: string;
  moissonneurCode: string;
  clientMoissonneurCode?: string;
  agentCode?: string;
  country: string;
  city: string;
  neighborhood: string;
  deliveryLocation: string;
  urgency: UrgencyLevel;
  location?: LocationData;
  paymentMethodId: string;
  photoUrl?: string; // Base64
  status: OrderStatus;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  aiAnalysis?: string;
}

export type UserRole = 'USER' | 'AGENT' | 'REP' | 'ADMIN';

export interface User {
  id: string;
  email?: string; // Added email
  name: string;
  role: UserRole;
  msnCode: string;
  walletBalance: number;
}
