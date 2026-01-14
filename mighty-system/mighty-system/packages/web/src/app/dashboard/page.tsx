import { Users, Calendar, DollarSign, Clock } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { name: 'Total Customers', value: '248', icon: Users, change: '+12%', changeType: 'positive' },
    { name: 'Bookings Today', value: '18', icon: Calendar, change: '+5%', changeType: 'positive' },
    { name: 'Revenue (MTD)', value: '£12,450', icon: DollarSign, change: '+8%', changeType: 'positive' },
    { name: 'Avg. Booking Duration', value: '45 min', icon: Clock, change: '-2%', changeType: 'negative' },
  ];

  const recentBookings = [
    { id: 1, customer: 'John Smith', service: 'Haircut', time: '10:00 AM', status: 'confirmed' },
    { id: 2, customer: 'Jane Doe', service: 'Massage', time: '11:00 AM', status: 'pending' },
    { id: 3, customer: 'Bob Wilson', service: 'Consultation', time: '2:00 PM', status: 'confirmed' },
    { id: 4, customer: 'Alice Brown', service: 'Manicure', time: '3:30 PM', status: 'pending' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-full">
                <stat.icon className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-sm ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-2">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Recent Bookings</h2>
        </div>
        <div className="divide-y">
          {recentBookings.map((booking) => (
            <div key={booking.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {booking.customer.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{booking.customer}</p>
                  <p className="text-sm text-gray-500">{booking.service}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">{booking.time}</span>
                <span className={`px-3 py-1 text-xs rounded-full ${
                  booking.status === 'confirmed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {booking.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
