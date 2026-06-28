import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, ShieldAlert, Key, MessageCircle, HelpCircle, Paperclip, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

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

export default function ChatbotWidget() {
  const [location] = useLocation();
  
  if (location.startsWith("/admin") || location.startsWith("/delivery")) {
    return null;
  }

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"menu" | "email-prompt" | "chat">("menu");
  const [reason, setReason] = useState<"forgot_password" | "login_issue" | "general" | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [threadId, setThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (step === "chat") {
      scrollToBottom();
    }
  }, [messages, step]);

  // Load active chat session if logged in
  useEffect(() => {
    if (isOpen && isAuthenticated && user) {
      startUserChat();
    }
  }, [isOpen, isAuthenticated, user]);

  // Remote event listener to open chatbot from external components
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      if (isAuthenticated && user) {
        startUserChat();
      }
    };
    window.addEventListener("open-chatbot", handleOpen);
    return () => window.removeEventListener("open-chatbot", handleOpen);
  }, [isAuthenticated, user]);

  // Polling for messages
  useEffect(() => {
    if (isOpen && threadId && step === "chat") {
      fetchMessages(); // Fetch immediately
      pollingRef.current = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isOpen, threadId, step]);

  const startUserChat = async () => {
    try {
      const res = await fetch("/api/chat/thread");
      if (res.ok) {
        const data = await res.json();
        setThreadId(data.id);
        setStep("chat");
      }
    } catch (err) {
      console.error("Error starting chat:", err);
    }
  };

  const fetchMessages = async () => {
    if (!threadId) return;
    try {
      const isGuestStr = !isAuthenticated ? "?isGuest=true" : "";
      const res = await fetch(`/api/chat/thread/${threadId}/messages${isGuestStr}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadId) return;
    if (!newMessage.trim() && !attachedFile) return;

    const text = newMessage.trim();
    const fileUrl = attachedFile?.url || null;
    const fileName = attachedFile?.name || null;

    setNewMessage("");
    setAttachedFile(null);

    try {
      const res = await fetch(`/api/chat/thread/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: text,
          fileUrl,
          fileName,
        }),
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleMenuSelect = (option: "forgot_password" | "login_issue" | "general") => {
    setReason(option);
    
    if (isAuthenticated) {
      // User is logged in, can directly open chat thread
      if (option === "forgot_password") {
        // Automatically file a request
        submitForgotPasswordRequest(user?.email || "");
      } else {
        startUserChat();
      }
    } else {
      // Need email input
      setStep("email-prompt");
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsSubmitting(true);
    const email = emailInput.trim();

    try {
      // 1. Submit forgot password request if chosen
      if (reason === "forgot_password") {
        await submitForgotPasswordRequest(email);
      }

      // 2. Open / create guest chat thread linked to user email
      const res = await fetch("/api/chat/guest-thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        const data = await res.json();
        setThreadId(data.id);
        setStep("chat");

        // Send a system message explaining the issue
        let initialMessageText = "";
        if (reason === "forgot_password") {
          initialMessageText = `System: User is requesting password help for email: ${email}`;
        } else if (reason === "login_issue") {
          initialMessageText = `System: User reports a login issue for email: ${email}`;
        } else {
          initialMessageText = `System: User is requesting help. User email: ${email}`;
        }

        await fetch(`/api/chat/thread/${data.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: initialMessageText }),
        });
      } else {
        toast({
          title: "Account Not Found",
          description: "No registered account found with that email. Please check and try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Chat email submit error:", err);
      toast({
        title: "Connection Error",
        description: "Failed to connect to support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitForgotPasswordRequest = async (email: string) => {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast({
          title: "Request Sent",
          description: "Your password reset request has been sent to the admin. You will receive help soon.",
        });
      }
    } catch (err) {
      console.error("Forgot password request error:", err);
    }
  };

  const handleBackToMenu = () => {
    setStep("menu");
    setReason(null);
    setEmailInput("");
    setThreadId(null);
    setMessages([]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-14 h-14 bg-green-600 text-white rounded-full shadow-2xl hover:bg-green-700 hover:scale-105 transition-all duration-300 group"
          aria-label="Open support chat"
        >
          <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
        </button>
      )}

      {/* Chat Dialog Panel */}
      {isOpen && (
        <div className="w-[360px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="bg-green-600 px-4 py-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center font-bold text-sm">
                GN
              </div>
              <div>
                <h3 className="font-semibold text-sm">Gauranitai Support</h3>
                <span className="text-[10px] text-green-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></span>
                  We reply instantly
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Content Body */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col">
            {step === "menu" && (
              <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4 py-6">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">Hello! How can we help you today?</h4>
                  <p className="text-xs text-gray-500 mt-1 px-4">Select an option below to start a chat with our support team.</p>
                </div>

                <div className="w-full space-y-2 mt-4 px-2">
                  <button
                    onClick={() => handleMenuSelect("forgot_password")}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 hover:border-green-500 hover:bg-green-50/30 rounded-xl text-left text-xs font-medium text-gray-700 transition-all shadow-sm"
                  >
                    <Key className="w-4.5 h-4.5 text-green-600" />
                    Forgot Password
                  </button>
                  <button
                    onClick={() => handleMenuSelect("login_issue")}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 hover:border-green-500 hover:bg-green-50/30 rounded-xl text-left text-xs font-medium text-gray-700 transition-all shadow-sm"
                  >
                    <ShieldAlert className="w-4.5 h-4.5 text-green-600" />
                    Login / Account Issues
                  </button>
                  <button
                    onClick={() => handleMenuSelect("general")}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 hover:border-green-500 hover:bg-green-50/30 rounded-xl text-left text-xs font-medium text-gray-700 transition-all shadow-sm"
                  >
                    <HelpCircle className="w-4.5 h-4.5 text-green-600" />
                    Contact Support / General Help
                  </button>
                </div>
              </div>
            )}

            {step === "email-prompt" && (
              <div className="flex-1 flex flex-col justify-center px-2 space-y-4">
                <div className="text-center space-y-2">
                  <h4 className="font-semibold text-gray-800 text-sm">Identify Your Account</h4>
                  <p className="text-xs text-gray-500 px-4">Please enter your registered email address to link this chat to your account.</p>
                </div>
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter registered email..."
                    className="w-full px-4 py-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackToMenu}
                      className="w-1/2 text-xs py-2 rounded-xl"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-1/2 bg-green-600 hover:bg-green-700 text-white text-xs py-2 rounded-xl"
                    >
                      {isSubmitting ? "Linking..." : "Start Chat"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {step === "chat" && (
              <div className="flex-1 flex flex-col space-y-3 pb-2">
                {/* Back option for Guest users to change account */}
                {!isAuthenticated && (
                  <button
                    onClick={handleBackToMenu}
                    className="text-[10px] text-green-600 hover:underline text-left"
                  >
                    ← Switch account or exit chat
                  </button>
                )}

                {/* Messages Listing */}
                <div className="flex-1 flex flex-col space-y-2.5 min-h-0">
                  {messages.length === 0 ? (
                    <div className="text-center text-[11px] text-gray-400 py-6">
                      No messages yet. Send a message to start conversation with the admin.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isAdminMsg = msg.senderRole === "admin";
                      const isSystem = msg.message.startsWith("System:");
                      
                      if (isSystem) {
                        return (
                          <div key={msg.id} className="text-center text-[10px] bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-lg p-2 font-medium">
                            {msg.message.replace("System:", "").trim()}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isAdminMsg ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
                              isAdminMsg
                                ? "bg-white text-gray-800 border border-gray-150 rounded-tl-none"
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
                                      isAdminMsg 
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
                            <span className={`block text-[9px] mt-1 text-right ${isAdminMsg ? "text-gray-400" : "text-green-200"}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Footer Input Bar */}
          {step === "chat" && (
            <div className="flex flex-col border-t border-gray-100 bg-white">
              {/* Attachment Preview Bar */}
              {(attachedFile || isUploading) && (
                <div className="px-3 py-1.5 bg-gray-50 flex items-center justify-between border-b border-gray-100 text-[11px] text-gray-600">
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
              <form onSubmit={handleSendMessage} className="p-3 flex gap-2 items-center">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileUpload}
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt" 
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-8 h-8 hover:bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center transition-colors shrink-0"
                >
                  <Paperclip className="w-4.5 h-4.5" />
                </button>
                <input
                  type="text"
                  required={!attachedFile}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={attachedFile ? "Add a caption..." : "Type a message to admin..."}
                  className="flex-1 px-3 py-2 text-xs bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={isUploading || (!newMessage.trim() && !attachedFile)}
                  className="w-8 h-8 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
