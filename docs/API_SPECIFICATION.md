# Rentora API Specification

## Base URL
```
Development: http://localhost:3001/api/v1
Production: https://api.rentora.com/api/v1
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }
  }
}
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+977-98XXXXXXXX"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": 900
    }
  }
}
```

#### POST /auth/login
Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:** Same as register

#### POST /auth/refresh
Get new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

#### POST /auth/logout
Invalidate current session.

**Headers:** Authorization required

#### GET /auth/me
Get current user profile.

**Headers:** Authorization required

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "avatar": "url",
      "emailVerified": true,
      "phoneVerified": false
    }
  }
}
```

### Properties

#### GET /properties
List all properties with filters.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `type` (enum: ROOM, APARTMENT, HOUSE, VILLA, etc.)
- `city` (string)
- `minPrice` (number)
- `maxPrice` (number)
- `bedrooms` (number)
- `furnished` (boolean)
- `amenities` (string[], comma-separated)
- `sort` (enum: newest, price_asc, price_desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Modern 2BHK Apartment",
      "type": "APARTMENT",
      "price": 35000,
      "priceUnit": "MONTHLY",
      "bedrooms": 2,
      "bathrooms": 2,
      "city": "Kathmandu",
      "address": "Thamel",
      "images": [{ "url": "..." }],
      "isFeatured": true,
      "isVerified": true
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasMore": true
  }
}
```

#### GET /properties/:id
Get property details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "...",
    "description": "...",
    "type": "APARTMENT",
    "price": 35000,
    "priceUnit": "MONTHLY",
    "bedrooms": 2,
    "bathrooms": 2,
    "areaSqFt": 1200,
    "furnished": true,
    "amenities": ["WiFi", "Parking"],
    "address": "...",
    "city": "Kathmandu",
    "latitude": 27.7172,
    "longitude": 85.3240,
    "images": [...],
    "owner": {
      "id": "uuid",
      "firstName": "...",
      "lastName": "...",
      "avatar": "..."
    },
    "reviews": [...]
  }
}
```

#### POST /properties
Create a new property listing.

**Headers:** Authorization required
**Role:** HOST, ADMIN, SUPER_ADMIN

**Request Body:**
```json
{
  "title": "Modern Apartment",
  "description": "...",
  "type": "APARTMENT",
  "price": 35000,
  "priceUnit": "MONTHLY",
  "bedrooms": 2,
  "bathrooms": 2,
  "address": "Thamel, Kathmandu",
  "city": "Kathmandu",
  "state": "Bagmati",
  "zipCode": "44600",
  "amenities": ["WiFi", "Parking"],
  "images": [
    { "url": "...", "isPrimary": true }
  ]
}
```

#### PUT /properties/:id
Update property.

**Headers:** Authorization required
**Permissions:** Owner or Admin

#### DELETE /properties/:id
Delete property.

**Headers:** Authorization required
**Permissions:** Owner or Admin

### Bookings

#### POST /bookings
Create a new booking.

**Headers:** Authorization required

**Request Body:**
```json
{
  "propertyId": "uuid",
  "checkIn": "2024-06-01T00:00:00Z",
  "checkOut": "2024-06-30T00:00:00Z",
  "guestsCount": 2,
  "specialRequests": "..."
}
```

#### GET /bookings/my
Get my bookings as guest.

**Headers:** Authorization required

**Query Parameters:**
- `status` (enum: PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED)

#### GET /bookings/host
Get bookings for my properties.

**Headers:** Authorization required
**Role:** HOST, ADMIN

#### PATCH /bookings/:id/confirm
Confirm a booking (host only).

#### PATCH /bookings/:id/cancel
Cancel a booking.

**Request Body:**
```json
{
  "reason": "Changed plans"
}
```

### Services

#### GET /services/categories
List all service categories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Electrical",
      "description": "...",
      "icon": "⚡"
    }
  ]
}
```

#### GET /services
List services.

**Query Parameters:**
- `category` (category ID)
- `city` (string)

#### POST /services/bookings
Book a service.

**Headers:** Authorization required

**Request Body:**
```json
{
  "serviceId": "uuid",
  "providerId": "uuid",
  "scheduledDate": "2024-06-01",
  "scheduledTime": "10:00",
  "address": "...",
  "city": "Kathmandu",
  "notes": "..."
}
```

### Marketplace

#### GET /marketplace
List marketplace items.

**Query Parameters:**
- `category` (category ID)
- `city` (string)
- `minPrice` (number)
- `maxPrice` (number)
- `condition` (enum: NEW, LIKE_NEW, EXCELLENT, GOOD, FAIR, POOR)

#### POST /marketplace
Create a new listing.

**Headers:** Authorization required

**Request Body:**
```json
{
  "title": "iPhone 13 Pro",
  "description": "...",
  "categoryId": "uuid",
  "condition": "EXCELLENT",
  "price": 80000,
  "isNegotiable": true,
  "city": "Kathmandu",
  "images": [...]
}
```

### Search

#### GET /search/properties
Full-text search for properties.

**Query Parameters:**
- `q` (search query)
- `type`, `city`, etc. (same filters as /properties)

#### GET /search/marketplace
Full-text search for marketplace items.

#### GET /search/suggestions
Autocomplete suggestions.

**Query Parameters:**
- `q` (partial query, min 2 chars)
- `collection` (properties, marketplace_items)

### Reviews

#### POST /reviews
Create a review.

**Headers:** Authorization required

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Great property!",
  "propertyId": "uuid"
}
```

#### GET /reviews/property/:propertyId
Get reviews for a property.

### Users

#### GET /users/profile
Get user profile.

**Headers:** Authorization required

#### PATCH /users/profile
Update profile.

#### POST /users/change-password
Change password.

#### GET /users/favorites
Get favorite properties.

#### POST /users/favorites/:propertyId
Add to favorites.

#### DELETE /users/favorites/:propertyId
Remove from favorites.

### Admin

All admin endpoints require ADMIN or SUPER_ADMIN role.

#### GET /admin/stats
Get dashboard statistics.

#### GET /admin/properties/pending
Get properties pending verification.

#### PATCH /admin/properties/:id/verify
Verify a property.

#### PATCH /admin/properties/:id/reject
Reject a property.

#### GET /admin/bookings
Get all bookings.

#### GET /admin/contact-submissions
Get contact form submissions.

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| DUPLICATE_ENTRY | 409 | Resource already exists |
| INVALID_STATUS | 400 | Invalid state transition |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

## Rate Limiting

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## Pagination

All list endpoints support pagination:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

Response includes `meta` object with pagination info.