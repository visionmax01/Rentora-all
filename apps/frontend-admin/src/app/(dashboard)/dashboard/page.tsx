'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Users,
  Building2,
  Wrench,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  totalServices: number;
  totalMarketplaceItems: number;
  totalBookings: number;
  totalRevenue: number;
  recentUsers: any[];
  recentBookings: any[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/admin/dashboard/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      change: '+12%',
      changeType: 'positive',
      color: 'blue',
    },
    {
      title: 'Properties',
      value: stats?.totalProperties || 0,
      icon: Building2,
      change: '+8%',
      changeType: 'positive',
      color: 'green',
    },
    {
      title: 'Services',
      value: stats?.totalServices || 0,
      icon: Wrench,
      change: '+15%',
      changeType: 'positive',
      color: 'amber',
    },
    {
      title: 'Marketplace Items',
      value: stats?.totalMarketplaceItems || 0,
      icon: ShoppingBag,
      change: '-3%',
      changeType: 'negative',
      color: 'purple',
    },
  ];

  const bookingData = [
    { name: 'Jan', bookings: 65 },
    { name: 'Feb', bookings: 78 },
    { name: 'Mar', bookings: 90 },
    { name: 'Apr', bookings: 81 },
    { name: 'May', bookings: 95 },
    { name: 'Jun', bookings: 110 },
  ];

  const revenueData = [
    { name: 'Property Rentals', value: 45000 },
    { name: 'Services', value: 28000 },
    { name: 'Marketplace', value: 15000 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4">
                {stat.changeType === 'positive' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span
                  className={`text-sm ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-sm text-slate-500">vs last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Bookings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bookingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bookings" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenueData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {revenueData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Recent Users</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats?.recentUsers?.slice(0, 5).map((user: any) => (
                <div key={user.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {user.firstName[0]}{user.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                  <span className="text-sm text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )) || (
                <p className="text-slate-500 text-center py-4">No recent users</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Recent Bookings</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats?.recentBookings?.slice(0, 5).map((booking: any) => (
                <div key={booking.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">Rs. {booking.totalAmount}</p>
                    <p className="text-sm text-slate-500">{booking.status}</p>
                  </div>
                  <span className="text-sm text-slate-400">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )) || (
                <p className="text-slate-500 text-center py-4">No recent bookings</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
