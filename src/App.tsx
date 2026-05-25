import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import PageLoader from "@/components/PageLoader";
import RequireAuth from "@/components/RequireAuth";

// Eagerly loaded (above the fold)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes
const AuthPage = lazy(() => import("./pages/AuthPage"));
const StoresPage = lazy(() => import("./pages/StoresPage"));
const DealsPage = lazy(() => import("./pages/DealsPage"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const StoreDetailPage = lazy(() => import("./pages/StoreDetailPage"));
const SpinWinPage = lazy(() => import("./pages/SpinWinPage"));
const GiftCardsPage = lazy(() => import("./pages/GiftCardsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const CareersPage = lazy(() => import("./pages/CareersPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const RefundPage = lazy(() => import("./pages/RefundPage"));
const CookiesPage = lazy(() => import("./pages/CookiesPage"));
const MissingCashbackPage = lazy(() => import("./pages/MissingCashbackPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/stores" element={<StoresPage />} />
                <Route path="/stores/:slug" element={<StoreDetailPage />} />
                <Route path="/store/:slug" element={<StoreDetailPage />} />
                <Route path="/deals" element={<DealsPage />} />
                <Route path="/products" element={<DealsPage />} />
                <Route path="/coupons" element={<DealsPage />} />
                <Route path="/offers" element={<DealsPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
                <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                <Route path="/spin-win" element={<SpinWinPage />} />
                <Route path="/gift-cards" element={<GiftCardsPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/category/:categorySlug" element={<CategoryPage />} />
                <Route path="/careers" element={<CareersPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/refund" element={<RefundPage />} />
                <Route path="/cookies" element={<CookiesPage />} />
                <Route path="/missing-cashback" element={<RequireAuth><MissingCashbackPage /></RequireAuth>} />
                <Route path="/check-balance" element={<Navigate to="/dashboard" replace />} />
                <Route path="/withdrawal" element={<Navigate to="/dashboard" replace />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
