import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import logoImage from "@assets/gauranitai_logo.png";
import { Calendar, Sparkles, Check, Loader2, ArrowLeft, Clock, ShoppingBag, CreditCard, User, Phone, Mail, MapPin } from "lucide-react";
import MainPageLayout from "@/components/layout/main-page-layout";

export default function SubscriptionCreatePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth() as any;
  const { settings } = useSiteSettings();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal checkout form state
  const [checkoutForm, setCheckoutForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    address: "",
    startDate: "",
    duration: "",
    paymentMethod: "cash_on_delivery",
  });

  // Fetch all active plans from the server
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["active-custom-plans"],
    queryFn: async () => {
      const res = await fetch("/api/custom-subscriptions", { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      // Filter active plans on the front-end just to be doubly safe
      return data.filter((p: any) => p.status === "active");
    },
  });

  // Pre-fill user data when modal opens or user changes
  useEffect(() => {
    if (user) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setCheckoutForm((prev) => ({
        ...prev,
        customerName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        startDate: tomorrow.toISOString().split("T")[0],
      }));
    }
  }, [user, selectedPlan]);

  // Handle plan select
  const handleSubscribeClick = (plan: any) => {
    if (!isAuthenticated) {
      toast({
        title: "🔒 Authentication Required",
        description: "Please log in to register your daily subscription.",
        variant: "destructive",
      });
      setLocation("/auth/login");
      return;
    }
    
    setSelectedPlan(plan);
    const durationOpts = Array.isArray(plan.durationOptions) ? plan.durationOptions : [];
    const defaultDuration = durationOpts.length > 0 ? durationOpts[0] : "30 days";
    
    setCheckoutForm((prev) => ({
      ...prev,
      duration: defaultDuration,
    }));
    
    setIsModalOpen(true);
  };

  // Mutation to purchase subscription
  const enrollMutation = useMutation({
    mutationFn: async (enrollData: any) => {
      const res = await fetch("/api/user-subscriptions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enrollData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to finalize subscription");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["user-custom-enrollments"] });
      toast({
        title: "🎉 Subscription Registered Successfully!",
        description: "Our agent will deliver A1 fresh dairy right to your door daily.",
      });
      setIsModalOpen(false);
      setLocation("/subscription");
    },
    onError: (error: any) => {
      toast({
        title: `❌ Registration Failed`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Parse days from duration string (e.g. "30 days" -> 30, "7" -> 7)
  const parseDays = (dur: string) => {
    if (!dur) return 30;
    const match = dur.match(/\d+/);
    return match ? parseInt(match[0]) : 30;
  };

  // Compute final checkout amount
  const getComputedTotal = () => {
    if (!selectedPlan) return 0;
    const price = parseFloat(selectedPlan.price || "0");
    const days = parseDays(checkoutForm.duration);
    
    // Check frequency to scale price
    let multiplier = 1;
    const freq = `${selectedPlan.frequency || "Daily"}`.toLowerCase();
    if (freq.includes("alternate")) {
      multiplier = 0.5; // alternate days
    } else if (freq.includes("weekly")) {
      multiplier = 1 / 7; // once a week
    } else if (freq.includes("monthly")) {
      multiplier = 1 / 30; // once a month
    }
    
    return Math.round(price * days * multiplier);
  };

  const handleConfirmEnrollment = () => {
    if (!checkoutForm.customerName || !checkoutForm.phone || !checkoutForm.address) {
      toast({
        title: "⚠️ Incomplete Information",
        description: "Please fill out customer name, contact phone, and delivery address.",
        variant: "destructive",
      });
      return;
    }

    enrollMutation.mutate({
      subscriptionPlanId: selectedPlan.id,
      customerName: checkoutForm.customerName,
      email: checkoutForm.email,
      phone: checkoutForm.phone,
      address: checkoutForm.address,
      selectedQuantity: selectedPlan.quantity,
      selectedFrequency: selectedPlan.frequency,
      startDate: checkoutForm.startDate,
      duration: checkoutForm.duration,
      totalAmount: getComputedTotal(),
    });
  };

  return (
    <MainPageLayout>
      <div className="bg-gradient-to-br from-green-50/50 via-white to-blue-50/30 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Back navigation */}
        <div className="mb-6 flex justify-between items-center">
          <Button
            onClick={() => setLocation("/subscription")}
            variant="ghost"
            className="flex items-center gap-2 hover:bg-green-50 hover:text-green-700 font-bold rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md p-1 border border-green-50">
            <img src={settings.logoUrl || logoImage} alt={settings.brandName} className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Hero title */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-green-100 text-green-700 mb-4 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Premium Curated Plans
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none m-0">
            Explore Daily <span className="text-green-600">Subscriptions</span>
          </h1>
          <p className="text-gray-500 text-base md:text-lg mt-3">
            Choose a premium, custom-tailored subscription option and enjoy pure, fresh dairy delivered straight to your doorstep daily.
          </p>
        </div>

        {/* Plan Cards Grid */}
        {plansLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
            <p className="text-gray-500 font-bold">Loading tailored plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No active plans currently</h3>
            <p className="text-gray-500">
              Our admins are crafting beautiful custom subscription options for you right now. Please check back shortly!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan: any) => {
              const hasDiscount = plan.originalPrice && parseFloat(plan.originalPrice) > parseFloat(plan.price);
              const discountPercent = hasDiscount 
                ? Math.round(((parseFloat(plan.originalPrice) - parseFloat(plan.price)) / parseFloat(plan.originalPrice)) * 100) 
                : 0;

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col relative ${
                    plan.isFeatured ? "ring-2 ring-green-600 ring-offset-2" : ""
                  }`}
                >
                  {/* Featured badge */}
                  {plan.isFeatured && (
                    <span className="absolute top-4 left-4 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md z-10 flex items-center gap-1">
                      ⭐ Featured Plan
                    </span>
                  )}

                  {/* Discount percentage tag */}
                  {hasDiscount && (
                    <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md z-10">
                      Save {discountPercent}%
                    </span>
                  )}

                  {/* Image header */}
                  <div className="relative h-56 bg-gray-100 overflow-hidden shrink-0">
                    <img
                      src={plan.image || "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600"}
                      alt={plan.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <span className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-black text-gray-900 shadow-sm flex items-center gap-1">
                        📦 {plan.quantity} per {plan.frequency}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-black text-gray-950 m-0 line-clamp-1">{plan.title}</h3>
                    {plan.customProductName && (
                      <p className="text-green-600 text-xs font-bold uppercase tracking-widest mt-1 mb-0">
                        {plan.customProductName}
                      </p>
                    )}
                    
                    <p className="text-gray-500 text-sm mt-3 mb-0 line-clamp-2 leading-relaxed flex-1">
                      {plan.shortDescription || "Pure daily essential dairy products delivered fresh every morning."}
                    </p>

                    {/* Price breakdown */}
                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-baseline gap-2 shrink-0">
                      <span className="text-3xl font-black text-green-600">₹{plan.price}</span>
                      <span className="text-xs text-gray-400 font-bold">/ {plan.frequency}</span>
                      {hasDiscount && (
                        <span className="text-sm text-gray-400 line-through ml-auto font-medium">
                          ₹{plan.originalPrice}
                        </span>
                      )}
                    </div>

                    {/* Benefits bullet points */}
                    {Array.isArray(plan.benefits) && plan.benefits.length > 0 && (
                      <div className="mt-6 space-y-2 shrink-0">
                        {plan.benefits.slice(0, 3).map((benefit: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-xs font-bold text-gray-700">
                            <Check className="w-4 h-4 text-green-600 shrink-0" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CTA Button */}
                    <Button
                      onClick={() => handleSubscribeClick(plan)}
                      className={`w-full mt-6 py-5 rounded-2xl font-black text-sm transition-all shadow-md hover:shadow-lg ${
                        plan.isFeatured
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-950 hover:bg-gray-800 text-white"
                      }`}
                    >
                      🥛 Subscribe Now
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==========================================
          CHECKOUT CONFIRMATION MODAL
          ========================================== */}
      {isModalOpen && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all my-8 flex flex-col">
            {/* Modal Header */}
            <div className="bg-green-600 px-6 py-5 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                <h3 className="text-lg font-black m-0">Confirm Subscription Enrollment</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white border-none bg-none font-bold text-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              {/* Selected Plan Summary Card */}
              <div className="flex gap-4 p-4 bg-green-50/50 rounded-2xl border border-green-100">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-white shadow-sm shrink-0">
                  <img
                    src={selectedPlan.image || "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300"}
                    alt={selectedPlan.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-base font-black text-gray-900 m-0">{selectedPlan.title}</h4>
                  <p className="text-xs text-green-600 font-bold uppercase tracking-wider mt-0.5 mb-1">
                    {selectedPlan.customProductName || "Dairy Subscription"}
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-black text-green-700">₹{selectedPlan.price}</span>
                    <span className="text-xs text-gray-400 font-semibold">per {selectedPlan.frequency}</span>
                    <span className="bg-white/80 px-2 py-0.5 rounded text-[10px] font-bold text-gray-600 border border-gray-100 ml-2">
                      {selectedPlan.quantity}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Details Form */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-2 uppercase tracking-wider">
                  🚚 Delivery Address & Contact
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest display-block mb-1">Customer Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        value={checkoutForm.customerName}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, customerName: e.target.value })}
                        className="pl-9 h-11 rounded-xl text-sm"
                        placeholder="Your Name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest display-block mb-1">Contact Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        value={checkoutForm.phone}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                        className="pl-9 h-11 rounded-xl text-sm"
                        placeholder="Your Phone Number"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest display-block mb-1">Confirm Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      value={checkoutForm.email}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                      className="pl-9 h-11 rounded-xl text-sm"
                      placeholder="Your Email"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest display-block mb-1">Delivery Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      rows={2}
                      value={checkoutForm.address}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="Your complete home or office address..."
                    />
                  </div>
                </div>
              </div>

              {/* Preferences Form */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-2 uppercase tracking-wider">
                  ⚙️ Subscription Options
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div>
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest display-block mb-1">Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                      <Input
                        type="date"
                        value={checkoutForm.startDate}
                        min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, startDate: e.target.value })}
                        className="pl-9 h-11 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* Duration Options */}
                  <div>
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest display-block mb-1">Subscription Duration</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={checkoutForm.duration}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, duration: e.target.value })}
                        className="w-full pl-9 pr-4 h-11 border border-gray-200 rounded-xl text-sm bg-white"
                      >
                        {Array.isArray(selectedPlan.durationOptions) && selectedPlan.durationOptions.length > 0 ? (
                          selectedPlan.durationOptions.map((opt: string, idx: number) => (
                            <option key={idx} value={opt}>
                              {opt}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="7 days">7 days (Trial)</option>
                            <option value="15 days">15 days (Half month)</option>
                            <option value="30 days">30 days (Full month)</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Payment Option */}
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest display-block mb-1">Payment Method</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setCheckoutForm({ ...checkoutForm, paymentMethod: "cash_on_delivery" })}
                      className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl text-sm font-bold transition-all ${
                        checkoutForm.paymentMethod === "cash_on_delivery"
                          ? "border-green-600 bg-green-50 text-green-700"
                          : "border-gray-200 hover:border-green-100 text-gray-600 bg-white"
                      }`}
                    >
                      💵 Cash on Delivery
                    </button>
                    <button
                      onClick={() => {
                        toast({ title: "💳 Wallet Balance selected", description: "Subscriptions will be billed monthly against your active wallet balance." });
                        setCheckoutForm({ ...checkoutForm, paymentMethod: "wallet" });
                      }}
                      className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl text-sm font-bold transition-all ${
                        checkoutForm.paymentMethod === "wallet"
                          ? "border-green-600 bg-green-50 text-green-700"
                          : "border-gray-200 hover:border-green-100 text-gray-600 bg-white"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" /> Wallet Balance
                    </button>
                  </div>
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100">
                <div>
                  <span className="text-xs text-gray-500 font-bold">Estimated Total Amount ({checkoutForm.duration})</span>
                  <p className="text-[10px] text-gray-400 mt-0.5 mb-0">Live calculation based on duration & price</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-green-600">₹{getComputedTotal()}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-4 shrink-0">
              <Button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-6 bg-gray-400 hover:bg-gray-500 text-white rounded-2xl font-bold transition-all"
              >
                ✕ Cancel Checkout
              </Button>
              <Button
                onClick={handleConfirmEnrollment}
                disabled={enrollMutation.isPending}
                className="flex-1 py-6 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black shadow-lg hover:shadow-xl transition-all"
              >
                {enrollMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Finalizing...
                  </span>
                ) : (
                  "✓ Confirm Enrollment"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </MainPageLayout>
  );
}
