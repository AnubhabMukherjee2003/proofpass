// Reuse most types from user app
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface Admin {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'gate_staff';
  createdAt: string;
}

export interface AdminAuthResponse {
  token: string;
  admin: Admin;
  expiresIn: number;
}

// Event Types (same as user app)
export interface Event {
  id: string;
  name: string;
  location: string;
  date: number; // Unix timestamp
  price: number;
  capacity: number;
  sold: number;
  image: string; // IPFS URL
  description: string;
  status: 'active' | 'inactive' | 'completed';
  createdBy: string;
}

// Entry/Ticket Types for Gate Staff
export interface EntryTicket {
  id: string;
  eventId: string;
  userId: string;
  userPhone: string;
  eventName: string;
  status: 'active' | 'used' | 'expired';
  qrCode: string;
  bookedAt: number;
  usedAt?: number;
}

export interface QrScanResponse {
  ticket: EntryTicket;
  otpSent: boolean;
  message: string;
}

export interface OtpVerificationResponse {
  success: boolean;
  ticket: EntryTicket;
  message: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalEvents: number;
  totalTicketsSold: number;
  activeEvents: number;
  ticketsScannedToday: number;
  recentBookings: {
    eventName: string;
    ticketId: string;
    bookedAt: number;
    price: number;
  }[];
}

// Create Event Request
export interface CreateEventRequest {
  name: string;
  location: string;
  date: number;
  price: number;
  capacity: number;
  image: string;
  description: string;
}
