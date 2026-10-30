import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { registerSchema, RegisterFormData } from '@/lib/validation/authSchemas';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Sprout, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      preferredLanguage: 'en',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setAuthError(null);
    const res = await signUp(data.email, data.password, data.fullName, data.preferredLanguage);
    if (res.success) {
      navigate('/onboarding', { replace: true });
    } else {
      setAuthError(res.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-earth-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-agri-700 text-white flex items-center justify-center shadow-md mb-3">
          <Sprout className="w-7 h-7" aria-hidden="true" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Join CropDiary AI
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600">
          Create an account to begin tracking your farms, plots, and crops
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-lg rounded-2xl border border-slate-200/90 text-left">
          {authError && (
            <div className="mb-6">
              <Alert variant="error" title="Registration Failed">
                {authError}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Full Name / Farmer Name"
              required
              placeholder="e.g. Ramesh Kumar"
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              required
              placeholder="farmer@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Select
              label="Preferred Language"
              required
              error={errors.preferredLanguage?.message}
              {...register('preferredLanguage')}
            >
              <option value="en">English</option>
              <option value="ta">Tamil (தமிழ்)</option>
              <option value="hi">Hindi (हिन्दी)</option>
            </Select>

            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="At least 6 characters"
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Re-enter password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isSubmitting}>
                Create Account & Continue
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-600">
            Already have a registered farm?{' '}
            <Link to="/login" className="font-bold text-agri-700 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
