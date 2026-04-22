export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://proofpass-nine.vercel.app';

type AdminLoginResponse = {
  token: string;
  admin: {
    username: string;
    role: string;
  };
};

type DashboardResponse = {
  totalEvents: number;
  activeEvents: number;
  totalTicketsSold: number;
  scannedToday: number;
  recentBookings: Array<{
    eventId: number;
    name: string;
    ticketsSold: number;
    capacity: number;
    active: boolean;
  }>;
};

async function readJson<T>(res: Response): Promise<T> {
  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload?.error || payload?.message || 'Request failed');
  }
  return payload as T;
}

export async function adminLogin(username: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return readJson<AdminLoginResponse>(res);
}

export async function getDashboard(adminToken: string) {
  const res = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  return readJson<DashboardResponse>(res);
}

export async function scanTicket(ticketId: string, userToken: string, adminToken: string) {
  const encodedUserToken = encodeURIComponent(userToken);
  const res = await fetch(
    `${API_BASE_URL}/api/entry/${ticketId}/scan/${encodedUserToken}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }
  );
  return readJson<{ phone: string; otp?: string; message: string; delivery?: 'SMS_SENT' | 'LOG_ONLY' | 'SMS_FAILED_LOG_ONLY' }>(res);
}

export async function confirmEntry(
  ticketId: string,
  phone: string,
  otp: string,
  adminToken: string
) {
  const res = await fetch(`${API_BASE_URL}/api/entry/${ticketId}/confirm`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone, otp }),
  });
  return readJson<{ status: string; txHash: string }>(res);
}