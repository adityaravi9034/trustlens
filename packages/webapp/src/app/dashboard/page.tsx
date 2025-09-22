'use client';

import React from 'react';
import Link from 'next/link';
import {
  ChartBarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/store/auth-store';
import { formatNumber, formatPercentage, formatRelativeTime } from '@/lib/utils';

// Mock data for demo
const mockStats = {
  totalAnalyses: 156,
  averageScore: 0.32,
  creditsUsed: 78,
  lastAnalysis: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
};

const mockRecentAnalyses = [
  {
    id: '1',
    text: 'Breaking: New study reveals shocking truth about...',
    scores: { manipulation: 0.82, bias: 0.65, deception: 0.71, overall: 0.73 },
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    text: 'Scientists discover potential breakthrough in renewable energy...',
    scores: { manipulation: 0.15, bias: 0.23, deception: 0.12, overall: 0.17 },
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    text: 'You won\'t believe what happened next in this incredible story...',
    scores: { manipulation: 0.94, bias: 0.78, deception: 0.89, overall: 0.87 },
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
];

const quickActions = [
  {
    name: 'Analyze Text',
    description: 'Analyze text content for manipulation and bias',
    href: '/analyze?type=text',
    icon: DocumentTextIcon,
    color: 'bg-trust-500',
  },
  {
    name: 'Analyze URL',
    description: 'Analyze content from a web page',
    href: '/analyze?type=url',
    icon: EyeIcon,
    color: 'bg-purple-500',
  },
  {
    name: 'View History',
    description: 'Review your analysis history',
    href: '/history',
    icon: ClockIcon,
    color: 'bg-green-500',
  },
  {
    name: 'API Access',
    description: 'Get your API key and documentation',
    href: '/settings/api',
    icon: ChartBarIcon,
    color: 'bg-orange-500',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.email.split('@')[0]}!
              </h2>
              <p className="mt-1 text-gray-500">
                Here's your TrustLens analysis overview
              </p>
            </div>
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="h-12 w-12 text-trust-600" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Analyses
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatNumber(mockStats.totalAnalyses, 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Average Risk Score
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatPercentage(mockStats.averageScore)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Credits Remaining
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatNumber(user.credits, 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Last Analysis
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatRelativeTime(mockStats.lastAnalysis)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  className="group relative rounded-lg p-6 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div>
                    <span className={`rounded-lg inline-flex p-3 ${action.color} text-white group-hover:opacity-75`}>
                      <action.icon className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900">{action.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Analyses */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Analyses</h3>
              <Link
                href="/history"
                className="text-trust-600 hover:text-trust-500 text-sm font-medium"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {mockRecentAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 font-medium truncate">
                        {analysis.text}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(analysis.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4 ml-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          Risk: {formatPercentage(analysis.scores.overall)}
                        </div>
                        <div className="flex space-x-2 text-xs text-gray-500">
                          <span>M: {formatPercentage(analysis.scores.manipulation)}</span>
                          <span>B: {formatPercentage(analysis.scores.bias)}</span>
                          <span>D: {formatPercentage(analysis.scores.deception)}</span>
                        </div>
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          analysis.scores.overall >= 0.7
                            ? 'bg-red-500'
                            : analysis.scores.overall >= 0.4
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Getting Started */}
        {mockStats.totalAnalyses < 5 && (
          <div className="bg-trust-50 border border-trust-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-trust-900 mb-2">Getting Started</h3>
            <p className="text-trust-700 mb-4">
              Welcome to TrustLens! Here are some ways to get started with content analysis:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/analyze"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-trust-700 bg-trust-100 hover:bg-trust-200 transition-colors"
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Try Your First Analysis
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center px-4 py-2 border border-trust-300 text-sm font-medium rounded-md text-trust-700 bg-white hover:bg-trust-50 transition-colors"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Read Documentation
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}