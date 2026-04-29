import { Request, Response } from 'express';
import { db } from '../config/db.js';
import { support_chat, support_message, chat_room, chat_room_message, user } from '../db/schema.js';
import { eq, desc, and, isNull, isNotNull, asc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// ====== USER FACING CONTROLLERS ======

// Get or create chat for the current user
export const getMyChat = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Try to find existing chat
        let chats = await db.select().from(support_chat).where(eq(support_chat.userId, userId)).limit(1);
        let chat = chats[0];

        if (!chat) {
            // Create chat if it doesn't exist
            const chatId = uuidv4();
            await db.insert(support_chat).values({
                id: chatId,
                userId,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            chats = await db.select().from(support_chat).where(eq(support_chat.id, chatId)).limit(1);
            chat = chats[0];
        }

        // Fetch messages for this chat
        const messages = await db.select()
            .from(support_message)
            .where(eq(support_message.chatId, chat.id))
            .orderBy(asc(support_message.createdAt));

        res.status(200).json({
            id: chat.id,
            userId: chat.userId,
            messages
        });

    } catch (error: any) {
        console.error('Error fetching/creating chat:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Mark admin messages as read for the user
export const markChatRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const chats = await db.select().from(support_chat).where(eq(support_chat.userId, userId)).limit(1);
        if (chats.length === 0) return res.status(404).json({ message: 'Chat not found' });

        // Update all admin messages for this chat where readAt is null
        await db.update(support_message)
            .set({ readAt: new Date(), updatedAt: new Date() })
            .where(and(
                eq(support_message.chatId, chats[0].id),
                eq(support_message.senderType, 'admin'),
                isNull(support_message.readAt)
            ));

        res.status(200).json({ message: 'Messages marked as read' });
    } catch (error: any) {
        console.error('Error marking chat read:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ====== ADMIN / MANAGER FACING CONTROLLERS ======

export const getAdminChats = async (req: Request, res: Response) => {
    try {
        const archivedStr = req.query.archived as string;
        const isArchived = archivedStr === 'true';

        let conditions = [];
        if (isArchived) {
            conditions.push(isNotNull(support_chat.archivedAt));
        } else {
            conditions.push(isNull(support_chat.archivedAt));
        }

        const requestingUserRole = (req as any).user?.role;
        const requestingUserId = (req as any).user?.id;

        if (requestingUserRole === 'branch') {
            conditions.push(eq(user.branchId, requestingUserId));
        }

        const chatsQuery = await db.select({
            id: support_chat.id,
            userId: support_chat.userId,
            userName: user.name,
            userEmail: user.email,
            lastMessageAt: support_chat.lastMessageAt,
            adminViewedAt: support_chat.adminViewedAt,
            archivedAt: support_chat.archivedAt
        })
            .from(support_chat)
            .leftJoin(user, eq(support_chat.userId, user.id))
            .where(conditions.length === 1 ? conditions[0] : and(...conditions))
            .orderBy(desc(support_chat.lastMessageAt));

        // Let's resolve the last messages for preview and unread status. Efficient approach for now: grab them async per chat
        const results = [];
        for (const chat of chatsQuery) {
            // Count total messages
            const messages = await db.select().from(support_message).where(eq(support_message.chatId, chat.id)).orderBy(asc(support_message.createdAt));

            const lastMessage = messages[messages.length - 1];

            // Check unread condition (if user sent a message after admin last viewed context)
            // Or simpler check: if there is any message sent by user after adminViewedAt
            let unread = false;
            if (chat.adminViewedAt) {
                const unreadMsgs = messages.filter(m => m.senderType === 'user' && new Date(m.createdAt) > new Date(chat.adminViewedAt!));
                unread = unreadMsgs.length > 0;
            } else {
                unread = messages.some(m => m.senderType === 'user');
            }

            results.push({
                ...chat,
                messageCount: messages.length,
                lastMessagePreview: lastMessage ? lastMessage.content.substring(0, 100) : null,
                lastMessageSender: lastMessage ? lastMessage.senderType : null,
                unread,
                archived: !!chat.archivedAt
            });
        }

        res.status(200).json(results);
    } catch (error: any) {
        console.error('Error fetching admin chats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const startAdminChat = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: 'userId is required' });

        // See if chat already exists
        let chats = await db.select().from(support_chat).where(eq(support_chat.userId, userId)).limit(1);
        let chat = chats[0];

        if (!chat) {
            const chatId = uuidv4();
            await db.insert(support_chat).values({
                id: chatId,
                userId,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            chats = await db.select().from(support_chat).where(eq(support_chat.id, chatId)).limit(1);
            chat = chats[0];
        }

        res.status(200).json(chat);
    } catch (err: any) {
        console.error('Error starting admin chat:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAdminChatById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const chatsQuery = await db.select({
            id: support_chat.id,
            userId: support_chat.userId,
            userName: user.name,
            userEmail: user.email,
            archivedAt: support_chat.archivedAt
        })
            .from(support_chat)
            .leftJoin(user, eq(support_chat.userId, user.id))
            .where(eq(support_chat.id, id))
            .limit(1);

        if (chatsQuery.length === 0) return res.status(404).json({ message: 'Chat not found' });
        const chat = chatsQuery[0];

        // Mark as viewed by admin
        await db.update(support_chat).set({ adminViewedAt: new Date(), updatedAt: new Date() }).where(eq(support_chat.id, id));

        const messages = await db.select()
            .from(support_message)
            .where(eq(support_message.chatId, id))
            .orderBy(asc(support_message.createdAt));

        res.status(200).json({
            id: chat.id,
            userId: chat.userId,
            userName: chat.userName,
            userEmail: chat.userEmail,
            archived: !!chat.archivedAt,
            messages
        });
    } catch (error: any) {
        console.error('Error fetching admin chat detail:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const archiveChat = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db.update(support_chat).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(support_chat.id, id));
        res.status(200).json({ message: 'Chat archived' });
    } catch (err: any) {
        res.status(500).json({ message: 'Error archiving chat' });
    }
};

export const restoreChat = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db.update(support_chat).set({ archivedAt: null, updatedAt: new Date() }).where(eq(support_chat.id, id));
        res.status(200).json({ message: 'Chat restored' });
    } catch (err: any) {
        res.status(500).json({ message: 'Error restoring chat' });
    }
};

export const getBranchChat = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.params;

        if (!branchId) return res.status(400).json({ message: 'Branch ID required' });

        // Ensure a chat room exists for this branch
        let rooms = await db.select().from(chat_room).where(eq(chat_room.branchId, branchId)).limit(1);
        let room = rooms[0];

        if (!room) {
            const roomId = uuidv4();
            await db.insert(chat_room).values({
                id: roomId,
                name: 'General',
                type: 'branch',
                branchId,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            rooms = await db.select().from(chat_room).where(eq(chat_room.id, roomId)).limit(1);
            room = rooms[0];
        }

        // Return messages
        const messagesQuery = await db.select({
            id: chat_room_message.id,
            roomId: chat_room_message.roomId,
            userId: chat_room_message.userId,
            userName: user.name,
            content: chat_room_message.content,
            attachmentUrl: chat_room_message.attachmentUrl,
            createdAt: chat_room_message.createdAt
        })
            .from(chat_room_message)
            .leftJoin(user, eq(chat_room_message.userId, user.id))
            .where(eq(chat_room_message.roomId, room.id))
            .orderBy(asc(chat_room_message.createdAt));

        res.status(200).json({
            id: room.id,
            name: room.name,
            branchId,
            messages: messagesQuery
        });

    } catch (err: any) {
        console.error('Error fetching branch chat:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAdminBranchChats = async (req: Request, res: Response) => {
    try {
        const requestingUserRole = (req as any).user?.role;
        const requestingUserId = (req as any).user?.id;

        let query = db.select().from(chat_room);
        if (requestingUserRole === 'branch') {
            query = query.where(eq(chat_room.branchId, requestingUserId)) as any;
        }

        const rooms = await query.orderBy(desc(chat_room.updatedAt));

        const results = [];
        for (const room of rooms) {
            const messages = await db.select().from(chat_room_message).where(eq(chat_room_message.roomId, room.id)).orderBy(asc(chat_room_message.createdAt));
            const lastMessage = messages[messages.length - 1];

            results.push({
                id: room.id,
                name: room.name,
                branchId: room.branchId,
                lastMessagePreview: lastMessage ? lastMessage.content.substring(0, 100) : null,
                lastMessageAt: lastMessage ? lastMessage.createdAt : room.createdAt,
            });
        }
        res.status(200).json(results);
    } catch (err: any) {
        console.error('Error fetching admin branch chats', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ====== AI CHATBOT PROXY ======

const AI_CHATBOT_URL = process.env.AI_CHATBOT_URL || 'http://localhost:8000';

/**
 * Proxy POST /api/chat/ai → Python AI microservice POST /chat
 * Forwards the authenticated user's JWT so the Python service can validate it.
 * The session_id defaults to the authenticated user's ID on the Python side.
 */
export const aiChatProxy = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ message: 'Missing authorization header' });
        }

        const { message, session_id } = req.body;
        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ message: '`message` field is required and must be a non-empty string.' });
        }

        const response = await fetch(`${AI_CHATBOT_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify({ message: message.trim(), session_id }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[AI Proxy] Python service error:', data);
            return res.status(response.status).json({ message: data.detail || 'AI service error' });
        }

        return res.status(200).json(data);
    } catch (error: any) {
        console.error('[AI Proxy] Failed to reach AI service:', error.message);
        return res.status(503).json({ message: 'AI chatbot service is unavailable. Please try again later.' });
    }
};

/**
 * Proxy DELETE /api/chat/ai/session/:sessionId → Python AI microservice DELETE /chat/:sessionId
 * Clears the conversation history for the given session.
 */
export const clearAiChatSession = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ message: 'Missing authorization header' });
        }

        const { sessionId } = req.params;

        const response = await fetch(`${AI_CHATBOT_URL}/chat/${sessionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': authHeader },
        });

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error: any) {
        console.error('[AI Proxy] Failed to clear session:', error.message);
        return res.status(503).json({ message: 'AI chatbot service is unavailable.' });
    }
};
