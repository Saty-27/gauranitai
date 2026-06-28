import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useRef } from "react";

interface BillDetail {
  id: number;
  userId: string;
  month: number;
  year: number;
  items: any[];
  subscriptionTotal: number;
  ordersTotal: number;
  penalty: number;
  discount: number;
  finalAmount: number;
  status: string;
  dueDate: string;
  paymentDate?: string;
  billPdfUrl?: string | null;
  paymentScreenshotUrl?: string | null;
  paymentScreenshotStatus?: string | null;
  paymentScreenshotUploadedAt?: string | null;
  user?: { firstName?: string; lastName?: string; email?: string; phone?: string };
}

const btnStyle = (color: string) => ({
  background: color, color: "white", border: "none", padding: "10px 16px",
  borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "14px",
} as React.CSSProperties);

export default function AdminBillingDetailPage() {
  const [location, setLocation] = useLocation();
  const billId = parseInt(location.split("/").pop() || "0");
  const [actionMode, setActionMode] = useState<"none" | "extend" | "penalty" | "discount">("none");
  const [actionValue, setActionValue] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [isUploadingBill, setIsUploadingBill] = useState(false);
  const [billFile, setBillFile] = useState<File | null>(null);
  const billFileRef = useRef<HTMLInputElement>(null);

  const { data: bill, refetch } = useQuery({
    queryKey: ["admin-bill-detail", billId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/admin/billing/${billId}`, { credentials: "include" });
        return res.ok ? res.json() : null;
      } catch { return null; }
    },
  });

  const handleAction = async (action: string) => {
    if (!bill) return;
    if (action !== "mark-paid" && !actionValue) return;
    try {
      let endpoint = "";
      let body: any = {};
      if (action === "extend") { endpoint = `/api/admin/billing/${billId}/extend-due`; body = { newDueDate: actionValue }; }
      else if (action === "penalty") { endpoint = `/api/admin/billing/${billId}/penalty`; body = { penaltyAmount: parseFloat(actionValue) }; }
      else if (action === "discount") { endpoint = `/api/admin/billing/${billId}/discount`; body = { discountAmount: parseFloat(actionValue) }; }
      else if (action === "mark-paid") { endpoint = `/api/admin/billing/${billId}/mark-paid`; body = { paymentMethod: "manual" }; }

      const res = await fetch(endpoint, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { setActionMode("none"); setActionValue(""); refetch(); }
    } catch (error) { console.error("Action failed:", error); }
  };

  const handleApproveScreenshot = async () => {
    const res = await fetch(`/api/admin/billing/${billId}/approve-screenshot`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }
    });
    if (res.ok) { refetch(); alert("✅ Payment approved! Bill marked as paid."); }
    else alert("❌ Failed to approve.");
  };

  const handleRejectScreenshot = async () => {
    const res = await fetch(`/api/admin/billing/${billId}/reject-screenshot`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    if (res.ok) { setShowRejectInput(false); setRejectReason(""); refetch(); alert("Screenshot rejected."); }
    else alert("❌ Failed to reject.");
  };

  const handleUploadBill = async () => {
    if (!billFile) return;
    setIsUploadingBill(true);
    try {
      const formData = new FormData();
      formData.append("file", billFile);
      const uploadRes = await fetch("/api/admin/media/upload", { method: "POST", credentials: "include", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      const saveRes = await fetch(`/api/admin/billing/${billId}/upload-bill`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billPdfUrl: url }),
      });
      if (!saveRes.ok) throw new Error("Save failed");
      setBillFile(null);
      refetch();
      alert("✅ Bill uploaded successfully!");
    } catch { alert("❌ Upload failed."); }
    finally { setIsUploadingBill(false); }
  };

  if (!bill) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Loading bill details...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)", padding: "2rem" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <button onClick={() => setLocation("/admin/billing")} style={{ background: "white", border: "1px solid #e5e7eb", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
            ← Back to Bills
          </button>
          <a href={`/api/bills/${billId}/pdf`} download={`invoice_${bill.user?.firstName || "user"}_${bill.month}_${bill.year}.pdf`}
            style={{ background: "#0d3e83", color: "white", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", textDecoration: "none", fontSize: "14px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "8px" }}>
            📥 Download Invoice PDF
          </a>
        </div>

        {/* Bill Summary Card */}
        <div style={{ background: "white", padding: "2rem", borderRadius: "12px", marginBottom: "2rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", margin: "0 0 8px 0" }}>
              Bill for {bill.user?.firstName} {bill.user?.lastName}
            </h1>
            <p style={{ color: "#6b7280", margin: 0 }}>
              {new Date(bill.year, bill.month - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
            {[
              { label: "Subscription Total", value: `₹${Number(bill.subscriptionTotal).toLocaleString()}`, color: "#10b981" },
              { label: "Orders Total", value: `₹${Number(bill.ordersTotal).toLocaleString()}`, color: "#3b82f6" },
              { label: "Penalty", value: `₹${Number(bill.penalty).toLocaleString()}`, color: "#ef4444" },
              { label: "Discount", value: `-₹${Number(bill.discount).toLocaleString()}`, color: "#f59e0b" },
            ].map((item) => (
              <div key={item.label}>
                <p style={{ color: "#6b7280", fontSize: "12px", fontWeight: "600", margin: "0 0 8px 0", textTransform: "uppercase" }}>{item.label}</p>
                <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: item.color, margin: 0 }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div style={{ background: "#f0fdf4", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 8px 0" }}>Final Amount Payable</p>
            <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#15803d", margin: 0 }}>₹{Number(bill.finalAmount).toLocaleString()}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <p style={{ color: "#6b7280", fontSize: "12px", fontWeight: "600", margin: 0 }}>Status</p>
              <p style={{ fontSize: "18px", fontWeight: "600", color: bill.status === "paid" ? "#10b981" : "#f59e0b", margin: "4px 0 0 0" }}>
                {bill.status === "paid" ? "✅ Paid" : "⏳ Unpaid"}
              </p>
            </div>
            <div>
              <p style={{ color: "#6b7280", fontSize: "12px", fontWeight: "600", margin: 0 }}>Due Date</p>
              <p style={{ fontSize: "18px", fontWeight: "600", color: "#111827", margin: "4px 0 0 0" }}>{new Date(bill.dueDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Bill Items Table */}
        <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", marginBottom: "2rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Type", "Product", "Qty", "Price", "Total"].map((h) => (
                  <th key={h} style={{ padding: "1rem", textAlign: h === "Type" || h === "Product" ? "left" : "right", fontSize: "14px", fontWeight: "600", color: "#374151" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bill.items?.map((item: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "1rem" }}>
                    <span style={{ background: item.type === "subscription" ? "#dbeafe" : "#f3e8ff", color: item.type === "subscription" ? "#1e40af" : "#6b21a8", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>{item.type}</span>
                  </td>
                  <td style={{ padding: "1rem", fontSize: "14px", color: "#111827" }}>{item.productName}</td>
                  <td style={{ padding: "1rem", fontSize: "14px", color: "#6b7280", textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ padding: "1rem", fontSize: "14px", color: "#6b7280", textAlign: "right" }}>₹{Number(item.pricePerUnit).toLocaleString()}</td>
                  <td style={{ padding: "1rem", fontSize: "14px", fontWeight: "600", color: "#111827", textAlign: "right" }}>₹{Number(item.total).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Upload Bill PDF for Customer */}
        <div style={{ background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#111827", margin: "0 0 0.75rem 0" }}>📤 Upload Bill / Invoice for Customer</h3>
          <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 1rem 0" }}>The customer will see a "Download Bill" button on their billing page.</p>

          {bill.billPdfUrl && (
            <div style={{ background: "#f0fdf4", padding: "10px 14px", borderRadius: "8px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#166534" }}>📄 Bill already uploaded</span>
              <a href={bill.billPdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0d3e83", fontSize: "13px", fontWeight: "600" }}>View ↗</a>
            </div>
          )}

          <input ref={billFileRef} type="file" accept=".pdf,image/*" style={{ display: "none" }} onChange={(e) => setBillFile(e.target.files?.[0] || null)} />
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => billFileRef.current?.click()} style={btnStyle("#8b5cf6")}>
              📁 {billFile ? billFile.name : "Select PDF / Image"}
            </button>
            {billFile && (
              <button onClick={handleUploadBill} disabled={isUploadingBill} style={{ ...btnStyle("#0d3e83"), opacity: isUploadingBill ? 0.6 : 1 }}>
                {isUploadingBill ? "Uploading..." : "📤 Upload"}
              </button>
            )}
            {billFile && <button onClick={() => setBillFile(null)} style={btnStyle("#6b7280")}>Cancel</button>}
          </div>
        </div>

        {/* Payment Screenshot Review */}
        {bill.paymentScreenshotUrl && (
          <div style={{ background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#111827", margin: "0 0 1.5rem 0" }}>📸 Customer Payment Screenshot</h3>

            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              <div>
                <a href={bill.paymentScreenshotUrl} target="_blank" rel="noopener noreferrer">
                  <img src={bill.paymentScreenshotUrl} alt="Payment screenshot"
                    style={{ width: "220px", height: "220px", objectFit: "contain", border: "1px solid #e5e7eb", borderRadius: "10px", background: "#f9fafb", cursor: "pointer" }} />
                </a>
                <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>Click to view full size</p>
                {bill.paymentScreenshotUploadedAt && (
                  <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                    Uploaded: {new Date(bill.paymentScreenshotUploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
              </div>

              <div style={{ flex: 1, minWidth: "200px" }}>
                <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151", margin: "0 0 12px 0" }}>
                  Screenshot Status:{" "}
                  {bill.paymentScreenshotStatus === "pending_review" && <span style={{ color: "#d97706" }}>⏳ Pending Review</span>}
                  {bill.paymentScreenshotStatus === "approved" && <span style={{ color: "#059669" }}>✅ Approved</span>}
                  {bill.paymentScreenshotStatus === "rejected" && <span style={{ color: "#dc2626" }}>❌ Rejected</span>}
                </p>

                {bill.paymentScreenshotStatus === "pending_review" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button onClick={handleApproveScreenshot} style={{ ...btnStyle("#10b981"), justifyContent: "center" as any }}>
                      ✅ Approve — Mark Bill as Paid
                    </button>
                    <button onClick={() => setShowRejectInput(!showRejectInput)} style={{ ...btnStyle("#ef4444"), justifyContent: "center" as any }}>
                      ❌ Reject Screenshot
                    </button>
                    {showRejectInput && (
                      <div style={{ background: "#fff7f7", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px" }}>
                        <p style={{ fontSize: "13px", fontWeight: "600", color: "#dc2626", margin: "0 0 8px 0" }}>Rejection reason (optional):</p>
                        <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="e.g. Blurry or amount mismatch"
                          style={{ width: "100%", padding: "8px 12px", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" as any, marginBottom: "8px" }}
                        />
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={handleRejectScreenshot} style={btnStyle("#ef4444")}>Confirm Reject</button>
                          <button onClick={() => setShowRejectInput(false)} style={btnStyle("#6b7280")}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {bill.paymentScreenshotStatus === "approved" && (
                  <div style={{ background: "#d1fae5", color: "#065f46", padding: "12px 16px", borderRadius: "8px", fontWeight: "600" }}>
                    ✅ Payment Confirmed — Bill Marked as Paid
                  </div>
                )}
                {bill.paymentScreenshotStatus === "rejected" && (
                  <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "8px", fontWeight: "600" }}>
                    ❌ Screenshot Rejected — Awaiting re-upload from customer
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Admin Actions */}
        <div style={{ background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#111827", margin: "0 0 1.5rem 0" }}>🔧 Admin Actions</h3>

          {actionMode === "none" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
              {bill.status !== "paid" && (
                <button onClick={() => handleAction("mark-paid")} style={btnStyle("#10b981")}>✅ Mark as Paid</button>
              )}
              <button onClick={() => setActionMode("extend")} style={btnStyle("#3b82f6")}>📅 Extend Due Date</button>
              <button onClick={() => setActionMode("penalty")} style={btnStyle("#ef4444")}>⚠️ Add Penalty</button>
              <button onClick={() => setActionMode("discount")} style={btnStyle("#f59e0b")}>💰 Add Discount</button>
            </div>
          ) : (
            <div style={{ background: "#f9fafb", padding: "1.5rem", borderRadius: "8px" }}>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#111827", margin: "0 0 1rem 0" }}>
                {actionMode === "extend" && "Enter new due date:"}
                {actionMode === "penalty" && "Enter penalty amount (₹):"}
                {actionMode === "discount" && "Enter discount amount (₹):"}
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input type={actionMode === "extend" ? "date" : "number"} value={actionValue} onChange={(e) => setActionValue(e.target.value)}
                  placeholder={actionMode === "extend" ? "" : "Amount"}
                  style={{ flex: 1, padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "14px" }}
                />
                <button onClick={() => handleAction(actionMode)} style={btnStyle("#22c55e")}>Save</button>
                <button onClick={() => { setActionMode("none"); setActionValue(""); }} style={btnStyle("#6b7280")}>Cancel</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
