```tsx file="app/dashboard/page.tsx"
[v0-no-op-code-block-prefix]import React from 'react';

const DashboardPage = () => {
  return (
    <div className="flex flex-col h-screen">
      <header className="p-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </header>

      <main className="flex-grow p-4">
        <section className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-md shadow-md">
              <h3 className="font-semibold">Total Users</h3>
              <p>1,234</p>
            </div>
            <div className="p-4 rounded-md shadow-md">
              <h3 className="font-semibold">Active Users</h3>
              <p>567</p>
            </div>
            <div className="p-4 rounded-md shadow-md">
              <h3 className="font-semibold">New Signups</h3>
              <p>89</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Recent Activity</h2>
          <ul className="divide-y divide-gray-200">
            <li className="py-2">User A logged in</li>
            <li className="py-2">User B updated profile</li>
            <li className="py-2">User C created a new post</li>
          </ul>
        </section>
      </main>

      <footer className="p-4 text-center">
        <p>&copy; 2024 My App</p>
      </footer>
    </div>
  );
};

export default DashboardPage;
