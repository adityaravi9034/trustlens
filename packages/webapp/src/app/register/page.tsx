'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheckIcon, EyeIcon, EyeSlashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/store/auth-store';
import { useToast } from '@/components/ui/toaster';
import { handleApiError } from '@/lib/api';
import { RegisterData } from '@/types';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  plan: z.enum(['free', 'basic', 'pro']).optional().default('free'),
  terms: z.boolean().refine((val) => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    credits: 100,
    features: ['100 analyses/month', 'Basic detection', 'Web interface'],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$19',
    credits: 1000,
    features: ['1,000 analyses/month', 'Advanced detection', 'API access', 'Explanations'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$99',
    credits: 10000,
    features: ['10,000 analyses/month', 'All features', 'Priority support', 'Custom models'],
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuth();
  const { addToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('free');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      plan: 'free',
    },
  });

  const password = watch('password');

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = password ? getPasswordStrength(password) : 0;

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, terms, ...registerData } = data;
      await registerUser(registerData);
      addToast({
        title: 'Account created successfully!',
        description: 'Welcome to TrustLens. You can now start analyzing content.',
        type: 'success',
      });
      router.push('/dashboard');
    } catch (error: any) {
      addToast({
        title: 'Registration failed',
        description: handleApiError(error),
        type: 'error',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-trust-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your TrustLens account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-trust-600 hover:text-trust-500"
            >
              Sign in here
            </Link>
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Selection */}
          <div className="bg-white py-8 px-6 shadow rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Choose your plan</h3>
            <div className="space-y-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPlan === plan.id
                      ? 'border-trust-500 bg-trust-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        {...register('plan')}
                        type="radio"
                        value={plan.id}
                        className="focus:ring-trust-500 h-4 w-4 text-trust-600 border-gray-300"
                        checked={selectedPlan === plan.id}
                        onChange={() => setSelectedPlan(plan.id)}
                      />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{plan.name}</span>
                        <span className="text-sm font-bold text-gray-900">{plan.price}/month</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{plan.credits} credits/month</p>
                      <ul className="mt-2 text-xs text-gray-500 space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <CheckIcon className="h-3 w-3 text-green-500 mr-1" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-500">
              All plans include a 14-day free trial. Cancel anytime.
            </p>
          </div>

          {/* Registration Form */}
          <div className="bg-white py-8 px-6 shadow rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Account details</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="mt-1 input"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative mt-1">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="input pr-10"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 w-full rounded ${
                            i < passwordStrength
                              ? passwordStrength <= 2
                                ? 'bg-red-500'
                                : passwordStrength <= 4
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Password strength: {
                        passwordStrength <= 2 ? 'Weak' :
                        passwordStrength <= 4 ? 'Good' : 'Strong'
                      }
                    </p>
                  </div>
                )}
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm password
                </label>
                <div className="relative mt-1">
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="input pr-10"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    {...register('terms')}
                    type="checkbox"
                    className="focus:ring-trust-500 h-4 w-4 text-trust-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <span className="text-gray-500">
                    I agree to the{' '}
                    <Link href="/terms" className="text-trust-600 hover:text-trust-500">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-trust-600 hover:text-trust-500">
                      Privacy Policy
                    </Link>
                  </span>
                </div>
              </div>
              {errors.terms && (
                <p className="text-sm text-red-600">{errors.terms.message}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-trust-600 hover:bg-trust-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-trust-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="loading-spinner mr-2" />
                ) : null}
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}