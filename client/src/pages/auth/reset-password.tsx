import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import MainPageLayout from "@/components/layout/main-page-layout";
import logoImage from "@assets/gauranitai_logo.png";
import { Eye, EyeOff, Loader2, Key, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { settings } = useSiteSettings();

  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Extract token from query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
    } else {
      toast({
        title: "Invalid Link",
        description: "No password reset token was found in the link.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast({
        title: "Error",
        description: "No reset token found. Please request a new link.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        toast({
          title: "Success!",
          description: "Your password has been reset successfully.",
        });
      } else {
        toast({
          title: "Reset Failed",
          description: data.message || "Failed to reset password. The link may have expired.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Connection failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainPageLayout>
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-100 my-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <img src={settings.logoUrl || logoImage} className="w-16 h-16 object-contain mb-4 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
            <p className="text-gray-500 text-xs mt-1">Set a secure password for your account</p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5 uppercase tracking-wide">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading || !token}
                    className="h-11 border-2 border-gray-200 focus:border-green-600 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading || !token}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5 uppercase tracking-wide">
                  Confirm Password
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || !token}
                  className="h-11 border-2 border-gray-200 focus:border-green-600"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !token || !newPassword || !confirmPassword}
                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Reset Password
              </Button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-gray-800 text-base">Password Updated</h3>
                <p className="text-xs text-gray-500 px-4 leading-relaxed">
                  Your password has been successfully updated. You can now log in using your new credentials.
                </p>
              </div>
              <Button
                onClick={() => setLocation("/auth/login")}
                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl"
              >
                Back to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainPageLayout>
  );
}
