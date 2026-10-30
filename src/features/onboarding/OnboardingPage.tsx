import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { onboardingSchema, OnboardingFormData } from '@/lib/validation/authSchemas';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Sprout, Check } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      displayName: profile?.display_name || '',
      preferredLanguage: profile?.preferred_language || 'en',
      country: profile?.country || 'India',
      state: profile?.state || 'Tamil Nadu',
      district: profile?.district || 'Thanjavur',
      preferredAreaUnit: profile?.preferred_area_unit || 'Acres',
      farmingExperience: profile?.farming_experience || '5-10 years',
      primaryFarmingType: profile?.primary_farming_type || 'Open field',
    },
  });

  const onSubmit = async (data: OnboardingFormData) => {
    await updateProfile({
      display_name: data.displayName,
      preferred_language: data.preferredLanguage,
      country: data.country,
      state: data.state,
      district: data.district,
      preferred_area_unit: data.preferredAreaUnit,
      farming_experience: data.farmingExperience,
      primary_farming_type: data.primaryFarmingType,
    });
    navigate('/app/dashboard', { replace: true });
  };

  const handleSkip = async () => {
    try {
      await updateProfile({
        display_name: profile?.display_name || 'Farmer',
        state: profile?.state || 'Tamil Nadu',
        district: profile?.district || 'General',
        preferred_area_unit: profile?.preferred_area_unit || 'Acres',
      });
    } catch (err) {
      console.warn('Skip profile update error:', err);
    }
    navigate('/app/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-earth-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-agri-700 text-white flex items-center justify-center shadow-md mb-2">
            <Sprout className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to CropDiary AI
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Let&apos;s personalize your farm settings. You can adjust these anytime in Settings.
          </p>
        </div>

        <Card className="shadow-lg border-slate-200">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg">Farmer Profile & Regional Preferences</CardTitle>
              <CardDescription>
                We use these settings to customize localized crop recommendations, weather alerts, and unit conversions.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Display / Farmer Name"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  error={errors.displayName?.message}
                  {...register('displayName')}
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Country"
                  required
                  error={errors.country?.message}
                  {...register('country')}
                />

                <Input
                  label="State / Province"
                  required
                  placeholder="e.g. Tamil Nadu / Punjab"
                  error={errors.state?.message}
                  {...register('state')}
                />

                <Input
                  label="District / Locality"
                  required
                  placeholder="e.g. Thanjavur / Ludhiana"
                  error={errors.district?.message}
                  {...register('district')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Preferred Land Unit"
                  required
                  helperText="Standard unit for your farms & plots"
                  error={errors.preferredAreaUnit?.message}
                  {...register('preferredAreaUnit')}
                >
                  <option value="Acres">Acres</option>
                  <option value="Hectares">Hectares</option>
                  <option value="Bigha">Bigha</option>
                  <option value="Guntha">Guntha</option>
                </Select>

                <Select
                  label="Farming Experience"
                  error={errors.farmingExperience?.message}
                  {...register('farmingExperience')}
                >
                  <option value="< 2 years">Beginner (&lt; 2 years)</option>
                  <option value="2-5 years">2 – 5 years</option>
                  <option value="5-10 years">5 – 10 years</option>
                  <option value="10+ years">10+ years (Experienced)</option>
                </Select>

                <Select
                  label="Primary Farming Type"
                  error={errors.primaryFarmingType?.message}
                  {...register('primaryFarmingType')}
                >
                  <option value="Open field">Open Field</option>
                  <option value="Orchard">Orchard / Plantation</option>
                  <option value="Greenhouse">Greenhouse / Polyhouse</option>
                  <option value="Kitchen garden">Kitchen Garden</option>
                  <option value="Mixed farming">Mixed Farming</option>
                  <option value="Other">Other</option>
                </Select>
              </div>
            </CardContent>

            <CardFooter className="bg-slate-50 border-t border-slate-100 p-4 sm:p-6 flex items-center justify-between">
              <Button type="button" variant="ghost" size="md" onClick={handleSkip}>
                Skip for Now
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={isSubmitting} className="gap-2">
                <Check className="w-4 h-4" />
                Save & Go to Dashboard
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
