'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheckIcon,
  HomeIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CogIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/store/auth-store';
import { useToast } from '@/components/ui/toaster';
import { getPlanInfo, formatNumber } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Analyze', href: '/analyze', icon: ChartBarIcon },
  { name: 'History', href: '/history', icon: DocumentTextIcon },
  { name: 'Billing', href: '/billing', icon: CreditCardIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    addToast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
      type: 'success',
    });
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const planInfo = getPlanInfo(user.plan);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`relative z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-0 flex">
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button
                type="button"
                className="-m-2.5 p-2.5"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
              <div className="flex h-16 shrink-0 items-center">
                <ShieldCheckIcon className="h-8 w-8 text-trust-600" />
                <span className="ml-2 text-xl font-bold text-gradient">TrustLens</span>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-trust-600 hover:bg-gray-50"
                          >
                            <item.icon className="h-6 w-6 shrink-0" />
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
          <div className="flex h-16 shrink-0 items-center">
            <ShieldCheckIcon className="h-8 w-8 text-trust-600" />
            <span className="ml-2 text-xl font-bold text-gradient">TrustLens</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-trust-600 hover:bg-gray-50"
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="-mx-6 mt-auto">
                <div className="px-6 py-3 border-t border-gray-200">
                  <div className="flex items-center gap-x-4 text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-trust-600 text-white">
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{user.email}</p>
                      <p className={`text-xs rounded px-2 py-1 ${planInfo.color}`}>
                        {planInfo.name} • {formatNumber(user.credits)} credits
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-gray-400 hover:text-gray-500"
                      title="Sign out"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="h-6 w-px bg-gray-200 lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {title && (
                <h1 className="text-xl font-semibold leading-7 text-gray-900">
                  {title}
                </h1>
              )}
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
              <div className="flex items-center gap-x-4">
                <div className="text-sm text-gray-700">
                  <span className={`rounded px-2 py-1 ${planInfo.color}`}>
                    {formatNumber(user.credits)} credits
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}