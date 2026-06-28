import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

export default function ContactSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch("/api/admin/contact-submissions", {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      } else {
        console.error("Failed to fetch:", response.status);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
    setLoading(false);
  };

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/contact-submissions/${id}/read`, {
        method: "PUT",
        credentials: "include"
      });
      if (response.ok) {
        fetchSubmissions();
        toast({ description: "✅ Marked as read" });
      }
    } catch (error) {
      toast({ description: "Error updating submission", variant: "destructive" });
    }
  };

  const deleteSubmission = async (id: number) => {
    setItemToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const response = await fetch(`/api/admin/contact-submissions/${itemToDelete}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (response.ok) {
        fetchSubmissions();
        toast({ description: "✅ Deleted" });
      }
    } catch (error) {
      toast({ description: "Error deleting submission", variant: "destructive" });
    } finally {
      setItemToDelete(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <span className="text-4xl">⏳</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-gray-900">Contact Submissions</h1>
          <Badge variant="secondary">{submissions.length} messages</Badge>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500">
            No contact submissions yet.
          </div>
        ) : (
          <div className="bg-white rounded-lg overflow-hidden shadow">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Message</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {submissions.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{sub.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{sub.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{sub.message}</td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={sub.status === "new" ? "default" : "secondary"}>
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {sub.status === "new" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead(sub.id)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSubmission(sub.id)}
                        className="gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-2 border-red-100 shadow-2xl rounded-3xl p-8">
          <AlertDialogHeader className="items-center text-center space-y-4">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-2">
              <AlertTriangle className="w-10 h-10 text-red-600 animate-pulse" />
            </div>
            <AlertDialogTitle className="text-3xl font-black text-gray-900">Delete Submission?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 text-lg font-medium">This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-4 sm:justify-center">
            <AlertDialogCancel className="h-14 px-8 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 font-bold text-gray-600 transition-all">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="h-14 px-8 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black shadow-lg transition-all"
            >Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
