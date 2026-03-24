// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth Types
export interface AuthResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface User {
  id: string;
  phone: string;
  createdAt: string;
}

// Event Types
export interface Event {
  eventId: number;
  name: string;
  location: string;
  date: number; // Unix timestamp
  price: string; // String representation of Wei amount
  capacity: number;
  ticketsSold: number;
  imageUrl: string; // IPFS URL
}

// Ticket Types
export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  event?: Event;
  status: 'active' | 'used' | 'expired';
  qrCode: string;
  transactionHash: string;
  bookedAt: number;
  usedAt?: number;
  price: number;
}

// OTP Types
export interface OtpResponse {
  otpId: string;
  expiresIn: number; // seconds
  message: string;
}

// Entry Types
export interface EntryResponse {
  success: boolean;
  otpSent: boolean;
  message: string;
}

export interface EntryConfirmResponse {
  success: boolean;
  ticket: Ticket;
  message: string;
}
