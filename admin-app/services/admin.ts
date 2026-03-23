import { adminApiService } from './api';
import { ADMIN_API_ENDPOINTS } from '@/constants/api';

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

export interface EventStats {
  eventId: number;
  capacity: number;
  ticketsSold: number;
  remaining: number;
}

export interface EntryStatus {
  status: string;
  ticketId: number;
  eventId: number;
  phone: string;
  txHash: string;
  timestamp: string;
}

export const adminEventService = {
  async listEvents(): Promise<Event[]> {
    try {
      const response = await adminApiService.getInstance().get(ADMIN_API_ENDPOINTS.EVENTS.LIST);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getEvent(id: number): Promise<Event> {
    try {
      const response = await adminApiService.getInstance().get(ADMIN_API_ENDPOINTS.EVENTS.GET(id));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async createEvent(eventData: Omit<Event, 'eventId' | 'isActive'>): Promise<Event> {
    try {
      const response = await adminApiService.getInstance().post(
        ADMIN_API_ENDPOINTS.EVENTS.CREATE,
        eventData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deactivateEvent(id: number): Promise<void> {
    try {
      await adminApiService.getInstance().post(ADMIN_API_ENDPOINTS.EVENTS.DEACTIVATE(id), {});
    } catch (error) {
      throw error;
    }
  },
};

export const adminEntryService = {
  async scanTicket(ticketId: number, userToken: string) {
    try {
      const response = await adminApiService.getInstance().post(
        ADMIN_API_ENDPOINTS.ENTRY.SCAN(ticketId, userToken),
        {}
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async confirmEntry(phone: string, otp: string): Promise<EntryStatus> {
    try {
      const response = await adminApiService.getInstance().post(
        ADMIN_API_ENDPOINTS.ENTRY.CONFIRM,
        { phone, otp }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getStatus(ticketId: number): Promise<EntryStatus> {
    try {
      const response = await adminApiService.getInstance().get(
        ADMIN_API_ENDPOINTS.ENTRY.STATUS(ticketId)
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getStats(eventId: number): Promise<EventStats> {
    try {
      const response = await adminApiService.getInstance().get(
        ADMIN_API_ENDPOINTS.ENTRY.STATS(eventId)
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
