import React, { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Key, MessageSquare, Mail, ShieldAlert, CheckCircle2, Search, X } from "lucide-react";
import { useLocation } from "wouter";

interface PasswordRequest {
  id: number;
  userId: string;
  email: string;
  status: "pending" | "resolved";
  createdAt: string;
  resolvedAt: string | null;
  userName: string;
  userEmail: string;
}

export default function PasswordRequestsAdmin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<PasswordRequest | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Fetch all requests
  const { data: requests = [], isLoading } = useQuery<PasswordRequest[]>({
    queryKey: ["admin", "password-requests"],
    queryFn: async () => {
      const res = await fetch("/api/auth/admin/password-requests", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch password requests");
      return res.json();
    },
  });

  // Reset Link Mutation
  const sendResetLinkMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/reset-link`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send reset link");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reset Link Sent",
        description: "Password reset link has been emailed to the user.",
      });
      setIsActionModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "password-requests"] });
    },
    onError: (err: any) => {
      toast({
        title: "Action Failed",
        description: err.message || "Failed to send reset link",
        variant: "destructive",
      });
    },
  });

  // Generate Temp Password Mutation
  const generateTempPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate password");
      return res.json();
    },
    onSuccess: (data) => {
      setTempPassword(data.tempPassword);
      toast({
        title: "Temporary Password Generated",
        description: "Email sent successfully with the new details.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "password-requests"] });
    },
    onError: (err: any) => {
      toast({
        title: "Action Failed",
        description: err.message || "Failed to generate temporary password",
        variant: "destructive",
      });
    },
  });

  const handleOpenChat = async (request: PasswordRequest) => {
    try {
      const res = await fetch("/api/chat/guest-thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: request.userEmail }),
      });
      if (res.ok) {
        const thread = await res.json();
        localStorage.setItem("admin_auto_select_thread_id", thread.id.toString());
        setLocation("/admin/chats");
      } else {
        toast({
          title: "Chat Failed",
          description: "Could not open chat with this user.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Connection Error",
        description: "Failed to connect to chat system.",
        variant: "destructive",
      });
    }
  };

  const handleOpenActionModal = (request: PasswordRequest) => {
    setSelectedRequest(request);
    setTempPassword(null);
    setIsActionModalOpen(true);
  };

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.userName.toLowerCase().includes(q) ||
      r.userEmail.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    );
  });

  const pendingRequests = filteredRequests.filter((r) => r.status === "pending");
  const resolvedRequests = filteredRequests.filter((r) => r.status === "resolved");

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search requests by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full"
            />
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Showing {filteredRequests.length} requests ({pendingRequests.length} pending)
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col justify-center items-center gap-3 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              <span>Fetching password requests...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              No password reset requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Requested On</th>
                    <th className="px-6 py-4">Resolved On</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {/* Pending Requests First */}
                  {pendingRequests.map((req) => (
                    <tr key={req.id} className="bg-amber-50/20 hover:bg-amber-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <h4 className="font-semibold text-gray-900">{req.userName}</h4>
                        <p className="text-xs text-gray-500">{req.userEmail}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                          Pending Help
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(req.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 font-medium">—</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            onClick={() => handleOpenActionModal(req)}
                            size="sm"
                            className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold gap-1 rounded-lg"
                          >
                            <Key className="w-3.5 h-3.5" />
                            Resolve Request
                          </Button>
                          <Button
                            onClick={() => handleOpenChat(req)}
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-1" />
                            Chat
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Resolved Requests */}
                  {resolvedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors text-gray-500">
                      <td className="px-6 py-4">
                        <h4 className="font-medium text-gray-700">{req.userName}</h4>
                        <p className="text-xs text-gray-400">{req.userEmail}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-500 border border-gray-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Resolved
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {new Date(req.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {req.resolvedAt ? new Date(req.resolvedAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={() => handleOpenChat(req)}
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs font-semibold text-gray-500 hover:bg-gray-50"
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1" />
                          Chat Log
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Action Dialog Modal */}
      {isActionModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 border border-gray-150 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-gray-900">Resolve Reset Help</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsActionModalOpen(false);
                  setTempPassword(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100 text-xs text-gray-600 space-y-1">
              <p className="font-bold text-gray-900 text-sm">{selectedRequest.userName}</p>
              <p>Email: {selectedRequest.userEmail}</p>
              <p className="text-[10px] text-amber-700">Requested: {new Date(selectedRequest.createdAt).toLocaleString()}</p>
            </div>

            {!tempPassword ? (
              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={() => sendResetLinkMutation.mutate(selectedRequest.userId)}
                  disabled={sendResetLinkMutation.isPending}
                  className="w-full h-11 bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-200 font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  {sendResetLinkMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 text-green-600" />
                  )}
                  Send Password Reset Link
                </Button>

                <Button
                  onClick={() => generateTempPasswordMutation.mutate(selectedRequest.userId)}
                  disabled={generateTempPasswordMutation.isPending}
                  className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  {generateTempPasswordMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                  Generate Temporary Password
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-xl p-4 text-center space-y-2">
                  <p className="text-xs font-semibold">Temporary Password Generated</p>
                  <p className="font-mono text-xl font-bold tracking-wider select-all bg-white py-1 px-3 rounded shadow-sm inline-block border">
                    {tempPassword}
                  </p>
                  <p className="text-[10px] text-amber-700 leading-normal">
                    This password was sent automatically to the user's email. Copy it now if you wish to share it via chat.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setIsActionModalOpen(false);
                    setTempPassword(null);
                  }}
                  className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  Close & Done
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
