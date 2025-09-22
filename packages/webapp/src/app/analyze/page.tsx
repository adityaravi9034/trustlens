'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  DocumentTextIcon,
  LinkIcon,
  PhotoIcon,
  PlayIcon,
  ClockIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  DocumentDuplicateIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useToast } from '@/components/ui/toaster';
import { formatPercentage, getScoreColor, formatDuration } from '@/lib/utils';
import { AnalysisRequest, AnalysisResult } from '@/types';
import { api } from '@/lib/api';

const analysisSchema = z.object({
  type: z.enum(['text', 'url', 'image']),
  content: z.string().min(1, 'Content is required'),
  options: z.object({
    includeExplanations: z.boolean().default(true),
    methods: z.array(z.string()).optional(),
    threshold: z.number().min(0).max(1).default(0.1),
  }).optional(),
});

type AnalysisFormData = z.infer<typeof analysisSchema>;

// Real API analysis function
const performAnalysis = async (data: AnalysisFormData): Promise<any> => {
  console.log('🔍 Starting analysis with data:', data);

  const payload = {
    content: data.content,
    url: data.type === 'url' ? data.content : undefined,
    includeExplanations: data.options?.includeExplanations || false,
  };

  console.log('📤 Sending payload to API:', payload);

  try {
    const response = await api.post('/analyze', payload);
    console.log('✅ API Response received:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ API Error:', error);
    throw error;
  }
};

export default function AnalyzePage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AnalysisFormData>({
    resolver: zodResolver(analysisSchema),
    defaultValues: {
      type: 'text',
      options: {
        includeExplanations: true,
        threshold: 0.1,
      },
    },
  });

  const selectedType = watch('type');
  const includeExplanations = watch('options.includeExplanations');

  const onSubmit = async (data: AnalysisFormData) => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const analysisResult = await performAnalysis(data);
      setResult(analysisResult);
      addToast({
        title: 'Analysis completed',
        description: `Trust score: ${formatPercentage(analysisResult.trustScore)}`,
        type: analysisResult.trustScore < 0.3 ? 'warning' : 'success',
      });
    } catch (error) {
      addToast({
        title: 'Analysis failed',
        description: 'Please try again later',
        type: 'error',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DashboardLayout title="Content Analysis">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Analysis Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Analyze Content</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Content Type Selection */}
            <div>
              <label className="text-base font-medium text-gray-900">Content Type</label>
              <p className="text-sm leading-5 text-gray-500">What type of content do you want to analyze?</p>
              <fieldset className="mt-4">
                <div className="space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
                  <div className="flex items-center">
                    <input
                      {...register('type')}
                      type="radio"
                      value="text"
                      className="focus:ring-trust-500 h-4 w-4 text-trust-600 border-gray-300"
                    />
                    <label className="ml-3 flex items-center cursor-pointer">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="block text-sm font-medium text-gray-700">Text</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      {...register('type')}
                      type="radio"
                      value="url"
                      className="focus:ring-trust-500 h-4 w-4 text-trust-600 border-gray-300"
                    />
                    <label className="ml-3 flex items-center cursor-pointer">
                      <LinkIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="block text-sm font-medium text-gray-700">URL</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      {...register('type')}
                      type="radio"
                      value="image"
                      className="focus:ring-trust-500 h-4 w-4 text-trust-600 border-gray-300"
                    />
                    <label className="ml-3 flex items-center cursor-pointer">
                      <PhotoIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="block text-sm font-medium text-gray-700">Image</span>
                    </label>
                  </div>
                </div>
              </fieldset>
            </div>

            {/* Content Input */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                {selectedType === 'text' && 'Text Content'}
                {selectedType === 'url' && 'URL to Analyze'}
                {selectedType === 'image' && 'Image URL'}
              </label>
              <div className="mt-1">
                {selectedType === 'text' ? (
                  <textarea
                    {...register('content')}
                    rows={6}
                    className="input resize-none"
                    placeholder="Enter the text content you want to analyze for manipulation, bias, and deception..."
                  />
                ) : (
                  <input
                    {...register('content')}
                    type="url"
                    className="input"
                    placeholder={
                      selectedType === 'url'
                        ? 'https://example.com/article'
                        : 'https://example.com/image.jpg'
                    }
                  />
                )}
              </div>
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>

            {/* Analysis Options */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Analysis Options</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    {...register('options.includeExplanations')}
                    type="checkbox"
                    className="focus:ring-trust-500 h-4 w-4 text-trust-600 border-gray-300 rounded"
                  />
                  <label className="ml-3 text-sm text-gray-700">
                    Include detailed explanations (uses 2x credits)
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Detection Threshold: {watch('options.threshold')}
                  </label>
                  <input
                    {...register('options.threshold', { valueAsNumber: true })}
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    className="mt-1 w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>More sensitive</span>
                    <span>Less sensitive</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isAnalyzing}
                className="btn-primary flex items-center"
              >
                {isAnalyzing ? (
                  <>
                    <div className="loading-spinner mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Analyze Content
                  </>
                )}
              </button>
            </div>

            {/* Credits Info */}
            <div className="bg-gray-50 rounded-md p-4">
              <div className="flex">
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-800">
                    Credit Cost: {includeExplanations ? '2' : '1'} credits
                  </h3>
                  <div className="text-sm text-gray-600">
                    {selectedType === 'image' && 'Image analysis uses 1.5x base cost. '}
                    {includeExplanations && 'Detailed explanations double the cost. '}
                    Higher detection sensitivity may affect accuracy.
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Analysis Results */}
        {result && (
          <div className="space-y-6">
            {/* Main Analysis Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-gray-900">Analysis Results</h2>
                <div className="flex items-center text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {result.timestamp && new Date(result.timestamp).toLocaleString()}
                </div>
              </div>

              {/* Trust Score & Credibility */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className={`p-4 rounded-lg border ${
                  result.trustScore > 0.7 ? 'bg-green-50 border-green-200' :
                  result.trustScore > 0.4 ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    <ShieldCheckIcon className="h-5 w-5 mr-2 text-gray-600" />
                    <h3 className="text-sm font-medium">Trust Score</h3>
                  </div>
                  <p className="text-2xl font-bold mt-2">{formatPercentage(result.trustScore)}</p>
                </div>
                <div className={`p-4 rounded-lg border ${
                  result.credibilityScore > 0.7 ? 'bg-green-50 border-green-200' :
                  result.credibilityScore > 0.4 ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    <CheckBadgeIcon className="h-5 w-5 mr-2 text-gray-600" />
                    <h3 className="text-sm font-medium">Credibility</h3>
                  </div>
                  <p className="text-2xl font-bold mt-2">{result.credibilityScore.toFixed(1)}/5</p>
                </div>
                <div className={`p-4 rounded-lg border ${
                  result.factCheck?.status === 'verified' ? 'bg-green-50 border-green-200' :
                  result.factCheck?.status === 'disputed' ? 'bg-red-50 border-red-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center">
                    <InformationCircleIcon className="h-5 w-5 mr-2 text-gray-600" />
                    <h3 className="text-sm font-medium">Fact Check</h3>
                  </div>
                  <p className="text-sm font-bold mt-2 capitalize">{result.factCheck?.status || 'Unverified'}</p>
                </div>
              </div>

              {/* Risk Categories */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Risk Categories</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(result.categories).map(([category, score]) => (
                    <div key={category} className={`p-3 rounded-lg border ${getScoreColor(score)}`}>
                      <h4 className="text-xs font-medium text-gray-700 capitalize">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <p className="text-lg font-bold">{formatPercentage(score)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Primary Explanation */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Analysis Summary</h4>
                <p className="text-sm text-blue-800">{result.explanation}</p>
              </div>
            </div>

            {/* Content Summary */}
            {result.summary && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <DocumentDuplicateIcon className="h-5 w-5 mr-2 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900">Content Summary</h3>
                </div>

                <div className="space-y-4">
                  {/* Main Claim */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Main Claim</h4>
                    <p className="text-sm text-gray-700">{result.summary.mainClaim}</p>
                  </div>

                  {/* Key Points */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Key Points</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {result.summary.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-gray-400 mr-2">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Reading Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">{result.summary.wordCount}</p>
                      <p className="text-xs text-gray-500">Words</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">{result.summary.readingTime}</p>
                      <p className="text-xs text-gray-500">Read Time</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900 capitalize">{result.summary.complexity}</p>
                      <p className="text-xs text-gray-500">Complexity</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fact-Checking Details */}
            {result.factCheck && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900">Fact-Checking Analysis</h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Verification Status</p>
                      <p className="text-lg font-bold capitalize">{result.factCheck.status}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Confidence</p>
                      <p className="text-lg font-bold">{formatPercentage(result.factCheck.confidence)}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Factual Claims</p>
                      <p className="text-lg font-bold">{result.factCheck.factualClaims}</p>
                    </div>
                  </div>

                  {result.factCheck.verification && result.factCheck.verification.length > 0 && (
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="text-sm font-medium text-yellow-900 mb-2">Verification Notes</h4>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        {result.factCheck.verification.map((note, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-yellow-600 mr-2">•</span>
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Source Analysis */}
            {result.sourceAnalysis && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <LinkIcon className="h-5 w-5 mr-2 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900">Source Analysis</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Overall Quality</h4>
                      <p className="text-xs text-gray-500">Based on multiple indicators</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatPercentage(result.sourceAnalysis.qualityScore)}</p>
                      <p className="text-xs text-gray-500 capitalize">{result.sourceAnalysis.assessment}</p>
                    </div>
                  </div>

                  {result.sourceAnalysis.recommendations && result.sourceAnalysis.recommendations.length > 0 && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Recommendations</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        {result.sourceAnalysis.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
                <div className="space-y-3">
                  {result.recommendations.map((rec, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${
                      rec.type === 'warning' ? 'bg-red-50 border-red-200' :
                      rec.type === 'caution' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 mr-3 ${
                          rec.type === 'warning' ? 'text-red-600' :
                          rec.type === 'caution' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {rec.type === 'warning' ? (
                            <ExclamationTriangleIcon className="h-5 w-5" />
                          ) : rec.type === 'caution' ? (
                            <InformationCircleIcon className="h-5 w-5" />
                          ) : (
                            <CheckBadgeIcon className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${
                            rec.type === 'warning' ? 'text-red-900' :
                            rec.type === 'caution' ? 'text-yellow-900' :
                            'text-green-900'
                          }`}>
                            {rec.priority && rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)} Priority
                          </p>
                          <p className={`text-sm ${
                            rec.type === 'warning' ? 'text-red-800' :
                            rec.type === 'caution' ? 'text-yellow-800' :
                            'text-green-800'
                          }`}>
                            {rec.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}