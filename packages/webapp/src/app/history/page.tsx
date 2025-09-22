'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { DocumentTextIcon, ClockIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysisHistory();
  }, []);

  const fetchAnalysisHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/analysis/history');
      const result = await response.json();

      if (result.success) {
        setAnalyses(result.data.analyses);
      }
    } catch (error) {
      console.error('Failed to fetch analysis history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const analysisDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - analysisDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  const getTrustColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600 bg-green-100';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <DashboardLayout title="Analysis History">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Recent Analyses</h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-trust-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading analysis history...</p>
            </div>
          ) : analyses.length > 0 ? (
            <div className="space-y-4">
              {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-500 uppercase">
                        {analysis.type} analysis
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <div className="flex items-center text-xs text-gray-500">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {formatTimeAgo(analysis.createdAt)}
                      </div>
                    </div>

                    <p className="text-sm text-gray-900 mb-3 line-clamp-2">
                      {analysis.content}
                    </p>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <ShieldCheckIcon className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500">
                          {analysis.creditsUsed} credits used
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex-shrink-0">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getTrustColor(analysis.trustScore)}`}>
                      {Math.round(analysis.trustScore * 100)}% Trust
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No analyses yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start analyzing content to see your history here
              </p>
              <div className="mt-6">
                <a href="/analyze" className="btn-primary">
                  Start Analysis
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Usage Summary */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Usage Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-trust-600">87</p>
              <p className="text-sm text-gray-500">Total Analyses</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-trust-600">15</p>
              <p className="text-sm text-gray-500">This Month</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-trust-600">85</p>
              <p className="text-sm text-gray-500">Credits Remaining</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}