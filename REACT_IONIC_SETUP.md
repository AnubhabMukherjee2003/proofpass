# ProofPass - React + Ionic + Capacitor Setup

✅ **Complete setup with React, Ionic, and Capacitor** - Clean mobile-first architecture!

## 📱 Apps Overview

### **User App** (`/user-app`)
Mobile app for event attendees to browse events, book tickets, and show QR codes for entry verification.

**Key Features:**
- ✅ OTP-based authentication
- ✅ Event browsing & search
- ✅ Ticket booking with payment integration
- ✅ QR code ticket display
- ✅ Ticket history & management

**Pages:**
- `/login` - Phone login
- `/verify` - OTP verification
- `/explore` - Event listing with search & filters
- `/explore/:eventId` - Event details & booking
- `/tickets` - My tickets listing
- `/ticket/:ticketId` - Ticket detail with QR code
- `/about` - App information & logout

### **Admin App** (`/admin-app`)
Web/mobile app for event admins and gate staff to manage events and verify entries.

**Key Features:**
- ✅ Admin login with credentials
- ✅ Dashboard with event stats
- ✅ Event creation & management
- ✅ QR code scanning for gate entry
- ✅ OTP verification for attendees at gate

**Pages:**
- `/login` - Admin credentials login
- `/dashboard` - Event overview & stats
- `/gate-entry` - QR scanner & OTP verification

## 🛠️ Tech Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.0.0 | UI framework |
| **Ionic** | 8.5.0 | Mobile UI components |
| **Capacitor** | 8.2.0 | Native bridge (iOS/Android) |
| **React Router** | 5.3.4 | Navigation |
| **Axios** | 1.6.5 | HTTP client |
| **QR Code** | 1.5.3 | QR generation |

## 📦 Installation

### User App

```bash
cd user-app
npm install
npm run dev
```

Opens on: `http://localhost:5173`

### Admin App

```bash
cd admin-app
npm install
npm run dev
```

Opens on: `http://localhost:5174`

## 🔑 API Configuration

Both apps use **localhost:3000/api** by default.

To change API URL, set environment variable:
```bash
export REACT_APP_API_URL=https://your-api-domain/api
```

## 📋 API Endpoints Required

The backend must implement these endpoints (from `USER_FLOW.md`):

### Auth
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP & get token
- `POST /api/auth/admin-login` - Admin login

### Events
- `GET /api/events` - List all active events
- `GET /api/events/:eventId` - Get event details
- `POST /api/events` - Create new event
- `POST /api/events/:eventId/deactivate` - Deactivate event

### Tickets
- `GET /api/tickets` - Get user's tickets
- `GET /api/tickets/:ticketId` - Get ticket details
- `POST /api/tickets` - Book ticket (after payment)

### Entry/Gate
- `POST /api/entry/:ticketId/scan/:userToken` - Scan QR & send OTP
- `POST /api/entry/:ticketId/confirm` - Verify OTP & mark ticket as used
- `POST /api/entry/:ticketId/resend-otp` - Resend OTP

### Admin Dashboard
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/scan-history` - Entry scan records

## 🏗️ Project Structure

### User App
```
user-app/src/
├── pages/
│   ├── auth/
│   │   ├── Login.tsx (+ CSS)
│   │   └── Verify.tsx (+ CSS)
│   └── main/
│       ├── Explore.tsx (+ CSS)
│       ├── EventDetail.tsx (+ CSS)
│       ├── MyTickets.tsx (+ CSS)
│       ├── TicketDetail.tsx (+ CSS)
│       └── About.tsx (+ CSS)
├── services/
│   └── api.ts (Axios client with token management)
├── types/
│   └── index.ts (TypeScript interfaces)
├── context/
│   └── AuthContext.tsx (Auth state management)
└── App.tsx (Router setup)
```

### Admin App
```
admin-app/src/
├── pages/
│   ├── auth/
│   │   └── AdminLogin.tsx (+ CSS)
│   └── main/
│       ├── Dashboard.tsx (+ CSS)
│       └── GateEntry.tsx (+ CSS)
├── services/
│   └── api.ts (Admin API client)
├── types/
│   └── index.ts (Admin types)
├── context/
│   └── AdminAuthContext.tsx (Admin auth state)
└── App.tsx (Router setup)
```

## 🎨 Styling

- **Framework**: Ionic CSS + Custom CSS
- **Color Scheme**: 
  - Primary: #6366f1 (Indigo)
  - Success: #22c55e (Green)
  - Danger: #ef4444 (Red)
  - Background: #f5f5f5

CSS files match component structure for easy maintenance.

## 🔐 Authentication

### User App (OTP Flow)
1. User enters phone number → `POST /api/auth/send-otp`
2. Receives OTP → Enters in verify screen
3. `POST /api/auth/verify-otp` → Gets JWT token
4. Token stored in localStorage & auto-added to all requests

### Admin App (Credentials Flow)
1. Admin enters username/password → `POST /api/auth/admin-login`
2. Gets JWT token
3. Token stored in localStorage & auto-added to all requests

## 📱 Building for Native

### iOS
```bash
cd user-app
ionic build
npx cap add ios
npx cap sync
npx cap open ios
```

### Android
```bash
cd user-app
ionic build
npx cap add android
npx cap sync
npx cap open android
```

## ⚡ Key Features Implemented

### User App
- ✅ Phone + OTP login
- ✅ Event search & filter by availability
- ✅ Event detail with live capacity tracking
- ✅ Booking confirmation with T&C acceptance
- ✅ QR code generation for tickets
- ✅ Ticket sharing & download
- ✅ Responsive mobile UI

### Admin App
- ✅ Admin login (credentials from backend)
- ✅ Dashboard with event stats
- ✅ Create event with image upload
- ✅ Manage events (view/deactivate)
- ✅ QR scanner for gate entry
- ✅ Manual entry fallback (by ticket ID/phone)
- ✅ OTP verification & entry confirmation
- ✅ Scan history & daily stats

## 🚀 Next Steps

1. **Backend Integration**: Implement backend API endpoints (see API spec)
2. **Database**: Set up MongoDB/PostgreSQL with ticket contracts
3. **Blockchain**: Deploy DecentralizedTicketRegistry smart contract
4. **Payment**: Integrate Razorpay/Stripe for payment processing
5. **Image Upload**: Set up IPFS for event image storage (Pinata)
6. **Email/SMS**: Configure OTP & notification services

## 📝 Notes

- **No web bundle**: Apps are mobile-first, use Capacitor for native
- **Token-based auth**: JWT tokens in Authorization header
- **Offline support**: Can be added later with Service Workers
- **Real-time updates**: Can be added with WebSockets/Firebase
- **Push notifications**: Use Capacitor plugins for native notifications

## 🔗 Related Files

- [USER_FLOW.md](../USER_FLOW.md) - Complete UI/UX flows
- [Implementation.md](../Implementation.md) - Technical specifications
- [Backend App](../backend/) - Node.js/Express server
- [Smart Contract](../contract/) - Solidity ticketing contract

## 📞 Support

For issues or questions:
1. Check `console.log` in browser DevTools
2. Review API responses in Network tab
3. Verify backend endpoints are running
4. Check token expiration (JWT)

---

**Status**: ✅ Ready for development

- User app: Mobile event browsing & ticket management
- Admin app: Gate entry & event management
- All pages created with Ionic components
- TypeScript types for API communication
- Responsive CSS for all screen sizes
