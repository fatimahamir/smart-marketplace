# Smart Community Marketplace — Frontend

React + Vite + React-Bootstrap frontend for the Smart Community Service & Local Marketplace Platform.
Theme: Green (#1E8449) & Orange (#F5820D).

## Setup
```bash
npm install
cp .env.example .env
npm run dev
```
Runs at http://localhost:5173 — make sure the backend is running at http://localhost:5000

## Features Implemented (Frontend)
- Authentication: Register, Login, JWT session persistence, Protected Routes
- User Profiles: view/edit, profile picture upload, skills, bio, location, ratings
- Product Marketplace: listing grid, search/filter/sort, pagination, detail page, create/edit, multi-image upload, favorites
- Service Marketplace: same as products + pricing type (fixed/hourly), delivery time, availability toggle
- Booking System: request service (modal with date/time), accept/reject/complete/cancel, buyer & provider views, status filters
- Real-Time Messaging: Socket.io powered chat, typing indicator, inbox with unread counts
- Reviews & Ratings: submit + list reviews on products/services, auto-updates seller reputation
- Notification System: bell icon with live unread badge, mark as read, mark all as read
- User Dashboard: stats, active listings, pending requests, earnings, recent activity
- Admin Panel: manage users (suspend/delete), approve/remove pending listings, platform stats, moderate reported reviews

## Structure
```
src/
├── components/
│   ├── layout/       -> Navbar, Footer
│   ├── common/         -> Loader, ProtectedRoute, StarRating, Pagination, EmptyState
│   ├── product/         -> ProductCard, ProductFilters
│   ├── service/          -> ServiceCard, ServiceFilters
│   └── booking/           -> BookingCard
├── context/                 -> AuthContext
├── pages/
│   ├── auth/                -> Login, Register
│   ├── products/              -> ProductList, ProductDetail, ProductForm
│   ├── services/               -> ServiceList, ServiceDetail, ServiceForm
│   ├── admin/                   -> AdminDashboard
│   ├── Dashboard.jsx, Profile.jsx, Favorites.jsx, Bookings.jsx, Messages.jsx, Notifications.jsx
├── services/                      -> api.js + one service file per backend resource, socket.js
├── styles/theme.css                -> Green & Orange design tokens
├── App.jsx, main.jsx
```

## Build
```bash
npm run build
```
Verified working — no errors.
