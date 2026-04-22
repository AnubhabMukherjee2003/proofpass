export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://proofpass-nine.vercel.app';

export type EventItem = {
  eventId: number;
  name: string;
  location: string;
  date: number;
  price: string;
  capacity: number;
  ticketsSold: number;
  imageUrl?: string;
  active?: boolean;
};

export type TicketItem = {
  ticketId: number;
  eventId: number;
  status: 'active' | 'used' | 'expired';
  event: EventItem;
};

async function readJson<T>(res: Response): Promise<T> {
  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload?.error || payload?.message || 'Request failed');
  }
  return payload as T;
}

export async function sendOtp(phone: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return readJson<{ message: string }>(res);
}

export async function verifyOtp(phone: string, otp: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp }),
  });
  return readJson<{ token: string }>(res);
}

export async function getEvents() {
  const res = await fetch(`${API_BASE_URL}/api/events`);
  return readJson<EventItem[]>(res);
}

export async function getEvent(eventId: string) {
  const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`);
  return readJson<EventItem>(res);
}

export async function bookTicket(token: string, eventId: number, price: number) {
  const res = await fetch(`${API_BASE_URL}/api/tickets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ eventId, price }),
  });
  return readJson<{ message: string; ticketId: string; txHash: string }>(res);
}

export async function getMyTickets(token: string) {
  const res = await fetch(`${API_BASE_URL}/api/tickets`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return readJson<TicketItem[]>(res);
}