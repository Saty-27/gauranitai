import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Edit, Trash2, X, Upload, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
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

export default function CategoriesAdmin() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    active: true,
    type: "physical",
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categories = [], isLoading, refetch } = useQuery({
    queryKey: ["admin_categories"],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/categories?t=${Date.now()}`, { credentials: "include" });
        return res.ok ? res.json() : [];
      } catch {
        return [];
      }
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: data,
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to upload image");
      }
      const json = await res.json();
      setFormData({ ...formData, icon: json.url });
      toast({ title: "✅ Image uploaded!" });
    } catch (err: any) {
      toast({
        title: "❌ Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "✅ Category added!" });
      refetch();
      resetForm();
    },
    onError: (e: any) => toast({ title: `❌ ${e.message}`, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/admin/categories/${editingId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "✅ Category updated!" });
      refetch();
      resetForm();
    },
    onError: (e: any) => toast({ title: `❌ ${e.message}`, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "✅ Category deleted!" });
      refetch();
    },
    onError: (e: any) => toast({ title: `❌ ${e.message}`, variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", icon: "", active: true, type: "physical" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (cat: any) => {
    setFormData({
      name: cat.name || "",
      description: cat.description || "",
      icon: cat.icon || "",
      active: cat.isActive !== false,
      type: cat.type || "physical",
    });
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "⚠️ Enter category name", variant: "destructive" });
      return;
    }
    if (!formData.icon.trim()) {
      toast({ title: "⚠️ Add category image", variant: "destructive" });
      return;
    }
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      addMutation.mutate(formData);
    }
  };

  const isProcessing = addMutation.isPending || updateMutation.isPending || deleteMutation.isPending || uploading;

  return (
    <AdminLayout>
      <div style={{ padding: "1.5rem" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", margin: 0 }}>
            🏷️ Categories ({categories.length})
          </h2>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            style={{
              padding: "0.5rem 1rem",
              background: "#0d3e83",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Plus size={18} /> Add Category
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ background: "white", border: "2px solid #0d3e83", borderRadius: "0.5rem", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#111827", margin: 0 }}>
                {editingId ? "✏️ Edit" : "➕ Add Category"}
              </h3>
              <button onClick={resetForm} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Milk, Ghee, Paneer"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                  Description
                </label>
                <textarea
                  placeholder="Describe this category..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", minHeight: "60px", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", boxSizing: "border-box", marginBottom: "0.5rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                  Or Upload Image from PC
                </label>
                <label style={{ display: "block", padding: "1rem", border: "2px dashed #d1d5db", borderRadius: "0.5rem", textAlign: "center", cursor: "pointer", background: "#f9fafb" }}>
                  <Upload size={20} style={{ display: "inline", marginRight: "0.5rem" }} />
                  <span>Click to upload image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              {formData.icon && (
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                    Preview
                  </label>
                  <img src={formData.icon} alt="Preview" style={{ maxHeight: "150px", maxWidth: "100%", borderRadius: "0.5rem" }} />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                  Category Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", boxSizing: "border-box" }}
                >
                  <option value="physical">📦 Physical Product</option>
                  <option value="service">🛠️ Service</option>
                  <option value="digital">💾 Digital Product</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                  Status
                </label>
                <select
                  value={formData.active ? "active" : "inactive"}
                  onChange={(e) => setFormData({ ...formData, active: e.target.value === "active" })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", boxSizing: "border-box" }}
                >
                  <option value="active">✅ Active</option>
                  <option value="inactive">❌ Inactive</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  style={{
                    padding: "0.5rem 1.5rem",
                    background: isProcessing ? "#9ca3af" : "#0d3e83",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: isProcessing ? "not-allowed" : "pointer",
                    fontWeight: "600",
                  }}
                >
                  {isProcessing ? "Processing..." : editingId ? "💾 Update" : "✅ Add"}
                </button>
                <button
                  onClick={resetForm}
                  style={{
                    padding: "0.5rem 1.5rem",
                    background: "#e5e7eb",
                    color: "#374151",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div style={{ background: "white", borderRadius: "0.5rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          {isLoading ? (
            <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>Loading categories...</p>
          ) : categories.length === 0 ? (
            <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>No categories. Click "Add Category" to create!</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
              {categories.map((cat: any) => (
                <div key={cat.id} style={{ border: "2px solid #e5e7eb", borderRadius: "0.5rem", overflow: "hidden", background: "white" }}>
                  {cat.icon && (
                    <img src={cat.icon} alt={cat.name} style={{ width: "100%", height: "150px", objectFit: "cover" }} />
                  )}
                  <div style={{ padding: "1rem" }}>
                    <h4 style={{ fontSize: "1rem", fontWeight: "bold", color: "#111827", margin: "0 0 0.5rem 0" }}>{cat.name}</h4>
                    <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: "0 0 0.75rem 0" }}>{cat.description || "-"}</p>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                      <span style={{ display: "inline-block", padding: "0.25rem 0.75rem", fontSize: "0.75rem", fontWeight: "600", background: cat.isActive !== false ? "#d1fae5" : "#fee2e2", color: cat.isActive !== false ? "#065f46" : "#991b1b", borderRadius: "0.25rem" }}>
                        {cat.isActive !== false ? "✅ Active" : "❌ Inactive"}
                      </span>
                      <span style={{ display: "inline-block", padding: "0.25rem 0.75rem", fontSize: "0.75rem", fontWeight: "600", background: "#f3f4f6", color: "#374151", borderRadius: "0.25rem" }}>
                        {cat.type === "physical" ? "📦 Physical" : cat.type === "service" ? "🛠️ Service" : "💾 Digital"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => handleEdit(cat)} disabled={isProcessing} style={{ flex: 1, padding: "0.5rem", background: "#dbeafe", color: "#1e40af", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" }}>
                        <Edit size={14} style={{ display: "inline" }} /> Edit
                      </button>
                      <button 
                        onClick={() => {
                          setItemToDelete(cat.id);
                          setIsDeleteDialogOpen(true);
                        }} 
                        disabled={isProcessing} 
                        style={{ flex: 1, padding: "0.5rem", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" }}
                      >
                        <Trash2 size={14} style={{ display: "inline" }} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-2 border-red-100 shadow-2xl rounded-3xl p-8">
          <AlertDialogHeader className="items-center text-center space-y-4">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-2">
              <AlertTriangle className="w-10 h-10 text-red-600 animate-pulse" />
            </div>
            <AlertDialogTitle className="text-3xl font-black text-gray-900">Delete Category?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 text-lg font-medium">This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-4 sm:justify-center">
            <AlertDialogCancel className="h-14 px-8 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 font-bold text-gray-600 transition-all">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => { if (itemToDelete) { deleteMutation.mutate(itemToDelete); setItemToDelete(null); } }}
              className="h-14 px-8 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black shadow-lg transition-all"
            >Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
