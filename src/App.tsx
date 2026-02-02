import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import StoresPage from "./pages/StoresPage";
import DealsPage from "./pages/DealsPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import FAQPage from "./pages/FAQPage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import DashboardPage from "./pages/DashboardPage";
import TermsPage from "./pages/TermsPage";
import StoreDetailPage from "./pages/StoreDetailPage";
import SpinWinPage from "./pages/SpinWinPage";
import GiftCardsPage from "./pages/GiftCardsPage";
import AdminPage from "./pages/AdminPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import CategoryPage from "./pages/CategoryPage";
import ProfilePage from "./pages/ProfilePage";
import CareersPage from "./pages/CareersPage";
import PrivacyPage from "./pages/PrivacyPage";
import RefundPage from "./pages/RefundPage";
import CookiesPage from "./pages/CookiesPage";
import MissingCashbackPage from "./pages/MissingCashbackPage";
import BlogPage from "./pages/BlogPage";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/spin-win" element={<SpinWinPage />} />
            <Route path="/gift-cards" element={<GiftCardsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/category/:categorySlug" element={<CategoryPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/refund" element={<RefundPage />} />
            <Route path="/cookies" element={<CookiesPage />} />
            <Route path="/missing-cashback" element={<MissingCashbackPage />} />
            <Route path="/check-balance" element={<Navigate to="/dashboard" replace />} />
            <Route path="/withdrawal" element={<Navigate to="/dashboard" replace />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
