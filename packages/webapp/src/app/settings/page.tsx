'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function SettingsPage() {
  return (
    <DashboardLayout title="Account Settings">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Account Settings</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 input"
                    value="demo@trustlens.ai"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plan</label>
                  <input
                    type="text"
                    className="mt-1 input"
                    value="Free Plan"
                    disabled
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="focus:ring-trust-500 h-4 w-4 text-trust-600 border-gray-300 rounded"
                    defaultChecked
                  />
                  <label className="ml-3 text-sm text-gray-700">
                    Email notifications for analysis results
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="focus:ring-trust-500 h-4 w-4 text-trust-600 border-gray-300 rounded"
                    defaultChecked
                  />
                  <label className="ml-3 text-sm text-gray-700">
                    Weekly usage summary emails
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button className="btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}