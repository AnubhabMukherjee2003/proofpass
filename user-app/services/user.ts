import { apiService } from './api';
import { API_ENDPOINTS } from '@/constants/api';

export interface Event {
  eventId: number;
  name: string;
  location: string;
  date: number;
  price: string;
  capacity: number;
  imageUrl?: string;
  isActive?: boolean;
}

export interface Ticket {
  ticketId: number;
  eventId: number;
  phone: string;
  price: number;
  currency: string;
  txHash: string;
  timestamp: string;
  status?: string;
}

export const eventService = {
  async listEvents(): Promise<Event[]> {
    try {
      const response = await apiService.getInstance().get(API_ENDPOINTS.EVENTS.LIST);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getEvent(id: number): Promise<Event> {
    try {
      const response = await apiService.getInstance().get(API_ENDPOINTS.EVENTS.GET(id));
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const ticketService = {
  async listTickets(): Promise<Ticket[]> {
    try {
      const response = await apiService.getInstance().get(API_ENDPOINTS.TICKETS.LIST);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getTicket(id: number): Promise<Ticket> {
    try {
      const response = await apiService.getInstance().get(API_ENDPOINTS.TICKETS.GET(id));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async bookTicket(eventId: number, price: number): Promise<Ticket> {
    try {
      const response = await apiService.getInstance().post(API_ENDPOINTS.TICKETS.CREATE, {
        eventId,
        price,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const entryService = {
  async scanTicket(ticketId: number, userToken: string) {
    try {
      const response = await apiService.getInstance().post(
        API_ENDPOINTS.ENTRY.SCAN(ticketId, userToken),
        {}
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async confirmEntry(phone: string, otp: string) {
    try {
      const response = await apiService.getInstance().post(API_ENDPOINTS.ENTRY.CONFIRM, {
        phone,
        otp,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getStatus(ticketId: number) {
    try {
      const response = await apiService.getInstance().get(
        API_ENDPOINTS.ENTRY.STATUS(ticketId)
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
