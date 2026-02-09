// ============================================
// API Response Types
// ============================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// ============================================
// Auth Types
// ============================================
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

// ============================================
// Property Types
// ============================================
export interface PropertyFilters {
  type?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  amenities?: string[];
  availableFrom?: string;
  availableTo?: string;
  lat?: number;
  lng?: number;
  radius?: number; // in km
}

export interface PropertySearchQuery {
  q?: string;
  filters?: PropertyFilters;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'relevance';
  page?: number;
  limit?: number;
}

export interface PropertyListItem {
  id: string;
  title: string;
  type: string;
  price: number;
  priceUnit: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqFt?: number;
  city: string;
  address: string;
  thumbnail?: string;
  isFeatured: boolean;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface PropertyDetail extends PropertyListItem {
  description: string;
  furnished: boolean;
  amenities: string[];
  rules: string[];
  availableFrom?: string;
  availableTo?: string;
  minStayDays: number;
  maxStayDays?: number;
  latitude?: number;
  longitude?: number;
  images: PropertyImage[];
  owner: UserSummary;
}

export interface PropertyImage {
  id: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
}

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  rating: number;
  memberSince: string;
}

// ============================================
// Booking Types
// ============================================
export interface PropertyBookingInput {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  specialRequests?: string;
}

export interface BookingSummary {
  id: string;
  property: PropertyListItem;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export interface BookingDetail extends BookingSummary {
  host: UserSummary;
  guest: UserSummary;
  specialRequests?: string;
  payment?: PaymentSummary;
}

// ============================================
// Service Types
// ============================================
export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface Service {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  priceRangeMin?: number;
  priceRangeMax?: number;
  priceUnit?: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  yearsExperience: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
}

export interface ServiceBookingInput {
  serviceId: string;
  providerId: string;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  city: string;
  notes?: string;
}

// ============================================
// Marketplace Types
// ============================================
export interface MarketplaceCategoryType {
  id: string;
  name: string;
  description?: string;
  slug: string;
}

export interface MarketplaceFilters {
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  isNegotiable?: boolean;
}

export interface MarketplaceItemList {
  id: string;
  title: string;
  category: string;
  condition: string;
  price: number;
  isNegotiable: boolean;
  city: string;
  thumbnail?: string;
  createdAt: string;
}

export interface MarketplaceItemDetail extends MarketplaceItemList {
  description: string;
  originalPrice?: number;
  seller: UserSummary;
  images: MarketplaceImage[];
}

export interface MarketplaceImage {
  id: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
}

// ============================================
// Review Types
// ============================================
export interface ReviewInput {
  rating: number;
  comment?: string;
  propertyId?: string;
  serviceBookingId?: string;
}

export interface Review {
  id: string;
  reviewer: UserSummary;
  rating: number;
  comment?: string;
  isVerified: boolean;
  createdAt: string;
}

// ============================================
// Payment Types
// ============================================
export interface PaymentSummary {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  paidAt?: string;
}

export interface PaymentIntentInput {
  bookingId: string;
  bookingType: 'property' | 'service';
  amount: number;
  method: string;
}

// ============================================
// Notification Types
// ============================================
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// ============================================
// Message Types
// ============================================
export interface Conversation {
  id: string;
  participants: UserSummary[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  attachments: string[];
  isRead: boolean;
  createdAt: string;
}

// ============================================
// Admin Types
// ============================================
export interface DashboardStats {
  totalUsers: number;
  newUsersThisMonth: number;
  totalProperties: number;
  activeProperties: number;
  totalBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export interface RecentActivity {
  id: string;
  type: 'booking' | 'listing' | 'user' | 'payment';
  description: string;
  user?: string;
  timestamp: string;
}

export interface UserAdminList {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  propertyCount: number;
  bookingCount: number;
}

// ============================================
// Search Types (Typesense)
// ============================================
export interface SearchResult<T> {
  hits: T[];
  found: number;
  page: number;
  searchTimeMs: number;
}

export interface PropertySearchDocument {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  priceUnit: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqFt?: number;
  city: string;
  address: string;
  amenities: string[];
  furnished: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  createdAt: number;
  location: [number, number]; // [lat, lng]
}

export interface MarketplaceSearchDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  isNegotiable: boolean;
  city: string;
  status: string;
  createdAt: number;
}