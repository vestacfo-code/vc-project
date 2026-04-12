import * as Sentry from '@sentry/react';
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createSentryMutationCache,
  getSentryReactQueryOptions,
} from "@/lib/sentry";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/hooks/useAuth";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { DashboardReferenceProvider } from "@/contexts/DashboardReferenceContext";
import { PortalAnimationProvider, usePortalAnimation } from "@/contexts/PortalAnimationContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { SignInPortalAnimation } from "@/components/SignInPortalAnimation";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import DemoRedirect from "./pages/DemoRedirect";

import Pricing from "./pages/Pricing";
import Features from "./pages/Features";
import Company from "./pages/Company";
import Contact from "./pages/Contact";
import Partners from "./pages/Partners";
import HotelPartnerMarketplace from "./pages/HotelPartnerMarketplace";
import About from "./pages/About";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import PressRelease from "./pages/PressRelease";
import Careers from "./pages/Careers";

import AdminHub from "./pages/AdminHub";
import Welcome from "./pages/Welcome";
import ConsumerJoin from "./pages/ConsumerJoin";
import JobRole from "./pages/JobRole";
import AICfoCall from "./pages/AICfoCall";
import ChatHub from "./pages/ChatHub";
import HotelChatPage from "./pages/HotelChatPage";
import Privacy from "./pages/Privacy";
import Support from "./pages/Support";
import Security from "./pages/Security";
import Trust from "./pages/Trust";
import Status from "./pages/Status";
import Onboarding from "./pages/Onboarding";
import HotelOnboarding from "./pages/HotelOnboarding";
import PaymentSelection from "./pages/PaymentSelection";
import StepByStepGuide from "./pages/StepByStepGuide";
import TermsOfService from "./pages/TermsOfService";
import Press from "./pages/Press";
import NotFound from "./pages/NotFound";
import Integrations from "./pages/Integrations";
import IntegrationsQbCallback from "./pages/IntegrationsQbCallback";
import BudgetPage from "./pages/Budget";
import AnomaliesPage from "./pages/Anomalies";
import ReportsPage from "./pages/Reports";
import TeamPage from "./pages/Team";
import SharedConversation from "./pages/SharedConversation";
import { HotelLayout } from "@/components/hotel/HotelLayout";
import SettingsPage from "./pages/Settings";

import Docs from "./pages/Docs";

// Documentation sub-pages
import Connect from "./pages/docs/Connect";
import ConnectQuickBooks from "./pages/docs/ConnectQuickBooks";
import ConnectXero from "./pages/docs/ConnectXero";
import ConnectWave from "./pages/docs/ConnectWave";
import ConnectZoho from "./pages/docs/ConnectZoho";
import UploadCSV from "./pages/docs/UploadCSV";
import ManualEntry from "./pages/docs/ManualEntry";
import AccountSetup from "./pages/docs/AccountSetup";
import QuickTour from "./pages/docs/QuickTour";
import AIChat from "./pages/docs/AIChat";
import Analytics from "./pages/docs/Analytics";
import Reports from "./pages/docs/Reports";
import DocsCashFlow from "./pages/docs/CashFlow";
import Expenses from "./pages/docs/Expenses";
import ARIntelligence from "./pages/docs/ARIntelligence";
import ExpenseIntelligence from "./pages/docs/ExpenseIntelligence";
import CustomerProfitability from "./pages/docs/CustomerProfitability";
import TopCustomers from "./pages/docs/TopCustomers";
import ExpenseDistribution from "./pages/docs/ExpenseDistribution";
import UnderstandingData from "./pages/docs/UnderstandingData";
import BestPractices from "./pages/docs/BestPractices";
import DocsFAQ from "./pages/docs/FAQ";
import APIReference from "./pages/docs/APIReference";
import DocsWebhooks from "./pages/docs/Webhooks";
import KnowledgeBase from "./pages/docs/KnowledgeBase";

const SentryDebugLazy = import.meta.env.DEV
  ? lazy(() => import("./pages/SentryDebug"))
  : null;

const queryClient = new QueryClient({
  mutationCache: createSentryMutationCache(),
  defaultOptions: getSentryReactQueryOptions(),
});

// Inner component that uses portal animation context and navigation
const AppContent = () => {
  const { isActive, userName, endAnimation } = usePortalAnimation();

  /** Navigation after the portal is handled in Auth (QuickBooks resume or dashboard). */
  const handlePortalComplete = () => {
    endAnimation();
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/demo" element={<DemoRedirect />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/features" element={<Features />} />
        <Route path="/company" element={<Company />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/press/:slug" element={<PressRelease />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/careers/:slug" element={<JobRole />} />
        
        <Route path="/admin" element={<ProtectedRoute><AdminHub /></ProtectedRoute>} />
        <Route path="/welcome/:slug" element={<Welcome />} />
        <Route path="/join/:slug" element={<ConsumerJoin />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/support" element={<Support />} />
        <Route path="/security" element={<Security />} />
        <Route path="/trust" element={<Trust />} />
        <Route path="/status" element={<Status />} />
        {/* Hotel app pages — all wrapped with HotelLayout (sidebar + bottom nav) */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <HotelLayout><Dashboard /></HotelLayout>
          </ProtectedRoute>
        } />
        <Route path="/integrations/qb-callback" element={
          <ProtectedRoute>
            <HotelLayout><IntegrationsQbCallback /></HotelLayout>
          </ProtectedRoute>
        } />
        <Route path="/integrations" element={
          <ProtectedRoute>
            <HotelLayout><Integrations /></HotelLayout>
          </ProtectedRoute>
        } />
        <Route path="/budget" element={
          <ProtectedRoute>
            <HotelLayout><BudgetPage /></HotelLayout>
          </ProtectedRoute>
        } />
        <Route path="/anomalies" element={
          <ProtectedRoute>
            <HotelLayout><AnomaliesPage /></HotelLayout>
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <HotelLayout><ReportsPage /></HotelLayout>
          </ProtectedRoute>
        } />
        <Route path="/team" element={
          <ProtectedRoute>
            <HotelLayout><TeamPage /></HotelLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <HotelLayout><SettingsPage /></HotelLayout>
          </ProtectedRoute>
        } />
        <Route path="/marketplace" element={
          <ProtectedRoute>
            <HotelLayout><HotelPartnerMarketplace /></HotelLayout>
          </ProtectedRoute>
        } />
        <Route path="/app" element={
          <ProtectedRoute>
            <ChatHub />
          </ProtectedRoute>
        } />
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <HotelOnboarding />
          </ProtectedRoute>
        } />
        <Route path="/payment-selection" element={
          <ProtectedRoute>
            <PaymentSelection />
          </ProtectedRoute>
        } />
        <Route path="/how-to-get-started" element={<StepByStepGuide />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/press" element={<Press />} />
        <Route path="/call" element={
          <ProtectedRoute>
            <AICfoCall />
          </ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute>
            <HotelLayout><HotelChatPage /></HotelLayout>
          </ProtectedRoute>
        } />
        <Route path="/quickbooks" element={
          <ProtectedRoute>
            <ChatHub />
          </ProtectedRoute>
        } />
        <Route path="/shared/:token" element={<SharedConversation />} />
        
        {/* Old /hpt1 route removed - now served at / */}
        <Route path="/docs" element={<Docs />} />
        <Route path="/docs/connect" element={<Connect />} />
        <Route path="/docs/connect/quickbooks" element={<ConnectQuickBooks />} />
        <Route path="/docs/connect/xero" element={<ConnectXero />} />
        <Route path="/docs/connect/wave" element={<ConnectWave />} />
        <Route path="/docs/connect/zoho" element={<ConnectZoho />} />
        <Route path="/docs/connect/csv" element={<UploadCSV />} />
        <Route path="/docs/connect/manual" element={<ManualEntry />} />
        <Route path="/docs/getting-started/setup" element={<AccountSetup />} />
        <Route path="/docs/getting-started/tour" element={<QuickTour />} />
        <Route path="/docs/features/ai-chat" element={<AIChat />} />
        <Route path="/docs/features/analytics" element={<Analytics />} />
        <Route path="/docs/features/reports" element={<Reports />} />
        <Route path="/docs/features/cashflow" element={<DocsCashFlow />} />
        <Route path="/docs/features/ar-intelligence" element={<ARIntelligence />} />
        <Route path="/docs/features/expense-intelligence" element={<ExpenseIntelligence />} />
        <Route path="/docs/features/customer-profitability" element={<CustomerProfitability />} />
        <Route path="/docs/features/top-customers" element={<TopCustomers />} />
        <Route path="/docs/features/expense-distribution" element={<ExpenseDistribution />} />
        <Route path="/docs/features/expenses" element={<Expenses />} />
        <Route path="/docs/learn/data" element={<UnderstandingData />} />
        <Route path="/docs/learn/practices" element={<BestPractices />} />
        <Route path="/docs/learn/faq" element={<DocsFAQ />} />
        <Route path="/docs/api" element={<APIReference />} />
        <Route path="/docs/webhooks" element={<DocsWebhooks />} />
        <Route path="/docs/knowledge" element={<KnowledgeBase />} />
        {import.meta.env.DEV && SentryDebugLazy && (
          <Route
            path="/__debug/sentry"
            element={
              <Suspense
                fallback={
                  <div className="flex min-h-[40vh] items-center justify-center text-sm text-vesta-navy/65">
                    Loading…
                  </div>
                }
              >
                <SentryDebugLazy />
              </Suspense>
            }
          />
        )}
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <FloatingChatbot />

      {/* Portal animation rendered OUTSIDE routes - persists across navigation */}
      <SignInPortalAnimation 
        isActive={isActive}
        userName={userName}
        onComplete={handlePortalComplete}
      />
    </>
  );
};

const App = () => (
  <Sentry.ErrorBoundary fallback={<div className="flex min-h-screen items-center justify-center bg-vesta-cream px-4 text-center font-sans text-sm text-vesta-navy/85">Something went wrong. Please refresh.</div>}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <PortalAnimationProvider>
              <ScrollToTop />
              <SettingsProvider>
                <DashboardReferenceProvider>
                  <AppContent />
                </DashboardReferenceProvider>
              </SettingsProvider>
            </PortalAnimationProvider>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </Sentry.ErrorBoundary>
);

export default App;
