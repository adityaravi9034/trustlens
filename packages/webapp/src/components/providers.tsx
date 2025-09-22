'use client';

import React from 'react';
import { AuthProvider } from '@/store/auth-store';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}