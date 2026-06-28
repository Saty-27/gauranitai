import type { Server as SocketServer } from "socket.io";
import { gauranitaiStore } from "./gauranitaiStore";

export function registerGauranitaiSocket(io: SocketServer) {
  io.on("connection", (socket) => {
    const session = (socket.request as any).session;

    socket.on("customer:join", async (_payload, ack) => {
      try {
        if (!session?.customer) throw new Error("Customer login required");
        const thread = await gauranitaiStore.getOrCreateChatThread(session.customer);
        const updatedThread = await gauranitaiStore.markChatRead(thread.id, "user") || thread;
        socket.join(`chat-${thread.id}`);
        io.to("admin-chat").emit("chat:thread", updatedThread);
        ack?.({ thread: updatedThread, messages: await gauranitaiStore.chatMessages(thread.id) });
      } catch (error: any) {
        ack?.({ error: error.message || "Could not join customer chat" });
      }
    });

    socket.on("admin:join", async (_payload, ack) => {
      try {
        if (!session?.adminUser) throw new Error("Admin login required");
        socket.join("admin-chat");
        ack?.({ threads: await gauranitaiStore.listChatThreads() });
      } catch (error: any) {
        ack?.({ error: error.message || "Could not join admin chat" });
      }
    });

    socket.on("chat:join-thread", async (payload, ack) => {
      try {
        if (!session?.adminUser) throw new Error("Admin login required");
        const threadId = Number(payload?.threadId);
        const thread = await gauranitaiStore.getChatThread(threadId);
        if (!thread) throw new Error("Chat thread not found");
        const updatedThread = await gauranitaiStore.markChatRead(threadId, "admin") || thread;
        socket.join(`chat-${threadId}`);
        io.to("admin-chat").emit("chat:thread", updatedThread);
        ack?.({ thread: updatedThread, messages: await gauranitaiStore.chatMessages(threadId) });
      } catch (error: any) {
        ack?.({ error: error.message || "Could not open chat thread" });
      }
    });

    socket.on("chat:send", async (payload, ack) => {
      try {
        const text = String(payload?.message || "");
        let threadId = Number(payload?.threadId);
        let result;

        if (session?.adminUser) {
          if (!threadId) throw new Error("Chat thread is required");
          result = await gauranitaiStore.addChatMessage(threadId, "admin", session.adminUser.name || "Admin", text);
        } else if (session?.customer) {
          const thread = await gauranitaiStore.getOrCreateChatThread(session.customer);
          threadId = thread.id;
          socket.join(`chat-${threadId}`);
          result = await gauranitaiStore.addChatMessage(threadId, "user", session.customer.name || "Customer", text);
        } else {
          throw new Error("Login required");
        }

        io.to(`chat-${threadId}`).emit("chat:message", result.message);
        io.to(`chat-${threadId}`).emit("chat:thread", result.thread);
        io.to("admin-chat").emit("chat:thread", result.thread);
        ack?.(result);
      } catch (error: any) {
        ack?.({ error: error.message || "Could not send message" });
      }
    });
  });
}
