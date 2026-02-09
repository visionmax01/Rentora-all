'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Search, Calendar, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';

interface Booking {
  id: string;
  bookingType: string;
  status: string;
  totalAmount: number;
  startDate: string;
  endDate: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/admin/bookings');
      setBookings(response.data.data.bookings);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) =>
    booking.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-amber-100 text-amber-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return <Calendar className="w-4 h-4 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bookings Management</h1>
          <p className="text-slate-600 mt-1">View and manage all bookings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600">Total Bookings</p>
          <p className="text-2xl font-bold text-slate-900">{bookings.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600">Pending</p>
          <p className="text-2xl font-bold text-amber-600">
            {bookings.filter((b) => b.status === 'PENDING').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600">Confirmed</p>
          <p className="text-2xl font-bold text-green-600">
            {bookings.filter((b) => b.status === 'CONFIRMED').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600">Total Revenue</p>
          <p className="text-2xl font-bold text-blue-600">
            Rs. {bookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Booking ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Type</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    #{booking.id.slice(-8)}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {booking.user.firstName} {booking.user.lastName}
                      </p>
                      <p className="text-sm text-slate-500">{booking.user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{booking.bookingType}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    Rs. {booking.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(booking.status)}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredBookings.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No bookings found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
