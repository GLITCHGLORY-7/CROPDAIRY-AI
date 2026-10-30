import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { loginSchema, LoginFormData } from '@/lib/validation/authSchemas';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Sprout, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authError, setAuthError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/app/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    const res = await signIn(data.email, data.password);
    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setAuthError(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleDemoFill = () => {
    setValue('email', 'farmer@cropdiary.ai');
    setValue('password', 'farmer123');
  };

  return (
    <div className="min-h-screen bg-earth-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-agri-700 text-white flex items-center justify-center shadow-md mb-3">
          <Sprout className="w-7 h-7" aria-hidden="true" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome to CropDiary AI
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600">
          Sign in to manage your farms, plots, and agricultural records
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-lg rounded-2xl border border-slate-200/90 text-left">
          {!isSupabaseConfigured && (
            <div className="mb-6">
              <Alert variant="warning" title="Local Development Mode">
                Supabase credentials are not configured in <code className="font-mono text-xs">.env</code>. The application is running with secure browser-isolated persistence.
                <button
                  type="button"
                  onClick={handleDemoFill}
                  className="mt-2 block text-xs font-bold text-agri-800 underline hover:text-agri-950"
                >
                  Click to pre-fill test farmer credentials
                </button>
              </Alert>
            </div>
          )}

          {authError && (
            <div className="mb-6">
              <Alert variant="error" title="Unable to Sign In">
                {authError}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              required
              placeholder="e.g. farmer@cropdiary.ai"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <Link
                to="/reset-password"
                className="font-semibold text-agri-700 hover:text-agri-800 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isSubmitting}>
                Sign In to Farm
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-600">
            Don&apos;t have an account yet?{' '}
            <Link to="/register" className="font-bold text-agri-700 hover:underline">
              Register as a New Farmer
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          CropDiary AI • Empowering Indian farmers with practical digital agronomy.
        </div>
      </div>
    </div>
  );
};
