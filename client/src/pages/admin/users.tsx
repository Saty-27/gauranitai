import React, { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShieldAlert, Key, MessageSquare, Loader2, Ban, CheckCircle2, Lock, Eye, Mail } from "lucide-react";
import { useLocation } from "wouter";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  hasPendingReset: boolean;
  pendingResetId: number | null;
}

export default function UsersAdmin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch all users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // Block/Unblock Mutations
  const toggleBlockMutation = useMutation({
    mutationFn: async ({ userId, isBlocked }: { userId: string; isBlocked: boolean }) => {
      const endpoint = isBlocked ? "unblock" : "block";
      const res = await fetch(`/api/admin/users/${userId}/${endpoint}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to ${endpoint} user`);
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.isBlocked ? "User Unblocked" : "User Blocked",
        description: `Successfully updated user status.`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err: any) => {
      toast({
        title: "Action Failed",
        description: err.message || "Failed to update user status",
        variant: "destructive",
      });
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
        description: "Password reset link has been emailed to the user (valid for 15 minutes).",
      });
      setIsResetModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
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
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err: any) => {
      toast({
        title: "Action Failed",
        description: err.message || "Failed to generate temporary password",
        variant: "destructive",
      });
    },
  });

  // Filter users by search query
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    return (
      fullName.includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q))
    );
  });

  const handleOpenResetModal = (user: User) => {
    setSelectedUser(user);
    setTempPassword(null);
    setIsResetModalOpen(true);
  };

  const handleOpenChat = async (user: User) => {
    // Initiate chat thread creation for guest/user
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/chat/guest-thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
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
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search users by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full"
            />
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Showing {filteredUsers.length} of {users.length} registered users
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col justify-center items-center gap-3 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              <span>Fetching users directory...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              No registered users found matching your query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Phone / Contact</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Reset Help</th>
                    <th className="px-6 py-4">Dates</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredUsers.map((user) => {
                    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "No Name";
                    
                    return (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {user.firstName?.charAt(0) || "👤"}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">{fullName}</h4>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <p className="font-semibold text-gray-700">{user.phone || "—"}</p>
                          <p className="text-gray-400 truncate max-w-[150px]">{user.address || "No address"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            user.isActive 
                              ? "bg-green-50 text-green-700 border border-green-200" 
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}>
                            {user.isActive ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Active
                              </>
                            ) : (
                              <>
                                <Ban className="w-3.5 h-3.5" />
                                Blocked
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.hasPendingReset ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              <ShieldAlert className="w-3 h-3" />
                              Requested Reset
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 space-y-1">
                          <p>Reg: {new Date(user.createdAt).toLocaleDateString()}</p>
                          <p>
                            Login: {user.lastLogin 
                              ? new Date(user.lastLogin).toLocaleDateString() 
                              : "Never"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              onClick={() => handleOpenResetModal(user)}
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs font-semibold hover:border-amber-500 hover:text-amber-600 gap-1"
                            >
                              <Key className="w-3.5 h-3.5" />
                              Reset
                            </Button>
                            
                            <Button
                              onClick={() => toggleBlockMutation.mutate({ 
                                userId: user.id, 
                                isBlocked: !user.isActive 
                              })}
                              disabled={toggleBlockMutation.isPending}
                              size="sm"
                              variant="ghost"
                              className={`h-8 text-xs font-semibold ${
                                user.isActive 
                                  ? "text-red-500 hover:bg-red-50 hover:text-red-600" 
                                  : "text-green-600 hover:bg-green-50 hover:text-green-700"
                              }`}
                            >
                              {user.isActive ? "Block" : "Unblock"}
                            </Button>

                            <Button
                              onClick={() => handleOpenChat(user)}
                              disabled={isActionLoading}
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-700 gap-1"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Chat
                            </Button>
                          </div>
                        </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Password Reset Help Modal */}
      {isResetModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 border border-gray-150 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-gray-900">Manage Password</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsResetModalOpen(false);
                  setTempPassword(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border text-xs text-gray-600 space-y-1.5">
              <p className="font-semibold text-gray-900 text-sm">
                {selectedUser.firstName} {selectedUser.lastName}
              </p>
              <p>Email: {selectedUser.email}</p>
              <p className="text-gray-400 mt-1">
                Password: <span className="font-mono text-gray-500 bg-gray-250 px-1 py-0.5 rounded">Encrypted / Hidden for security</span>
              </p>
            </div>

            {!tempPassword ? (
              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={() => sendResetLinkMutation.mutate(selectedUser.id)}
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
                  onClick={() => generateTempPasswordMutation.mutate(selectedUser.id)}
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
                    Please copy this password. It has been emailed to the user. This dialog will hide it once closed.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setIsResetModalOpen(false);
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

// Inline X Icon fallback since Lucide X was used
function X(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
