import { Milk } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { type User } from "@shared/schema";

export default function HomePage() {
  const { user, isLoading } = useAuth() as { user?: User; isLoading: boolean };
  const { toast } = useToast();
  const { settings } = useSiteSettings();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Logout failed",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-md mx-auto p-4">
        {/* Header */}
        <div className="text-center py-10">
          <div className="mx-auto w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 transform rotate-3 overflow-hidden p-2">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.brandName} className="w-full h-full object-contain" />
            ) : (
              <Milk className="w-12 h-12 text-emerald-600" />
            )}
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{settings.brandName}</h1>
          <p className="text-emerald-600 font-bold uppercase tracking-widest text-xs mt-2">Premium Dairy Delivery</p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Profile</h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Phone Number</p>
              <p className="text-lg font-semibold text-gray-900">
                {user?.phone || "Not available"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="text-lg font-semibold text-gray-900">
                {user?.name || "Not set"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-lg font-semibold text-gray-900">
                {user?.email || "Not set"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {user?.role || "Customer"}
              </p>
            </div>
          </div>
        </div>

        {/* Features Coming Soon */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Features</h2>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-700">✅ Shop (Coming Soon)</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-700">✅ Milk Subscription (Coming Soon)</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-700">✅ Orders (Coming Soon)</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-700">✅ Wallet (Coming Soon)</p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-12 text-base text-red-600 border-red-600 hover:bg-red-50"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
