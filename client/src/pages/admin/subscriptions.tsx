import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
import ImageUploader from "@/components/admin/image-uploader";
import { AlertTriangle, Star, Trash2, Plus, Pencil, Check, X, ShieldAlert, Sparkles, Image, CheckCircle, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function SubscriptionsAdmin() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [activeTab, setActiveTab] = useState("subscriptions");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    customerId: "",
    productId: "",
    quantity: "",
    frequency: "daily",
    pricePerL: "",
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ==========================================
  // STATE VARIABLES FOR CUSTOM PLANS & ENROLLMENTS
  // ==========================================
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [customPlanFormData, setCustomPlanFormData] = useState({
    title: "",
    productId: "",
    customProductName: "",
    image: "",
    quantity: "",
    unitType: "Liter",
    price: "",
    originalPrice: "",
    frequency: "Daily",
    shortDescription: "",
    detailedDescription: "",
    deliveryTimeSlot: "",
    status: "active",
    isFeatured: false,
    sortOrder: "0",
  });
  const [benefitsList, setBenefitsList] = useState<string[]>([]);
  const [benefitInput, setBenefitInput] = useState("");
  const [durationOptionsList, setDurationOptionsList] = useState<string[]>(["7 days", "15 days", "30 days"]);
  const [durationInput, setDurationInput] = useState("");

  const [isPlanDeleteOpen, setIsPlanDeleteOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<number | null>(null);

  // ==========================================
  // QUERIES FOR CUSTOM PLANS & ENROLLMENTS
  // ==========================================
  const { data: customPlans = [], isLoading: isPlansLoading, refetch: refetchPlans } = useQuery({
    queryKey: ["admin-custom-plans"],
    queryFn: async () => {
      const res = await fetch("/api/custom-subscriptions", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
  });

  const { data: enrollments = [], isLoading: isEnrollmentsLoading, refetch: refetchEnrollments } = useQuery({
    queryKey: ["admin-enrollments"],
    queryFn: async () => {
      const res = await fetch("/api/user-subscriptions", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
  });

  // ==========================================
  // MUTATIONS FOR CUSTOM PLANS
  // ==========================================
  const savePlanMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingPlanId
        ? `/api/custom-subscriptions/${editingPlanId}`
        : "/api/custom-subscriptions";
      const method = editingPlanId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save plan");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-custom-plans"] });
      toast({ title: editingPlanId ? "✅ Plan updated successfully!" : "✅ Plan created successfully!" });
      setEditingPlanId(null);
      resetPlanForm();
      refetchPlans();
    },
    onError: (error: any) => {
      toast({ title: `❌ ${error.message}`, variant: "destructive" });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/custom-subscriptions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete plan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-custom-plans"] });
      toast({ title: "✅ Plan deleted successfully!" });
      refetchPlans();
    },
    onError: (error: any) => {
      toast({ title: `❌ ${error.message}`, variant: "destructive" });
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: number; isFeatured: boolean }) => {
      const res = await fetch(`/api/custom-subscriptions/${id}/featured`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured }),
      });
      if (!res.ok) throw new Error("Failed to toggle featured status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-custom-plans"] });
      toast({ title: "✅ Plan featured status updated!" });
      refetchPlans();
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/custom-subscriptions/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to toggle status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-custom-plans"] });
      toast({ title: "✅ Plan status updated!" });
      refetchPlans();
    },
  });

  // ==========================================
  // MUTATIONS FOR ENROLLMENTS
  // ==========================================
  const updateEnrollmentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/user-subscriptions/${id}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      toast({ title: "✅ Subscription status updated!" });
      refetchEnrollments();
    },
    onError: (error: any) => {
      toast({ title: `❌ ${error.message}`, variant: "destructive" });
    },
  });

  const updateEnrollmentPaymentMutation = useMutation({
    mutationFn: async ({ id, paymentStatus }: { id: number; paymentStatus: string }) => {
      const res = await fetch(`/api/user-subscriptions/${id}/payment`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      });
      if (!res.ok) throw new Error("Failed to update payment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      toast({ title: "✅ Payment status updated!" });
      refetchEnrollments();
    },
    onError: (error: any) => {
      toast({ title: `❌ ${error.message}`, variant: "destructive" });
    },
  });

  // ==========================================
  // HELPERS FOR CUSTOM PLANS
  // ==========================================
  const resetPlanForm = () => {
    setCustomPlanFormData({
      title: "",
      productId: "",
      customProductName: "",
      image: "",
      quantity: "",
      unitType: "Liter",
      price: "",
      originalPrice: "",
      frequency: "Daily",
      shortDescription: "",
      detailedDescription: "",
      deliveryTimeSlot: "",
      status: "active",
      isFeatured: false,
      sortOrder: "0",
    });
    setBenefitsList([]);
    setDurationOptionsList(["7 days", "15 days", "30 days"]);
  };

  const handleEditPlanClick = (plan: any) => {
    setEditingPlanId(plan.id);
    setCustomPlanFormData({
      title: plan.title || "",
      productId: plan.productId ? plan.productId.toString() : "",
      customProductName: plan.customProductName || "",
      image: plan.image || "",
      quantity: plan.quantity || "",
      unitType: plan.unitType || "Liter",
      price: plan.price ? plan.price.toString() : "",
      originalPrice: plan.originalPrice ? plan.originalPrice.toString() : "",
      frequency: plan.frequency || "Daily",
      shortDescription: plan.shortDescription || "",
      detailedDescription: plan.detailedDescription || "",
      deliveryTimeSlot: plan.deliveryTimeSlot || "",
      status: plan.status || "active",
      isFeatured: !!plan.isFeatured,
      sortOrder: plan.sortOrder ? plan.sortOrder.toString() : "0",
    });
    setBenefitsList(Array.isArray(plan.benefits) ? plan.benefits : []);
    setDurationOptionsList(Array.isArray(plan.durationOptions) ? plan.durationOptions : ["7 days", "15 days", "30 days"]);
  };

  const handleAdminProductSelect = (prodId: string) => {
    const selected = products.find((p: any) => p.id.toString() === prodId);
    if (selected) {
      setCustomPlanFormData((prev) => ({
        ...prev,
        productId: prodId,
        title: selected.name,
        price: selected.price ? selected.price.toString() : "",
        unitType: selected.unit || "Liter",
        image: selected.imageUrl || "",
      }));
    } else {
      setCustomPlanFormData((prev) => ({
        ...prev,
        productId: "",
      }));
    }
  };


  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const { data: deliveries = [], refetch: refetchDeliveries } = useQuery({
    queryKey: ["admin-deliveries", selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/admin/subscriptions/deliveries?date=${selectedDate}`, {
        credentials: "include",
      });
      return res.ok ? res.json() : [];
    },
  });

  const { data: milkSummary, refetch: refetchSummary } = useQuery({
    queryKey: ["admin-milk-summary", selectedDate],
    queryFn: async () => {
      const res = await fetch("/api/admin/subscriptions/dashboard-summary", {
        credentials: "include",
      });
      return res.ok ? res.json() : { todayRequired: 0, todayDelivered: 0, todayRemaining: 0 };
    },
  });

  const { data: subscriptions = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-subscriptions", statusFilter],
    queryFn: async () => {
      try {
        const res = await fetch("/api/admin/subscriptions", { credentials: "include" });
        const data = res.ok ? await res.json() : [];
        return statusFilter ? data.filter((s: any) => s.status === statusFilter) : data;
      } catch {
        return [];
      }
    },
  });

  const filteredSubscriptions = subscriptions.filter((sub: any) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    const subIdMatch = String(sub.id).includes(term);
    const customerName = sub.customer
      ? `${sub.customer.firstName || ""} ${sub.customer.lastName || ""}`.toLowerCase()
      : "";
    const customerNameMatch = customerName.includes(term);
    const phoneMatch = sub.customer?.phone?.toLowerCase().includes(term) || false;
    const emailMatch = sub.customer?.email?.toLowerCase().includes(term) || false;
    const statusMatch = sub.status?.toLowerCase().includes(term) || false;
    const productNameMatch = sub.product?.name?.toLowerCase().includes(term) || false;
    const frequencyMatch = sub.frequency?.toLowerCase().includes(term) || false;

    return subIdMatch || customerNameMatch || phoneMatch || emailMatch || statusMatch || productNameMatch || frequencyMatch;
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/customers", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
  });

  const saveSubscriptionMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingId 
        ? `/api/admin/subscriptions/${editingId}` 
        : "/api/admin/subscriptions";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.customerId,
          productId: parseInt(data.productId),
          quantity: parseFloat(data.quantity),
          frequency: data.frequency,
          deliveryTime: "7-8 AM",
          startDate: new Date().toISOString().split("T")[0],
          pricePerL: data.pricePerL !== "" ? parseFloat(data.pricePerL) : undefined,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save subscription");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      toast({ title: editingId ? "✅ Subscription updated successfully!" : "✅ Subscription added successfully!" });
      setEditingId(null);
      setFormData({ customerId: "", productId: "", quantity: "", frequency: "daily", pricePerL: "" });
      setActiveTab("subscriptions");
      refetch();
    },
    onError: (error: any) => {
      toast({ title: `❌ ${error.message}`, variant: "destructive" });
    },
  });

  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/subscriptions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete subscription");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      toast({ title: "✅ Subscription deleted!" });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: `❌ ${error.message}`, variant: "destructive" });
    },
  });

  const handleEditClick = (sub: any) => {
    setEditingId(sub.id);
    setFormData({
      customerId: sub.userId || "",
      productId: sub.productId ? sub.productId.toString() : "",
      quantity: sub.quantity ? sub.quantity.toString() : "",
      frequency: sub.frequency || "daily",
      pricePerL: sub.pricePerL ? sub.pricePerL.toString() : "",
    });
    setActiveTab("add-subscription");
  };

  const handleProductChange = (productId: string) => {
    const selectedProd = products.find((p: any) => p.id.toString() === productId);
    setFormData((prev) => ({
      ...prev,
      productId,
      pricePerL: selectedProd ? selectedProd.price.toString() : prev.pricePerL,
    }));
  };

  const totalSubs = subscriptions.length;
  const activeSubs = subscriptions.filter((s: any) => s.status === "ACTIVE").length;
  const pausedSubs = subscriptions.filter((s: any) => s.status === "PAUSED").length;
  const totalMilk = subscriptions.reduce((sum: number, s: any) => sum + parseFloat(s.quantity || "0"), 0);
  
  // Calculate daily totals by frequency
  const dailyTotal = subscriptions
    .filter((s: any) => s.status === "ACTIVE" && s.frequency === "daily")
    .reduce((sum: number, s: any) => sum + parseFloat(s.quantity || "0"), 0);
  const alternateDayTotal = subscriptions
    .filter((s: any) => s.status === "ACTIVE" && s.frequency === "alternate")
    .reduce((sum: number, s: any) => sum + parseFloat(s.quantity || "0"), 0);

  return (
    <AdminLayout>
      <div style={{ padding: "1.5rem" }}>
        <Tabs value={activeTab} className="space-y-6" onValueChange={(val) => { setActiveTab(val); if (val === "deliveries" || val === "subscriptions") { refetchDeliveries(); refetchSummary(); } else if (val === "custom-plans") { refetchPlans(); } else if (val === "plan-enrollments") { refetchEnrollments(); } }}>
          <TabsList className="bg-gray-100 p-1 rounded-lg flex flex-wrap gap-1">
            <TabsTrigger value="subscriptions" className="font-bold text-sm">
              🥛 Manage Subscriptions
            </TabsTrigger>
            <TabsTrigger value="add-subscription" className="font-bold text-sm">
              {editingId ? "✏️ Edit Subscription" : "➕ Add Subscription"}
            </TabsTrigger>
            <TabsTrigger value="deliveries" className="font-bold text-sm">
              🚚 Daily Delivery Tracking
            </TabsTrigger>
            <TabsTrigger value="custom-plans" className="font-bold text-sm text-green-700 bg-green-50/50">
              ✨ Custom Subscription Plans
            </TabsTrigger>
            <TabsTrigger value="plan-enrollments" className="font-bold text-sm text-blue-700 bg-blue-50/50">
              👥 Plan Enrollments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions" className="space-y-6">
        {/* Header & Filters */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", margin: 0 }}>
              🥛 Subscriptions Management
            </h2>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({ customerId: "", productId: "", quantity: "", frequency: "daily", pricePerL: "" });
                setActiveTab("add-subscription");
              }}
              style={{
                padding: "0.5rem 1rem",
                background: "#0d3e83",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              ➕ Add Subscription
            </Button>
          </div>


          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                onClick={() => setStatusFilter("")}
                style={{
                  padding: "0.5rem 1rem",
                  background: !statusFilter ? "#0d3e83" : "#e5e7eb",
                  color: !statusFilter ? "white" : "#374151",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                }}
              >
                All ({totalSubs})
              </button>
              <button
                onClick={() => setStatusFilter("ACTIVE")}
                style={{
                  padding: "0.5rem 1rem",
                  background: statusFilter === "ACTIVE" ? "#3b82f6" : "#e5e7eb",
                  color: statusFilter === "ACTIVE" ? "white" : "#374151",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                }}
              >
                ✅ Active ({activeSubs})
              </button>
              <button
                onClick={() => setStatusFilter("PAUSED")}
                style={{
                  padding: "0.5rem 1rem",
                  background: statusFilter === "PAUSED" ? "#f59e0b" : "#e5e7eb",
                  color: statusFilter === "PAUSED" ? "white" : "#374151",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                }}
              >
                ⏸ Paused ({pausedSubs})
              </button>
            </div>

            {/* Search Bar */}
            <div style={{ position: "relative", minWidth: "300px", flex: "1", maxWidth: "450px" }}>
              <input
                type="text"
                placeholder="🔍 Search ID, customer name, phone, product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 1rem",
                  paddingRight: "2rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  outline: "none",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    fontSize: "0.875rem"
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "white", border: "2px solid #3b82f6", borderRadius: "0.5rem", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>Total Subscriptions</p>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#3b82f6", margin: "0.5rem 0 0 0" }}>{totalSubs}</p>
          </div>
          <div style={{ background: "white", border: "2px solid #10b981", borderRadius: "0.5rem", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>Active</p>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#10b981", margin: "0.5rem 0 0 0" }}>{activeSubs}</p>
          </div>
          <div style={{ background: "white", border: "2px solid #f59e0b", borderRadius: "0.5rem", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>Paused</p>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f59e0b", margin: "0.5rem 0 0 0" }}>{pausedSubs}</p>
          </div>
          <div style={{ background: "white", border: "2px solid #ec4899", borderRadius: "0.5rem", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>Total Milk</p>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ec4899", margin: "0.5rem 0 0 0" }}>{totalMilk} L</p>
          </div>
          <div style={{ background: "white", border: "2px solid #8b5cf6", borderRadius: "0.5rem", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>Daily Requirement</p>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#8b5cf6", margin: "0.5rem 0 0 0" }}>{dailyTotal} L</p>
          </div>
          <div style={{ background: "white", border: "2px solid #06b6d4", borderRadius: "0.5rem", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>Alternate Days</p>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#06b6d4", margin: "0.5rem 0 0 0" }}>{alternateDayTotal} L</p>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div style={{ background: "white", borderRadius: "0.5rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflowX: "auto" }}>
          {isLoading ? (
            <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>Loading subscriptions...</p>
          ) : filteredSubscriptions.length === 0 ? (
            <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>No matching subscriptions found</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
                <tr>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>ID</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Customer</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Product</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Quantity</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Frequency</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Status</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Started</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.map((sub: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", fontFamily: "monospace", color: "#3b82f6", fontWeight: "600" }}>
                      #{sub.id}
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#374151" }}>
                      {sub.customer ? (
                        <Link href={`/admin/customers/${sub.userId}`}>
                          <div style={{ color: "#3b82f6", cursor: "pointer", textDecoration: "underline", fontWeight: "600" }}>
                            {`${sub.customer.firstName || ""} ${sub.customer.lastName || ""}`.trim() || "No Name"}
                          </div>
                          {sub.customer.phone && (
                            <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                              📞 {sub.customer.phone}
                            </div>
                          )}
                        </Link>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>Unknown</span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#374151" }}>
                      {sub.product?.name || "N/A"}
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>
                      {sub.quantity} L
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#6b7280" }}>
                      {sub.frequency}
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "0.25rem",
                          background: sub.status === "ACTIVE" ? "#d1fae5" : "#fef3c7",
                          color: sub.status === "ACTIVE" ? "#065f46" : "#92400e",
                          fontWeight: "600",
                          fontSize: "0.75rem",
                        }}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#6b7280" }}>
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => handleEditClick(sub)}
                        style={{
                          padding: "0.25rem 0.75rem",
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "0.375rem",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: "600"
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete(sub.id);
                          setIsDeleteDialogOpen(true);
                        }}
                        style={{
                          padding: "0.25rem 0.75rem",
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "0.375rem",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: "600"
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </TabsContent>

      <TabsContent value="add-subscription" className="space-y-6">
        <div style={{ background: "white", borderRadius: "0.5rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", marginBottom: "1.5rem" }}>
            {editingId ? "✏️ Edit Subscription" : "➕ Add New Subscription"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", display: "block", marginBottom: "0.5rem" }}>Customer</label>
              <select 
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                style={{ 
                  width: "100%", 
                  padding: "0.625rem", 
                  border: "1px solid #d1d5db", 
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem"
                }}
              >
                <option value="">Select Customer</option>
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", display: "block", marginBottom: "0.5rem" }}>Product</label>
              <select 
                value={formData.productId}
                onChange={(e) => handleProductChange(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "0.625rem", 
                  border: "1px solid #d1d5db", 
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem"
                }}
              >
                <option value="">Select Product</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ₹{p.price}/{p.unit}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", display: "block", marginBottom: "0.5rem" }}>Quantity (L)</label>
              <Input 
                type="number" 
                step="0.5"
                placeholder="1.5"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                style={{ fontSize: "0.875rem", padding: "0.625rem" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", display: "block", marginBottom: "0.5rem" }}>Frequency</label>
              <select 
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                style={{ 
                  width: "100%", 
                  padding: "0.625rem", 
                  border: "1px solid #d1d5db", 
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem"
                }}
              >
                <option value="daily">Daily</option>
                <option value="alternate">Alternate Days</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", display: "block", marginBottom: "0.5rem" }}>Price per Liter (₹)</label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0.00"
                value={formData.pricePerL}
                onChange={(e) => setFormData({ ...formData, pricePerL: e.target.value })}
                style={{ fontSize: "0.875rem", padding: "0.625rem" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <Button 
              onClick={() => saveSubscriptionMutation.mutate(formData)}
              disabled={saveSubscriptionMutation.isPending || !formData.customerId || !formData.productId || !formData.quantity}
              style={{ background: "#0d3e83", color: "white", padding: "0.625rem 1.25rem" }}
            >
              {saveSubscriptionMutation.isPending ? "Saving..." : editingId ? "✅ Update Subscription" : "✅ Add Subscription"}
            </Button>
            <Button 
              onClick={() => {
                setEditingId(null);
                setFormData({ customerId: "", productId: "", quantity: "", frequency: "daily", pricePerL: "" });
                setActiveTab("subscriptions");
              }}
              style={{ background: "#6b7280", color: "white", padding: "0.625rem 1.25rem" }}
            >
              ✕ Cancel
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="deliveries" className="space-y-6">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#111827", margin: 0 }}>
            🚚 Daily Delivery Tracking
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#4b5563" }}>Select Date:</span>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: "180px", fontSize: "0.875rem" }}
            />
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "white", border: "2px solid #3b82f6", borderRadius: "0.5rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0, fontWeight: "600" }}>Total Required</p>
            <p style={{ fontSize: "1.75rem", fontWeight: "900", color: "#3b82f6", margin: "0.5rem 0 0 0" }}>{milkSummary?.todayRequired || 0} L</p>
          </div>
          <div style={{ background: "white", border: "2px solid #10b981", borderRadius: "0.5rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0, fontWeight: "600" }}>Total Delivered</p>
            <p style={{ fontSize: "1.75rem", fontWeight: "900", color: "#10b981", margin: "0.5rem 0 0 0" }}>{milkSummary?.todayDelivered || 0} L</p>
          </div>
          <div style={{ background: "white", border: "2px solid #f59e0b", borderRadius: "0.5rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0, fontWeight: "600" }}>Total Pending</p>
            <p style={{ fontSize: "1.75rem", fontWeight: "900", color: "#f59e0b", margin: "0.5rem 0 0 0" }}>{milkSummary?.todayRemaining || 0} L</p>
          </div>
        </div>

        {/* Tracking Table */}
        <div style={{ background: "white", borderRadius: "0.5rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
              <tr>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Date</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Customer Name</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Subscription Quantity</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Delivery Status</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Confirmed By User</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Confirmed Time</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "1.5rem", textAlign: "center", color: "#6b7280", fontSize: "0.875rem" }}>
                    No deliveries found for this date.
                  </td>
                </tr>
              ) : (
                deliveries.map((del: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#374151" }}>
                      {del.deliveryDate}
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>
                      <Link href={`/admin/customers/${del.customerId}`}>
                        <span style={{ color: "#3b82f6", cursor: "pointer", textDecoration: "underline" }}>
                          {del.customerName}
                        </span>
                      </Link>
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>
                      {del.quantity} L ({del.productName})
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "0.25rem",
                          background: del.status === "Delivered" || del.status === "delivered" ? "#d1fae5" : "#fef3c7",
                          color: del.status === "Delivered" || del.status === "delivered" ? "#065f46" : "#92400e",
                          fontWeight: "600",
                          fontSize: "0.75rem",
                        }}
                      >
                        {del.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "0.25rem",
                          background: del.confirmedByUser ? "#d1fae5" : "#e5e7eb",
                          color: del.confirmedByUser ? "#065f46" : "#374151",
                          fontWeight: "600",
                          fontSize: "0.75rem",
                        }}
                      >
                        {del.confirmedByUser ? "Yes" : "No"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#6b7280" }}>
                      {del.confirmedAt ? new Date(del.confirmedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TabsContent>

      {/* ==========================================
          TAB CONTENT: CUSTOM SUBSCRIPTION PLANS
          ========================================== */}
      <TabsContent value="custom-plans" className="space-y-6">
        {/* Create / Edit Plan Form */}
        <div style={{ background: "white", borderRadius: "0.5rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#111827", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Sparkles className="w-5 h-5 text-green-600" />
            {editingPlanId ? `✏️ Edit Custom Subscription Plan (ID: #${editingPlanId})` : "➕ Create Custom Subscription Plan"}
          </h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
            {/* Link to existing product */}
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", display: "block", marginBottom: "0.5rem" }}>
                Select Existing Product (Optional)
              </label>
              <select
                value={customPlanFormData.productId}
                onChange={(e) => handleAdminProductSelect(e.target.value)}
                style={{ width: "100%", padding: "0.625rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", fontSize: "0.875rem" }}
              >
                <option value="">-- Create Manual Custom Plan --</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₹{p.price}/{p.unit})
                  </option>
                ))}
              </select>
              <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                Selecting a product will auto-fill name, unit type, price, and image.
              </p>
            </div>

            {/* Plan Title */}
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", display: "block", marginBottom: "0.5rem" }}>
                Subscription Plan Title <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Premium Farm Fresh Milk"
                value={customPlanFormData.title}
                onChange={(e) => setCustomPlanFormData({ ...customPlanFormData, title: e.target.value })}
                required
                style={{ fontSize: "0.875rem", padding: "0.625rem" }}
              />
            </div>

            {/* Custom Product Name */}
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", display: "block", marginBottom: "0.5rem" }}>
                Custom Product / Sub-title
              </label>
              <Input
                type="text"
                placeholder="e.g. Organic A2 Cow Milk"
                value={customPlanFormData.customProductName}
                onChange={(e) => setCustomPlanFormData({ ...customPlanFormData, customProductName: e.target.value })}
                style={{ fontSize: "0.875rem", padding: "0.625rem" }}
              />
            </div>

            {/* Image Upload */}
            <div className="col-span-full sm:col-span-1">
              <ImageUploader
                label="Plan Image"
                value={customPlanFormData.image || ""}
                onChange={(url) => setCustomPlanFormData({ ...customPlanFormData, image: url })}
                folder="subscriptions"
              />
            </div>

            {/* Quantity */}
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", display: "block", marginBottom: "0.5rem" }}>
                Quantity <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. 1 Liter or 500g"
                value={customPlanFormData.quantity}
                onChange={(e) => setCustomPlanFormData({ ...customPlanFormData, quantity: e.target.value })}
                required
                style={{ fontSize: "0.875rem", padding: "0.625rem" }}
              />
            </div>

            {/* Unit Type */}
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", display: "block", marginBottom: "0.5rem" }}>
                Unit Type <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                value={customPlanFormData.unitType}
                onChange={(e) => setCustomPlanFormData({ ...customPlanFormData, unitType: e.target.value })}
                style={{ width: "100%", padding: "0.625rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", fontSize: "0.875rem" }}
              >
                <option value="Liter">Liter</option>
                <option value="Kg">Kg</option>
                <option value="Pack">Pack</option>
                <option value="Bottle">Bottle</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", display: "block", marginBottom: "0.5rem" }}>
                Subscription Price (₹) <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={customPlanFormData.price}
                onChange={(e) => setCustomPlanFormData({ ...customPlanFormData, price: e.target.value })}
                required
                style={{ fontSize: "0.875rem", padding: "0.625rem" }}
              />
            </div>

            {/* Original Price */}
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", display: "block", marginBottom: "0.5rem" }}>
                Original Price (₹ - Optional)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={customPlanFormData.originalPrice}
                onChange={(e) => setCustomPlanFormData({ ...customPlanFormData, originalPrice: e.target.value })}
                style={{ fontSize: "0.875rem", padding: "0.625rem" }}
              />
              <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                Shows cross-out pricing discount.
              </p>
            </div>

            {/* Frequency */}
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", display: "block", marginBottom: "0.5rem" }}>
                Frequency <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                value={customPlanFormData.frequency}
                onChange={(e) => setCustomPlanFormData({ ...customPlanFormData, frequency: e.target.value })}
                style={{ width: "100%", padding: "0.625rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", fontSize: "0.875rem" }}
              >
                <option value="Daily">Daily</option>
                <option value="Alternate Days">Alternate Days</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            {/* Delivery Time Slot */}
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", display: "block", marginBottom: "0.5rem" }}>
                Delivery Time Slot
              </label>
              <select
                value={customPlanFormData.deliveryTimeSlot}
                onChange={(e) => setCustomPlanFormData({ ...customPlanFormData, deliveryTimeSlot: e.target.value })}
                style={{ width: "100%", padding: "0.625rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", fontSize: "0.875rem" }}
              >
                <option value="">Select Time Slot...</option>
                <option value="6-7 AM">6-7 AM (Early Morning)</option>
                <option value="7-8 AM">7-8 AM (Morning)</option>
                <option value="8-9 AM">8-9 AM (Late Morning)</option>
                <option value="6-8 PM">6-8 PM (Evening)</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", display: "block", marginBottom: "0.5rem" }}>
                Sort Order (Display priority)
              </label>
              <Input
                type="number"
                value={customPlanFormData.sortOrder}
                onChange={(e) => setCustomPlanFormData({ ...customPlanFormData, sortOrder: e.target.value })}
                style={{ fontSize: "0.875rem", padding: "0.625rem" }}
              />
            </div>

            {/* Status */}
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", display: "block", marginBottom: "0.5rem" }}>
                Status
              </label>
              <select
                value={customPlanFormData.status}
                onChange={(e) => setCustomPlanFormData({ ...customPlanFormData, status: e.target.value })}
                style={{ width: "100%", padding: "0.625rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", fontSize: "0.875rem" }}
              >
                <option value="active">Active (Visible to users)</option>
                <option value="inactive">Inactive (Hidden)</option>
              </select>
            </div>

            {/* Featured */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", height: "100%", paddingTop: "1.75rem" }}>
              <input
                type="checkbox"
                id="isFeaturedPlan"
                checked={customPlanFormData.isFeatured}
                onChange={(e) => setCustomPlanFormData({ ...customPlanFormData, isFeatured: e.target.checked })}
                style={{ width: "1.25rem", height: "1.25rem", accentColor: "#0d3e83", cursor: "pointer" }}
              />
              <label htmlFor="isFeaturedPlan" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", cursor: "pointer" }}>
                ⭐ Featured Plan (Prioritize on front-end)
              </label>
            </div>
          </div>

          {/* Short & Detailed Descriptions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", display: "block", marginBottom: "0.5rem" }}>
                Short Description (Shown on cards)
              </label>
              <textarea
                rows={2}
                placeholder="A brief tagline description..."
                value={customPlanFormData.shortDescription}
                onChange={(e) => setCustomPlanFormData({ ...customPlanFormData, shortDescription: e.target.value })}
                style={{ width: "100%", padding: "0.625rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", fontSize: "0.875rem" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", display: "block", marginBottom: "0.5rem" }}>
                Detailed Description (Modal info)
              </label>
              <textarea
                rows={2}
                placeholder="Full details, delivery rules, etc..."
                value={customPlanFormData.detailedDescription}
                onChange={(e) => setCustomPlanFormData({ ...customPlanFormData, detailedDescription: e.target.value })}
                style={{ width: "100%", padding: "0.625rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", fontSize: "0.875rem" }}
              />
            </div>
          </div>

          {/* Benefits & Duration Lists */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
            {/* Highlights list */}
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", display: "block", marginBottom: "0.5rem" }}>
                Benefits & Highlights
              </label>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Input
                  type="text"
                  placeholder="e.g. Fresh cow milk daily"
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  style={{ fontSize: "0.875rem" }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (benefitInput.trim()) { setBenefitsList([...benefitsList, benefitInput.trim()]); setBenefitInput(""); } } }}
                />
                <Button
                  type="button"
                  onClick={() => { if (benefitInput.trim()) { setBenefitsList([...benefitsList, benefitInput.trim()]); setBenefitInput(""); } }}
                  style={{ background: "#0d3e83", color: "white" }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {benefitsList.map((benefit, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.5rem", background: "#f3f4f6", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: "600", color: "#374151" }}>
                    {benefit}
                    <button type="button" onClick={() => setBenefitsList(benefitsList.filter((_, idx) => idx !== i))} style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444", fontSize: "0.75rem" }}>
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Durations list */}
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", display: "block", marginBottom: "0.5rem" }}>
                Subscription Duration Options
              </label>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Input
                  type="text"
                  placeholder="e.g. 7 days, 15 days, 30 days"
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  style={{ fontSize: "0.875rem" }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (durationInput.trim()) { setDurationOptionsList([...durationOptionsList, durationInput.trim()]); setDurationInput(""); } } }}
                />
                <Button
                  type="button"
                  onClick={() => { if (durationInput.trim()) { setDurationOptionsList([...durationOptionsList, durationInput.trim()]); setDurationInput(""); } }}
                  style={{ background: "#0d3e83", color: "white" }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {durationOptionsList.map((duration, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.5rem", background: "#e0f2fe", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: "600", color: "#0369a1" }}>
                    {duration}
                    <button type="button" onClick={() => setDurationOptionsList(durationOptionsList.filter((_, idx) => idx !== i))} style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444", fontSize: "0.75rem" }}>
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <Button
              onClick={() => savePlanMutation.mutate({
                ...customPlanFormData,
                benefits: benefitsList,
                durationOptions: durationOptionsList,
              })}
              disabled={savePlanMutation.isPending || !customPlanFormData.title || !customPlanFormData.quantity || !customPlanFormData.price}
              style={{ background: "#0d3e83", color: "white", padding: "0.625rem 1.25rem", fontWeight: "700" }}
            >
              {savePlanMutation.isPending ? "Saving..." : editingPlanId ? "💾 Save Plan Details" : "✨ Publish Custom Plan"}
            </Button>
            <Button
              onClick={() => {
                setEditingPlanId(null);
                resetPlanForm();
              }}
              style={{ background: "#6b7280", color: "white", padding: "0.625rem 1.25rem" }}
            >
              ✕ Cancel / Clear
            </Button>
          </div>
        </div>

        {/* Existing Custom Plans Table */}
        <div style={{ background: "white", borderRadius: "0.5rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflowX: "auto" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#111827", marginBottom: "1rem" }}>
            📋 Created Custom Subscription Plans
          </h3>
          {isPlansLoading ? (
            <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>Loading subscription plans...</p>
          ) : customPlans.length === 0 ? (
            <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>No custom subscription plans created yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
                <tr>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Image</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Title</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Linked Product</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Quantity</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Price</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Frequency</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Featured</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Status</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customPlans.map((plan: any) => (
                  <tr key={plan.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    {/* Image */}
                    <td style={{ padding: "0.75rem" }}>
                      {plan.image ? (
                        <div style={{ width: "44px", height: "44px", borderRadius: "0.375rem", overflow: "hidden", border: "1px solid #e5e7eb" }}>
                          <img src={plan.image} alt={plan.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ) : (
                        <div style={{ width: "44px", height: "44px", borderRadius: "0.375rem", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                          <Image className="w-5 h-5" />
                        </div>
                      )}
                    </td>
                    
                    {/* Title */}
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>
                      {plan.title}
                      {plan.customProductName && (
                        <div style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: "normal" }}>
                          {plan.customProductName}
                        </div>
                      )}
                    </td>

                    {/* Linked product */}
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#374151" }}>
                      {plan.product ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          📦 {plan.product.name}
                        </span>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>Custom (Manual)</span>
                      )}
                    </td>

                    {/* Quantity */}
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", fontWeight: "600" }}>
                      {plan.quantity} ({plan.unitType})
                    </td>

                    {/* Price */}
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
                      <span style={{ fontWeight: "700", color: "#0d3e83" }}>₹{plan.price}</span>
                      {plan.originalPrice && (
                        <span style={{ textDecoration: "line-through", color: "#9ca3af", fontSize: "0.75rem", marginLeft: "0.5rem" }}>
                          ₹{plan.originalPrice}
                        </span>
                      )}
                    </td>

                    {/* Frequency */}
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#4b5563" }}>
                      {plan.frequency}
                    </td>

                    {/* Featured toggler */}
                    <td style={{ padding: "0.75rem" }}>
                      <button
                        onClick={() => toggleFeaturedMutation.mutate({ id: plan.id, isFeatured: !plan.isFeatured })}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        <Star className={`w-6 h-6 transition-all ${plan.isFeatured ? "text-yellow-500 fill-yellow-500 hover:scale-110" : "text-gray-300 hover:text-yellow-400"}`} />
                      </button>
                    </td>

                    {/* Status badge toggler */}
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        onClick={() => toggleStatusMutation.mutate({ id: plan.id, status: plan.status === "active" ? "inactive" : "active" })}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          background: plan.status === "active" ? "#d1fae5" : "#fee2e2",
                          color: plan.status === "active" ? "#065f46" : "#991b1b",
                        }}
                      >
                        {plan.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "0.75rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Button
                          onClick={() => handleEditPlanClick(plan)}
                          style={{ padding: "0.25rem 0.5rem", height: "auto", background: "#3b82f6", color: "white" }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          onClick={() => {
                            setPlanToDelete(plan.id);
                            setIsPlanDeleteOpen(true);
                          }}
                          style={{ padding: "0.25rem 0.5rem", height: "auto", background: "#ef4444", color: "white" }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </TabsContent>

      {/* ==========================================
          TAB CONTENT: PLAN ENROLLMENTS
          ========================================== */}
      <TabsContent value="plan-enrollments" className="space-y-6">
        <div style={{ background: "white", borderRadius: "0.5rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflowX: "auto" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#111827", marginBottom: "1rem" }}>
            👥 Custom Plan Enrollments & Requests
          </h2>
          {isEnrollmentsLoading ? (
            <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>Loading enrollments...</p>
          ) : enrollments.length === 0 ? (
            <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>No customer enrollments found.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
                <tr>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>ID</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Customer Details</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Subscription Plan</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Selected Details</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Start & Duration</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Total Price</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Payment Status</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Subscription Status</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment: any) => (
                  <tr key={enrollment.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", fontWeight: "600", fontFamily: "monospace", color: "#3b82f6" }}>
                      #{enrollment.id}
                    </td>

                    {/* Customer details */}
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
                      <div style={{ fontWeight: "700", color: "#111827" }}>{enrollment.customerName}</div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.15rem" }}>📞 {enrollment.phone}</div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>✉️ {enrollment.email}</div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={enrollment.address}>
                        📍 {enrollment.address}
                      </div>
                    </td>

                    {/* Sub plan */}
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>
                      {enrollment.plan ? (
                        <span>✨ {enrollment.plan.title}</span>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>Custom Plan</span>
                      )}
                    </td>

                    {/* Selected qty / freq */}
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
                      <div style={{ fontWeight: "600" }}>{enrollment.selectedQuantity}</div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{enrollment.selectedFrequency}</div>
                    </td>

                    {/* Duration & start date */}
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
                      <div style={{ fontWeight: "600", color: "#0284c7" }}>📅 {enrollment.duration}</div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.15rem" }}>Starts: {new Date(enrollment.startDate).toLocaleDateString()}</div>
                    </td>

                    {/* Total price */}
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", fontWeight: "700", color: "#0d3e83" }}>
                      ₹{enrollment.totalAmount}
                    </td>

                    {/* Payment status dropdown */}
                    <td style={{ padding: "0.75rem" }}>
                      <select
                        value={enrollment.paymentStatus}
                        onChange={(e) => updateEnrollmentPaymentMutation.mutate({ id: enrollment.id, paymentStatus: e.target.value })}
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.25rem",
                          border: "1px solid #d1d5db",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          cursor: "pointer",
                          background: enrollment.paymentStatus === "paid" ? "#d1fae5" : enrollment.paymentStatus === "failed" ? "#fee2e2" : "#fef3c7",
                          color: enrollment.paymentStatus === "paid" ? "#065f46" : enrollment.paymentStatus === "failed" ? "#991b1b" : "#92400e",
                        }}
                      >
                        <option value="pending">⏳ Pending</option>
                        <option value="paid">✅ Paid</option>
                        <option value="failed">❌ Failed</option>
                      </select>
                    </td>

                    {/* Subscription status dropdown */}
                    <td style={{ padding: "0.75rem" }}>
                      <select
                        value={enrollment.subscriptionStatus}
                        onChange={(e) => updateEnrollmentStatusMutation.mutate({ id: enrollment.id, status: e.target.value })}
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.25rem",
                          border: "1px solid #d1d5db",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          cursor: "pointer",
                          background: enrollment.subscriptionStatus === "active" ? "#e0f2fe" : enrollment.subscriptionStatus === "paused" ? "#fef3c7" : "#fee2e2",
                          color: enrollment.subscriptionStatus === "active" ? "#0369a1" : enrollment.subscriptionStatus === "paused" ? "#92400e" : "#991b1b",
                        }}
                      >
                        <option value="active">🟢 Active</option>
                        <option value="paused">⏸️ Paused</option>
                        <option value="cancelled">🔴 Cancelled</option>
                        <option value="completed">🏁 Completed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </TabsContent>
    </Tabs>
  </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-2 border-red-100 shadow-2xl rounded-3xl p-8">
          <AlertDialogHeader className="items-center text-center space-y-4">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-2">
              <AlertTriangle className="w-10 h-10 text-red-600 animate-pulse" />
            </div>
            <AlertDialogTitle className="text-3xl font-black text-gray-900">Delete Subscription?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 text-lg font-medium">This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-4 sm:justify-center">
            <AlertDialogCancel className="h-14 px-8 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 font-bold text-gray-600 transition-all">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => { if (itemToDelete) { deleteSubscriptionMutation.mutate(itemToDelete); setItemToDelete(null); } }}
              className="h-14 px-8 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black shadow-lg transition-all"
            >Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isPlanDeleteOpen} onOpenChange={setIsPlanDeleteOpen}>
        <AlertDialogContent className="bg-white border-2 border-red-100 shadow-2xl rounded-3xl p-8">
          <AlertDialogHeader className="items-center text-center space-y-4">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-2">
              <AlertTriangle className="w-10 h-10 text-red-600 animate-pulse" />
            </div>
            <AlertDialogTitle className="text-3xl font-black text-gray-900">Delete Custom Plan?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 text-lg font-medium">
              This will remove the plan from the catalog. Existing user enrollments will NOT be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-4 sm:justify-center">
            <AlertDialogCancel className="h-14 px-8 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 font-bold text-gray-600 transition-all">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => { if (planToDelete) { deletePlanMutation.mutate(planToDelete); setPlanToDelete(null); } }}
              className="h-14 px-8 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black shadow-lg transition-all"
            >Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
