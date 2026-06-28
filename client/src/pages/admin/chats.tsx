import React, { useState, useEffect, useRef } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Send, CheckCircle2, MessageSquare, Search, AlertCircle, HelpCircle, Plus, X, Paperclip, FileText } from "lucide-react";

interface ChatThread {
  id: number;
  userId: string;
  status: "pending" | "active" | "resolved";
  lastMessage: string | null;
  unreadForAdmin: number;
  unreadForUser: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  };
}

interface Message {
  id: number;
  threadId: number;
  senderId: string | null;
  senderRole: "user" | "admin";
  message: string;
  isRead: boolean;
  fileUrl?: string | null;
  fileName?: string | null;
  createdAt: string;
}

export default function ChatsAdmin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatSearchQuery, setNewChatSearchQuery] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesPollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch threads
  const { data: threads = [], isLoading: isThreadsLoading } = useQuery<ChatThread[]>({
    queryKey: ["admin", "chat-threads"],
    queryFn: async () => {
      const res = await fetch("/api/chat/admin/threads", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch chat threads");
      return res.json();
    },
    refetchInterval: 5000, // Poll threads every 5s
  });

  // Handle auto-selecting thread if redirected from Users/Password requests page
  useEffect(() => {
    const savedThreadId = localStorage.getItem("admin_auto_select_thread_id");
    if (savedThreadId) {
      const parsedId = parseInt(savedThreadId);
      if (!isNaN(parsedId)) {
        setSelectedThreadId(parsedId);
      }
      localStorage.removeItem("admin_auto_select_thread_id");
    }
  }, [threads]);

  // Fetch all users for starting a new chat
  const { data: allUsers = [], isLoading: isUsersLoading } = useQuery<any[]>({
    queryKey: ["admin", "users-for-chat"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: isNewChatModalOpen,
  });

  const handleStartChatWithUser = async (userEmail: string) => {
    try {
      const res = await fetch("/api/chat/guest-thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      if (res.ok) {
        const thread = await res.json();
        await queryClient.invalidateQueries({ queryKey: ["admin", "chat-threads"] });
        setSelectedThreadId(thread.id);
        setIsNewChatModalOpen(false);
        setNewChatSearchQuery("");
        toast({
          title: "Chat Session Started",
          description: `You can now message this user.`,
        });
      } else {
        toast({
          title: "Failed to Start Chat",
          description: "Could not establish a chat thread.",
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

  // Fetch messages for active thread
  const fetchMessages = async () => {
    if (!selectedThreadId) return;
    try {
      const res = await fetch(`/api/chat/thread/${selectedThreadId}/messages`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Error fetching chat messages:", err);
    }
  };

  // Start polling messages when selected thread changes
  useEffect(() => {
    if (selectedThreadId) {
      fetchMessages(); // Fetch immediately
      if (messagesPollingRef.current) {
        clearInterval(messagesPollingRef.current);
      }
      messagesPollingRef.current = setInterval(fetchMessages, 3000); // Poll every 3s
    } else {
      if (messagesPollingRef.current) {
        clearInterval(messagesPollingRef.current);
        messagesPollingRef.current = null;
      }
      setMessages([]);
    }

    return () => {
      if (messagesPollingRef.current) {
        clearInterval(messagesPollingRef.current);
      }
    };
  }, [selectedThreadId]);

  // Scroll to bottom when message list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (500KB)
    if (file.size > 500 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be under 500KB.",
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAttachedFile(data);
        toast({
          title: "File uploaded successfully",
          description: file.name,
        });
      } else {
        const err = await res.json();
        toast({
          title: "Upload Failed",
          description: err.message || "Failed to upload file.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Connection Error",
        description: "Could not upload file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Reply Mutation
  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThreadId) return;
    if (!replyText.trim() && !attachedFile) return;

    const text = replyText.trim();
    const fileUrl = attachedFile?.url || null;
    const fileName = attachedFile?.name || null;

    setReplyText("");
    setAttachedFile(null);
    setIsSending(true);

    try {
      const res = await fetch(`/api/chat/thread/${selectedThreadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          message: text,
          fileUrl,
          fileName,
        }),
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        queryClient.invalidateQueries({ queryKey: ["admin", "chat-threads"] });
      } else {
        toast({
          title: "Send Failed",
          description: "Failed to deliver message.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Connection Error",
        description: "Failed to connect to server.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Resolve Thread Mutation
  const resolveThreadMutation = useMutation({
    mutationFn: async (threadId: number) => {
      const res = await fetch(`/api/chat/admin/threads/${threadId}/resolve`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to resolve chat thread");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Chat Resolved",
        description: "Successfully marked conversation as resolved.",
      });
      fetchMessages();
      queryClient.invalidateQueries({ queryKey: ["admin", "chat-threads"] });
    },
    onError: (err: any) => {
      toast({
        title: "Resolve Failed",
        description: err.message || "Failed to mark chat as resolved",
        variant: "destructive",
      });
    },
  });

  const activeThread = threads.find((t) => t.id === selectedThreadId);

  // Filter threads by search query
  const filteredThreads = threads.filter((t) => {
    const q = searchQuery.toLowerCase();
    const userName = `${t.user?.firstName || ""} ${t.user?.lastName || ""}`.toLowerCase();
    const userEmail = (t.user?.email || "").toLowerCase();
    return userName.includes(q) || userEmail.includes(q);
  });

  return (
    <AdminLayout>
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden h-[calc(100vh-170px)] flex flex-col md:flex-row">
        
        {/* Thread Sidebar List */}
        <div className="w-full md:w-80 border-r flex flex-col shrink-0 bg-gray-50/50">
          <div className="p-4 border-b bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Conversations</h3>
              <Button
                onClick={() => setIsNewChatModalOpen(true)}
                size="sm"
                className="h-7 text-[10px] font-bold bg-green-600 hover:bg-green-700 text-white gap-1 rounded-lg px-2"
              >
                <Plus className="w-3.5 h-3.5" />
                New Chat
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {isThreadsLoading ? (
              <div className="py-12 flex justify-center items-center">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 px-4">
                No active chat threads found.
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isActive = thread.id === selectedThreadId;
                const userFullName = `${thread.user?.firstName || ""} ${thread.user?.lastName || ""}`.trim() || "Guest User";
                
                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full text-left p-4 flex gap-3 transition-colors ${
                      isActive ? "bg-green-50/30" : "bg-transparent hover:bg-gray-50/30"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {thread.user?.firstName?.charAt(0) || "👤"}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-800 text-xs truncate">
                          {userFullName}
                        </h4>
                        <span className="text-[9px] text-gray-400 shrink-0">
                          {new Date(thread.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-gray-550 truncate">
                        {thread.lastMessage || "Started a chat"}
                      </p>

                      <div className="flex items-center justify-between pt-0.5">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          thread.status === "pending"
                            ? "bg-red-50 text-red-650 border border-red-100"
                            : thread.status === "active"
                            ? "bg-green-50 text-green-650 border border-green-100"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {thread.status}
                        </span>

                        {thread.unreadForAdmin > 0 && (
                          <span className="h-4.5 min-w-4.5 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shrink-0">
                            {thread.unreadForAdmin}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Thread Dialogue Window */}
        <div className="flex-1 flex flex-col bg-gray-50/30 min-w-0">
          {activeThread ? (
            <>
              {/* Active Header */}
              <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {activeThread.user?.firstName?.charAt(0) || "👤"}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">
                      {activeThread.user ? `${activeThread.user.firstName} ${activeThread.user.lastName}` : "Guest User"}
                    </h3>
                    <p className="text-xs text-gray-550">{activeThread.user?.email}</p>
                  </div>
                </div>
                
                {activeThread.status !== "resolved" && (
                  <Button
                    onClick={() => resolveThreadMutation.mutate(activeThread.id)}
                    disabled={resolveThreadMutation.isPending}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs gap-1 h-8 rounded-lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark Resolved
                  </Button>
                )}
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-gray-400 gap-2">
                    <MessageSquare className="w-8 h-8" />
                    <p className="text-xs">No messages in this conversation yet.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUserMsg = msg.senderRole === "user";
                    const isSystem = msg.message.startsWith("System:");
                    
                    if (isSystem) {
                      return (
                        <div key={msg.id} className="text-center">
                          <span className="inline-block text-[10px] bg-amber-50 text-amber-705 border border-amber-100 rounded-lg px-3 py-1 font-semibold max-w-[90%]">
                            {msg.message.replace("System:", "").trim()}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isUserMsg ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                            isUserMsg
                              ? "bg-white border border-gray-150 rounded-tl-none text-gray-800"
                              : "bg-green-600 text-white rounded-tr-none"
                          }`}
                        >
                          {msg.fileUrl ? (
                            <div className="mb-1">
                              {msg.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                                  <img 
                                    src={msg.fileUrl} 
                                    alt={msg.fileName || "Image attachment"} 
                                    className="max-h-36 object-contain hover:scale-105 transition-transform duration-200" 
                                  />
                                </a>
                              ) : (
                                <a 
                                  href={msg.fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-medium transition-colors ${
                                    isUserMsg 
                                      ? "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100" 
                                      : "bg-green-750 border-green-500 text-white hover:bg-green-700"
                                  }`}
                                >
                                  <FileText className="w-4 h-4 shrink-0" />
                                  <span className="truncate max-w-[150px]">{msg.fileName || "Download File"}</span>
                                </a>
                              )}
                            </div>
                          ) : null}
                          {(msg.message && msg.message !== msg.fileName && msg.message !== "Attachment") && (
                            <p className="leading-relaxed break-words">{msg.message}</p>
                          )}
                          <span className={`block text-[9px] mt-1 text-right ${isUserMsg ? "text-gray-450" : "text-green-200"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input reply form */}
              <div className="bg-white border-t p-4 shadow-inner flex flex-col gap-2">
                {/* Attached File Preview */}
                {(attachedFile || isUploading) && (
                  <div className="px-3 py-1.5 bg-gray-50 flex items-center justify-between border border-gray-250 rounded-xl text-[11px] text-gray-600">
                    <div className="flex items-center gap-1.5 truncate">
                      <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {isUploading ? (
                        <span className="italic text-gray-400">Uploading file...</span>
                      ) : (
                        <span className="truncate font-medium text-green-700">{attachedFile?.name}</span>
                      )}
                    </div>
                    {!isUploading && (
                      <button 
                        type="button" 
                        onClick={() => setAttachedFile(null)} 
                        className="p-0.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
                
                <form onSubmit={sendReply} className="flex gap-3 items-center">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload}
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt" 
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center p-0 shrink-0 text-gray-500 hover:bg-gray-50"
                  >
                    <Paperclip className="w-4.5 h-4.5" />
                  </Button>
                  
                  <input
                    type="text"
                    required={!attachedFile}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={attachedFile ? "Add a caption..." : "Type a reply to customer..."}
                    className="flex-1 px-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 focus:bg-white transition-all"
                  />
                  <Button
                    type="submit"
                    disabled={isSending || isUploading || (!replyText.trim() && !attachedFile)}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 rounded-xl h-10 flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Reply
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-gray-400 gap-3">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                <HelpCircle className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-gray-800 text-sm">No Active Conversation</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-xs px-4">
                  Select a user conversation from the left sidebar list to begin messaging them.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Start New Chat Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-gray-150 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-bold text-gray-900 font-display">Start a New Chat</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNewChatModalOpen(false);
                  setNewChatSearchQuery("");
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search registered users by name or email..."
                value={newChatSearchQuery}
                onChange={(e) => setNewChatSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 focus:bg-white transition-all"
              />
            </div>

            {/* Users List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 border rounded-xl bg-gray-50/30">
              {isUsersLoading ? (
                <div className="py-8 flex justify-center items-center">
                  <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                </div>
              ) : allUsers.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-450">
                  No registered users found.
                </div>
              ) : (() => {
                const query = newChatSearchQuery.toLowerCase();
                const filteredUsers = allUsers.filter((u: any) => {
                  const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
                  const email = (u.email || "").toLowerCase();
                  return fullName.includes(query) || email.includes(query);
                });

                if (filteredUsers.length === 0) {
                  return (
                    <div className="py-8 text-center text-xs text-gray-450">
                      No matching users found.
                    </div>
                  );
                }

                return filteredUsers.map((user: any) => {
                  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "No Name";
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleStartChatWithUser(user.email)}
                      className="w-full text-left p-3 hover:bg-green-50/20 flex items-center justify-between transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-xs truncate group-hover:text-green-700">
                          {fullName}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-150 rounded-lg px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        Chat
                      </span>
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
