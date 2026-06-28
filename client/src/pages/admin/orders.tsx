import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Filter } from "lucide-react";
import AdminLayout from "@/components/layout/admin-layout";
import { useToast } from "@/hooks/use-toast";

export default function OrdersAdmin() {
  const [location] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Modal states
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-orders", statusFilter],
    queryFn: async () => {
      try {
        const url = statusFilter ? `/api/admin/orders?status=${statusFilter}` : "/api/admin/orders";
        const res = await fetch(url, { credentials: "include" });
        return res.ok ? res.json() : [];
      } catch {
        return [];
      }
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status, paymentStatus }: any) => {
      const res = await fetch(`/api/admin/orders/${orderId}/update-status`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, paymentStatus }),
      });
      if (!res.ok) throw new Error("Failed to update order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "✅ Order updated!" });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: `❌ ${error.message}`, variant: "destructive" });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "🗑️ Order deleted successfully" });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: `❌ ${error.message}`, variant: "destructive" });
    },
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o: any) => o.status === "PENDING").length;
  const deliveredOrders = orders.filter((o: any) => o.status === "DELIVERED").length;

  const filteredOrders = orders.filter((order: any) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    const orderIdMatch = String(order.id).includes(term);
    const customerName = order.customer
      ? `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.toLowerCase()
      : "";
    const customerNameMatch = customerName.includes(term);
    const phoneMatch = order.customer?.phone?.toLowerCase().includes(term) || false;
    const emailMatch = order.customer?.email?.toLowerCase().includes(term) || false;
    const statusMatch = order.status?.toLowerCase().includes(term) || false;
    const paymentStatusMatch = order.paymentStatus?.toLowerCase().includes(term) || false;
    
    const productsMatch = order.items?.some((item: any) =>
      item.product?.name?.toLowerCase().includes(term)
    ) || false;

    return orderIdMatch || customerNameMatch || phoneMatch || emailMatch || statusMatch || paymentStatusMatch || productsMatch;
  });

  return (
    <AdminLayout>
      <div style={{ padding: "1.5rem" }}>
        {/* Header & Filters */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", margin: "0 0 1rem 0" }}>
            📦 Orders Management
          </h2>
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
                All Orders ({totalOrders})
              </button>
              <button
                onClick={() => setStatusFilter("PENDING")}
                style={{
                  padding: "0.5rem 1rem",
                  background: statusFilter === "PENDING" ? "#f59e0b" : "#e5e7eb",
                  color: statusFilter === "PENDING" ? "white" : "#374151",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                }}
              >
                ⏳ Pending ({pendingOrders})
              </button>
              <button
                onClick={() => setStatusFilter("DELIVERED")}
                style={{
                  padding: "0.5rem 1rem",
                  background: statusFilter === "DELIVERED" ? "#10b981" : "#e5e7eb",
                  color: statusFilter === "DELIVERED" ? "white" : "#374151",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                }}
              >
                ✅ Delivered ({deliveredOrders})
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
          <div style={{ background: "white", border: "2px solid #10b981", borderRadius: "0.5rem", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>Total Orders</p>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", margin: "0.5rem 0 0 0" }}>{totalOrders}</p>
          </div>
          <div style={{ background: "white", border: "2px solid #f59e0b", borderRadius: "0.5rem", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>Pending</p>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f59e0b", margin: "0.5rem 0 0 0" }}>{pendingOrders}</p>
          </div>
          <div style={{ background: "white", border: "2px solid #10b981", borderRadius: "0.5rem", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>Delivered</p>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#10b981", margin: "0.5rem 0 0 0" }}>{deliveredOrders}</p>
          </div>
        </div>

        {/* Orders Table */}
        <div style={{ background: "white", borderRadius: "0.5rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflowX: "auto" }}>
          {isLoading ? (
            <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>Loading orders...</p>
          ) : filteredOrders.length === 0 ? (
            <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>No matching orders found</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
                <tr>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Order ID</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Customer</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Items</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Amount</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Status & Payment</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Date</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", fontFamily: "monospace", color: "#3b82f6", fontWeight: "600" }}>
                      #{order.id}
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#374151" }}>
                      {order.customer ? (
                        order.userId ? (
                          <Link href={`/admin/customers/${order.userId}`}>
                            <div style={{ color: "#3b82f6", cursor: "pointer", textDecoration: "underline", fontWeight: "600" }}>
                              {`${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim() || "No Name"}
                            </div>
                            {order.customer.phone && (
                              <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                                📞 {order.customer.phone}
                              </div>
                            )}
                          </Link>
                        ) : (
                          <div>
                            <div style={{ fontWeight: "600", color: "#1f2937" }}>
                              {`${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim() || "Guest Customer"}
                              <span style={{ fontSize: "0.7rem", backgroundColor: "#dbeafe", color: "#1e40af", padding: "0.1rem 0.3rem", borderRadius: "0.25rem", marginLeft: "0.5rem", fontWeight: "bold" }}>Guest</span>
                            </div>
                            {order.customer.phone && (
                              <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                                📞 {order.customer.phone}
                              </div>
                            )}
                          </div>
                        )
                      ) : (
                        <span style={{ color: "#9ca3af" }}>
                          Guest User
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#374151", maxWidth: "250px" }}>
                      {order.items && order.items.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          {order.items.map((item: any, itemIdx: number) => (
                            <div key={itemIdx} style={{ fontSize: "0.825rem", color: "#1f2937" }}>
                              • <span style={{ fontWeight: "600" }}>{item.product?.name || "Product"}</span> x {item.quantity}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: "#9ca3af", fontStyle: "italic" }}>{order.liters ? `${order.liters}L Milk` : "No products"}</span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", fontWeight: "600", color: "#10b981" }}>
                      ₹{parseFloat(order.totalAmount || "0").toLocaleString()}
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "0.25rem",
                            background: order.status === "PENDING" ? "#fef3c7" : "#d1fae5",
                            color: order.status === "PENDING" ? "#92400e" : "#065f46",
                            fontWeight: "600",
                            fontSize: "0.75rem",
                          }}
                        >
                          {order.status}
                        </span>
                        {order.paymentStatus && (
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0.25rem 0.75rem",
                              borderRadius: "0.25rem",
                              background: order.paymentStatus === "paid" ? "#d1fae5" : "#fee2e2",
                              color: order.paymentStatus === "paid" ? "#065f46" : "#991b1b",
                              fontWeight: "600",
                              fontSize: "0.75rem",
                            }}
                          >
                            💳 {order.paymentStatus}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#6b7280" }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.75rem", display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        style={{ padding: "0.25rem 0.5rem", background: "#4b5563", color: "white", border: "none", borderRadius: "0.25rem", cursor: "pointer", fontWeight: "600" }}
                      >
                        👁️ Details
                      </button>
                      <button
                        onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: "DELIVERED" })}
                        style={{ padding: "0.25rem 0.5rem", background: "#10b981", color: "white", border: "none", borderRadius: "0.25rem", cursor: "pointer", fontWeight: "600" }}
                      >
                        ✅ Deliver
                      </button>
                      <button
                        onClick={() => updateOrderMutation.mutate({ orderId: order.id, paymentStatus: "paid" })}
                        style={{ padding: "0.25rem 0.5rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "0.25rem", cursor: "pointer", fontWeight: "600" }}
                      >
                        💳 Pay
                      </button>
                      <button
                        onClick={() => setConfirmCancel(order.id)}
                        style={{ padding: "0.25rem 0.5rem", background: "#ef4444", color: "white", border: "none", borderRadius: "0.25rem", cursor: "pointer", fontWeight: "600" }}
                      >
                        ✕ Cancel
                      </button>
                      <button
                        onClick={() => setConfirmDelete(order.id)}
                        style={{ padding: "0.25rem 0.5rem", background: "#7f1d1d", color: "white", border: "none", borderRadius: "0.25rem", cursor: "pointer", fontWeight: "600" }}
                      >
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modals */}
        {confirmCancel && (
          <Modal
            title="Cancel Order"
            message={`Are you sure you want to cancel order #${confirmCancel}?`}
            confirmText="Yes, Cancel"
            confirmColor="#ef4444"
            onConfirm={() => {
              updateOrderMutation.mutate({ orderId: confirmCancel, status: "CANCELLED" });
              setConfirmCancel(null);
            }}
            onCancel={() => setConfirmCancel(null)}
          />
        )}

        {confirmDelete && (
          <Modal
            title="Delete Order"
            message={`Are you sure you want to permanently DELETE order #${confirmDelete}? This action cannot be undone.`}
            confirmText="Delete Forever"
            confirmColor="#7f1d1d"
            onConfirm={() => {
              deleteOrderMutation.mutate(confirmDelete);
              setConfirmDelete(null);
            }}
            onCancel={() => setConfirmDelete(null)}
          />
        )}

        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// Simple Modal Component
function Modal({ title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", confirmColor = "#ef4444" }: any) {
  return (
    <div style={{
      fixed: "fixed",
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "1rem"
    }}>
      <div style={{
        background: "white",
        padding: "2rem",
        borderRadius: "0.75rem",
        maxWidth: "400px",
        width: "100%",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}>
        <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#111827" }}>{title}</h3>
        <p style={{ color: "#4b5563", marginBottom: "2rem", lineHeight: "1.5" }}>{message}</p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "0.625rem 1.25rem",
              background: "#f3f4f6",
              color: "#374151",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.875rem"
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "0.625rem 1.25rem",
              background: confirmColor,
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.875rem"
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Order Details Modal Component
function OrderDetailsModal({ order, onClose }: any) {
  const customerName = order.customer
    ? `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim()
    : "Unknown Customer";

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "1rem"
    }}>
      <div style={{
        background: "white",
        padding: "2rem",
        borderRadius: "0.75rem",
        maxWidth: "600px",
        width: "100%",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.75rem" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#111827", margin: 0 }}>
            📦 Order Details: #{order.id}
          </h3>
          <button 
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "#9ca3af" }}
          >
            ✕
          </button>
        </div>

        {/* Customer & Order Metadata */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
          <div>
            <h4 style={{ fontWeight: "bold", fontSize: "0.875rem", color: "#4b5563", marginBottom: "0.5rem", textTransform: "uppercase" }}>
              Customer Information
            </h4>
            <p style={{ margin: "0.25rem 0", fontSize: "0.875rem" }}>
              <strong>Name:</strong> {customerName}
            </p>
            <p style={{ margin: "0.25rem 0", fontSize: "0.875rem" }}>
              <strong>Phone:</strong> {order.customer?.phone || "N/A"}
            </p>
            <p style={{ margin: "0.25rem 0", fontSize: "0.875rem" }}>
              <strong>Email:</strong> {order.customer?.email || "N/A"}
            </p>
            <p style={{ margin: "0.25rem 0", fontSize: "0.875rem" }}>
              <strong>Address:</strong> {order.deliveryAddress || "N/A"}
            </p>
          </div>
          
          <div>
            <h4 style={{ fontWeight: "bold", fontSize: "0.875rem", color: "#4b5563", marginBottom: "0.5rem", textTransform: "uppercase" }}>
              Delivery & Status
            </h4>
            <p style={{ margin: "0.25rem 0", fontSize: "0.875rem" }}>
              <strong>Status:</strong> {order.status}
            </p>
            <p style={{ margin: "0.25rem 0", fontSize: "0.875rem" }}>
              <strong>Payment Status:</strong> {order.paymentStatus}
            </p>
            <p style={{ margin: "0.25rem 0", fontSize: "0.875rem" }}>
              <strong>Payment Method:</strong> {order.paymentMethod?.replace(/_/g, " ")}
            </p>
            <p style={{ margin: "0.25rem 0", fontSize: "0.875rem" }}>
              <strong>Delivery Date:</strong> {new Date(order.deliveryDate).toLocaleDateString()}
            </p>
            <p style={{ margin: "0.25rem 0", fontSize: "0.875rem" }}>
              <strong>Delivery Slot:</strong> {order.deliverySlot || order.deliveryTime || "N/A"}
            </p>
          </div>
        </div>

        {/* Order Items Table */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ fontWeight: "bold", fontSize: "0.875rem", color: "#4b5563", marginBottom: "0.75rem", textTransform: "uppercase" }}>
            Items Ordered
          </h4>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ padding: "0.5rem", textAlign: "left" }}>Product</th>
                <th style={{ padding: "0.5rem", textAlign: "right" }}>Price</th>
                <th style={{ padding: "0.5rem", textAlign: "center" }}>Qty</th>
                <th style={{ padding: "0.5rem", textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items && order.items.length > 0 ? (
                order.items.map((item: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "0.5rem" }}>{item.product?.name || "Product"}</td>
                    <td style={{ padding: "0.5rem", textAlign: "right" }}>₹{parseFloat(item.price || "0").toFixed(2)}</td>
                    <td style={{ padding: "0.5rem", textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ padding: "0.5rem", textAlign: "right" }}>₹{parseFloat(item.totalPrice || "0").toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: "1rem", textAlign: "center", color: "#9ca3af" }}>
                    {order.liters ? `Milk Order (${order.liters} L)` : "No items listed"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Grand Total */}
        <div style={{ borderTop: "2px solid #e5e7eb", paddingTop: "0.75rem", display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "1.125rem", fontWeight: "bold" }}>
            Grand Total: <span style={{ color: "#10b981" }}>₹{parseFloat(order.totalAmount || "0").toLocaleString()}</span>
          </div>
        </div>

        {/* Close Action */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "0.625rem 1.25rem",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.875rem"
            }}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
