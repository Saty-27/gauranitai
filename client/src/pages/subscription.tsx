import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pause, Play, Loader2, Sparkles, Inbox, CheckCircle2, PauseCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MainPageLayout from "@/components/layout/main-page-layout";

interface Subscription {
  id: number;
  productId: number;
  quantity: number;
  frequency: string;
  deliveryTime: string;
  status: string;
  startDate: string;
  pricePerL?: string;
  product?: { name: string; price: string; description: string };
  perDeliveryAmount?: number | string;
  monthlyAmount?: number | string;
  monthlyDeliveryCount?: number;
}

const toAmount = (value: unknown) => {
  const amount = Number.parseFloat(`${value ?? 0}`);
  return Number.isFinite(amount) ? amount : 0;
};

const getMonthlyDeliveryCount = (frequency?: string) => {
  const normalized = `${frequency || "daily"}`.toLowerCase().trim();
  if (normalized.includes("week")) return 4;
  if (normalized.includes("alternate") || normalized.includes("every other")) return 15;
  if (normalized.includes("month")) return 1;
  return 30;
};

const getDailySubscriptionCost = (subscription: any) => {
  const perDeliveryAmount = toAmount(subscription.perDeliveryAmount);
  if (perDeliveryAmount > 0) return perDeliveryAmount;

  const price = toAmount(subscription.pricePerL || subscription.product?.price);
  const quantity = toAmount(subscription.quantity || 1);
  return price * quantity;
};

const getMonthlySubscriptionCost = (subscription: any) => {
  const monthlyAmount = toAmount(subscription.monthlyAmount);
  const perDeliveryCost = getDailySubscriptionCost(subscription);

  if (monthlyAmount > perDeliveryCost) {
    return monthlyAmount;
  }

  return perDeliveryCost * getMonthlyDeliveryCount(subscription.frequency);
};

export default function SubscriptionPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch current user data
  const { data: userData } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/user", { credentials: "include" });
        return res.ok ? res.json() : null;
      } catch {
        return null;
      }
    },
  });

  // Fetch billing status for badge
  const { data: billingData } = useQuery({
    queryKey: ["billing-status"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/billing/current", { credentials: "include" });
        return res.ok ? res.json() : null;
      } catch {
        return null;
      }
    },
  });

  const { data: subscriptions = [], isLoading: isSubsLoading, refetch } = useQuery({
    queryKey: ["user-subscriptions"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/subscriptions/me", { credentials: "include", cache: "no-store" });
        const data = res.ok ? await res.json() : [];
        console.log("Subscriptions fetched:", data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Subscription fetch error:", error);
        return [];
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: customEnrollments = [], isLoading: isCustomLoading, refetch: refetchCustom } = useQuery({
    queryKey: ["user-custom-enrollments"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/user-subscriptions/me", { credentials: "include" });
        return res.ok ? res.json() : [];
      } catch {
        return [];
      }
    },
  });

  const isLoading = isSubsLoading || isCustomLoading;


  const handlePause = async (subId: number) => {
    try {
      const res = await fetch(`/api/subscriptions/${subId}/pause`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "✅ Subscription paused" });
        refetch();
      }
    } catch (e) {
      toast({ title: "❌ Error pausing subscription", variant: "destructive" });
    }
  };

  const handleResume = async (subId: number) => {
    try {
      const res = await fetch(`/api/subscriptions/${subId}/resume`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "✅ Subscription resumed" });
        refetch();
      }
    } catch (e) {
      toast({ title: "❌ Error resuming subscription", variant: "destructive" });
    }
  };

  const handleConfirmDelivery = async (subId: number) => {
    try {
      const res = await fetch(`/api/subscriptions/${subId}/confirm-delivery`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "✅ Milk delivery confirmed for today!" });
        refetch();
      } else {
        const err = await res.json();
        toast({ title: `❌ ${err.message || "Failed to confirm delivery"}`, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "❌ Error confirming delivery", variant: "destructive" });
    }
  };

  const totalMonthlyStandard = subscriptions.reduce((sum: number, s: any) => {
    if (`${s.status}`.toUpperCase() !== "ACTIVE") return sum;
    return sum + getMonthlySubscriptionCost(s);
  }, 0);

  const totalMonthlyCustom = customEnrollments.reduce((sum: number, e: any) => {
    if (e.subscriptionStatus !== "active") return sum;
    const amount = parseFloat(e.totalAmount || "0");
    const match = e.duration ? e.duration.match(/\d+/) : null;
    const days = match ? parseInt(match[0]) : 30;
    const scaled = days > 0 ? (amount / days) * 30 : amount;
    return sum + scaled;
  }, 0);

  const totalMonthly = totalMonthlyStandard + totalMonthlyCustom;

  const activeStandardCount = subscriptions.filter((s: any) => `${s.status}`.toUpperCase() === "ACTIVE").length;
  const activeCustomCount = customEnrollments.filter((e: any) => e.subscriptionStatus === "active").length;
  const activeCount = activeStandardCount + activeCustomCount;

  const totalSubscriptionsCount = subscriptions.length + customEnrollments.length;

  if (isLoading) {
    return (
      <MainPageLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
          <div style={{ textAlign: "center" }}>
            <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
            <p style={{ color: "#6b7280", fontWeight: "600" }}>Loading subscriptions...</p>
          </div>
        </div>
      </MainPageLayout>
    );
  }

  return (
    <MainPageLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-8 text-center sm:text-left">
          <button
            onClick={() => setLocation("/home")}
            className="bg-white border-none rounded-lg p-2 cursor-pointer shadow-sm hover:shadow-md transition-shadow shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 m-0 truncate flex items-center justify-center sm:justify-start gap-3">
              <Sparkles className="w-8 h-8 text-yellow-500 shrink-0" /> Hi {userData?.firstName || "there"}!
            </h1>
            <p className="text-gray-500 text-sm m-0 mt-1">Here are your milk subscriptions</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-500">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black m-0">Active</p>
            <p className="text-2xl font-black text-green-600 mt-2 m-0">{activeCount}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-orange-500">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black m-0">Monthly Cost</p>
            <p className="text-2xl font-black text-orange-600 mt-2 m-0">₹{totalMonthly.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-blue-500">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black m-0">Total</p>
            <p className="text-2xl font-black text-blue-600 mt-2 m-0">{totalSubscriptionsCount}</p>
          </div>
        </div>

        {/* Subscriptions List */}
        {subscriptions.length === 0 && customEnrollments.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 sm:p-20 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-gray-50 rounded-full">
                <Inbox size={64} className="text-gray-300" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No subscriptions yet</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Start a fresh daily milk subscription delivered right to your door. Pure. Fresh. Daily.
            </p>
            <Button 
              onClick={() => setLocation("/subscription/create")} 
              className="bg-green-600 hover:bg-green-700 text-white px-10 py-6 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Start Your First Subscription
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Standard Daily Milk Subscriptions */}
            {subscriptions.length > 0 && (
              <div>
                <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">🥛 Daily Delivery Subscriptions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {subscriptions.map((sub: any, idx: number) => (
                    <div key={idx} className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-[10px] text-green-600 uppercase tracking-widest font-black mb-1">Product</p>
                          <h3 className="text-xl font-black text-gray-900">{sub.product?.name || "Unknown"}</h3>
                          <p className="text-gray-500 text-sm mt-1">
                            {sub.quantity} L per {sub.frequency}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-1">Total Price</p>
                          <p className="text-xl font-black text-green-600">
                            ₹{getDailySubscriptionCost(sub).toLocaleString()}
                          </p>
                          <p className="text-gray-400 text-xs mt-1">per {sub.frequency}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-100">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-2">Status</p>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            sub.status === "ACTIVE" 
                              ? "bg-green-100 text-green-700" 
                              : "bg-orange-100 text-orange-700"
                          }`}>
                            {sub.status === "ACTIVE" ? <CheckCircle2 className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
                            {sub.status === "ACTIVE" ? "Active" : "Paused"}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-2">Delivery Time</p>
                          <p className="text-sm font-bold text-gray-900">{sub.deliveryTime || "Morning"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-2">Today's Delivery</p>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            sub.todayDeliveryStatus === "Delivered" || sub.todayDeliveryConfirmed
                              ? "bg-green-100 text-green-700" 
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {sub.todayDeliveryStatus || "Pending"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-1">Started</p>
                          <p className="text-xs text-gray-600">{new Date(sub.startDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        {sub.status === "ACTIVE" ? (
                          <button
                            onClick={() => handlePause(sub.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors text-sm font-bold"
                          >
                            <Pause size={16} /> Pause
                          </button>
                        ) : (
                          <button
                            onClick={() => handleResume(sub.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors text-sm font-bold"
                          >
                            <Play size={16} /> Resume
                          </button>
                        )}
                      </div>

                      {sub.status === "ACTIVE" && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          {sub.todayDeliveryConfirmed ? (
                            <Button
                              disabled
                              className="w-full bg-gray-100 text-gray-400 font-bold py-2 rounded-xl cursor-not-allowed border-none hover:bg-gray-100"
                            >
                              ✓ Today's delivery marked as received
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleConfirmDelivery(sub.id)}
                              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl transition-all shadow-md hover:shadow-lg"
                            >
                              🥛 Mark Milk Delivered Today
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Subscription Plan Enrollments */}
            {customEnrollments.length > 0 && (
              <div>
                <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">✨ Curated Plan Subscriptions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customEnrollments.map((enrollment: any, idx: number) => {
                    const isActive = enrollment.subscriptionStatus === "active";
                    return (
                      <div key={idx} className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow relative overflow-hidden">
                        {/* Top banner colors based on plan status */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${isActive ? "bg-green-500" : "bg-orange-400"}`} />

                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <p className="text-[10px] text-green-600 uppercase tracking-widest font-black mb-1">Tailored Plan</p>
                            <h3 className="text-xl font-black text-gray-900">{enrollment.plan?.title || "Plan Enrollment"}</h3>
                            <p className="text-gray-500 text-sm mt-1">
                              {enrollment.selectedQuantity} per {enrollment.selectedFrequency}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-1">Total Cost</p>
                            <p className="text-xl font-black text-green-600">₹{enrollment.totalAmount}</p>
                            <p className="text-gray-400 text-xs mt-1">for {enrollment.duration}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-100">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-2">Plan Status</p>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize ${
                              isActive ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                            }`}>
                              {enrollment.subscriptionStatus}
                            </span>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-2">Duration</p>
                            <p className="text-sm font-bold text-gray-900">{enrollment.duration}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-2">Payment</p>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize ${
                              enrollment.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {enrollment.paymentStatus}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-1">Delivery Time Slot</p>
                            <p className="text-xs font-bold text-gray-800">{enrollment.plan?.deliveryTimeSlot || "Morning"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-1">Start Date</p>
                            <p className="text-xs text-gray-600 font-bold">{new Date(enrollment.startDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Button */}
        <div className="mt-12">
          <Button
            onClick={() => setLocation("/subscription/create")}
            className="w-full sm:w-auto px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 animate-bounce"
          >
            <Plus className="w-5 h-5" /> Explore Subscription Plans
          </Button>
        </div>
      </div>
    </MainPageLayout>
  );
}
