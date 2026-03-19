# Professional Services Marketplace — Backend API

A Node.js/Express REST API powering a two-sided marketplace that connects **professionals** (individuals offering services) with **users/clients** (people looking for professionals), with support for **companies** that can list and manage multiple professionals.

---

## Table of Contents

- [Overview](#overview)
- [User Roles](#user-roles)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Users](#users)
  - [Professionals](#professionals)
  - [Services](#services)
  - [Bookings / Service Requests](#bookings--service-requests)
  - [Companies](#companies)
  - [Messages](#messages)
- [Data Models](#data-models)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)

---

## Overview

This backend supports a professional services marketplace where:

- **Users (clients)** can browse professionals, view profiles, send booking/service requests, negotiate offers, and chat.
- **Professionals** can create a rich profile with availability, pricing, location, certifications, and service listings; respond to offers; and manage their schedule.
- **Companies** can register a company profile, add professionals to it, and assign services.

A single user account can hold the `user` role, the `professional` role (with a full profile), or be associated with a company. Role switching is supported.

---

## User Roles

| Role           | Capabilities                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| `user`         | Browse/search professionals, view profiles, send service requests, chat, accept/reject counter-offers            |
| `professional` | Create & manage professional profile, set availability & pricing, list services, respond to requests, chat       |
| `admin`        | Moderation and verification review (future phase)                                                                 |

---

## Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Runtime      | Node.js (CommonJS)                  |
| Framework    | Express 5                           |
| Database     | MongoDB + Mongoose 9                |
| Auth         | JWT (jsonwebtoken) + bcryptjs       |
| Validation   | express-validator                   |
| Security     | helmet, cors, express-rate-limit    |
| Testing      | Jest + Supertest + in-memory mocks  |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or cloud, e.g. MongoDB Atlas)

### Installation

```bash
git clone https://github.com/elanthi1112/marketplace-backend.git
cd marketplace-backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

The server starts on `http://localhost:3000` by default.

---

## Environment Variables

| Variable         | Description                      | Example                              |
| ---------------- | -------------------------------- | ------------------------------------ |
| `PORT`           | HTTP server port                 | `3000`                               |
| `MONGODB_URI`    | MongoDB connection string        | `mongodb://localhost:27017/marketplace` |
| `JWT_SECRET`     | Secret key for JWT signing       | `your_strong_secret_here`            |
| `JWT_EXPIRES_IN` | JWT expiry duration              | `7d`                                 |
| `SMTP_HOST`      | SMTP server host (for email)     | `smtp.gmail.com`                     |
| `SMTP_PORT`      | SMTP server port                 | `587`                                |
| `SMTP_USER`      | SMTP username                    | `your@email.com`                     |
| `SMTP_PASS`      | SMTP password                    | `your_email_password`                |
| `SMTP_FROM`      | (Optional) From email address    | `noreply@yourdomain.com`             |

---

## API Reference

All endpoints are prefixed with `/api`. Protected endpoints require a `Bearer` token in the `Authorization` header.

### Authentication

#### `POST /api/auth/register`

Register a new account.

**Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securepassword",
  "role": "professional"
}
```

`role` is optional (defaults to `"user"`). Accepted values: `"user"`, `"professional"`.

**Response `201`:**
```json
{
  "token": "<jwt>",
  "user": { "_id": "...", "name": "Jane Smith", "email": "jane@example.com", "role": "professional" }
}
```

---

#### `POST /api/auth/login`

Authenticate and receive a token.

**Body:**
```json
{
  "email": "jane@example.com",
  "password": "securepassword"
}
```

**Response `200`:**
```json
{
  "token": "<jwt>",
  "user": { "_id": "...", "name": "Jane Smith", "email": "jane@example.com", "role": "professional" }
}
```

---

### Users

All `/api/users` endpoints require authentication.

#### `GET /api/users/me`

Get the current authenticated user's profile.

---

#### `PUT /api/users/me`

Update the current user's basic profile.

**Body (all fields optional):**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "avatar": "https://cdn.example.com/avatar.jpg"
}
```

---

#### `PUT /api/users/me/role`

Switch the user's role between `"user"` and `"professional"`.

**Body:**
```json
{ "role": "professional" }
```

---

### Professionals

#### `GET /api/professionals`

Browse and search professional profiles. Public endpoint.

**Query parameters:**

| Param        | Type   | Description                                  |
| ------------ | ------ | -------------------------------------------- |
| `profession` | string | Full-text search by profession               |
| `lat`        | number | Latitude for geospatial search               |
| `lng`        | number | Longitude for geospatial search              |
| `radius`     | number | Search radius in km (default: 10)            |
| `page`       | number | Page number (default: 1)                     |
| `limit`      | number | Results per page (default: 20, max: 100)     |

**Response `200`:**
```json
{
  "professionals": [ { ... } ],
  "total": 42,
  "page": 1,
  "pages": 3
}
```

---

#### `GET /api/professionals/:userId`

Get a single professional's public profile by their user ID.

---

#### `GET /api/professionals/me/profile`

Get the authenticated professional's own profile. Requires `professional` role.

---

#### `PUT /api/professionals/me/profile`

Create or update the authenticated professional's profile. Requires `professional` role.

**Body (all fields optional):**
```json
{
  "profession": "Lawyer",
  "bio": "Specialised in contract law with 10 years experience.",
  "yearsOfExperience": 10,
  "languages": ["English", "French"],
  "certifications": ["Bar Association"],
  "lat": 48.8566,
  "lng": 2.3522,
  "serviceRadiusKm": 15,
  "serviceAreas": ["Paris", "Île-de-France"],
  "showPhone": false,
  "showAvailabilityPublicly": true,
  "isVisibleOnMap": true,
  "availability": {
    "monday": { "available": true, "slots": [{ "start": "09:00", "end": "17:00" }] },
    "tuesday": { "available": true, "slots": [{ "start": "09:00", "end": "17:00" }] }
  }
}
```

---

#### `POST /api/professionals/me/verify`

Submit verification documents. Requires `professional` role.

**Body:**
```json
{
  "documents": ["https://cdn.example.com/doc1.pdf", "https://cdn.example.com/doc2.pdf"]
}
```

---

### Services

Professional service listings. Read operations are public; write operations require `professional` role.

#### `GET /api/services`

List available services with pagination and filtering.

**Query parameters:**

| Param          | Type   | Description                              |
| -------------- | ------ | ---------------------------------------- |
| `category`     | string | Filter by category                       |
| `search`       | string | Full-text search in title/description    |
| `professional` | string | Filter by professional user ID           |
| `page`         | number | Page number (default: 1)                 |
| `limit`        | number | Results per page (default: 20, max: 100) |

---

#### `GET /api/services/:id`

Get a single service by ID.

---

#### `POST /api/services`

Create a new service listing. Requires `professional` role.

**Body:**
```json
{
  "title": "Contract Review",
  "description": "Detailed review of commercial contracts",
  "price": 250,
  "priceType": "fixed",
  "category": "Legal",
  "minimumCharge": 100,
  "travelFee": 0,
  "imageUrl": "https://cdn.example.com/legal.jpg"
}
```

`priceType` values: `"hourly"`, `"fixed"`, `"from"`.

---

#### `PUT /api/services/:id`

Update a service. Requires `professional` role and ownership.

---

#### `DELETE /api/services/:id`

Delete a service. Requires `professional` role and ownership.

---

### Bookings / Service Requests

The booking flow allows clients to request services from professionals with a rich status lifecycle.

**Status lifecycle:**

```
pending → accepted → completed
pending → rejected
pending → countered → (client accepts or rejects counter)
pending / accepted → cancelled
```

All booking endpoints require authentication.

#### `GET /api/bookings`

List bookings where the authenticated user is the client or professional.

**Query parameters:**

| Param    | Type   | Description                                                  |
| -------- | ------ | ------------------------------------------------------------ |
| `status` | string | Filter by status (pending, accepted, rejected, countered...) |

---

#### `GET /api/bookings/:id`

Get a single booking. Accessible only to the client or professional involved.

---

#### `POST /api/bookings`

Create a new service request (client initiates booking).

**Body:**
```json
{
  "professional": "<professional-user-id>",
  "service": "<service-id>",
  "serviceTitle": "Contract Review",
  "preferredDateTime": "2026-04-01T10:00:00Z",
  "notes": "Please review the attached NDA",
  "offeredPrice": 200
}
```

`service` and `offeredPrice` are optional.

---

#### `PUT /api/bookings/:id/status`

Update the booking status.

| Status      | Who can set it          |
| ----------- | ----------------------- |
| `accepted`  | Professional only       |
| `rejected`  | Professional only       |
| `cancelled` | Client or Professional  |
| `completed` | Professional only       |

**Body:**
```json
{
  "status": "accepted",
  "cancelReason": "Optional reason when cancelling"
}
```

---

#### `PUT /api/bookings/:id/counter`

Send a counter-offer (professional only). Sets booking status to `"countered"`.

**Body:**
```json
{
  "price": 300,
  "proposedDateTime": "2026-04-02T14:00:00Z",
  "notes": "I am available on this date at this rate"
}
```

---

### Companies

#### `GET /api/companies`

List all active companies. Public endpoint.

---

#### `GET /api/companies/:id`

Get a single company by ID. Public endpoint.

---

#### `POST /api/companies`

Create a new company. Requires authentication.

**Body:**
```json
{
  "name": "Smith & Associates",
  "description": "Full-service law firm",
  "email": "contact@smithlaw.com",
  "phone": "+33123456789",
  "website": "https://smithlaw.com",
  "address": "10 Rue de la Paix, Paris"
}
```

---

#### `PUT /api/companies/:id`

Update company details. Requires ownership.

---

#### `POST /api/companies/:id/professionals`

Add a professional (user with `professional` role) to the company. Requires company ownership.

**Body:**
```json
{ "userId": "<professional-user-id>" }
```

---

#### `DELETE /api/companies/:id/professionals/:profId`

Remove a professional from the company. Requires company ownership.

---

### Messages

Real-time one-to-one chat between users. All endpoints require authentication.

#### `GET /api/messages/conversations`

List all conversations for the authenticated user, with the last message included.

---

#### `GET /api/messages/conversations/:conversationId`

Get all messages in a conversation. Also marks received messages as read.

---

#### `POST /api/messages`

Send a message. Creates a new conversation if none exists with the recipient.

**Body (new conversation):**
```json
{
  "recipientId": "<user-id>",
  "content": "Hello, I'd like to book a consultation."
}
```

**Body (existing conversation):**
```json
{
  "conversationId": "<conversation-id>",
  "content": "Are you available on Monday?"
}
```

---

## Data Models

### User

```
_id, name, email, password (hashed), role (user|professional|admin),
phone, avatar, company (ref), isActive, createdAt, updatedAt
```

### ProfessionalProfile

```
_id, user (ref), profession, bio, yearsOfExperience, languages[],
certifications[], location (GeoJSON Point), serviceRadiusKm, serviceAreas[],
availability (weekly schedule with time slots), showPhone, showAvailabilityPublicly,
isVisibleOnMap, verificationStatus (not_submitted|pending|approved|rejected),
verificationDocuments[], verificationRejectionReason, profileCompleteness (0-100),
requiresVerification, createdAt, updatedAt
```

### Service

```
_id, title, description, price, priceType (hourly|fixed|from),
minimumCharge, travelFee, category, professional (ref User), isActive,
imageUrl, createdAt, updatedAt
```

### ServiceRequest (Booking)

```
_id, client (ref User), professional (ref User), service (ref Service),
serviceTitle, preferredDateTime, notes, offeredPrice, counterOffer
  { price, proposedDateTime, notes }, cancelReason,
status (pending|accepted|rejected|countered|cancelled|expired|completed),
createdAt, updatedAt
```

### Company

```
_id, name, description, email, phone, website, address, logo,
owner (ref User), professionals (ref[] User),
verificationStatus (not_submitted|pending|approved|rejected),
isActive, createdAt, updatedAt
```

### Conversation

```
_id, participants (ref[] User), lastMessage (ref Message),
serviceRequest (ref ServiceRequest), isActive, createdAt, updatedAt
```

### Message

```
_id, conversation (ref Conversation), sender (ref User), content,
type (text|system|offer_update), isRead, createdAt, updatedAt
```

---

## Running Tests

The test suite uses Jest with in-memory model mocks (no real MongoDB required).

```bash
npm test
```

Tests cover:
- Auth: registration, login, validation, duplicate detection
- Services: CRUD operations, role-based access control
- Bookings: creation, status updates, counter-offers, authorization rules

---

## Project Structure

```
src/
├── app.js                    # Express app setup, middleware, routes
├── server.js                 # Server entry point
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── auth.controller.js    # Register, login
│   ├── user.controller.js    # Profile, role switching
│   ├── professional.controller.js  # Professional profile management
│   ├── service.controller.js       # Service listing CRUD
│   ├── booking.controller.js       # Service request lifecycle
│   ├── company.controller.js       # Company management
│   └── message.controller.js       # Chat / messaging
├── middleware/
│   ├── auth.middleware.js    # JWT protect, requireRole
│   └── error.middleware.js   # Centralised error handler
├── models/
│   ├── User.js
│   ├── ProfessionalProfile.js
│   ├── Service.js
│   ├── ServiceRequest.js
│   ├── Company.js
│   ├── Conversation.js
│   └── Message.js
└── routes/
    ├── auth.routes.js
    ├── user.routes.js
    ├── professional.routes.js
    ├── service.routes.js
    ├── booking.routes.js
    ├── company.routes.js
    └── message.routes.js

tests/
├── setup.js                  # Jest global setup & store teardown
├── auth.test.js
├── service.test.js
├── booking.test.js
└── __mocks__/
    ├── store.js              # Shared in-memory data store
    ├── User.js
    ├── Service.js
    └── ServiceRequest.js
```

---

## Security Notes

- Passwords are hashed with bcryptjs (cost factor 12)
- JWT tokens expire after 7 days by default
- Auth endpoints are rate-limited to 20 requests per 15 minutes (production)
- All routes sanitise inputs via express-validator
- Helmet sets security-related HTTP headers
- CORS is enabled (configure origins for production)
- Professionals control their own location privacy: approximate coordinates shown on map, exact location never exposed
- Profile visibility controls: toggle phone visibility, availability visibility, and map presence

---

## Future Roadmap (Phase 2+)

- **Payments & Invoicing** – Stripe integration for secure transactions
- **Reviews & Ratings** – Post-service reviews for professionals
- **AI-powered matching** – Smart recommendations based on location, history, and preferences
- **Push Notifications** – Real-time alerts for new messages and booking updates
- **File & Image Sharing** – Document uploads within chat
- **Group Chats** – Multi-party conversations for team bookings
- **Admin Dashboard** – Moderation, verification review, profile management
