import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';

// Dynamic lazy route imports for optimal code splitting & lightning-fast initial load
const LoginPage = lazy(() => import('@/features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ResetPasswordPage = lazy(() => import('@/features/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const OnboardingPage = lazy(() => import('@/features/onboarding/OnboardingPage').then(m => ({ default: m.OnboardingPage })));

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const FarmsListPage = lazy(() => import('@/features/farms/FarmsListPage').then(m => ({ default: m.FarmsListPage })));
const FarmDetailPage = lazy(() => import('@/features/farms/FarmDetailPage').then(m => ({ default: m.FarmDetailPage })));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));

const CropPlannerListPage = lazy(() => import('@/features/crop-planner/CropPlannerListPage').then(m => ({ default: m.CropPlannerListPage })));
const NewCropPlanWizardPage = lazy(() => import('@/features/crop-planner/NewCropPlanWizardPage').then(m => ({ default: m.NewCropPlanWizardPage })));
const CropPlanDetailPage = lazy(() => import('@/features/crop-planner/CropPlanDetailPage').then(m => ({ default: m.CropPlanDetailPage })));

const CropDoctorListPage = lazy(() => import('@/features/crop-doctor/CropDoctorListPage').then(m => ({ default: m.CropDoctorListPage })));
const NewCropAssessmentPage = lazy(() => import('@/features/crop-doctor/NewCropAssessmentPage').then(m => ({ default: m.NewCropAssessmentPage })));
const CropAssessmentDetailPage = lazy(() => import('@/features/crop-doctor/CropAssessmentDetailPage').then(m => ({ default: m.CropAssessmentDetailPage })));

const WeatherDashboardPage = lazy(() => import('@/features/weather/WeatherDashboardPage').then(m => ({ default: m.WeatherDashboardPage })));
const RemindersPage = lazy(() => import('@/features/weather/RemindersPage').then(m => ({ default: m.RemindersPage })));
const NotificationCenterPage = lazy(() => import('@/features/weather/NotificationCenterPage').then(m => ({ default: m.NotificationCenterPage })));

const FarmDiaryPage = lazy(() => import('@/features/diary/FarmDiaryPage').then(m => ({ default: m.FarmDiaryPage })));
const NewDiaryEntryPage = lazy(() => import('@/features/diary/NewDiaryEntryPage').then(m => ({ default: m.NewDiaryEntryPage })));
const DiaryEntryDetailPage = lazy(() => import('@/features/diary/DiaryEntryDetailPage').then(m => ({ default: m.DiaryEntryDetailPage })));
const EditDiaryEntryPage = lazy(() => import('@/features/diary/EditDiaryEntryPage').then(m => ({ default: m.EditDiaryEntryPage })));

const FinanceDashboardPage = lazy(() => import('@/features/finance/FinanceDashboardPage').then(m => ({ default: m.FinanceDashboardPage })));
const FinancialTransactionsPage = lazy(() => import('@/features/finance/FinancialTransactionsPage').then(m => ({ default: m.FinancialTransactionsPage })));
const BudgetsManagerPage = lazy(() => import('@/features/finance/BudgetsManagerPage').then(m => ({ default: m.BudgetsManagerPage })));
const HarvestSalesPage = lazy(() => import('@/features/finance/HarvestSalesPage').then(m => ({ default: m.HarvestSalesPage })));
const ProfitabilityReportsPage = lazy(() => import('@/features/finance/ProfitabilityReportsPage').then(m => ({ default: m.ProfitabilityReportsPage })));
const MarketPricesPage = lazy(() => import('@/features/finance/MarketPricesPage').then(m => ({ default: m.MarketPricesPage })));

const AIFarmAssistantPage = lazy(() => import('@/features/assistant/AIFarmAssistantPage').then(m => ({ default: m.AIFarmAssistantPage })));
const GovernmentSchemesPage = lazy(() => import('@/features/schemes/GovernmentSchemesPage').then(m => ({ default: m.GovernmentSchemesPage })));
const FarmHistoryPage = lazy(() => import('@/features/history/FarmHistoryPage').then(m => ({ default: m.FarmHistoryPage })));

// Accessible module loading fallback
const RouteLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center" role="status" aria-live="polite">
    <div className="w-10 h-10 border-3 border-agri-600 border-t-transparent rounded-full animate-spin mb-3" />
    <span className="text-xs font-semibold text-slate-600">Loading Agricultural Module...</span>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Onboarding Wizard (Protected) */}
        <Route
          path="/onboarding"
          element={
            <AuthGuard>
              <OnboardingPage />
            </AuthGuard>
          }
        />

        {/* Protected Main Application Shell */}
        <Route
          path="/app"
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* Farm Management */}
          <Route path="farms" element={<FarmsListPage />} />
          <Route path="farms/:farmId" element={<FarmDetailPage />} />

          {/* Smart Crop Planner */}
          <Route path="crop-planner" element={<CropPlannerListPage />} />
          <Route path="crop-planner/new" element={<NewCropPlanWizardPage />} />
          <Route path="crop-planner/:planId" element={<CropPlanDetailPage />} />

          {/* AI Crop Doctor */}
          <Route path="crop-doctor" element={<CropDoctorListPage />} />
          <Route path="crop-doctor/new" element={<NewCropAssessmentPage />} />
          <Route path="crop-doctor/:assessmentId" element={<CropAssessmentDetailPage />} />

          {/* Weather Intelligence, Alerts & Reminders */}
          <Route path="weather" element={<WeatherDashboardPage />} />
          <Route path="weather/:farmId" element={<WeatherDashboardPage />} />
          <Route path="reminders" element={<RemindersPage />} />
          <Route path="notifications" element={<NotificationCenterPage />} />

          {/* Smart Farm Diary & Field Records */}
          <Route path="diary" element={<FarmDiaryPage />} />
          <Route path="diary/new" element={<NewDiaryEntryPage />} />
          <Route path="diary/:entryId" element={<DiaryEntryDetailPage />} />
          <Route path="diary/:entryId/edit" element={<EditDiaryEntryPage />} />
          <Route path="farm-diary" element={<Navigate to="/app/diary" replace />} />
          <Route path="farm-diary/new" element={<Navigate to="/app/diary/new" replace />} />

          {/* Farm Finance, P&L, Budgets & Market Prices */}
          <Route path="finance" element={<FinanceDashboardPage />} />
          <Route path="finance/transactions" element={<FinancialTransactionsPage />} />
          <Route path="finance/budgets" element={<BudgetsManagerPage />} />
          <Route path="finance/sales" element={<HarvestSalesPage />} />
          <Route path="finance/reports" element={<ProfitabilityReportsPage />} />
          <Route path="market-prices" element={<MarketPricesPage />} />
          <Route path="market-prices/:commodity" element={<MarketPricesPage />} />

          {/* AI Farm Assistant & Multilingual Guidance */}
          <Route path="assistant" element={<AIFarmAssistantPage />} />
          <Route path="assistant/:conversationId" element={<AIFarmAssistantPage />} />

          {/* Government Schemes & Subsidies */}
          <Route path="schemes" element={<GovernmentSchemesPage />} />
          <Route path="schemes/:schemeId" element={<GovernmentSchemesPage />} />

          {/* Multi-Season Farm History & Longitudinal Analytics */}
          <Route path="history" element={<FarmHistoryPage />} />

          {/* Farmer Settings */}
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback & Root Redirection */}
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};
