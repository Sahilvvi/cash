import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn, signUp, isLoading: authLoading } = useAuth();
  const mode = searchParams.get("mode") || "login";
  const referralCode = searchParams.get("ref") || "";
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    password: "", 
    confirmPassword: "",
    referralCode: referralCode,
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    
    const { error } = await signIn(loginData.email, loginData.password);
    
    if (error) {
      toast.error(error.message || "Login failed");
      setIsLoading(false);
      return;
    }
    
    toast.success("Login successful!", {
      description: "Welcome back to Cashback!",
    });
    
    setIsLoading(false);
    navigate("/dashboard");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerData.name || !registerData.email || !registerData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (registerData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await signUp(
      registerData.email, 
      registerData.password, 
      registerData.name,
      registerData.referralCode
    );
    
    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("This email is already registered. Please login instead.");
      } else {
        toast.error(error.message || "Registration failed");
      }
      setIsLoading(false);
      return;
    }
    
    toast.success("Registration successful!", {
      description: "Welcome to Cashback! Start earning cashback now.",
    });
    
    setIsLoading(false);
    navigate("/dashboard");
  };

  const benefits = [
    "Earn cashback on 300+ stores",
    "Exclusive deals & coupons",
    "Refer friends & earn bonus",
    "Withdraw to bank or UPI",
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Benefits */}
      <div className="hidden lg:flex lg:w-1/2 steps-gradient p-12 flex-col justify-center">
        <Link to="/" className="mb-8">
          <span className="text-3xl font-bold font-heading text-secondary-foreground">
            Cashback
          </span>
        </Link>
        
        <h1 className="text-4xl font-bold font-heading text-secondary-foreground mb-4">
          Start Saving Today
        </h1>
        <p className="text-secondary-foreground/80 text-lg mb-8">
          Join millions of smart shoppers who earn cashback on every purchase.
        </p>
        
        <ul className="space-y-4">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-center gap-3 text-secondary-foreground">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
        
        <div className="mt-12 pt-8 border-t border-secondary-foreground/20">
          <p className="text-secondary-foreground/60 text-sm">
            Trusted by 10 Lakh+ users | ₹50Cr+ Cashback Paid
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden block mb-8 text-center">
            <span className="text-2xl font-bold font-heading text-foreground">
              Cashback
            </span>
          </Link>

          {/* Tab Switcher */}
          <div className="flex bg-muted rounded-lg p-1 mb-8">
            <Link
              to="/auth?mode=login"
              className={`flex-1 py-2.5 text-center rounded-md font-medium transition-all ${
                mode === "login" 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Login
            </Link>
            <Link
              to={`/auth?mode=register${referralCode ? `&ref=${referralCode}` : ""}`}
              className={`flex-1 py-2.5 text-center rounded-md font-medium transition-all ${
                mode === "register" 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Register
            </Link>
          </div>

          {mode === "login" ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded border-input" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password (min 6 chars)"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Referral Code (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="Enter referral code"
                  value={registerData.referralCode}
                  onChange={(e) => setRegisterData({ ...registerData, referralCode: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="flex items-start gap-2">
                <input type="checkbox" className="rounded border-input mt-1" required />
                <span className="text-sm text-muted-foreground">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary hover:underline">Terms & Conditions</Link>
                  {" "}and{" "}
                  <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </span>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <Link to="/auth?mode=register" className="text-primary font-medium hover:underline">
                  Sign up free
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link to="/auth?mode=login" className="text-primary font-medium hover:underline">
                  Login
                </Link>
              </>
            )}
          </p>

          {mode === "login" && (
            <div className="mt-4 pt-4 border-t border-border">
              <Link 
                to="/admin" 
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Lock className="w-4 h-4" />
                Admin Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
