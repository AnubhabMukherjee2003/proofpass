# ProofPass UI Flows

## Overview
This document outlines the expected user interface flows and user journeys for ProofPass across all applications (user app, admin app, and gate staff app).

---

## 1. USER APP FLOWS

### 1.1 Authentication Flow

#### **Login with OTP**

**Entry Point**: User App Home Screen
```
[Login Screen]
    ↓
Input Phone Number (+91...)
    ↓
[Click "Send OTP"]
    ↓
API: POST /api/auth/send-otp
    ↓
Display: "OTP sent to +91..."
    ↓
[OTP Entry Screen]
    ↓
Enter 6-digit OTP
    ↓
[Click "Verify"]
    ↓
API: POST /api/auth/verify-otp
    ↓
✓ JWT Token Received
    ↓
[Redirect to Home/Explore Screen]
```

**Error Handling**:
- Invalid phone format → Show error, allow retry
- OTP expired → "OTP expired, request new OTP"
- Wrong OTP → "Invalid OTP, try again"
- Network error → Show retry button

**UX Notes**:
- Auto-focus on OTP field after sending
- Show countdown timer (10 minutes)
- "Resend OTP" button (appears after 30 seconds)
- Clear feedback messages

---

### 1.2 Home/Explore Screen

**Description**: Browse and discover events

```
[Header]
  - App Logo/Title "ProofPass"
  - Info Icon (top-right)

[Search Bar]
  - Search events by name/location
  - Filter by date range (optional)

[Tab Navigation]
  - Explore (active)
  - My Tickets
  - About

[Event List - Feed]
  - Infinite scroll / Pagination
  - Each Event Card:
    ├─ Event Image (from IPFS)
    ├─ Event Name
    ├─ Location
    ├─ Date & Time
    ├─ Price (₹)
    ├─ Progress (Sold: X/Capacity)
    └─ [View Details Button]

[Loading States]
  - Skeleton cards while fetching
  - Empty state: "No events available"
```

**API Calls**:
- `GET /api/events` → Load all active events

**User Actions**:
- Tap event card → Navigate to Event Detail screen
- Pull-to-refresh → Reload events
- Search → Filter visible events
- Tap About icon → Go to About screen

---

### 1.3 Event Detail Screen

**Entry Point**: From Explore tab (tap event card)

```
[Header]
  - Back button
  - Share button (QR/Link)

[Event Image]
  - Full-width image from IPFS
  - Dark overlay with event info

[Event Details Section]
  - Event Name (large, bold)
  - Location + Map Icon
  - Date + Time (formatted)
  - Category/Type (optional)
  
[Description Section]
  - Long-form event description
  - Scrollable

[Availability Section]
  - Capacity info: "1,200 / 5,000 tickets sold"
  - Availability bar (progress)
  - Status: "Available" / "Sold Out"

[Price Section]
  - Large display: "₹500"
  - Currency: "INR"

[Action Button]
  If logged in:
    └─ [Book Now Button] (green, prominent)
  If not logged in:
    └─ [Login to Book Button]

[Similar Events Section] (optional)
  - Carousel of related events
```

**API Calls**:
- `GET /api/events/:eventId` → Fetch full event details

**User Actions**:
- Tap "Book Now" → Go to Booking Confirmation screen
- Tap "Share" → Share event details
- Swipe back or tap back button → Return to Explore

---

### 1.4 Booking Confirmation Screen

**Entry Point**: From Event Detail (tap "Book Now")

```
[Header]
  - "Confirm Booking"

[Event Summary Card]
  - Event Image (thumbnail)
  - Event Name
  - Date/Location
  - Price

[Ticket Details Section]
  - Quantity: 1 (fixed for MVP)
  - Ticket Type: General Admission
  - Price Breakdown:
    ├─ Ticket Price: ₹500
    ├─ Platform Fee: ₹0 (optional)
    ├─ Tax: ₹0 (optional)
    └─ Total: ₹500

[Terms & Conditions]
  - Checkbox: "I agree to T&Cs"
  - Link to terms

[Action Buttons]
  [Cancel] [Proceed to Payment]

[Payment Gateway Integration]
  On "Proceed to Payment":
    ├─ Initiate payment (Razorpay/Stripe)
    ├─ Show payment modal
    ├─ Process payment
    └─ Callback handling
```

**API Calls**:
- On payment success: `POST /api/tickets` → Book ticket on-chain

**Success Flow**:
```
Payment Successful
    ↓
API: POST /api/tickets
    ↓
✓ Ticket Minted (Smart Contract)
    ↓
[Booking Success Screen]
```

**Error Flow**:
```
Payment Failed / Cancelled
    ↓
Show error message
    ↓
[Retry / Go Back options]
```

---

### 1.5 Booking Success Screen

**Triggered**: After successful payment and ticket minting

```
[Success Icon]
  - Checkmark animation

[Confirmation Message]
  - "Booking Confirmed! 🎉"
  - "Your ticket has been booked and secured on blockchain"

[Ticket Summary Card]
  - Ticket ID: 0
  - Event Name
  - Date/Time
  - Location
  - Price Paid

[QR Code Display]
  - Large QR code containing:
    ├─ Ticket ID
    ├─ User Phone
    ├─ JWT User Token
    └─ Verification Hash

[Action Buttons]
  [View My Tickets] [Back to Explore]

[Share/Download]
  - Share ticket (SMS/Email/WhatsApp)
  - Download ticket as PDF/image
```

---

### 1.6 My Tickets Screen

**Entry Point**: Tap "My Tickets" tab

```
[Header]
  - "My Tickets"
  - Total count: "5 Tickets"

[Filter/Sort Options] (optional)
  - Upcoming / Past / All
  - Sort by date

[Ticket List - Cards]
  
  For Each Ticket:
  ┌─────────────────────────────────┐
  │ [Event Image]  Event Name       │
  │                Date: 24 Mar     │
  │                Location         │
  │                Status: ACTIVE  │
  │                [View Ticket]    │
  └─────────────────────────────────┘

[Empty State]
  - "No tickets yet"
  - [Browse Events Button]

[Loading State]
  - Skeleton cards
```

**API Calls**:
- `GET /api/tickets` → Fetch all user tickets

**User Actions**:
- Tap ticket card → Go to Ticket Detail screen
- Pull-to-refresh → Reload tickets

---

### 1.7 Ticket Detail Screen

**Entry Point**: From My Tickets (tap ticket card)

```
[Header]
  - Back button
  - Share button

[Ticket Card - Large Display]
  - Event Image (full-width)
  - Event Name (large)
  - Date/Time
  - Location
  - Ticket ID

[QR Code Display]
  - Large, centered
  - Contains encoded data for gate scanning

[Ticket Info Section]
  - Status: "Valid" / "Used" / "Expired"
  - Booking Date
  - Price Paid
  - Transaction Hash (blockchain link)

[Copy/Share Actions]
  [Copy Ticket ID] [Share] [Download]

[Entry Verification Info]
  If ticket not yet used:
    └─ "Show this QR at gate for entry"
  If ticket already used:
    └─ "✓ Ticket used on [Date/Time]"

[Details Expandable Section]
  - Payment ID
  - Smart Contract Address
  - Blockchain Network
  - Full ticket data (JSON view)
```

**API Calls**:
- `GET /api/tickets/:ticketId` → Fetch ticket details

**User Actions**:
- Share ticket
- Download/Save QR code
- View blockchain details
- Go back

---

### 1.8 About Screen

**Entry Point**: Tap profile icon / "About" tab

```
[Header]
  - "About ProofPass"

[App Overview Section]
  - App Logo
  - "ProofPass - Blockchain Ticketing"
  - Version: 1.0.0

[How It Works - Step by Step]

  Step 1: Login
  ├─ Icon: 📱
  ├─ "Login with OTP"
  ├─ Enter your phone number
  ├─ Receive 6-digit OTP
  └─ Verify to get access

  Step 2: Explore Events
  ├─ Icon: 🔍
  ├─ "Browse Upcoming Events"
  ├─ View event details
  ├─ Check availability
  └─ See pricing & location

  Step 3: Book Ticket
  ├─ Icon: 🎫
  ├─ "Secure Your Ticket"
  ├─ Proceed to payment
  ├─ Pay via Razorpay/Stripe
  └─ Ticket minted on blockchain

  Step 4: Get QR Code
  ├─ Icon: 📲
  ├─ "Display Your Ticket"
  ├─ Find ticket in "My Tickets"
  ├─ Show QR code at gate
  └─ QR contains secure data

  Step 5: Entry Verification
  ├─ Icon: ✓
  ├─ "Gate Staff Scans QR"
  ├─ You receive OTP
  ├─ Share OTP with staff
  └─ Entry confirmed & verified

[User Logged In Section]
  - Current Account: +91 ****1234
  - Status: Active
  - Logged In Since: [Time]

[Support & Resources]
  - Help Center / FAQ
  - Contact Support
  - Report Issue
  - Terms & Conditions
  - Privacy Policy

[Security Info]
  - "Your tickets are secured on blockchain"
  - "Data encrypted with industry standards"
  - "OTP verified entry ensures safety"

[Logout Button]
  - Red/Warning style
  - [Logout]

[Confirmation Dialog]
  On logout click:
    - "Are you sure you want to logout?"
    - [Cancel] [Confirm]
    - Clear JWT token
    - Redirect to Login screen
```

---

### 1.9 Gate Entry Flow (User Side)

**Triggered**: At event venue during entry

```
[Gate Staff scans QR code]
    ↓
QR contains:
  - Ticket ID
  - User JWT Token
  - Phone Hash
    ↓
API (backend): POST /api/entry/:ticketId/scan/:userToken
    ↓
User's phone receives OTP (SMS)
    ↓
[User sees OTP prompt at gate]
    ↓
Enter 6-digit OTP
    ↓
[User shows OTP to gate staff]
    ↓
Gate staff enters OTP in their app
    ↓
API: POST /api/entry/:ticketId/confirm
    ↓
✓ Ticket marked as USED (Smart Contract)
    ↓
[Entry Confirmed - User can enter]
```

**User Exception Flows**:
- OTP not received → Request resend
- OTP expired → Request new OTP
- Wrong OTP entered → Retry
- Ticket already used → Show error "Ticket already used"

---

## 2. ADMIN/GATE STAFF APP FLOWS

### 2.1 Authentication

```
[Login Screen]
    ↓
Enter Username
Enter Password
    ↓
[Click "Login"]
    ↓
API: POST /api/auth/admin-login
    ↓
✓ Admin JWT Token Received
    ↓
[Redirect to Dashboard/Home]
```

---

### 2.2 Dashboard/Home Screen

```
[Header]
  - "ProofPass Admin"
  - Admin Name
  - Logout button

[Tab Navigation] (MVP)
  - Dashboard
  - Gate Entry

[Dashboard Tab]
  Overview:
  - Total Events Created
  - Total Tickets Sold
  - Active Events Count
  - Recent Bookings (table)

[Quick Actions]
  [+ Create Event] [View All Events]
```

---

### 2.3 Create Event Screen

```
[Header]
  - "Create New Event"
  - Back button

[Form Fields]
  
  Event Name (text input)
  └─ Placeholder: "Concert Night"
  
  Location (text input)
  └─ Placeholder: "Madison Square Garden"
  
  Date & Time (date-time picker)
  └─ Unix timestamp
  
  Price (number input)
  └─ Placeholder: "500"
  └─ Currency: INR
  
  Capacity (number input)
  └─ Placeholder: "5000"
  
  Event Image (file upload)
  └─ Drag-and-drop or click
  └─ Preview thumbnail

[Action Buttons]
  [Cancel] [Create Event]

[Loading State (on submit)]
  - Show spinner
  - "Uploading image to IPFS..."
  - "Creating event on blockchain..."

[Success State]
  - Show transaction hash (blockchain link)
  - [View Event] [Create Another] buttons
```

**API Calls**:
1. Upload image → Pinata IPFS
2. `POST /api/events` → Create event on-chain

---

### 2.4 Manage Events Screen

**Entry Point**: "Dashboard" tab

```
[Header]
  - "Events"
  - Filter/Sort options

[Event List - Table View]
  
  Columns:
  │ Event Name │ Location │ Date │ Status │ Sold │ Actions │
  ├────────────┼──────────┼──────┼────────┼──────┼─────────┤
  │ Concert    │ MSG      │ ... │ Active │ 1200 │ [...]   │
  │ Sports Day │ Stadium  │ ... │ Active │ 500  │ [...]   │

[Row Actions]
  - [View] → Event detail screen
  - [Edit] → Edit event (name, description, etc.)
  - [Deactivate] → Mark event inactive (with confirmation)

[Empty State]
  - "No events created yet"
  - [Create Event Button]

[Pagination]
  - Show 10 per page
  - Next/Previous buttons
```

**API Calls**:
- `GET /api/events` → Fetch all events
- `POST /api/events/:eventId/deactivate` → Deactivate event

---

### 2.5 Gate Entry Scanner Screen

**Entry Point**: "Gate Entry" tab

```
[Header]
  - "Gate Entry"
  - Current Time
  - Tickets Scanned Today: 45

[Camera/Scanner Area]
  - QR code scanner (camera feed)
  - Focus reticle in center
  - "Point camera at ticket QR code"

[Last Scanned Display] (optional)
  - Show last 5 scanned tickets
  - Status indicator (green/red)
  - Time of scan

[Manual Entry Fallback]
  - "Can't scan? [Enter Manually]"
  - Input: Ticket ID, Phone Number

[Actions]
  [Refresh] [Help]
```

**QR Scan Success Flow**:

```
[QR Code Detected]
    ↓
Extract: Ticket ID, User Token, Phone Hash
    ↓
API: POST /api/entry/:ticketId/scan/:userToken
    ↓
OTP Generated & sent to user
    ↓
[OTP Entry Screen]
```

---

### 2.6 OTP Verification Screen

**Triggered**: After successful QR scan

```
[Header]
  - "Verify Entry"
  - Back button (to rescan)

[Ticket Info Display]
  - Ticket ID: 0
  - User Phone: +91 ****1234
  - Event Name
  - "OTP Sent to user's phone"

[OTP Input Field]
  - 6-digit input
  - Auto-focus
  - Clear on error

[Timer]
  - "Expires in: 5:23"
  - Red warning when < 2 min

[Action Buttons]
  [Cancel] [Verify OTP]

[Resend OTP Link]
  - "Didn't receive? [Resend]" (appears after 30s)

[Error Messages]
  - "Invalid OTP"
  - "OTP Expired, rescan ticket"
  - "Ticket already used"
```

**API Calls**:
- `POST /api/entry/:ticketId/confirm` → Verify OTP and confirm entry

**Success Flow**:
```
OTP Verified
    ↓
API Call
    ↓
✓ Ticket marked USED on blockchain
    ↓
[Entry Confirmed Screen]
```

---

### 2.7 Entry Confirmed Screen

**Success Feedback**

```
[Success Icon Animation]
  - Checkmark with green color
  - Satisfying animation

[Message]
  - "✓ Entry Confirmed"
  - "User: +91 ****1234"
  - "Ticket ID: 0"

[Sound Feedback]
  - Success beep (can be toggled)

[Auto-Redirect]
  - After 2-3 seconds → Back to Scanner screen
  - Or [Scan Next Ticket] button

[Quick Stats]
  - Tickets scanned today: 45
  - Remaining: 100
```

---

### 2.8 Manual Entry Fallback

**When QR scan fails**

```
[Header]
  - "Manual Ticket Entry"
  - Back button

[Input Fields]
  
  Ticket ID (number)
  └─ Last 4 digits of ticket
  
  Phone Number (text)
  └─ Complete phone number (with +91)
  
  Verification Code (number)
  └─ User provides verbally
  
[Search Button]
  └─ [Find Ticket]

[Result Display]
  ├─ Ticket found
  ├─ Show ticket info
  ├─ Proceed to OTP entry
  {
  ├─ Ticket not found
  ├─ Show error
  ├─ [Try again] button
  }
```

---

## 4. GLOBAL UI PATTERNS

### 4.1 Loading States
- Skeleton screens for cards
- Spinners for form submissions
- Progress bars for multi-step processes

### 4.2 Error States
- Toast notifications (bottom of screen)
- Inline errors below form fields
- Error screens with retry buttons
- Network error with offline indicator

### 4.3 Success States
- Toast messages with checkmark
- Success screens with confirmations
- Modal dialogs for critical actions

### 4.4 Empty States
- Centered icon + message
- Call-to-action button
- Helpful suggestions

### 4.5 Accessibility
- Touch targets: 44x44px minimum
- High contrast text
- Keyboard navigation support
- Screen reader friendly labels

---

## 5. NAVIGATION STRUCTURE

### User App Navigation
```
Tabs:
├─ Explore (home feed)
├─ My Tickets (user's bookings)
└─ About (how it works & info)

Modal Overlays:
├─ Event Detail (from explore)
├─ Booking Confirmation (from detail)
├─ Ticket Detail (from my tickets)
└─ Authentication (login flow)
```

### Admin/Gate Staff App Navigation (MVP - Single App)
```
Two-Tab Interface:
├─ Dashboard
│  ├─ Event Overview
│  ├─ + Create Event
│  └─ Manage Events
│
└─ Gate Entry
   ├─ QR Scanner
   ├─ OTP Verification
   ├─ Manual Entry (fallback)
   └─ Scan History
```

---

## 6. KEY INTERACTIONS

### 6.1 User Booking Journey
```
Browse Events → View Details → Confirm Booking
   → Payment → Success → View Ticket → Share QR
```

### 6.2 Gate Entry Journey
```
Scan QR → OTP Sent to User → Admin Enters OTP → Entry Confirmed
```

### 6.3 Admin Event Management
```
Create Event → View in Dashboard → Manage/Deactivate Event
```

---

## 7. MVP FEATURES (Phase 1)

**User App**:
- ✅ Login with OTP
- ✅ Browse & search events
- ✅ View event details
- ✅ Book ticket (payment integrated)
- ✅ View my tickets with QR code
- ✅ Share ticket QR

**Admin/Gate Staff App** (Combined):
- ✅ Admin login (credentials from admins.json)
- ✅ Create event (with image upload to IPFS)
- ✅ View all events
- ✅ Deactivate event
- ✅ Gate entry: Scan QR code
- ✅ Gate entry: Send OTP to user
- ✅ Gate entry: Verify OTP & confirm entry
- ✅ Gate entry: Manual fallback entry
- ✅ View scan history/stats

---

## 8. PHASE 2 ENHANCEMENTS (Future)

**Analytics Dashboard**:
- Event sales analytics
- Ticket usage reports
- Revenue tracking
- Entry rate analytics

**Admin Features**:
- Event editing (after creation)
- Staff management (separate roles)
- Refund processing
- Event cancellation with refund

**User Features**:
- Event search/filter
- Favorites/Wishlist
- Multiple payment methods
- Email receipt

**Gate Staff Features**:
- Role-based access control
- Shift management
- Export scan reports

**Additional Features**:
- Event notifications
- Referral system
- Social sharing
- Multiple event types/categories
