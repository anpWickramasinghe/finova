import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_URL.replace('/api', '');

export interface SupportMessage {
    id: string;
    chatId: string;
    content: string;
    attachmentUrl?: string | null;
    senderType: 'user' | 'admin';
    readAt: string | null;
    createdAt: string;
}

export interface SupportChat {
    id: string;
    userId: string;
    messages: SupportMessage[];
}

export function useSupportChat(user: any, mode: 'support' | 'branch' = 'support', branchId?: string) {
    const [chat, setChat] = useState<SupportChat | null>(null);
    const [connected, setConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef<Socket | null>(null);
    const seenIds = useRef(new Set<string>());

    const getAuthHeader = useCallback(() => {
        const token = user?.token;
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, [user?.token]);

    useEffect(() => {
        if (!user) return;
        if (mode === 'branch' && !branchId) return;

        // Load initial chat history
        const fetchHistory = async () => {
            try {
                const headers = getAuthHeader();
                let res;
                if (mode === 'branch') {
                    res = await axios.get(`${API_URL}/chat/branch/${branchId}`, { headers });
                } else {
                    res = await axios.get(`${API_URL}/chat/my-chat`, { headers });
                }

                setChat(res.data);
                res.data.messages.forEach((m: SupportMessage) => {
                    seenIds.current.add(m.id);
                });

                const unread = res.data.messages.filter((m: SupportMessage) => m.senderType === 'admin' && !m.readAt).length;
                setUnreadCount(unread);
            } catch (err) {
                console.error('Failed to load chat history', err);
            }
        };

        fetchHistory();
    }, [user, mode, branchId]);

    useEffect(() => {
        if (!user) return;

        // Connect to WebSocket Server
        const socket = io(SOCKET_URL, {
            query: {
                userId: user._id || user.id || 'employee',
                role: user.role || 'user'
            },
            reconnectionAttempts: 5,
            timeout: 10000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[Socket] Connected');
            setConnected(true);
        });

        socket.on('connect_error', (error) => {
            console.error('[Socket] Connection Error:', error);
            setConnected(false);
        });

        socket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            setConnected(false);
        });

        return () => {
            console.log('[Socket] Cleaning up');
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user]);

    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !connected || !chat?.id) return;

        if (mode === 'branch') {
            socket.emit('join_branch_room', { roomId: chat.id });
        } else {
            socket.emit('join_chat', { chatId: chat.id });
        }

        const eventName = mode === 'branch' ? 'new_branch_message' : 'new_message';

        const messageHandler = (message: SupportMessage) => {
            if (!seenIds.current.has(message.id)) {
                seenIds.current.add(message.id);
                setChat(prev => prev ? { ...prev, messages: [...prev.messages, message] } : prev);

                if (message.senderType === 'admin') {
                    setUnreadCount(prev => prev + 1);
                }
            }
        };

        socket.on(eventName, messageHandler);

        return () => {
            socket.off(eventName, messageHandler);
        };
    }, [connected, chat?.id, mode]);

    const sendMessage = useCallback((content: string, attachmentUrl?: string | null) => {
        if (!socketRef.current || !chat?.id) return;

        if (mode === 'branch') {
            socketRef.current.emit('send_branch_message', {
                roomId: chat.id,
                content,
                attachmentUrl
            });
        } else {
            socketRef.current.emit('send_message', {
                chatId: chat.id,
                content,
                attachmentUrl,
                senderType: 'user'
            });
        }
    }, [chat?.id, mode]);

    const markAsRead = useCallback(async () => {
        if (mode === 'branch') return; // maybe not necessary for branches right now
        try {
            const headers = getAuthHeader();
            await axios.patch(`${API_URL}/chat/my-chat/read`, {}, { headers });
            setUnreadCount(0);
            setChat(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    messages: prev.messages.map(m => m.senderType === 'admin' ? { ...m, readAt: new Date().toISOString() } : m)
                };
            });
        } catch (e) {
            console.error('Failed to mark read', e);
        }
    }, [mode]);

    return { chat, connected, unreadCount, sendMessage, markAsRead };
}
