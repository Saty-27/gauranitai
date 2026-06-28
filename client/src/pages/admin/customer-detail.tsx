import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  CreditCard,
  Edit,
  FileText,
  Home,
  Mail,
  MapPin,
  Milk,
  MessageSquare,
  NotebookText,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Truck,
  User,
  WalletCards,
} from "lucide-react";
import AdminLayout from "@/components/layout/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const currency = (value: any) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value: any) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value: any) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const dateKey = (value: any) => {
  if (!value) return "";
  if (typeof value === "string") return value.split("T")[0];
  return new Date(value).toISOString().split("T")[0];
};

const statusClass = (status: any) => {
  const normalized = `${status || ""}`.toLowerCase();
  if (["active", "paid", "delivered", "resolved", "closed"].includes(normalized)) {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
  if (["paused", "partial", "partial paid", "partial delivered", "processing", "in_progress"].includes(normalized)) {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }
  if (["blocked", "cancelled", "failed", "missed", "refunded", "overdue"].includes(normalized)) {
    return "bg-red-100 text-red-800 border-red-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
};

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone = "slate",
}: {
  icon: any;
  label: string;
  value: string | number;
  tone?: "slate" | "green" | "blue" | "amber" | "red";
}) {
  const tones = {
    slate: "border-slate-200 text-slate-700",
    green: "border-emerald-200 text-emerald-700",
    blue: "border-blue-200 text-blue-700",
    amber: "border-amber-200 text-amber-700",
    red: "border-red-200 text-red-700",
  };

  return (
    <Card className={`rounded-lg border ${tones[tone]}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-slate-50 p-2">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-normal text-slate-500">{label}</p>
            <p className="mt-1 truncate text-xl font-bold text-slate-950">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-normal text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value || "N/A"}</p>
    </div>
  );
}

function FilterInput({
  icon: Icon,
  value,
  onChange,
  placeholder,
}: {
  icon: any;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-[220px] flex-1">
      <Icon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
      <Input className="pl-9" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

function NativeSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  label: string;
}) {
  return (
    <label className="min-w-[180px] flex-1 text-xs font-medium uppercase tracking-normal text-slate-500">
      {label}
      <select
        className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-slate-900"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function CustomerDetailPage() {
  const [location, setLocation] = useLocation();
  const customerId = decodeURIComponent(location.split("/admin/customers/")[1]?.split("?")[0] || "");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [orderFilters, setOrderFilters] = useState({ search: "", status: "all", from: "", to: "" });
  const [subscriptionStatus, setSubscriptionStatus] = useState("all");
  const [deliveryFilters, setDeliveryFilters] = useState({ status: "all", from: "", to: "" });
  const [paymentFilters, setPaymentFilters] = useState({ status: "all", month: "" });
  const [noteDraft, setNoteDraft] = useState("");
  const [editingNote, setEditingNote] = useState<any>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState<any>(null);

  const {
    data: detail,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-customer-detail", customerId],
    enabled: Boolean(customerId),
    queryFn: async () => {
      const res = await fetch(`/api/admin/customers/${customerId}`, { credentials: "include" });
      if (res.status === 404) throw new Error("Customer not found.");
      if (!res.ok) throw new Error("Unable to load customer details. Please try again.");
      return res.json();
    },
  });

  useEffect(() => {
    if (!detail?.defaultAddress) return;
    setAddressForm({
      id: detail.defaultAddress.id,
      type: detail.defaultAddress.type || "home",
      address: detail.defaultAddress.address || "",
      landmark: detail.defaultAddress.landmark || "",
      city: detail.defaultAddress.city || "",
      state: detail.defaultAddress.state || "",
      pincode: detail.defaultAddress.pincode || "",
      phone: detail.defaultAddress.phone || detail.customer?.phone || "",
      isDefault: true,
    });
  }, [detail?.defaultAddress, detail?.customer?.phone]);

  const invalidateDetail = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-customer-detail", customerId] });
    queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
  };

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/admin/customers/${customerId}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Unable to update customer status.");
      return res.json();
    },
    onSuccess: () => {
      invalidateDetail();
      toast({ title: "Customer status updated" });
    },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" }),
  });

  const noteMutation = useMutation({
    mutationFn: async () => {
      const isEditing = Boolean(editingNote);
      const res = await fetch(
        isEditing
          ? `/api/admin/customers/${customerId}/notes/${editingNote.id}`
          : `/api/admin/customers/${customerId}/notes`,
        {
          method: isEditing ? "PUT" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ noteText: isEditing ? editingNote.noteText : noteDraft }),
        },
      );
      if (!res.ok) throw new Error("Unable to save admin note.");
      return res.json();
    },
    onSuccess: () => {
      setNoteDraft("");
      setEditingNote(null);
      invalidateDetail();
      toast({ title: "Admin note saved" });
    },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" }),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const res = await fetch(`/api/admin/customers/${customerId}/notes/${noteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Unable to delete admin note.");
      return res.json();
    },
    onSuccess: () => {
      invalidateDetail();
      toast({ title: "Admin note deleted" });
    },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" }),
  });

  const addressMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/customers/${customerId}/address`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressForm),
      });
      if (!res.ok) throw new Error("Unable to update customer address.");
      return res.json();
    },
    onSuccess: () => {
      setShowAddressForm(false);
      invalidateDetail();
      toast({ title: "Customer address updated" });
    },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" }),
  });

  const subscriptionStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/admin/subscriptions/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Unable to update subscription.");
      return res.json();
    },
    onSuccess: () => {
      invalidateDetail();
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      toast({ title: "Subscription updated" });
    },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" }),
  });

  const markPaidMutation = useMutation({
    mutationFn: async (billId: number) => {
      const res = await fetch(`/api/admin/billing/${billId}/mark-paid`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: "manual" }),
      });
      if (!res.ok) throw new Error("Unable to mark payment as paid.");
      return res.json();
    },
    onSuccess: () => {
      invalidateDetail();
      queryClient.invalidateQueries({ queryKey: ["admin-bills"] });
      toast({ title: "Payment marked paid" });
    },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" }),
  });

  const filteredOrders = useMemo(() => {
    const orders = detail?.orders || [];
    return orders.filter((order: any) => {
      const statusMatch = orderFilters.status === "all" || `${order.status}`.toLowerCase() === orderFilters.status;
      const searchText = `${order.orderCode} ${order.id} ${order.productsOrdered}`.toLowerCase();
      const searchMatch = !orderFilters.search || searchText.includes(orderFilters.search.toLowerCase());
      const orderDate = dateKey(order.createdAt);
      const fromMatch = !orderFilters.from || orderDate >= orderFilters.from;
      const toMatch = !orderFilters.to || orderDate <= orderFilters.to;
      return statusMatch && searchMatch && fromMatch && toMatch;
    });
  }, [detail?.orders, orderFilters]);

  const filteredSubscriptions = useMemo(() => {
    const subscriptions = detail?.subscriptions || [];
    return subscriptions.filter((subscription: any) => {
      return subscriptionStatus === "all" || `${subscription.status}`.toLowerCase() === subscriptionStatus;
    });
  }, [detail?.subscriptions, subscriptionStatus]);

  const filteredDeliveries = useMemo(() => {
    const deliveries = detail?.deliveries || [];
    return deliveries.filter((delivery: any) => {
      const normalized = `${delivery.deliveryStatus}`.toLowerCase();
      const statusMatch = deliveryFilters.status === "all" || normalized === deliveryFilters.status;
      const deliveryDate = dateKey(delivery.deliveryDate);
      const fromMatch = !deliveryFilters.from || deliveryDate >= deliveryFilters.from;
      const toMatch = !deliveryFilters.to || deliveryDate <= deliveryFilters.to;
      return statusMatch && fromMatch && toMatch;
    });
  }, [detail?.deliveries, deliveryFilters]);

  const filteredPayments = useMemo(() => {
    const payments = detail?.payments || [];
    return payments.filter((payment: any) => {
      const statusMatch = paymentFilters.status === "all" || `${payment.paymentStatus}`.toLowerCase() === paymentFilters.status;
      const monthMatch = !paymentFilters.month || `${payment.billingMonth}`.includes(paymentFilters.month);
      return statusMatch && monthMatch;
    });
  }, [detail?.payments, paymentFilters]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 text-slate-500">Loading customer details...</div>
      </AdminLayout>
    );
  }

  if (error || !detail) {
    return (
      <AdminLayout>
        <div className="max-w-3xl p-6">
          <p className="text-lg font-semibold text-red-600">
            {(error as Error)?.message || "Unable to load customer details. Please try again."}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => setLocation("/admin/customers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const { customer, summary, todayDelivery, defaultAddress, dues } = detail;
  const blocked = customer.status === "Blocked";

  const updateAddressField = (field: string, value: any) => {
    setAddressForm((current: any) => ({
      ...(current || { type: "home", isDefault: true }),
      [field]: value,
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-1 sm:p-2">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Button variant="ghost" className="mb-3 px-0" onClick={() => setLocation("/admin/customers")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customers
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-950">{customer.name}</h2>
              <Badge className={statusClass(customer.status)}>{customer.status}</Badge>
            </div>
            <p className="mt-1 break-all text-sm text-slate-500">Customer ID: {customer.customerId}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={blocked ? "default" : "outline"}
              onClick={() => {
                const nextStatus = blocked ? "active" : "blocked";
                const warning = blocked
                  ? "Unblock this customer and allow ordering, subscriptions, and delivery confirmations?"
                  : "Block this customer? They will not be able to place orders, create subscriptions, or confirm deliveries.";
                if (window.confirm(warning)) statusMutation.mutate(nextStatus);
              }}
              disabled={statusMutation.isPending}
            >
              {blocked ? <ShieldCheck className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
              {blocked ? "Unblock Customer" : "Block Customer"}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <SummaryCard icon={Package} label="Total Orders" value={summary.totalOrders} tone="blue" />
          <SummaryCard icon={Milk} label="Active Subscriptions" value={summary.activeSubscriptions} tone="green" />
          <SummaryCard icon={Truck} label="Liters Delivered" value={`${summary.totalLitersDelivered}L`} tone="slate" />
          <SummaryCard icon={CreditCard} label="Total Spent" value={currency(summary.totalAmountSpent)} tone="amber" />
          <SummaryCard icon={WalletCards} label="Pending Dues" value={currency(summary.pendingAmount)} tone="red" />
          <SummaryCard icon={CheckCircle2} label="Last Delivery" value={summary.lastDeliveryStatus} tone="green" />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="rounded-lg xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Customer Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-3">
              <InfoItem label="Email Address" value={customer.email} />
              <InfoItem label="Phone Number" value={customer.phone} />
              <InfoItem label="Alternate Phone" value={customer.alternatePhone} />
              <InfoItem label="Joined" value={formatDate(customer.accountCreatedDate)} />
              <InfoItem label="Last Login" value={formatDateTime(customer.lastLoginDate)} />
              <InfoItem label="Wallet Balance" value={currency(customer.walletBalance)} />
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Milk className="h-4 w-4" />
                Today's Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Status</span>
                <Badge className={statusClass(todayDelivery.status)}>{todayDelivery.status}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Required</p>
                  <p className="font-bold">{todayDelivery.required}L</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Delivered</p>
                  <p className="font-bold">{todayDelivery.delivered}L</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Remaining</p>
                  <p className="font-bold">{todayDelivery.remaining}L</p>
                </div>
              </div>
              <InfoItem label="Confirmed By User" value={todayDelivery.confirmedByUser ? "Yes" : "No"} />
              <InfoItem label="Confirmed Time" value={formatDateTime(todayDelivery.confirmedTime)} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                Contact & Address
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowAddressForm((value) => !value)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Address
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoItem label="Full Name" value={customer.name} />
                <InfoItem label="Email" value={customer.email} />
                <InfoItem label="Phone" value={customer.phone} />
                <InfoItem label="Alternate Phone" value={customer.alternatePhone} />
              </div>
              {defaultAddress ? (
                <div className="rounded-md border border-slate-200 p-4">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Home className="h-4 w-4" />
                    Delivery Address
                  </p>
                  <p className="text-sm text-slate-700">{defaultAddress.address}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {[defaultAddress.city, defaultAddress.state, defaultAddress.pincode].filter(Boolean).join(", ")}
                  </p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-normal text-slate-500">Landmark</p>
                  <p className="text-sm text-slate-700">{defaultAddress.landmark || "N/A"}</p>
                </div>
              ) : (
                <EmptyState message="No address found for this customer." />
              )}

              {showAddressForm && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="sm:col-span-2 text-sm font-medium text-slate-700">
                      Full Delivery Address
                      <Textarea
                        className="mt-1 bg-white"
                        value={addressForm?.address || ""}
                        onChange={(event) => updateAddressField("address", event.target.value)}
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      City
                      <Input className="mt-1 bg-white" value={addressForm?.city || ""} onChange={(event) => updateAddressField("city", event.target.value)} />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      State
                      <Input className="mt-1 bg-white" value={addressForm?.state || ""} onChange={(event) => updateAddressField("state", event.target.value)} />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Pincode
                      <Input className="mt-1 bg-white" value={addressForm?.pincode || ""} onChange={(event) => updateAddressField("pincode", event.target.value)} />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Landmark
                      <Input className="mt-1 bg-white" value={addressForm?.landmark || ""} onChange={(event) => updateAddressField("landmark", event.target.value)} />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Delivery Phone
                      <Input className="mt-1 bg-white" value={addressForm?.phone || ""} onChange={(event) => updateAddressField("phone", event.target.value)} />
                    </label>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button onClick={() => addressMutation.mutate()} disabled={addressMutation.isPending}>
                      Save Address
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddressForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <WalletCards className="h-4 w-4" />
                Wallet, Credit & Dues
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Outstanding Balance" value={currency(dues.outstandingBalance)} />
              <InfoItem label="Current Month Bill" value={currency(dues.currentMonthBill)} />
              <InfoItem label="Previous Pending" value={currency(dues.previousPending)} />
              <InfoItem label="Total Payable" value={currency(dues.totalPayable)} />
              <InfoItem label="Last Payment Date" value={formatDate(dues.lastPaymentDate)} />
              <InfoItem label="Next Billing Date" value={formatDate(dues.nextBillingDate)} />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-slate-100 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle className="text-base">Customer 360 Summary</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <InfoItem label="Total Orders" value={summary.totalOrders} />
                <InfoItem label="Total Subscriptions" value={summary.totalSubscriptions} />
                <InfoItem label="Active Subscriptions" value={summary.activeSubscriptions} />
                <InfoItem label="Total Spent" value={currency(summary.totalAmountSpent)} />
                <InfoItem label="Pending Dues" value={currency(summary.pendingAmount)} />
                <InfoItem label="Last Delivery" value={summary.lastDeliveryStatus} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <FilterInput icon={Search} value={orderFilters.search} onChange={(search) => setOrderFilters({ ...orderFilters, search })} placeholder="Search by order ID or product" />
              <NativeSelect
                label="Status"
                value={orderFilters.status}
                onChange={(status) => setOrderFilters({ ...orderFilters, status })}
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "pending", label: "Pending" },
                  { value: "confirmed", label: "Confirmed" },
                  { value: "processing", label: "Processing" },
                  { value: "out_for_delivery", label: "Out for Delivery" },
                  { value: "delivered", label: "Delivered" },
                  { value: "cancelled", label: "Cancelled" },
                  { value: "refunded", label: "Refunded" },
                  { value: "placed", label: "Placed" },
                ]}
              />
              <Input type="date" className="min-w-[160px] flex-1" value={orderFilters.from} onChange={(event) => setOrderFilters({ ...orderFilters, from: event.target.value })} />
              <Input type="date" className="min-w-[160px] flex-1" value={orderFilters.to} onChange={(event) => setOrderFilters({ ...orderFilters, to: event.target.value })} />
            </div>
            <Card className="rounded-lg">
              <CardContent className="p-0">
                {filteredOrders.length === 0 ? (
                  <div className="p-4">
                    <EmptyState message="No orders found for this customer." />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Delivery</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order: any) => (
                        <TableRow key={order.id} className="cursor-pointer" onClick={() => setLocation("/admin/orders")}>
                          <TableCell className="font-semibold text-blue-700">{order.orderCode}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell className="min-w-[220px]">{order.productsOrdered}</TableCell>
                          <TableCell>{order.quantity || "N/A"}</TableCell>
                          <TableCell>{currency(order.orderAmount)}</TableCell>
                          <TableCell>
                            <Badge className={statusClass(order.paymentStatus)}>{order.paymentStatus || "pending"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusClass(order.status)}>{order.status}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(order.deliveryDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <div className="max-w-xs">
              <NativeSelect
                label="Subscription Status"
                value={subscriptionStatus}
                onChange={setSubscriptionStatus}
                options={[
                  { value: "all", label: "All subscriptions" },
                  { value: "active", label: "Active" },
                  { value: "paused", label: "Paused" },
                  { value: "cancelled", label: "Cancelled" },
                  { value: "expired", label: "Expired" },
                  { value: "pending verification", label: "Pending Verification" },
                ]}
              />
            </div>
            {filteredSubscriptions.length === 0 ? (
              <EmptyState message="No subscriptions found for this customer." />
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredSubscriptions.map((subscription: any) => (
                  <Card key={subscription.id} className="rounded-lg">
                    <CardHeader className="space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">{subscription.productName}</CardTitle>
                          <p className="text-sm text-slate-500">{subscription.subscriptionCode}</p>
                        </div>
                        <Badge className={statusClass(subscription.status)}>{subscription.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <InfoItem label="Daily Quantity" value={`${subscription.dailyQuantity} ${subscription.product?.unit || "unit"}`} />
                        <InfoItem label="Type" value={subscription.subscriptionType} />
                        <InfoItem label="Monthly Amount" value={currency(subscription.monthlyAmount)} />
                        <InfoItem label="Created" value={formatDateTime(subscription.createdDateTime)} />
                        <InfoItem label="Delivery Start" value={formatDate(subscription.deliveryStartDate)} />
                        <InfoItem label="Delivered Qty" value={`${subscription.totalDeliveredQuantity}L`} />
                      </div>
                      <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
                        {subscription.cutoffMessage}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {`${subscription.status}`.toUpperCase() === "ACTIVE" ? (
                          <Button size="sm" variant="outline" onClick={() => subscriptionStatusMutation.mutate({ id: subscription.id, status: "PAUSED" })}>
                            Pause
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => subscriptionStatusMutation.mutate({ id: subscription.id, status: "ACTIVE" })}>
                            Resume
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (window.confirm("Cancel this customer subscription?")) {
                              subscriptionStatusMutation.mutate({ id: subscription.id, status: "CANCELLED" });
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="deliveries" className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <NativeSelect
                label="Delivery Status"
                value={deliveryFilters.status}
                onChange={(status) => setDeliveryFilters({ ...deliveryFilters, status })}
                options={[
                  { value: "all", label: "All deliveries" },
                  { value: "pending", label: "Pending" },
                  { value: "delivered", label: "Delivered" },
                  { value: "partial delivered", label: "Partial Delivered" },
                  { value: "missed", label: "Missed" },
                  { value: "skipped", label: "Skipped" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
              <Input type="date" className="min-w-[160px] flex-1" value={deliveryFilters.from} onChange={(event) => setDeliveryFilters({ ...deliveryFilters, from: event.target.value })} />
              <Input type="date" className="min-w-[160px] flex-1" value={deliveryFilters.to} onChange={(event) => setDeliveryFilters({ ...deliveryFilters, to: event.target.value })} />
            </div>
            <Card className="rounded-lg">
              <CardContent className="p-0">
                {filteredDeliveries.length === 0 ? (
                  <div className="p-4">
                    <EmptyState message="No delivery history found for this customer." />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>Delivered</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Confirmed</TableHead>
                        <TableHead>Partner</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDeliveries.map((delivery: any) => (
                        <TableRow key={delivery.id}>
                          <TableCell>{formatDate(delivery.deliveryDate)}</TableCell>
                          <TableCell>{delivery.subscriptionCode}</TableCell>
                          <TableCell>{delivery.productName}</TableCell>
                          <TableCell>{delivery.quantityRequired}L</TableCell>
                          <TableCell>{delivery.quantityDelivered}L</TableCell>
                          <TableCell>
                            <Badge className={statusClass(delivery.deliveryStatus)}>{delivery.deliveryStatus}</Badge>
                          </TableCell>
                          <TableCell>{delivery.confirmedByUser ? `Yes, ${formatDateTime(delivery.confirmedTime)}` : "No"}</TableCell>
                          <TableCell>{delivery.deliveryPartner || "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <NativeSelect
                label="Payment Status"
                value={paymentFilters.status}
                onChange={(status) => setPaymentFilters({ ...paymentFilters, status })}
                options={[
                  { value: "all", label: "All payments" },
                  { value: "paid", label: "Paid" },
                  { value: "unpaid", label: "Unpaid" },
                  { value: "partial", label: "Partial" },
                  { value: "overdue", label: "Overdue" },
                  { value: "refunded", label: "Refunded" },
                ]}
              />
              <Input className="min-w-[180px] flex-1" placeholder="Filter by month, e.g. 5/2026" value={paymentFilters.month} onChange={(event) => setPaymentFilters({ ...paymentFilters, month: event.target.value })} />
            </div>
            <Card className="rounded-lg">
              <CardContent className="p-0">
                {filteredPayments.length === 0 ? (
                  <div className="p-4">
                    <EmptyState message="No payment history available." />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead>Total Qty</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Pending</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment: any) => (
                        <TableRow key={payment.billId}>
                          <TableCell className="font-semibold text-blue-700">{payment.invoiceId}</TableCell>
                          <TableCell>{payment.billingMonth}</TableCell>
                          <TableCell>{payment.totalMilkQuantity}L</TableCell>
                          <TableCell>{currency(payment.finalAmount)}</TableCell>
                          <TableCell>{currency(payment.paidAmount)}</TableCell>
                          <TableCell>{currency(payment.pendingAmount)}</TableCell>
                          <TableCell>{payment.paymentMethod}</TableCell>
                          <TableCell>
                            <Badge className={statusClass(payment.paymentStatus)}>{payment.paymentStatus}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={() => setLocation(`/admin/billing/${payment.billId}`)}>
                                <FileText className="mr-2 h-4 w-4" />
                                View
                              </Button>
                              {payment.paymentStatus !== "paid" && (
                                <Button size="sm" onClick={() => markPaidMutation.mutate(payment.billId)}>
                                  Mark Paid
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="complaints" className="space-y-4">
            {(detail.complaints || []).length === 0 ? (
              <EmptyState message="No complaints or support requests found for this customer." />
            ) : (
              <div className="space-y-3">
                {detail.complaints.map((complaint: any) => (
                  <Card key={complaint.complaintId} className="rounded-lg">
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{complaint.subject}</p>
                          <p className="mt-1 text-sm text-slate-600">{complaint.message}</p>
                        </div>
                        <Badge className={statusClass(complaint.status)}>{complaint.status}</Badge>
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <InfoItem label="Complaint ID" value={complaint.complaintId} />
                        <InfoItem label="Date" value={formatDate(complaint.date)} />
                        <InfoItem label="Resolved Date" value={formatDate(complaint.resolvedDate)} />
                      </div>
                      <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                        <span className="font-semibold">Admin Reply: </span>
                        {complaint.adminReply || "No admin reply yet."}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <NotebookText className="h-4 w-4" />
                  Private Admin Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Add a private note for this customer" />
                <Button disabled={!noteDraft.trim() || noteMutation.isPending} onClick={() => noteMutation.mutate()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Note
                </Button>
              </CardContent>
            </Card>

            {(detail.notes || []).length === 0 ? (
              <EmptyState message="No admin notes have been added for this customer." />
            ) : (
              <div className="space-y-3">
                {detail.notes.map((note: any) => (
                  <Card key={note.id} className="rounded-lg">
                    <CardContent className="p-4">
                      {editingNote?.id === note.id ? (
                        <div className="space-y-3">
                          <Textarea value={editingNote.noteText} onChange={(event) => setEditingNote({ ...editingNote, noteText: event.target.value })} />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => noteMutation.mutate()} disabled={noteMutation.isPending}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingNote(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm text-slate-800">{note.noteText}</p>
                            <p className="mt-2 text-xs text-slate-500">
                              Added by {note.addedByAdminName || "Admin"} on {formatDateTime(note.createdAt)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setEditingNote(note)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (window.confirm("Delete this admin note?")) deleteNoteMutation.mutate(note.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-3">
            {(detail.activity || []).length === 0 ? (
              <EmptyState message="No activity history found for this customer." />
            ) : (
              detail.activity.map((event: any, index: number) => (
                <div key={`${event.type}-${event.createdAt}-${index}`} className="flex gap-3 rounded-lg border bg-white p-4">
                  <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">{event.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{event.description}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {formatDateTime(event.createdAt)} · {event.type}
                    </p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
