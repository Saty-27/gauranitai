import { useMemo, useRef, useState } from "react";
import type { ComponentType, Dispatch, ReactNode, SetStateAction } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  FileText,
  History,
  ImagePlus,
  Inbox,
  Package,
  Receipt,
  Settings,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import MainPageLayout from "@/components/layout/main-page-layout";

type BillStatus = "PAID" | "PENDING" | "OVERDUE" | "NO_DUES";

interface BillingLineItem {
  name: string;
  quantity: number;
  rate: number;
  total: number;
  date?: string | null;
  source?: string;
}

interface BillingAdjustment {
  type: string;
  amount: number;
  direction?: "charge" | "discount";
}

interface Bill {
  id: number | null;
  billId: number | null;
  month: string;
  monthNumber?: number;
  year?: number;
  amount: number;
  finalAmount: number;
  subscriptionTotal: number;
  ordersTotal: number;
  previousDue: number;
  penalty: number;
  discount: number;
  status: BillStatus;
  rawStatus?: string;
  dueDate: string;
  daysLeft: number;
  paidDate?: string;
  paymentMethod?: string;
  notes?: string;
  subscriptionItems: BillingLineItem[];
  orderItems: BillingLineItem[];
  adjustments: BillingAdjustment[];
  isGenerated: boolean;
  isPreview: boolean;
  // new fields
  billPdfUrl?: string | null;
  paymentScreenshotUrl?: string | null;
  paymentScreenshotStatus?: string | null;
}

interface PaymentSettings {
  brandName?: string;
  upiId?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  qrCodeUrl?: string;
  isOnlinePaymentEnabled?: boolean;
}

const emptyBill: Bill = {
  id: null,
  billId: null,
  month: "",
  amount: 0,
  finalAmount: 0,
  subscriptionTotal: 0,
  ordersTotal: 0,
  previousDue: 0,
  penalty: 0,
  discount: 0,
  status: "NO_DUES",
  dueDate: "",
  daysLeft: 0,
  subscriptionItems: [],
  orderItems: [],
  adjustments: [],
  isGenerated: false,
  isPreview: true,
};

const formatMoney = (value: number | string | null | undefined) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const statusConfig = (status: BillStatus) => {
  if (status === "PAID") {
    return { label: "Paid", className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 };
  }
  if (status === "OVERDUE") {
    return { label: "Overdue", className: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle };
  }
  if (status === "NO_DUES") {
    return { label: "No dues", className: "bg-slate-50 text-slate-600 border-slate-200", icon: CheckCircle2 };
  }
  return { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock };
};

const getJson = async (url: string) => {
  const res = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error("Unable to load billing data");
  return res.json();
};

function StatusBadge({ status }: { status: BillStatus }) {
  const config = statusConfig(status);
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-bold ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

function ScreenshotStatusBanner({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  if (status === "pending_review") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
        <Clock className="h-5 w-5 flex-shrink-0" />
        <span>Your payment screenshot is <strong>under review</strong> by admin. You'll be notified once approved.</span>
      </div>
    );
  }
  if (status === "approved") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
        <span>Your payment has been <strong>confirmed</strong> by admin. ✅</span>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <span>Your screenshot was <strong>rejected</strong>. Please re-upload a clear payment screenshot.</span>
      </div>
    );
  }
  return null;
}

function SectionShell({
  title,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="flex items-center gap-3 text-sm font-bold text-slate-900">
          <Icon className="h-4 w-4 text-green-600" />
          {title}
        </span>
        {open ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
      </button>
      {open && <div className="border-t border-slate-100 px-5 py-4">{children}</div>}
    </div>
  );
}

function LineItemTable({ items, emptyText }: { items: BillingLineItem[]; emptyText: string }) {
  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <th className="py-3 text-left font-bold">Item</th>
            <th className="py-3 text-right font-bold">Quantity</th>
            <th className="py-3 text-right font-bold">Rate</th>
            <th className="py-3 text-right font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.name}-${index}`} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pr-4 font-medium text-slate-900">
                {item.name}
                {item.date && <span className="ml-2 text-xs font-normal text-slate-400">{formatDate(item.date)}</span>}
              </td>
              <td className="py-3 text-right text-slate-600">{Number(item.quantity || 0).toLocaleString("en-IN")}</td>
              <td className="py-3 text-right text-slate-600">{formatMoney(item.rate)}</td>
              <td className="py-3 text-right font-bold text-slate-900">{formatMoney(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BillBreakdown({
  bill,
  expanded,
  setExpanded,
}: {
  bill: Bill;
  expanded: Record<string, boolean>;
  setExpanded: Dispatch<SetStateAction<Record<string, boolean>>>;
}) {
  return (
    <div className="space-y-3">
      <SectionShell
        title="Subscription Deliveries"
        icon={Package}
        open={expanded.subscriptions}
        onToggle={() => setExpanded((prev) => ({ ...prev, subscriptions: !prev.subscriptions }))}
      >
        <LineItemTable items={bill.subscriptionItems || []} emptyText="No subscription deliveries found for this billing period." />
      </SectionShell>

      <SectionShell
        title="One-Time Orders"
        icon={Receipt}
        open={expanded.orders}
        onToggle={() => setExpanded((prev) => ({ ...prev, orders: !prev.orders }))}
      >
        <LineItemTable items={bill.orderItems || []} emptyText="No one-time orders found for this billing period." />
      </SectionShell>

      <SectionShell
        title="Adjustments, Discounts, and Previous Dues"
        icon={Settings}
        open={expanded.adjustments}
        onToggle={() => setExpanded((prev) => ({ ...prev, adjustments: !prev.adjustments }))}
      >
        {!bill.adjustments?.length ? (
          <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            No adjustments found for this billing period.
          </div>
        ) : (
          <div className="space-y-3">
            {bill.adjustments.map((adjustment, index) => (
              <div key={`${adjustment.type}-${index}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
                <span className="font-medium text-slate-800">{adjustment.type}</span>
                <span className={adjustment.direction === "discount" ? "font-bold text-emerald-600" : "font-bold text-slate-900"}>
                  {adjustment.direction === "discount" ? "-" : "+"}
                  {formatMoney(adjustment.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionShell>
    </div>
  );
}

export default function BillingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"ALL" | BillStatus>("ALL");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    subscriptions: true,
    orders: true,
    adjustments: false,
  });

  // Screenshot upload state
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentBillQuery = useQuery<Bill>({
    queryKey: ["/api/billing/current"],
    queryFn: () => getJson("/api/billing/current"),
  });

  const historyQuery = useQuery<Bill[]>({
    queryKey: ["/api/billing/history"],
    queryFn: () => getJson("/api/billing/history"),
  });

  const settingsQuery = useQuery<PaymentSettings>({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const res = await fetch("/api/site-settings", { cache: "no-store" });
      if (!res.ok) return {};
      return res.json();
    },
  });

  const currentBill = currentBillQuery.data || emptyBill;
  const billHistory = historyQuery.data || [];
  const paymentSettings = settingsQuery.data || {};
  const isLoading = currentBillQuery.isLoading || historyQuery.isLoading;
  const hasError = currentBillQuery.isError || historyQuery.isError;

  const filteredHistory = useMemo(() => {
    if (statusFilter === "ALL") return billHistory;
    return billHistory.filter((bill) => bill.status === statusFilter);
  }, [billHistory, statusFilter]);

  const paidTotal = billHistory
    .filter((bill) => bill.status === "PAID")
    .reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
  const pendingTotal = billHistory
    .filter((bill) => bill.status !== "PAID")
    .reduce((sum, bill) => sum + Number(bill.amount || 0), 0);

  const copyToClipboard = async (text: string, fieldName: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast({ title: "Copied!", description: `${fieldName} copied to clipboard` });
    setTimeout(() => setCopiedField(null), 1800);
  };

  const hasPaymentDetails = Boolean(
    paymentSettings.qrCodeUrl || paymentSettings.upiId || paymentSettings.bankName
  );

  const canPay = currentBill.amount > 0 && currentBill.status !== "PAID" && currentBill.status !== "NO_DUES";
  const canDownloadInvoice = Boolean(currentBill.id);
  const screenshotStatus = currentBill.paymentScreenshotStatus;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadScreenshot = async () => {
    if (!screenshotFile || !currentBill.id) return;
    setIsUploadingScreenshot(true);
    try {
      // Step 1: Upload file
      const formData = new FormData();
      formData.append("file", screenshotFile);
      const uploadRes = await fetch("/api/media/upload-screenshot", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      // Step 2: Save URL to bill
      const saveRes = await fetch(`/api/billing/${currentBill.id}/submit-screenshot`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenshotUrl: url }),
      });
      if (!saveRes.ok) throw new Error("Save failed");

      toast({ title: "Screenshot Submitted! ✅", description: "Admin will review your payment and confirm shortly." });
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setShowPaymentModal(false);
      queryClient.invalidateQueries({ queryKey: ["/api/billing/current"] });
    } catch {
      toast({ title: "Upload Failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  if (isLoading) {
    return (
      <MainPageLayout>
        <div className="min-h-screen bg-slate-50 px-4 py-10">
          <div className="mx-auto max-w-6xl space-y-4">
            <div className="h-28 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-72 animate-pulse rounded-lg bg-white" />
            <div className="h-48 animate-pulse rounded-lg bg-white" />
          </div>
        </div>
      </MainPageLayout>
    );
  }

  if (hasError) {
    return (
      <MainPageLayout>
        <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
          <div className="max-w-md rounded-lg border border-red-100 bg-white p-8 text-center shadow-sm">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-500" />
            <h1 className="text-xl font-bold text-slate-900">Unable to load billing</h1>
            <p className="mt-2 text-sm text-slate-500">Please try again after refreshing the page.</p>
            <Button onClick={() => window.location.reload()} className="mt-6 bg-green-600 hover:bg-green-700">
              Retry
            </Button>
          </div>
        </div>
      </MainPageLayout>
    );
  }

  return (
    <MainPageLayout>
      <div className="min-h-screen bg-slate-50 pb-14">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-green-600 via-teal-600 to-blue-600">
          <div className="mx-auto max-w-6xl px-4 py-8 text-white sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setLocation("/home")}
              className="mb-5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight">
                  <Receipt className="h-8 w-8" />
                  Monthly Billing
                </h1>
                <p className="mt-2 text-sm text-white/85">Billing period: {currentBill.month || "Current month"}</p>
              </div>
              <StatusBadge status={currentBill.status} />
            </div>
          </div>
        </div>

        <main className="mx-auto -mt-6 max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">

          {/* Screenshot status banner */}
          {screenshotStatus && (
            <div className="pt-2">
              <ScreenshotStatusBanner status={screenshotStatus} />
            </div>
          )}

          {/* Current Bill Summary */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-black text-slate-900">{currentBill.month} Bill</h2>
                  {currentBill.isPreview && (
                    <span className="rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                      Live preview
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Due {formatDate(currentBill.dueDate)}
                  {currentBill.status !== "PAID" && currentBill.daysLeft >= 0 ? `, ${currentBill.daysLeft} days left` : ""}
                </p>

                <div className="mt-8 rounded-lg bg-slate-50 px-6 py-8 text-center">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Total Amount to Pay</p>
                  <p className="mt-3 text-5xl font-black text-green-600">{formatMoney(currentBill.amount)}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Subscription Total</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{formatMoney(currentBill.subscriptionTotal)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Orders Total</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{formatMoney(currentBill.ordersTotal)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Previous Pending</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{formatMoney(currentBill.previousDue)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Penalty / Discount</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {formatMoney(currentBill.penalty)} / {formatMoney(currentBill.discount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* Pay Now */}
              {canPay && (
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  className="h-12 bg-green-600 font-bold hover:bg-green-700"
                >
                  <Banknote className="mr-2 h-5 w-5" />
                  {screenshotStatus === "rejected" ? "Re-upload Screenshot" : "Pay Now / Upload Proof"}
                </Button>
              )}

              {/* Download admin-uploaded bill */}
              {currentBill.billPdfUrl && (
                <a
                  href={currentBill.billPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-purple-600 px-4 text-sm font-bold text-purple-600 hover:bg-purple-50"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download Bill (Admin)
                </a>
              )}

              {/* Download invoice PDF */}
              {canDownloadInvoice ? (
                <a
                  href={`/api/bills/${currentBill.id}/pdf`}
                  download={`invoice_${currentBill.month?.replace(/\s+/g, "_")}.pdf`}
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-blue-600 px-4 text-sm font-bold text-blue-600 hover:bg-blue-50"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download Invoice PDF
                </a>
              ) : (
                <div className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-400">
                  <FileText className="mr-2 h-5 w-5" />
                  Invoice available after bill generation
                </div>
              )}
            </div>
          </section>

          {/* Stats */}
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase text-slate-500">Generated Bills</p>
              <p className="mt-2 text-3xl font-black text-blue-600">{billHistory.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase text-slate-500">Paid History</p>
              <p className="mt-2 text-3xl font-black text-emerald-600">{formatMoney(paidTotal)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase text-slate-500">Pending History</p>
              <p className="mt-2 text-3xl font-black text-orange-600">{formatMoney(pendingTotal)}</p>
            </div>
          </section>

          {/* Bill Breakdown */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-slate-900">
              <Package className="h-5 w-5 text-green-600" />
              Bill Breakdown
            </h2>
            <BillBreakdown bill={currentBill} expanded={expanded} setExpanded={setExpanded} />
          </section>

          {/* Billing History */}
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
                <History className="h-5 w-5 text-slate-500" />
                Billing History
              </h2>
              <div className="flex flex-wrap gap-2">
                {(["ALL", "PENDING", "OVERDUE", "PAID", "NO_DUES"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-bold ${
                      statusFilter === filter
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {filter === "ALL" ? "All" : statusConfig(filter).label}
                  </button>
                ))}
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <Inbox className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="font-bold text-slate-900">No bills found</p>
                <p className="mt-1 text-sm text-slate-500">Generated bills will appear here with full invoice details.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                      <th className="px-5 py-4 text-left font-bold">Month</th>
                      <th className="px-5 py-4 text-right font-bold">Amount</th>
                      <th className="px-5 py-4 text-center font-bold">Due Date</th>
                      <th className="px-5 py-4 text-center font-bold">Paid Date</th>
                      <th className="px-5 py-4 text-center font-bold">Status</th>
                      <th className="px-5 py-4 text-right font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((bill) => (
                      <tr key={bill.id || `${bill.month}-${bill.year}`} className="border-t border-slate-100">
                        <td className="px-5 py-4 font-bold text-slate-900">{bill.month}</td>
                        <td className="px-5 py-4 text-right font-bold text-green-600">{formatMoney(bill.amount)}</td>
                        <td className="px-5 py-4 text-center text-slate-600">{formatDate(bill.dueDate)}</td>
                        <td className="px-5 py-4 text-center text-slate-600">{formatDate(bill.paidDate)}</td>
                        <td className="px-5 py-4 text-center">
                          <StatusBadge status={bill.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button variant="outline" className="h-9" onClick={() => setSelectedBill(bill)}>
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* ─── History Detail Modal ─── */}
      {selectedBill && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedBill(null)}>
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <h3 className="text-lg font-black text-slateate-900">{selectedBill.month} Bill Details</h3>
                <p className="text-sm text-slate-500">Invoice amount {formatMoney(selectedBill.amount)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 p-5">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Amount</p>
                  <p className="mt-1 text-xl font-black text-slate-900">{formatMoney(selectedBill.amount)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Due Date</p>
                  <p className="mt-1 font-bold text-slate-900">{formatDate(selectedBill.dueDate)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Paid Date</p>
                  <p className="mt-1 font-bold text-slate-900">{formatDate(selectedBill.paidDate)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Status</p>
                  <div className="mt-2"><StatusBadge status={selectedBill.status} /></div>
                </div>
              </div>
              <BillBreakdown bill={selectedBill} expanded={{ subscriptions: true, orders: true, adjustments: true }} setExpanded={() => {}} />
              {selectedBill.id && (
                <a
                  href={`/api/bills/${selectedBill.id}/pdf`}
                  download={`invoice_${selectedBill.month?.replace(/\s+/g, "_")}.pdf`}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-blue-600 px-4 text-sm font-bold text-blue-600 hover:bg-blue-50"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download Invoice PDF
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Pay Now Modal (payment details + screenshot upload) ─── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Pay {formatMoney(currentBill.amount)}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Transfer & upload your payment screenshot</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {/* Step 1 – Download admin bill PDF */}
              {currentBill.billPdfUrl && (
                <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-purple-700">📄 Step 1 — View Your Bill</p>
                  <a
                    href={currentBill.billPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Bill / Invoice
                  </a>
                </div>
              )}

              {/* Step 2 – Payment details */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                  {currentBill.billPdfUrl ? "📲 Step 2" : "📲 Step 1"} — Make Payment
                </p>

                {!hasPaymentDetails ? (
                  <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                    Payment details not configured yet. Please contact admin.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* QR Code */}
                    {paymentSettings.qrCodeUrl && (
                      <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
                        <p className="mb-2 text-xs font-bold text-slate-500">Scan QR to Pay</p>
                        <img
                          src={paymentSettings.qrCodeUrl}
                          alt="Payment QR code"
                          className="mx-auto h-48 w-48 object-contain rounded-lg border border-slate-100"
                        />
                      </div>
                    )}

                    {/* UPI ID */}
                    {paymentSettings.upiId && (
                      <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <p className="text-xs font-bold uppercase text-slate-500">UPI ID</p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span className="break-all font-bold text-slate-900">{paymentSettings.upiId}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(paymentSettings.upiId!, "UPI ID")}
                            className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100 transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                            {copiedField === "UPI ID" ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Bank Details */}
                    {(paymentSettings.bankName || paymentSettings.accountNumber || paymentSettings.ifscCode) && (
                      <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                          <Banknote className="h-4 w-4 text-green-600" />
                          Bank Transfer
                        </div>
                        <div className="space-y-2 text-sm">
                          {paymentSettings.bankName && (
                            <p><span className="text-slate-500">Bank:</span> <strong>{paymentSettings.bankName}</strong></p>
                          )}
                          {paymentSettings.accountNumber && (
                            <div className="flex items-center justify-between gap-3">
                              <p><span className="text-slate-500">Account:</span> <strong>{paymentSettings.accountNumber}</strong></p>
                              <button type="button" onClick={() => copyToClipboard(paymentSettings.accountNumber!, "Account Number")}
                                className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100 transition-colors">
                                <Copy className="h-3 w-3" />
                                {copiedField === "Account Number" ? "Copied!" : "Copy"}
                              </button>
                            </div>
                          )}
                          {paymentSettings.ifscCode && (
                            <div className="flex items-center justify-between gap-3">
                              <p><span className="text-slate-500">IFSC:</span> <strong>{paymentSettings.ifscCode}</strong></p>
                              <button type="button" onClick={() => copyToClipboard(paymentSettings.ifscCode!, "IFSC Code")}
                                className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100 transition-colors">
                                <Copy className="h-3 w-3" />
                                {copiedField === "IFSC Code" ? "Copied!" : "Copy"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 3 – Upload Screenshot */}
              {currentBill.id && screenshotStatus !== "approved" && (
                <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-green-700">
                    📸 {currentBill.billPdfUrl ? "Step 3" : "Step 2"} — Upload Payment Screenshot
                  </p>

                  {/* Existing screenshot status */}
                  {currentBill.paymentScreenshotUrl && screenshotStatus === "pending_review" && (
                    <div className="mb-3 rounded-lg bg-white border border-amber-200 p-3">
                      <p className="text-xs font-bold text-amber-700 mb-2">⏳ Screenshot submitted – awaiting admin review</p>
                      <img src={currentBill.paymentScreenshotUrl} alt="Submitted screenshot"
                        className="h-28 w-auto rounded-lg border border-slate-200 object-cover" />
                    </div>
                  )}
                  {screenshotStatus === "rejected" && (
                    <p className="mb-2 text-xs font-semibold text-red-600">❌ Previous screenshot was rejected. Please upload a new one.</p>
                  )}

                  {/* File picker */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {screenshotPreview ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <img src={screenshotPreview} alt="Screenshot preview"
                          className="h-40 w-full rounded-lg border border-slate-200 object-contain bg-slate-100" />
                        <button
                          type="button"
                          onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }}
                          className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate">📎 {screenshotFile?.name}</p>
                      <Button
                        onClick={handleUploadScreenshot}
                        disabled={isUploadingScreenshot}
                        className="w-full bg-green-600 hover:bg-green-700 font-bold h-11"
                      >
                        {isUploadingScreenshot ? (
                          <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Uploading...</span>
                        ) : (
                          <span className="flex items-center gap-2"><Upload className="h-4 w-4" /> Submit Payment Proof</span>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-green-300 bg-white py-8 text-green-700 hover:bg-green-50 transition-colors cursor-pointer"
                    >
                      <ImagePlus className="h-8 w-8" />
                      <span className="text-sm font-bold">Click to upload screenshot</span>
                      <span className="text-xs text-slate-500">JPG, PNG, WEBP or PDF</span>
                    </button>
                  )}
                </div>
              )}

              {/* Already approved */}
              {screenshotStatus === "approved" && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="font-black text-emerald-800">Payment Confirmed! ✅</p>
                    <p className="text-sm text-emerald-700 mt-0.5">Your payment has been verified by admin.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </MainPageLayout>
  );
}
