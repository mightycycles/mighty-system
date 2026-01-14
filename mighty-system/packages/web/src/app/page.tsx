import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-24">
      <h1 className="text-6xl font-bold text-center mb-8">
        Mighty System
      </h1>
      <p className="text-xl text-center text-gray-600 mb-8 max-w-2xl">
        Multi-tenant SaaS booking platform for retail and service businesses.
        Built with clean architecture, scalability, and UK compliance in mind.
      </p>
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          Dashboard
        </Link>
        <Link
          href="/bookings"
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
        >
          Bookings
        </Link>
      </div>
    </main>
  );
}
