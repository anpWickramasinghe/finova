import { Server, Socket } from 'socket.io';
import { db } from '../config/db.js';
import { support_chat, support_message, chat_room, chat_room_message, user } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const setupChatSocket = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        const userId = socket.handshake.query.userId as string;
        const role = socket.handshake.query.role as string;

        if (!userId) {
            socket.disconnect();
            return;
        }

        console.log(`[Chat] User connected: ${userId} (${role})`);

        // If admin/manager, join the global notification room
        if (role === 'admin' || role === 'manager') {
            socket.join('admin_support_notifications');
        }

        // ── Support Chat ──────────────────────────────────────────

        socket.on('join_chat', async ({ chatId }) => {
            if (chatId) {
                socket.join(`support_chat_${chatId}`);
                console.log(`[Chat] User ${userId} joined room support_chat_${chatId}`);
            }
        });

        socket.on('send_message', async (data) => {
            const { chatId, content, senderType, attachmentUrl } = data;

            if (!content && !attachmentUrl) return;

            try {
                const msgId = uuidv4();
                const now = new Date();

                await db.insert(support_message).values({
                    id: msgId,
                    chatId,
                    content: content ? content.trim() : '',
                    attachmentUrl: attachmentUrl || null,
                    senderType: senderType || (['admin', 'manager'].includes(role) ? 'admin' : 'user'),
                    createdAt: now,
                    updatedAt: now,
                });

                const chatUpdate: any = { lastMessageAt: now, updatedAt: now };
                if (senderType === 'user') {
                    chatUpdate.archivedAt = null;
                }
                await db.update(support_chat).set(chatUpdate).where(eq(support_chat.id, chatId));

                const outgoingMessage = {
                    id: msgId,
                    chatId,
                    content: content ? content.trim() : '',
                    attachmentUrl: attachmentUrl || null,
                    senderType: senderType || (['admin', 'manager'].includes(role) ? 'admin' : 'user'),
                    createdAt: now,
                    readAt: null,
                };

                io.to(`support_chat_${chatId}`).emit('new_message', outgoingMessage);

                if (outgoingMessage.senderType === 'user') {
                    io.to('admin_support_notifications').emit('new_user_message', outgoingMessage);
                }

            } catch (err) {
                console.error('[Chat] Error saving message:', err);
            }
        });

        // ── Branch Group Chat ────────────────────────────────────

        socket.on('join_branch_room', async ({ roomId }) => {
            if (roomId) {
                socket.join(`branch_room_${roomId}`);
                console.log(`[Chat] User ${userId} joined branch room branch_room_${roomId}`);
            }
        });

        socket.on('send_branch_message', async (data) => {
            const { roomId, content, attachmentUrl } = data;

            if (!content && !attachmentUrl) return;

            try {
                const msgId = uuidv4();
                const now = new Date();

                // Look up the sender's display name from the DB
                let senderName = userId; // fallback to userId if not found
                if (userId !== 'admin-dashboard') {
                    const senderRows = await db
                        .select({ name: user.name })
                        .from(user)
                        .where(eq(user.id, userId))
                        .limit(1);
                    if (senderRows.length > 0) senderName = senderRows[0].name;
                } else {
                    senderName = 'Admin';
                }

                await db.insert(chat_room_message).values({
                    id: msgId,
                    roomId,
                    userId,
                    content: content ? content.trim() : '',
                    attachmentUrl: attachmentUrl || null,
                    createdAt: now,
                });

                // Update the chat_room's updatedAt so sidebar sorts correctly
                await db.update(chat_room)
                    .set({ updatedAt: now })
                    .where(eq(chat_room.id, roomId));

                const outgoingMessage = {
                    id: msgId,
                    roomId,
                    userId,
                    userName: senderName,
                    content: content ? content.trim() : '',
                    attachmentUrl: attachmentUrl || null,
                    createdAt: now,
                    isOwnMessage: false, // resolved per-client on frontend
                };

                io.to(`branch_room_${roomId}`).emit('new_branch_message', outgoingMessage);

            } catch (err) {
                console.error('[Chat] Error saving branch message:', err);
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Chat] User disconnected: ${userId}`);
        });
    });
};
