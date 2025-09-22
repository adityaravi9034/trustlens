'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { KeyIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function ApiSettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const apiKey = 'tl_demo_1234567890abcdef1234567890abcdef';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <DashboardLayout title="API Settings">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* API Keys */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">API Keys</h2>

          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Default API Key</h3>
                  <p className="text-sm text-gray-500">Created on {new Date().toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-sm text-trust-600 hover:text-trust-500"
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(apiKey)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                  {showApiKey ? apiKey : '••••••••••••••••••••••••••••••••'}
                </code>
              </div>
            </div>

            <button className="btn-primary">
              <KeyIcon className="h-4 w-4 mr-2" />
              Generate New API Key
            </button>
          </div>
        </div>

        {/* API Documentation */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">API Documentation</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Base URL</h3>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono block">
                https://api.trustlens.ai/v1
              </code>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Authentication</h3>
              <p className="text-sm text-gray-600 mb-2">
                Include your API key in the Authorization header:
              </p>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono block">
                Authorization: Bearer YOUR_API_KEY
              </code>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Example Request</h3>
              <pre className="text-sm bg-gray-100 p-4 rounded font-mono overflow-x-auto">
{`curl -X POST https://api.trustlens.ai/v1/analyze \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Your content to analyze",
    "options": {
      "includeExplanations": true
    }
  }'`}
              </pre>
            </div>
          </div>
        </div>

        {/* Rate Limits */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Rate Limits</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900">Current Plan: Free</h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>• 10 requests per 15 minutes</li>
                <li>• 100 analysis credits per month</li>
                <li>• Basic support</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900">Usage This Month</h3>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">API Calls</span>
                  <span className="font-medium">15 / 100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-trust-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}