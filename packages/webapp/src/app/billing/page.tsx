'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { CreditCardIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function BillingPage() {
  return (
    <DashboardLayout title="Billing & Subscription">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Current Plan */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Current Plan</h2>

          <div className="border border-trust-200 rounded-lg p-6 bg-trust-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-trust-900">Free Plan</h3>
                <p className="text-trust-700 mt-1">Perfect for getting started</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-trust-900">$0</p>
                <p className="text-trust-700">per month</p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium text-trust-900 mb-2">Plan Features:</h4>
              <ul className="space-y-1 text-trust-700">
                <li>• 100 analysis credits per month</li>
                <li>• Basic content analysis</li>
                <li>• Standard support</li>
                <li>• API access (rate limited)</li>
              </ul>
            </div>

            <div className="mt-6">
              <button className="btn-primary">
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>

        {/* Usage This Month */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Usage This Month</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-gray-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Credits Used</p>
                  <p className="text-2xl font-bold text-gray-900">15 / 100</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <CreditCardIcon className="h-8 w-8 text-gray-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Analyses</p>
                  <p className="text-2xl font-bold text-gray-900">87</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-gray-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Days Left</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-trust-600 h-2 rounded-full"
                style={{ width: '15%' }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">15% of monthly credits used</p>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Payment Method</h2>

          <div className="text-center py-8">
            <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payment method</h3>
            <p className="mt-1 text-sm text-gray-500">Add a payment method to upgrade your plan</p>
            <div className="mt-6">
              <button className="btn-primary">
                Add Payment Method
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}