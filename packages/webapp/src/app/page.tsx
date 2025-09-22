import Link from 'next/link';
import { ArrowRightIcon, ShieldCheckIcon, EyeIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-trust-50 to-blue-100">
      {/* Navigation */}
      <nav className="relative px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-trust-600" />
            <span className="ml-2 text-2xl font-bold text-gradient">TrustLens</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/features" className="text-gray-600 hover:text-trust-600 transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-trust-600 transition-colors">
              Pricing
            </Link>
            <Link href="/docs" className="text-gray-600 hover:text-trust-600 transition-colors">
              Docs
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-trust-600 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
          <div className="mx-auto max-w-4xl">
            <h1 className="mx-auto max-w-4xl font-display text-5xl font-medium tracking-tight text-slate-900 sm:text-7xl">
              Detect{' '}
              <span className="relative whitespace-nowrap text-trust-600">
                <span className="relative">manipulation</span>
              </span>{' '}
              in content with AI
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700">
              Advanced AI-powered analysis to identify bias, deception, and manipulation in text, images, and online content.
              Protect yourself and your organization from misinformation.
            </p>
            <div className="mt-10 flex justify-center gap-x-6">
              <Link href="/register" className="group inline-flex items-center justify-center rounded-full py-2 px-4 text-sm font-semibold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 bg-trust-600 text-white hover:bg-trust-700 active:bg-trust-800 focus-visible:outline-trust-600">
                Start Free Analysis
              </Link>
              <Link href="/demo" className="group inline-flex ring-1 items-center justify-center rounded-full py-2 px-4 text-sm focus:outline-none ring-slate-200 text-slate-700 hover:text-slate-900 hover:ring-slate-300 active:bg-slate-100 active:text-slate-600 focus-visible:outline-blue-600 focus-visible:ring-slate-300">
                <svg className="h-3 w-3 flex-none" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M6.75 4.5l6.5 4a1 1 0 010 1.5l-6.5 4V4.5z" />
                </svg>
                <span className="ml-3">Watch demo</span>
              </Link>
            </div>
            <div className="mt-36 lg:mt-44">
              <p className="font-display text-base text-slate-900">
                Trusted by researchers and organizations worldwide
              </p>
              <ul className="mt-8 flex items-center justify-center gap-x-8 sm:flex-col sm:gap-x-0 sm:gap-y-10 xl:flex-row xl:gap-x-12 xl:gap-y-0">
                <li>
                  <div className="flex items-center gap-2 text-slate-600">
                    <EyeIcon className="h-5 w-5" />
                    <span>99.2% Accuracy</span>
                  </div>
                </li>
                <li>
                  <div className="flex items-center gap-2 text-slate-600">
                    <ChartBarIcon className="h-5 w-5" />
                    <span>16+ Detection Categories</span>
                  </div>
                </li>
                <li>
                  <div className="flex items-center gap-2 text-slate-600">
                    <ShieldCheckIcon className="h-5 w-5" />
                    <span>Enterprise Security</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-trust-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Comprehensive Content Analysis
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Our advanced AI models detect multiple forms of manipulation, bias, and deception in digital content.
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-trust-500 text-white">
                  <EyeIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Multi-Modal Analysis</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Analyze text, images, and multimedia content with our integrated AI models for comprehensive detection.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-trust-500 text-white">
                  <ChartBarIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Real-time Scoring</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Get instant manipulation, bias, and deception scores with detailed explanations and confidence levels.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-trust-500 text-white">
                  <ShieldCheckIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Enterprise Security</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Bank-grade security with API access, custom models, and compliance with data protection regulations.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-trust-500 text-white">
                  <ArrowRightIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Easy Integration</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Simple API, browser extension, and SDKs for seamless integration into your existing workflows.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-trust-600">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to start analyzing?</span>
            <span className="block">Try TrustLens today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-trust-200">
            Start with our free tier and analyze up to 100 pieces of content per month.
          </p>
          <Link
            href="/register"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-trust-600 bg-white hover:bg-trust-50 sm:w-auto"
          >
            Get started for free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <Link href="/privacy" className="text-gray-400 hover:text-gray-500">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-gray-500">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-gray-400 hover:text-gray-500">
              Contact
            </Link>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">
              &copy; 2024 TrustLens. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}