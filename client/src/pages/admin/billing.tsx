import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useRef } from "react";
import AdminLayout from "@/components/layout/admin-layout";

interface Bill {
  id: number;
  userId: string;
  month: number;
  year: number;
  finalAmount: number;
  status: string;
  dueDate: string;
  billPdfUrl?: string | null;
  paymentScreenshotUrl?: string | null;
  paymentScreenshotStatus?: string | null;
  paymentScreenshotUploadedAt?: string | null;
  user?: { firstName?: string; lastName?: string; email?: string; phone?: string };
}

const S = {
  card: { background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } as React.CSSProperties,
  btn: (color: string) => ({ background: color, color: "white", border: "none", padding: "7px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" } as React.CSSProperties),
  badge: (color: string, bg: string) => ({ background: bg, color, padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" } as React.CSSProperties),
};

const screenshotBadge = (status?: string | null) => {
  if (!status) return null;
  if (status === "pending_review") return <span style={S.badge("#92400e", "#fef3c7")}>⏳ Pending Review</span>;
  if (status === "approved") return <span style={S.badge("#065f46", "#d1fae5")}>✅ Approved</span>;
  if (status === "rejected") return <span style={S.badge("#991b1b", "#fee2e2")}>❌ Rejected</span>;
  return null;
};

export default function AdminBillingPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"bills" | "screenshots" | "settings">("bills");
  const [statusFilter, setStatusFilter] = useState("all");

  // Upload bill PDF state (per bill)
  const [uploadingBillId, setUploadingBillId] = useState<number | null>(null);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Payment settings state
  const [settingsForm, setSettingsForm] = useState({ upiId: "", bankName: "", accountNumber: "", ifscCode: "", qrCodeUrl: "", isOnlinePaymentEnabled: false });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  // Screenshot reject reason
  const [rejectBillId, setRejectBillId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: bills = [], refetch: refetchBills } = useQuery({
    queryKey: ["admin-bills", statusFilter],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/admin/billing?status=${statusFilter}`, { credentials: "include" });
        return res.ok ? res.json() : [];
      } catch { return []; }
    },
  });

  const { data: screenshots = [], refetch: refetchScreenshots } = useQuery({
    queryKey: ["admin-payment-screenshots"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/admin/billing/payment-screenshots", { credentials: "include" });
        return res.ok ? res.json() : [];
      } catch { return []; }
    },
    enabled: activeTab === "screenshots",
  });

  const { data: siteSettings } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/site-settings", { credentials: "include" });
        return res.ok ? res.json() : {};
      } catch { return {}; }
    },
    enabled: activeTab === "settings",
  });

  // Sync site settings into form once loaded
  if (siteSettings && !settingsLoaded) {
    setSettingsForm({
      upiId: siteSettings.upiId || "",
      bankName: siteSettings.bankName || "",
      accountNumber: siteSettings.accountNumber || "",
      ifscCode: siteSettings.ifscCode || "",
      qrCodeUrl: siteSettings.qrCodeUrl || "",
      isOnlinePaymentEnabled: siteSettings.isOnlinePaymentEnabled || false,
    });
    if (siteSettings.qrCodeUrl) setQrPreview(siteSettings.qrCodeUrl);
    setSettingsLoaded(true);
  }

  const stats = {
    total: bills.length,
    unpaid: bills.filter((b: Bill) => b.status === "unpaid").length,
    paid: bills.filter((b: Bill) => b.status === "paid").length,
    overdue: bills.filter((b: Bill) => b.status === "overdue").length,
    collected: bills.filter((b: Bill) => b.status === "paid").reduce((s: number, b: Bill) => s + Number(b.finalAmount), 0),
    pending: bills.filter((b: Bill) => b.status !== "paid").reduce((s: number, b: Bill) => s + Number(b.finalAmount), 0),
    pendingScreenshots: (screenshots as Bill[]).filter((b) => b.paymentScreenshotStatus === "pending_review").length,
  };

  // Upload bill PDF
  const handleUploadBillPdf = async (billId: number) => {
    if (!uploadingFile) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadingFile);
      const uploadRes = await fetch("/api/admin/media/upload", { method: "POST", credentials: "include", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      const saveRes = await fetch(`/api/admin/billing/${billId}/upload-bill`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billPdfUrl: url }),
      });
      if (!saveRes.ok) throw new Error("Save failed");

      setUploadingBillId(null);
      setUploadingFile(null);
      refetchBills();
      alert("✅ Bill uploaded successfully!");
    } catch {
      alert("❌ Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Approve screenshot
  const handleApprove = async (billId: number) => {
    const res = await fetch(`/api/admin/billing/${billId}/approve-screenshot`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" } });
    if (res.ok) { refetchScreenshots(); refetchBills(); alert("✅ Payment approved!"); }
    else alert("❌ Failed to approve.");
  };

  // Reject screenshot
  const handleReject = async (billId: number) => {
    const res = await fetch(`/api/admin/billing/${billId}/reject-screenshot`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    if (res.ok) { setRejectBillId(null); setRejectReason(""); refetchScreenshots(); alert("Screenshot rejected."); }
    else alert("❌ Failed to reject.");
  };

  // Upload QR code image
  const handleQrUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/media/upload", { method: "POST", credentials: "include", body: formData });
    if (res.ok) {
      const { url } = await res.json();
      setSettingsForm((f) => ({ ...f, qrCodeUrl: url }));
      setQrPreview(url);
    }
  };

  // Save payment settings
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      if (res.ok) { alert("✅ Payment settings saved!"); queryClient.invalidateQueries({ queryKey: ["site-settings"] }); }
      else alert("❌ Failed to save settings.");
    } catch { alert("❌ Error saving settings."); }
    finally { setSavingSettings(false); }
  };

  const tabStyle = (t: string) => ({
    padding: "10px 20px", borderRadius: "8px", border: "none", fontWeight: "600", fontSize: "14px", cursor: "pointer",
    background: activeTab === t ? "#0d3e83" : "white", color: activeTab === t ? "white" : "#6b7280",
    boxShadow: activeTab === t ? "0 2px 4px rgba(22,163,74,0.3)" : "0 1px 2px rgba(0,0,0,0.1)",
    transition: "all 0.2s",
  } as React.CSSProperties);

  const monthName = new Date(2025, new Date().getMonth()).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <AdminLayout>
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)", padding: "2rem" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: "2rem" }}>
            <button onClick={() => setLocation("/admin")} style={{ background: "white", border: "1px solid #e5e7eb", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", marginBottom: "1rem" }}>
              ← Back to Admin
            </button>
            <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#111827", margin: "0 0 8px 0" }}>📑 Billing Management</h1>
            <p style={{ color: "#6b7280", margin: 0 }}>Current Month: {monthName}</p>
          </div>

          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            {[
              { label: "Total Bills", value: stats.total, color: "#3b82f6" },
              { label: "Unpaid", value: stats.unpaid, color: "#ef4444" },
              { label: "Paid", value: stats.paid, color: "#10b981" },
              { label: "Overdue", value: stats.overdue, color: "#f59e0b" },
              { label: "Revenue Collected", value: `₹${stats.collected.toLocaleString()}`, color: "#8b5cf6" },
              { label: "Pending Revenue", value: `₹${stats.pending.toLocaleString()}`, color: "#f97316" },
              { label: "Pending Screenshots", value: stats.pendingScreenshots, color: "#0ea5e9" },
            ].map((kpi) => (
              <div key={kpi.label} style={S.card}>
                <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 8px 0" }}>{kpi.label}</p>
                <p style={{ fontSize: "1.8rem", fontWeight: "bold", color: kpi.color, margin: 0 }}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <button style={tabStyle("bills")} onClick={() => setActiveTab("bills")}>📋 All Bills</button>
            <button style={tabStyle("screenshots")} onClick={() => setActiveTab("screenshots")}>
              📸 Payment Screenshots {stats.pendingScreenshots > 0 && <span style={{ background: "#ef4444", color: "white", borderRadius: "50%", width: "20px", height: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", marginLeft: "6px" }}>{stats.pendingScreenshots}</span>}
            </button>
            <button style={tabStyle("settings")} onClick={() => { setActiveTab("settings"); setSettingsLoaded(false); }}>⚙️ Payment Settings</button>
          </div>

          {/* ─── TAB: All Bills ─── */}
          {activeTab === "bills" && (
            <>
              {/* Status Filter */}
              <div style={{ ...S.card, marginBottom: "1.5rem" }}>
                <p style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 0.75rem 0" }}>Filter by Status</p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {["all", "unpaid", "paid", "overdue"].map((s) => (
                    <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "7px 16px", borderRadius: "8px", border: statusFilter === s ? "2px solid #22c55e" : "1px solid #e5e7eb", background: statusFilter === s ? "#dcfce7" : "white", color: statusFilter === s ? "#15803d" : "#6b7280", cursor: "pointer", fontWeight: statusFilter === s ? "600" : "400" }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bills Table */}
              <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                        {["#", "User", "Month", "Amount", "Status", "Bill PDF", "Screenshot", "Due Date", "Actions"].map((h) => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(bills as Bill[]).map((bill, index) => (
                        <tr key={bill.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "12px 16px", fontSize: "13px", color: "#9ca3af" }}>{index + 1}</td>
                          <td style={{ padding: "12px 16px", fontSize: "13px", color: "#111827", fontWeight: "500", whiteSpace: "nowrap" }}>
                            {bill.user?.firstName} {bill.user?.lastName}
                            <br />
                            <span style={{ color: "#9ca3af", fontSize: "11px" }}>{bill.user?.email}</span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>
                            {new Date(bill.year, bill.month - 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "600" }}>₹{Number(bill.finalAmount).toLocaleString()}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={S.badge(bill.status === "paid" ? "#065f46" : bill.status === "overdue" ? "#991b1b" : "#92400e", bill.status === "paid" ? "#d1fae5" : bill.status === "overdue" ? "#fee2e2" : "#fef3c7")}>
                              {bill.status === "paid" ? "✅ Paid" : bill.status === "overdue" ? "⚠️ Overdue" : "⏳ Unpaid"}
                            </span>
                          </td>

                          {/* Bill PDF column */}
                          <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                            {bill.billPdfUrl ? (
                              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                <a href={bill.billPdfUrl} target="_blank" rel="noopener noreferrer" style={{ ...S.btn("#8b5cf6"), textDecoration: "none" }}>📄 View</a>
                                <button onClick={() => { setUploadingBillId(bill.id); setUploadingFile(null); }} style={S.btn("#6b7280")}>↻ Replace</button>
                              </div>
                            ) : (
                              <button onClick={() => { setUploadingBillId(bill.id); setUploadingFile(null); }} style={S.btn("#8b5cf6")}>
                                📤 Upload Bill
                              </button>
                            )}
                          </td>

                          {/* Screenshot status column */}
                          <td style={{ padding: "12px 16px" }}>
                            {screenshotBadge(bill.paymentScreenshotStatus) || <span style={{ color: "#9ca3af", fontSize: "12px" }}>—</span>}
                          </td>

                          <td style={{ padding: "12px 16px", fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>
                            {new Date(bill.dueDate).toLocaleDateString()}
                          </td>
                          <td style={{ padding: "12px 16px", display: "flex", gap: "6px", alignItems: "center", flexWrap: "nowrap" }}>
                            <button onClick={() => setLocation(`/admin/billing/${bill.id}`)} style={S.btn("#3b82f6")}>View</button>
                            <a href={`/api/bills/${bill.id}/pdf`} download style={{ ...S.btn("#0d3e83"), textDecoration: "none" }}>PDF</a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bills.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No bills found</div>}
                </div>
              </div>
            </>
          )}

          {/* ─── TAB: Payment Screenshots ─── */}
          {activeTab === "screenshots" && (
            <div style={{ ...S.card }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#111827", margin: "0 0 1.5rem 0" }}>📸 Payment Screenshots — Review & Approve</h2>

              {(screenshots as Bill[]).length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
                  <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</p>
                  <p style={{ fontWeight: "600" }}>No payment screenshots submitted yet.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "1.5rem" }}>
                  {(screenshots as Bill[]).map((bill) => (
                    <div key={bill.id} style={{ border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden" }}>
                      {/* Bill header */}
                      <div style={{ background: "#f9fafb", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div>
                          <p style={{ fontWeight: "700", color: "#111827", margin: "0 0 4px 0" }}>{bill.user?.firstName} {bill.user?.lastName} — {new Date(bill.year, bill.month - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
                          <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>Amount: <strong>₹{Number(bill.finalAmount).toLocaleString()}</strong> · {bill.user?.email}</p>
                        </div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          {screenshotBadge(bill.paymentScreenshotStatus)}
                          {bill.paymentScreenshotUploadedAt && (
                            <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                              Uploaded {new Date(bill.paymentScreenshotUploadedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Screenshot preview + actions */}
                      <div style={{ padding: "1.5rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                        {bill.paymentScreenshotUrl && (
                          <div style={{ flexShrink: 0 }}>
                            <p style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", margin: "0 0 8px 0" }}>Payment Screenshot:</p>
                            <a href={bill.paymentScreenshotUrl} target="_blank" rel="noopener noreferrer">
                              <img
                                src={bill.paymentScreenshotUrl}
                                alt="Payment screenshot"
                                style={{ width: "200px", height: "200px", objectFit: "contain", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#f9fafb", cursor: "pointer" }}
                              />
                            </a>
                            <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>Click to view full size</p>
                          </div>
                        )}

                        <div style={{ flex: 1, minWidth: "200px" }}>
                          <p style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", margin: "0 0 12px 0" }}>Admin Actions:</p>

                          {bill.paymentScreenshotStatus === "pending_review" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                              <button
                                onClick={() => handleApprove(bill.id)}
                                style={{ ...S.btn("#10b981"), justifyContent: "center", padding: "10px 20px" }}
                              >
                                ✅ Approve & Mark Paid
                              </button>
                              <button
                                onClick={() => setRejectBillId(bill.id)}
                                style={{ ...S.btn("#ef4444"), justifyContent: "center", padding: "10px 20px" }}
                              >
                                ❌ Reject Screenshot
                              </button>
                            </div>
                          )}

                          {bill.paymentScreenshotStatus === "approved" && (
                            <div style={{ background: "#d1fae5", color: "#065f46", padding: "12px 16px", borderRadius: "8px", fontWeight: "600", fontSize: "14px" }}>
                              ✅ Payment Confirmed
                            </div>
                          )}

                          {bill.paymentScreenshotStatus === "rejected" && (
                            <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "8px", fontWeight: "600", fontSize: "14px" }}>
                              ❌ Screenshot Rejected — waiting for user to re-upload
                            </div>
                          )}

                          <div style={{ marginTop: "12px" }}>
                            <button onClick={() => setLocation(`/admin/billing/${bill.id}`)} style={S.btn("#3b82f6")}>
                              📋 View Full Bill
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Reject reason input */}
                      {rejectBillId === bill.id && (
                        <div style={{ borderTop: "1px solid #f3f4f6", padding: "1rem 1.5rem", background: "#fff7f7" }}>
                          <p style={{ fontSize: "13px", fontWeight: "600", color: "#dc2626", margin: "0 0 8px 0" }}>Rejection Reason (optional):</p>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <input
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="e.g. Screenshot is blurry or amount is wrong"
                              style={{ flex: 1, padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "13px" }}
                            />
                            <button onClick={() => handleReject(bill.id)} style={S.btn("#ef4444")}>Confirm Reject</button>
                            <button onClick={() => setRejectBillId(null)} style={S.btn("#6b7280")}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: Payment Settings ─── */}
          {activeTab === "settings" && (
            <div style={{ ...S.card, maxWidth: "680px" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#111827", margin: "0 0 1.5rem 0" }}>⚙️ Payment Settings</h2>
              <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 1.5rem 0" }}>
                These details are shown to users when they click "Pay Now". Set your UPI ID, bank account, and QR code so customers can transfer payment directly to you.
              </p>

              <div style={{ display: "grid", gap: "1.25rem" }}>
                {/* Enable/disable */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                  <div>
                    <p style={{ fontWeight: "700", color: "#166534", margin: "0 0 4px 0" }}>Enable Payment Details for Users</p>
                    <p style={{ fontSize: "13px", color: "#4ade80", margin: 0 }}>Show UPI/bank details to users on billing page</p>
                  </div>
                  <label style={{ position: "relative", display: "inline-block", width: "52px", height: "28px", cursor: "pointer" }}>
                    <input type="checkbox" checked={settingsForm.isOnlinePaymentEnabled} onChange={(e) => setSettingsForm((f) => ({ ...f, isOnlinePaymentEnabled: e.target.checked }))} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: "absolute", inset: 0, borderRadius: "28px", background: settingsForm.isOnlinePaymentEnabled ? "#0d3e83" : "#d1d5db", transition: "0.3s" }}>
                      <span style={{ position: "absolute", top: "3px", left: settingsForm.isOnlinePaymentEnabled ? "26px" : "3px", width: "22px", height: "22px", background: "white", borderRadius: "50%", transition: "0.3s" }} />
                    </span>
                  </label>
                </div>

                {/* UPI ID */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>UPI ID</label>
                  <input value={settingsForm.upiId} onChange={(e) => setSettingsForm((f) => ({ ...f, upiId: e.target.value }))}
                    placeholder="e.g. gauranitai@upi"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>

                {/* Bank Name */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Bank Name</label>
                  <input value={settingsForm.bankName} onChange={(e) => setSettingsForm((f) => ({ ...f, bankName: e.target.value }))}
                    placeholder="e.g. State Bank of India"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Account Number</label>
                  <input value={settingsForm.accountNumber} onChange={(e) => setSettingsForm((f) => ({ ...f, accountNumber: e.target.value }))}
                    placeholder="e.g. 1234567890"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>

                {/* IFSC */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>IFSC Code</label>
                  <input value={settingsForm.ifscCode} onChange={(e) => setSettingsForm((f) => ({ ...f, ifscCode: e.target.value }))}
                    placeholder="e.g. SBIN0012345"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>

                {/* QR Code Upload */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>QR Code Image</label>
                  <input ref={qrInputRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setQrFile(f);
                      const reader = new FileReader();
                      reader.onload = (ev) => setQrPreview(ev.target?.result as string);
                      reader.readAsDataURL(f);
                      handleQrUpload(f);
                    }}
                  />
                  {qrPreview ? (
                    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                      <img src={qrPreview} alt="QR Code" style={{ width: "140px", height: "140px", objectFit: "contain", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
                      <div>
                        <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>✅ QR Code uploaded</p>
                        <button onClick={() => qrInputRef.current?.click()} style={S.btn("#8b5cf6")}>📤 Replace QR</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => qrInputRef.current?.click()}
                      style={{ width: "100%", padding: "2rem", border: "2px dashed #d1d5db", borderRadius: "8px", background: "#f9fafb", cursor: "pointer", color: "#6b7280", fontWeight: "600", fontSize: "14px" }}>
                      📤 Click to upload QR code image
                    </button>
                  )}
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  style={{ ...S.btn("#0d3e83"), justifyContent: "center", padding: "12px 24px", fontSize: "15px", opacity: savingSettings ? 0.6 : 1 }}
                >
                  {savingSettings ? "Saving..." : "💾 Save Payment Settings"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Bill PDF Upload Modal */}
      {uploadingBillId !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "2rem", width: "440px", maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontWeight: "bold", fontSize: "1.1rem", color: "#111827", margin: 0 }}>📤 Upload Bill / PDF for Customer</h3>
              <button onClick={() => { setUploadingBillId(null); setUploadingFile(null); }} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#9ca3af" }}>×</button>
            </div>
            <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "1rem" }}>Upload a PDF or image bill for this customer. They will see a download link on their billing page.</p>

            <input ref={fileInputRef} type="file" accept=".pdf,image/*" style={{ display: "none" }}
              onChange={(e) => setUploadingFile(e.target.files?.[0] || null)}
            />

            {uploadingFile ? (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px 16px", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#166534" }}>📎 {uploadingFile.name}</span>
                <button onClick={() => setUploadingFile(null)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "16px" }}>×</button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()}
                style={{ display: "block", width: "100%", padding: "1.5rem", border: "2px dashed #d1d5db", borderRadius: "8px", background: "#f9fafb", cursor: "pointer", color: "#6b7280", fontWeight: "600", marginBottom: "1rem", textAlign: "center" }}>
                📁 Click to select PDF or image
              </button>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => handleUploadBillPdf(uploadingBillId!)}
                disabled={!uploadingFile || isUploading}
                style={{ ...S.btn("#0d3e83"), flex: 1, justifyContent: "center", padding: "10px", opacity: !uploadingFile || isUploading ? 0.5 : 1 }}
              >
                {isUploading ? "Uploading..." : "📤 Upload Bill"}
              </button>
              <button onClick={() => { setUploadingBillId(null); setUploadingFile(null); }} style={S.btn("#6b7280")}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
