import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import MainPageLayout from "@/components/layout/main-page-layout";
import logoImage from "@assets/gauranitai_logo.png";
import { Eye, EyeOff, Camera, Phone as PhoneIcon, MapPin, Loader2, UserPlus, LogIn, X, Key } from "lucide-react";


type AuthMode = "login" | "signup";

export default function LoginPage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordSignup, setShowPasswordSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { settings } = useSiteSettings();
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);


  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter email and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "USER_NOT_FOUND") {
          toast({
            title: "Account not found",
            description: data.message,
            variant: "destructive",
          });
          setMode("signup");
        } else {
          toast({
            title: "Login failed",
            description: data.message || "Invalid credentials",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Success!",
        description: "Logged in successfully",
      });

      // Clear cache and redirect to home page
      queryClient.clear();
      window.location.href = "/home";
    } catch (error) {
      toast({
        title: "Error",
        description: "Connection failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter email and password",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("phone", phone);
      formData.append("address", address);
      if (profilePhoto) {
        formData.append("profilePhoto", profilePhoto);
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "USER_EXISTS") {
          toast({
            title: "Account exists",
            description: data.message,
            variant: "destructive",
          });
          setMode("login");
        } else {
          toast({
            title: "Signup failed",
            description: data.message || "Something went wrong",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Success!",
        description: "Account created. Welcome!",
      });

      // Clear cache and redirect to home page
      queryClient.clear();
      window.location.href = "/home";
    } catch (error) {
      toast({
        title: "Error",
        description: "Connection failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      if (res.ok) {
        setForgotSubmitted(true);
        toast({
          title: "Request Sent",
          description: "Your password reset request has been sent to admin.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit request. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to contact server",
        variant: "destructive",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <MainPageLayout>
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg backdrop-blur-sm border border-gray-100 my-8">
          {/* Header */}
          <div className="text-center mb-8">
            <img src={settings.logoUrl || logoImage} className="w-20 h-20 object-contain mb-4 mx-auto" />
            <h1 className="text-3xl font-bold text-gray-900">{settings.brandName}</h1>
            <p className="text-gray-500 text-sm mt-1">Pure. Fresh. Daily.</p>
          </div>

          {/* Tab Buttons */}
          <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setFirstName("");
                setLastName("");
              }}
              className={`flex-1 py-2 rounded-md font-semibold transition-all ${
                mode === "login"
                  ? "bg-green-600 text-white"
                  : "bg-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-md font-semibold transition-all ${
                mode === "signup"
                  ? "bg-green-600 text-white"
                  : "bg-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* FORM CONTENT */}
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-12 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="h-12 text-base pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end -mt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs text-green-600 hover:text-green-700 font-semibold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-base flex items-center justify-center gap-2 rounded-xl"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                {loading ? "Logging in..." : "Login"}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-green-600 font-semibold hover:underline"
                >
                  Sign up here
                </button>
              </p>
            </form>
          ) : (
            /* SIGNUP FORM */
            <form onSubmit={handleSignup} className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
              {/* Profile Photo Preview & Upload */}
              <div className="text-center space-y-3">
                {photoPreview ? (
                  <div className="flex justify-center">
                    <img
                      src={photoPreview}
                      alt="Profile preview"
                      className="w-24 h-24 rounded-full object-cover border-3 border-green-600 shadow-md"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                    <Camera className="w-10 h-10 text-green-600" />
                  </div>
                )}
                <label className="block">
                  <span className="cursor-pointer px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-semibold text-sm inline-block">
                    {photoPreview ? "Change Photo" : "Upload Photo (Optional)"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    disabled={loading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Name Fields - Two Column */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5 uppercase tracking-wide">
                    First Name
                  </label>
                   <Input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                    className="h-11 text-base border-2 border-gray-200 focus:border-green-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5 uppercase tracking-wide">
                    Last Name
                  </label>
                   <Input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                    className="h-11 text-base border-2 border-gray-200 focus:border-green-600"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5 uppercase tracking-wide">
                  Email Address
                </label>
                 <Input
                   type="email"
                   placeholder="Email Address"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   disabled={loading}
                   className="h-11 text-base border-2 border-gray-200 focus:border-green-600"
                 />
              </div>

              {/* Phone Number */}
              <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <PhoneIcon className="w-4 h-4 text-green-600" />
                    <label className="block text-xs font-bold text-gray-800 uppercase tracking-wide">
                      Phone Number
                    </label>
                  </div>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  className="h-11 text-base border-2 border-gray-200 focus:border-green-600"
                />
              </div>

              {/* Address */}
              <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <label className="block text-xs font-bold text-gray-800 uppercase tracking-wide">
                      Delivery Address
                    </label>
                  </div>
                <textarea
                  placeholder="123 Main Street, City, State 12345"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={loading}
                  rows={2}
                  className="w-full px-3 py-2 text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 resize-none"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPasswordSignup ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="h-11 text-base border-2 border-gray-200 focus:border-green-600 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordSignup(!showPasswordSignup)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPasswordSignup ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-base rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                {loading ? "Creating Account..." : "Create Account"}
              </Button>

              <p className="text-center text-sm text-gray-600 pb-2">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setFirstName("");
                    setLastName("");
                    setPhone("");
                    setAddress("");
                    setPhotoPreview("");
                    setProfilePhoto(null);
                  }}
                  className="text-green-600 font-bold hover:text-green-700 hover:underline"
                >
                  Sign in here
                </button>
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-gray-150 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Forgot Password?</h3>
              <button
                type="button"
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setForgotSubmitted(false);
                  setForgotEmail("");
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!forgotSubmitted ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Enter your registered email address below. We will submit a password help request to the administrator, who can reset your password or email you a recovery link/temporary login details.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">
                    Registered Email
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={forgotLoading}
                    className="h-11"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={forgotLoading || !forgotEmail.trim()}
                  className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  {forgotLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Request Password Help
                </Button>
              </form>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <Key className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-gray-800 text-sm">Help Request Submitted</h4>
                <p className="text-xs text-gray-500 px-4 leading-relaxed">
                  Your password reset request has been sent to admin. You will receive help soon.
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setForgotSubmitted(false);
                    setForgotEmail("");
                  }}
                  className="w-full h-10 mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </MainPageLayout>
  );
}
