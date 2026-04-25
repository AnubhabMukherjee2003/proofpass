# ProofPass Frontend Implementation

## Overview
ProofPass has two frontend applications built with **Expo 54 + React Native 19 + TypeScript**:
1. **user-app**: For ticket buyers (login, browse events, book tickets, view tickets)
2. **admin-app**: For event organizers (dashboard, create events, verify entries)

Both apps use **Expo Router** for file-based navigation, **AsyncStorage** for persistent sessions, and **expo-camera** for QR scanning.

---

## Authentication & Session Management

### User App - Phone OTP Login
```
Login Flow:
1. User enters phone number (+91...)
2. POST /api/auth/send-otp → Backend generates cryptographic OTP
3. User receives SMS with 6-digit OTP
4. User enters OTP
5. POST /api/auth/verify-otp → Backend issues JWT token
6. Token stored in AsyncStorage for persistence
7. User redirected to events list
```

**Key Implementation:**
- `context/AuthContext.tsx`: Manages phone, token, and login/logout
- `isInitializing` flag: Prevents redirect flicker on app reload
- `restoreSession()`: Reads token from AsyncStorage on app launch
- Hydration-safe redirects: All routes check `isInitializing` before navigation

### Admin App - Username/Password Login
```
Admin Login Flow:
1. Admin enters username + password
2. POST /api/auth/admin-login → Backend verifies credentials from data/admins.json
3. Backend issues admin JWT token
4. Token stored in AsyncStorage for persistence
5. Admin redirected to dashboard
```

**Key Implementation:**
- `context/AdminAuthContext.tsx`: Manages admin token and login state
- Session restored from AsyncStorage on app launch

---

## User App - Core Features

### 1. Events Tab (`app/(tabs)/index.tsx`)
- **View**: List all active events from `GET /api/events`
- **Display**: Event name, location, date, price, remaining tickets
- **Interaction**: "Book Now" button navigates to event detail page
- **Persistence Guard**: Awaits `isInitializing` before rendering

### 2. Ticket Booking (`app/book/[eventId].tsx`)
- **Dynamic Route**: Receives `eventId` from navigation params
- **Flow**:
  ```
  1. User clicks "Book Ticket"
  2. POST /api/tickets { eventId, price } → Creates ticket on blockchain
  3. Response includes ticketId + transaction hash
  4. Ticket stored and user sees success message
  5. Navigate to tickets tab
  ```
- **Data**: Fetches event details from `GET /api/events/:eventId`
- **Hydration Guard**: Checks `isInitializing` before redirect

### 3. Tickets Tab (`app/(tabs)/explore.tsx`)
- **View**: List all user's purchased tickets from `GET /api/tickets`
- **Display**: 
  - Ticket ID
  - Event details (name, date, location)
  - QR code (base64 encoded)
  - Status (active/used/expired)
- **QR Payload**: Contains `{ ticketId, userToken }` for gate scanning
- **Hydration Guard**: Waits for `isInitializing`

---

## Admin App - Core Features

### 1. Dashboard Tab (`app/(tabs)/index.tsx`)
- **Stats Cards**: 
  - Total Events
  - Active Events
  - Tickets Sold
  - Scanned Today
- **Data Source**: `GET /api/admin/dashboard` (requires admin token)
- **Add Event Form** (integrated in dashboard):
  ```
  Fields:
  - Event Name (text)
  - Location (text)
  - Date (date picker → unix timestamp)
  - Price (number)
  - Capacity (number)
  - Image (optional file upload)
  ```
  - **Submission**: `POST /api/events` with form-data
  - **Response**: Event ID + transaction hash
  - **Feedback**: Toast notification on success/error

### 2. Ticket Check Tab (`app/(tabs)/explore.tsx`)
- **Two-Step Verification**:
  1. **Scan QR**: Camera scans user's ticket QR code
  2. **Verify OTP**: Gate staff enters OTP from user's phone

- **Camera Scanner** (expo-camera):
  - Requests camera permissions
  - Displays live camera feed
  - Auto-detects barcode (QR) and parses JSON: `{ ticketId, userToken }`
  - Extracts ticketId and userToken from QR
  
- **Manual Fallback**:
  - Text inputs for ticketId and userToken
  - Useful if QR scan fails

- **OTP Verification**:
  ```
  Flow:
  1. QR scanned → POST /api/entry/:ticketId/scan/:userToken
  2. Backend generates gate OTP, sends SMS to user
  3. Admin sees "OTP sent, expires in 5 min"
  4. Input OTP field appears
  5. User enters OTP → POST /api/entry/:ticketId/confirm { phone, otp }
  6. Success: Ticket marked as used on blockchain
  7. Gate staff: "Entry confirmed ✓"
  ```

- **Debug UI**:
  - "Last scan" field shows last parsed QR data
  - Error messages for parse failures
  - "Scan Again" button to clear state without closing camera

---

## Key Technologies

| Feature | Library | Purpose |
|---------|---------|---------|
| Navigation | Expo Router v6 | File-based routing (tabs, dynamic routes) |
| State Management | React Context | Auth state, global login/logout |
| Persistence | AsyncStorage 3.0.2 | Store JWT token across app restarts |
| Camera Scanning | expo-camera 55.0.16 | QR barcode detection |
| Date/Time | date-fns | Parse ISO date strings to unix timestamps |
| UI Components | React Native | Native platform components (View, Text, Button, etc.) |
| Styling | StyleSheet | React Native styles |
| HTTP | fetch API | REST API calls (no external HTTP client) |

---

## File Structure

```
user-app/
├── app/
│   ├── login.tsx              # Phone OTP login screen
│   ├── (tabs)/
│   │   ├── index.tsx          # Events tab (browse & book)
│   │   └── explore.tsx        # Tickets tab (view QR codes)
│   ├── book/
│   │   └── [eventId].tsx      # Event detail & booking
│   └── _layout.tsx            # Root layout + navigation
├── context/
│   └── AuthContext.tsx        # Auth state + AsyncStorage persistence
├── lib/
│   └── api.ts                 # API client functions
└── app.json                   # Expo config (permissions, etc.)

admin-app/
├── app/
│   ├── login.tsx              # Admin login (username/password)
│   ├── (tabs)/
│   │   ├── index.tsx          # Dashboard + add event form
│   │   └── explore.tsx        # Ticket check + QR scanner
│   └── _layout.tsx            # Root layout + navigation
├── context/
│   └── AdminAuthContext.tsx   # Admin auth state + AsyncStorage
├── lib/
│   └── api.ts                 # Admin API client
└── app.json                   # Expo config (camera permissions)
```

---

## Session Persistence

### How It Works
1. **On Login**: JWT token saved to AsyncStorage
2. **On App Reload**: `restoreSession()` reads token from storage
3. **Hydration**: `isInitializing` flag prevents redirect flicker
4. **On Logout**: Token cleared from storage

### Code Pattern
```typescript
// In AuthContext
const restoreSession = useCallback(async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      setToken(token);
    }
  } finally {
    setIsInitializing(false);
  }
}, []);

// On app launch
useEffect(() => {
  restoreSession();
}, []);
```

### UI Pattern (Hydration-Safe)
```typescript
// In all tabs/screens
if (isInitializing) {
  return <ActivityIndicator />;
}

// Render normal UI
return (
  ...
);
```

---

## API Client (lib/api.ts)

### Common Pattern
```typescript
const api = {
  // User endpoints
  sendOtp: (phone) => fetch(`${BASE_URL}/api/auth/send-otp`, { ... }),
  verifyOtp: (phone, otp) => fetch(`${BASE_URL}/api/auth/verify-otp`, { ... }),
  getEvents: (token) => fetch(`${BASE_URL}/api/events`, { headers: { Authorization: `Bearer ${token}` } }),
  bookTicket: (token, eventId, price) => fetch(`${BASE_URL}/api/tickets`, { ... }),
  
  // Admin endpoints
  adminLogin: (username, password) => fetch(`${BASE_URL}/api/auth/admin-login`, { ... }),
  getDashboard: (token) => fetch(`${BASE_URL}/api/admin/dashboard`, { ... }),
  createEvent: (token, formData) => fetch(`${BASE_URL}/api/events`, { ... }),
  scanQR: (token, ticketId, userToken) => fetch(`${BASE_URL}/api/entry/:ticketId/scan/:userToken`, { ... }),
  confirmEntry: (token, ticketId, phone, otp) => fetch(`${BASE_URL}/api/entry/:ticketId/confirm`, { ... }),
};
```

---

## Permissions

### iOS (app.json)
```json
"ios": {
  "infoPlist": {
    "NSCameraUsageDescription": "Camera is required to scan QR codes for ticket entry verification."
  }
}
```

### Android (app.json)
```json
"android": {
  "permissions": ["android.permission.CAMERA"]
}
```

---

## Development & Testing

### Running the Apps
```bash
# User App
cd user-app
npm start

# Admin App (in separate terminal)
cd admin-app
npm start
```

### Expo Go
- Scan QR code with Expo Go app (iOS) or Camera app (Android)
- Hot reload on file save

### Postman Testing
- Use `ProofPass.postman_collection.json` to test APIs
- Set variables: `base_url`, `token`, `admin_token`, `phone`, `event_id`, `ticket_id`

---

## Known Considerations

1. **Phone Number Format**: Must be E.164 format (e.g., +919876543210)
2. **Date Format**: Unix timestamp (seconds) or ISO string; automatically parsed on backend
3. **QR Parsing**: Admin app expects valid JSON: `{ ticketId, token }`
4. **OTP Grace Period**: 10 minutes (current + previous 5-min window)
5. **Image Upload**: Optional when creating events; uploaded to IPFS via Pinata
