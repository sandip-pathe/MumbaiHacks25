import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import { GlassCard } from "../components/ui/GlassCard";
import { api } from "../lib/api-client";
import {
  ArrowRight,
  Mail,
  Lock,
  User,
  Building2,
  ChevronDown,
  ArrowLeft,
  Briefcase,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";

// --- Types & Constants ---

const COMPANY_TYPES = [
  "Payment Aggregators",
  "Payment Gateways",
  "Lending / BNPL",
  "InsurTech",
  "WealthTech / Investment Platforms",
  "NeoBanks",
  "Fraud & Risk Intelligence",
  "RegTech",
  "Forex & Cross-Border Payments",
  "Crypto & Digital Assets",
  "Microfinance / NBFC",
  "Trading & Brokerage Platforms",
  "Banking Infrastructure / API Banking",
  "P2P Lending",
  "Digital KYC / Identity Verification",
];

interface AuthProps {
  onNavigate: (view: "LANDING" | "LOGIN" | "REGISTER" | "ONBOARDING") => void;
}

// --- Internal Toast Component ---
interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 right-6 z-50 animate-fade-in-up flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${
        type === "success"
          ? "bg-success/10 border-success/20 text-success"
          : "bg-danger/10 border-danger/20 text-danger"
      }`}
    >
      {type === "success" ? (
        <CheckCircle size={18} />
      ) : (
        <AlertCircle size={18} />
      )}
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
};

// --- Auth Landing Page ---

export const AuthLanding: React.FC<AuthProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-bgMain p-6">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
      <div
        className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent2/10 rounded-full blur-[120px] animate-pulse-slow"
        style={{ animationDelay: "2s" }}
      />

      <div className="max-w-md w-full relative z-10 animate-fade-in-up">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-accent2">
            Welcome
          </h1>
          <p className="text-accent3 text-lg">
            Sign in if you're an existing user or register to get started.
          </p>
        </div>

        <GlassCard className="p-8 space-y-6">
          <Button
            onClick={() => onNavigate("LOGIN")}
            className="w-full h-14 text-lg"
            variant="primary"
          >
            Sign In
          </Button>

          <Button
            onClick={() => onNavigate("REGISTER")}
            className="w-full h-14 text-lg"
            variant="secondary"
          >
            Register
          </Button>
        </GlassCard>
      </div>
    </div>
  );
};

// --- Login Page ---

export const Login: React.FC<AuthProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.login(formData.email, formData.password);

      if (response.error || !response.data) {
        throw new Error(response.error || "Login failed");
      }

      const { access_token, user } = response.data;

      // Store token using API client
      api.setToken(access_token);
      localStorage.setItem("user", JSON.stringify(user));

      setToast({ message: "Signed in successfully.", type: "success" });
      setTimeout(() => {
        onNavigate("ONBOARDING");
      }, 1000);
    } catch (error: any) {
      setToast({ message: error.message || "Login failed", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-bgMain p-6">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-md w-full relative z-10 animate-fade-in-up">
        <button
          onClick={() => onNavigate("LANDING")}
          className="mb-8 flex items-center gap-2 text-accent3 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <GlassCard className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-heading font-bold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-accent3">
              Enter your credentials to access the dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-accent3 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-accent3"
                  size={18}
                />
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3.5 text-white placeholder:text-gray-600 focus:border-primary/50 focus:bg-white/10 focus:outline-none transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-accent3 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-accent3"
                  size={18}
                />
                <input
                  type="password"
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3.5 text-white placeholder:text-gray-600 focus:border-primary/50 focus:bg-white/10 focus:outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <Button className="w-full" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-accent3">
            Don't have an account?{" "}
            <button
              onClick={() => onNavigate("REGISTER")}
              className="text-white font-semibold hover:underline"
            >
              Register
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

// --- Register Page ---

export const Register: React.FC<AuthProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companyType: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(password))
      return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(password))
      return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(password))
      return "Password must contain at least one number.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      return "Password must contain at least one special character.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setToast({ message: passwordError, type: "error" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setToast({ message: "Passwords do not match.", type: "error" });
      return;
    }

    setLoading(true);

    try {
      const response = await api.register({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        company_name: formData.companyName,
        company_type: formData.companyType,
      });

      if (response.error || !response.data) {
        throw new Error(response.error || "Registration failed");
      }

      const { access_token, user } = response.data;

      // Store token using API client
      api.setToken(access_token);
      localStorage.setItem("user", JSON.stringify(user));

      setToast({ message: "Account created successfully!", type: "success" });
      setTimeout(() => {
        onNavigate("ONBOARDING");
      }, 1000);
    } catch (error: any) {
      setToast({
        message: error.message || "Registration failed",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-bgMain p-6 py-12">
      <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-accent1/5 to-transparent pointer-events-none" />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-xl w-full relative z-10 animate-fade-in-up">
        <button
          onClick={() => onNavigate("LANDING")}
          className="mb-6 flex items-center gap-2 text-accent3 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <GlassCard className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-heading font-bold text-white mb-2">
              Create Account
            </h2>
            <p className="text-accent3">Tell us about you and your company.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-accent3 uppercase tracking-wider">
                  First Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-accent3"
                    size={18}
                  />
                  <input
                    type="text"
                    required
                    name="firstName"
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-accent1/50 focus:outline-none transition-all"
                    placeholder="Jane"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-accent3 uppercase tracking-wider">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  name="lastName"
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-accent1/50 focus:outline-none transition-all"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-accent3 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-accent3"
                  size={18}
                />
                <input
                  type="email"
                  required
                  name="email"
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-accent1/50 focus:outline-none transition-all"
                  placeholder="jane@fintech.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-accent3 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-accent3"
                    size={18}
                  />
                  <input
                    type="password"
                    required
                    name="password"
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-accent1/50 focus:outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-accent3 uppercase tracking-wider">
                  Confirm
                </label>
                <input
                  type="password"
                  required
                  name="confirmPassword"
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-accent1/50 focus:outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Password Requirements Hint */}
            <div className="text-[10px] text-accent3 space-y-1 pl-1">
              <p>• Min 8 chars, 1 uppercase, 1 lowercase</p>
              <p>• 1 number, 1 special character</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-accent3 uppercase tracking-wider">
                Company Name
              </label>
              <div className="relative">
                <Building2
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-accent3"
                  size={18}
                />
                <input
                  type="text"
                  required
                  name="companyName"
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-accent1/50 focus:outline-none transition-all"
                  placeholder="Acme Financial"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-accent3 uppercase tracking-wider">
                Company Type
              </label>
              <div className="relative">
                <Briefcase
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-accent3"
                  size={18}
                />
                <select
                  required
                  name="companyType"
                  value={formData.companyType}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-accent1/50 focus:outline-none transition-all appearance-none"
                >
                  <option value="" className="bg-gray-900">
                    Select type...
                  </option>
                  <option value="startup" className="bg-gray-900">
                    Startup
                  </option>
                  <option value="smb" className="bg-gray-900">
                    Small Business
                  </option>
                  <option value="enterprise" className="bg-gray-900">
                    Enterprise
                  </option>
                  <option value="agency" className="bg-gray-900">
                    Agency
                  </option>
                </select>
              </div>
            </div>

            <Button className="w-full mt-4" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-accent3">
            Already have an account?{" "}
            <button
              onClick={() => onNavigate("LOGIN")}
              className="text-white font-semibold hover:underline"
            >
              Sign in
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
