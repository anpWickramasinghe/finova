import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { Search, Archive, ArchiveRestore, MoreVertical, MessageCircle, Send, Plus, X, Paperclip } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_URL.replace('/api', '');

// The userId used by the admin socket connection
const ADMIN_SOCKET_USER_ID = 'admin-dashboard';

interface ChatPreview {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    unread: boolean;
    lastMessageAt: string;
    lastMessagePreview: string;
    lastMessageSender: string;
    archived: boolean;
    isBranch?: boolean;
}

interface Message {
    id: string;
    chatId?: string;      // support chat
    roomId?: string;      // branch chat
    content: string;
    attachmentUrl?: string | null;
    // Support chat fields
    senderType?: 'user' | 'admin';
    // Branch chat fields
    userId?: string;
    userName?: string;
    createdAt: string;
    readAt?: string | null;
}

/** Returns true if the URL looks like an image (Supabase or local) */
function isImageUrl(url: string): boolean {
    return /\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i.test(url);
}

/** Renders an attachment — handles both full Supabase URLs and legacy local paths */
function AttachmentPreview({ url, isAdminBubble }: { url: string; isAdminBubble: boolean }) {
    const fullUrl = url.startsWith('http') ? url : `${SOCKET_URL}${url}`;
    if (isImageUrl(fullUrl)) {
        return <img src={fullUrl} alt="Attachment" className="max-w-[220px] rounded-lg mb-1" />;
    }
    return (
        <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline text-sm break-all font-medium mb-1 block ${isAdminBubble ? 'text-blue-100' : 'text-blue-600'}`}
        >
            📎 View Attachment
        </a>
    );
}

export default function AdminChatDashboard() {
    const [chats, setChats] = useState<ChatPreview[]>([]);
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [activeMessages, setActiveMessages] = useState<Message[]>([]);
    const [activeUserDetails, setActiveUserDetails] = useState<any>(null);

    const [inputValue, setInputValue] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filter, setFilter] = useState<'active' | 'archived'>('active');
    const [viewMode, setViewMode] = useState<'support' | 'branch'>('support');
    const [searchTerm, setSearchTerm] = useState('');

    const [showNewChat, setShowNewChat] = useState(false);
    const [usersList, setUsersList] = useState<any[]>([]);

    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // Track which chat is currently active inside socket handlers
    const activeChatRef = useRef<string | null>(null);
    const viewModeRef = useRef<'support' | 'branch'>('support');

    useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
    useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const fetchChats = async () => {
        try {
            if (viewMode === 'branch') {
                const res = await axios.get(`${API_URL}/chat/admin/branches`, { headers: getHeaders() });
                setChats(res.data.map((b: any) => ({
                    id: b.id,
                    userId: b.branchId,
                    userName: b.name || `Branch ${b.branchId}`,
                    userEmail: 'Branch Group',
                    unread: false,
                    lastMessageAt: b.lastMessageAt || new Date().toISOString(),
                    lastMessagePreview: b.lastMessagePreview || 'No messages yet',
                    lastMessageSender: 'system',
                    archived: false,
                    isBranch: true,
                })));
            } else {
                const res = await axios.get(`${API_URL}/chat/admin/chats?archived=${filter === 'archived'}`, { headers: getHeaders() });
                setChats(res.data);
            }
        } catch (err) {
            console.error('Failed to load chats', err);
        }
    };

    const fetchUsersForNewChat = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/users`, { headers: getHeaders() });
            setUsersList(res.data);
        } catch (err) {
            console.error('Failed to load users for new chat', err);
        }
    };

    const handleStartNewChat = async (userId: string) => {
        try {
            setShowNewChat(false);
            const res = await axios.post(`${API_URL}/chat/admin/chats/start`, { userId }, { headers: getHeaders() });
            await fetchChats();
            selectChat(res.data.id);
        } catch (err) {
            console.error('Failed to start chat', err);
        }
    };

    useEffect(() => {
        setActiveChat(null);
        setActiveMessages([]);
        fetchChats();
    }, [filter, viewMode]);

    useEffect(() => {
        if (showNewChat) fetchUsersForNewChat();
    }, [showNewChat]);

    // Socket setup
    useEffect(() => {
        const socket = io(SOCKET_URL, {
            query: { userId: ADMIN_SOCKET_USER_ID, role: 'admin' },
        });
        socketRef.current = socket;

        // ── Support chat: incoming user message ──
        socket.on('new_user_message', (msg: Message) => {
            const targetId = msg.chatId!;
            setChats(prev => {
                const idx = prev.findIndex(c => c.id === targetId);
                if (idx === -1) return prev;
                const updated = [...prev];
                updated[idx] = {
                    ...updated[idx],
                    lastMessagePreview: msg.attachmentUrl ? 'Sent an attachment' : msg.content,
                    lastMessageAt: msg.createdAt,
                    lastMessageSender: 'user',
                    unread: activeChatRef.current !== targetId,
                };
                return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
            });
            if (activeChatRef.current === targetId && viewModeRef.current === 'support') {
                setActiveMessages(prev => [...prev, msg]);
            }
        });

        // ── Branch chat: incoming message ──
        socket.on('new_branch_message', (msg: Message) => {
            const targetId = msg.roomId!;
            setChats(prev => {
                const idx = prev.findIndex(c => c.id === targetId);
                if (idx === -1) return prev;
                const updated = [...prev];
                updated[idx] = {
                    ...updated[idx],
                    lastMessagePreview: msg.attachmentUrl ? 'Sent an attachment' : msg.content,
                    lastMessageAt: msg.createdAt,
                    lastMessageSender: msg.userName || 'Member',
                };
                return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
            });
            // Only append if viewing this branch room — and don't duplicate our own sent message
            // (we optimistically add it in handleSend already)
            if (activeChatRef.current === targetId && viewModeRef.current === 'branch') {
                // If it came from another user (not admin-dashboard), append it
                if (msg.userId !== ADMIN_SOCKET_USER_ID) {
                    setActiveMessages(prev => [...prev, msg]);
                }
            }
        });

        return () => { socket.disconnect(); };
    }, []);

    const selectChat = async (chatId: string) => {
        setActiveChat(chatId);
        activeChatRef.current = chatId;

        if (viewMode === 'branch') {
            socketRef.current?.emit('join_branch_room', { roomId: chatId });

            try {
                const branchObj = chats.find(c => c.id === chatId);
                if (!branchObj) return;

                const res = await axios.get(`${API_URL}/chat/branch/${branchObj.userId}`, { headers: getHeaders() });
                setActiveMessages(res.data.messages || []);
                setActiveUserDetails({
                    name: (res.data.name || branchObj.userName) + ' — Group',
                    email: undefined,
                    id: res.data.id,
                });
            } catch (err) {
                console.error(err);
            }
        } else {
            socketRef.current?.emit('join_chat', { chatId });

            try {
                const res = await axios.get(`${API_URL}/chat/admin/chats/${chatId}`, { headers: getHeaders() });
                setActiveMessages(res.data.messages || []);
                setActiveUserDetails({
                    name: res.data.userName,
                    email: res.data.userEmail,
                    id: res.data.userId,
                });
                setChats(prev => prev.map(c => c.id === chatId ? { ...c, unread: false } : c));
            } catch (err) {
                console.error(err);
            }
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeMessages]);

    const handleSend = async () => {
        const hasText = inputValue.trim().length > 0;
        if ((!hasText && !selectedFile) || !activeChat) return;

        let attachmentUrl: string | null = null;

        if (selectedFile) {
            const formData = new FormData();
            formData.append('file', selectedFile);
            try {
                const uploadRes = await axios.post(`${API_URL}/upload`, formData, {
                    headers: { ...getHeaders(), 'Content-Type': 'multipart/form-data' },
                });
                attachmentUrl = uploadRes.data.url;
            } catch (err) {
                console.error('Failed to upload file', err);
                return;
            }
        }

        if (viewMode === 'branch') {
            // Optimistic update for the sender
            const optimistic: Message = {
                id: Date.now().toString(),
                roomId: activeChat,
                userId: ADMIN_SOCKET_USER_ID,
                userName: 'Admin',
                content: inputValue.trim(),
                attachmentUrl,
                createdAt: new Date().toISOString(),
            };
            setActiveMessages(prev => [...prev, optimistic]);

            socketRef.current?.emit('send_branch_message', {
                roomId: activeChat,
                content: inputValue.trim(),
                attachmentUrl,
            });
        } else {
            const optimistic: Message = {
                id: Date.now().toString(),
                chatId: activeChat,
                content: inputValue.trim(),
                attachmentUrl,
                senderType: 'admin',
                createdAt: new Date().toISOString(),
                readAt: null,
            };
            setActiveMessages(prev => [...prev, optimistic]);

            socketRef.current?.emit('send_message', {
                chatId: activeChat,
                content: inputValue.trim(),
                attachmentUrl,
                senderType: 'admin',
            });
        }

        // Update sidebar preview
        setChats(prev => {
            const idx = prev.findIndex(c => c.id === activeChat);
            if (idx === -1) return prev;
            const updated = [...prev];
            updated[idx] = {
                ...updated[idx],
                lastMessagePreview: attachmentUrl ? 'Sent an attachment' : inputValue.trim(),
                lastMessageAt: new Date().toISOString(),
                lastMessageSender: 'admin',
            };
            return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        });

        setInputValue('');
        setSelectedFile(null);
    };

    const archiveChat = async () => {
        if (!activeChat) return;
        try {
            await axios.post(`${API_URL}/chat/admin/chats/${activeChat}/archive`, {}, { headers: getHeaders() });
            setActiveChat(null);
            fetchChats();
        } catch (e) { console.error(e); }
    };

    const restoreChat = async () => {
        if (!activeChat) return;
        try {
            await axios.post(`${API_URL}/chat/admin/chats/${activeChat}/restore`, {}, { headers: getHeaders() });
            setActiveChat(null);
            fetchChats();
        } catch (e) { console.error(e); }
    };

    const filteredChats = chats.filter(c =>
        c.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Whether the message input/send should be disabled
    const isSendDisabled = viewMode === 'support' && filter === 'archived';

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Sidebar */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50/50">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                        {viewMode === 'support' && (
                            <button onClick={() => setShowNewChat(true)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                                <Plus className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <div className="flex space-x-1 mb-4 p-1 bg-gray-100 rounded-lg">
                        <button
                            onClick={() => setViewMode('support')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors
                                ${viewMode === 'support' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Support
                        </button>
                        <button
                            onClick={() => setViewMode('branch')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors
                                ${viewMode === 'branch' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Branch Groups
                        </button>
                    </div>

                    {viewMode === 'support' && (
                        <div className="flex space-x-1 mb-4 p-1 bg-gray-100 rounded-lg">
                            <button
                                onClick={() => setFilter('active')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors
                                    ${filter === 'active' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => setFilter('archived')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors
                                    ${filter === 'archived' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Archived
                            </button>
                        </div>
                    )}

                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredChats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                            <MessageCircle className="w-8 h-8" />
                            <p className="text-sm">No conversations found</p>
                        </div>
                    ) : (
                        filteredChats.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => selectChat(chat.id)}
                                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors relative
                                    ${activeChat === chat.id ? 'bg-blue-50/50' : 'hover:bg-gray-100'}`}
                            >
                                {chat.unread && (
                                    <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-blue-600 rounded-full" />
                                )}
                                <div className="flex items-center justify-between mb-1 pr-4">
                                    <h3 className={`font-medium text-sm truncate ${chat.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                                        {chat.userName || 'Unknown'}
                                    </h3>
                                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                        {chat.lastMessageAt ? format(new Date(chat.lastMessageAt), 'MMM d, h:mm a') : ''}
                                    </span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    {chat.lastMessageSender === 'admin' && viewMode === 'support' && (
                                        <span className="text-blue-600 mr-1">You:</span>
                                    )}
                                    <p className="truncate flex-1">{chat.lastMessagePreview || 'No messages yet'}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {activeChat && activeUserDetails ? (
                    <>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                                    {activeUserDetails.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h2 className="text-gray-900 font-medium">{activeUserDetails.name || 'Unknown'}</h2>
                                    {activeUserDetails.email && <p className="text-gray-500 text-sm">{activeUserDetails.email}</p>}
                                    {viewMode === 'branch' && (
                                        <p className="text-xs text-green-600 font-medium">● Group Chat</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-400">
                                {viewMode === 'support' && (
                                    filter === 'active' ? (
                                        <button onClick={archiveChat} className="p-2 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors" title="Archive Chat">
                                            <Archive className="w-5 h-5" />
                                        </button>
                                    ) : (
                                        <button onClick={restoreChat} className="p-2 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors" title="Unarchive Chat">
                                            <ArchiveRestore className="w-5 h-5" />
                                        </button>
                                    )
                                )}
                                <button className="p-2 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-6 overflow-y-auto bg-gray-50 space-y-4">
                            {activeMessages.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                activeMessages.map((msg, idx) => {
                                    // Determine if this message is "from admin" for display
                                    const isFromAdmin = viewMode === 'branch'
                                        ? msg.userId === ADMIN_SOCKET_USER_ID
                                        : msg.senderType === 'admin';

                                    const showSenderLabel = viewMode === 'branch' && !isFromAdmin;
                                    const prevMsg = idx > 0 ? activeMessages[idx - 1] : null;
                                    const showAvatar = !isFromAdmin && (
                                        idx === 0 ||
                                        (viewMode === 'branch' ? prevMsg?.userId !== msg.userId : prevMsg?.senderType !== msg.senderType)
                                    );
                                    const senderName = viewMode === 'branch'
                                        ? (msg.userName || 'Member')
                                        : activeUserDetails.name;

                                    return (
                                        <div key={msg.id} className={`flex ${isFromAdmin ? 'justify-end' : 'justify-start'} max-w-full`}>
                                            {!isFromAdmin && showAvatar && (
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium text-xs mr-2 self-end mb-1 shrink-0">
                                                    {senderName?.charAt(0)?.toUpperCase()}
                                                </div>
                                            )}
                                            {!isFromAdmin && !showAvatar && <div className="w-8 mr-2 shrink-0" />}

                                            <div className="flex flex-col max-w-[70%]">
                                                {showSenderLabel && showAvatar && (
                                                    <span className="text-[10px] text-gray-500 mb-0.5 px-1">{senderName}</span>
                                                )}
                                                <div className={`px-4 py-2 text-sm shadow-sm ${isFromAdmin
                                                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
                                                    : 'bg-white text-gray-900 border border-gray-100 rounded-2xl rounded-bl-sm'
                                                    }`}>
                                                    {msg.attachmentUrl && (
                                                        <AttachmentPreview url={msg.attachmentUrl} isAdminBubble={isFromAdmin} />
                                                    )}
                                                    {msg.content && <span>{msg.content}</span>}
                                                </div>
                                                <div className={`text-[10px] text-gray-400 mt-1 px-1 ${isFromAdmin ? 'text-right' : 'text-left'}`}>
                                                    {format(new Date(msg.createdAt), 'h:mm a')}
                                                    {isFromAdmin && msg.readAt && <span className="ml-1 text-blue-500 font-medium">· Read</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                            {selectedFile && (
                                <div className="mb-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between text-sm">
                                    <span className="text-blue-700 truncate">{selectedFile.name}</span>
                                    <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-red-500 transition-colors ml-2">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <div className={`relative flex items-center bg-gray-50 rounded-full border px-2 pl-3 py-1 transition-all
                                ${isSendDisabled ? 'border-gray-100 opacity-60' : 'border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent'}`}>
                                <label className={`transition-colors mr-2 ${isSendDisabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer text-gray-400 hover:text-blue-600'}`}>
                                    <Paperclip className="w-5 h-5" />
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                                        disabled={isSendDisabled}
                                    />
                                </label>
                                <input
                                    type="text"
                                    placeholder={viewMode === 'branch' ? 'Message the branch group...' : 'Type a message to the user...'}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    className="flex-1 bg-transparent py-2 text-sm focus:outline-none"
                                    disabled={isSendDisabled}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={(!inputValue.trim() && !selectedFile) || isSendDisabled}
                                    className={`p-2 rounded-full transition-colors flex items-center justify-center
                                        ${(inputValue.trim() || selectedFile) && !isSendDisabled
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-gray-200 text-gray-400'}`}
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            {isSendDisabled && (
                                <p className="text-center text-xs text-gray-400 mt-2">Unarchive this chat to send messages.</p>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <MessageCircle className="w-16 h-16 mb-4 text-gray-200" />
                        <h2 className="text-xl font-medium text-gray-700">
                            {viewMode === 'branch' ? 'Branch Group Chat' : 'Support Chat'}
                        </h2>
                        <p className="max-w-sm text-center mt-2">
                            {viewMode === 'branch'
                                ? 'Select a branch group to view the conversation.'
                                : 'Select a conversation from the sidebar to start helping your users.'}
                        </p>
                    </div>
                )}
            </div>

            {/* New Chat Modal */}
            {showNewChat && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-xl">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80%] border border-gray-100">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h2 className="text-lg font-semibold text-gray-900">Start New Chat</h2>
                            <button onClick={() => setShowNewChat(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search users to chat with..."
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {usersList.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <p className="text-sm">No users found.</p>
                                </div>
                            ) : (
                                usersList.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => handleStartNewChat(u.id)}
                                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors text-left group border border-transparent hover:border-gray-200"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{u.name}</span>
                                            <span className="text-xs text-gray-500">{u.email}</span>
                                        </div>
                                        <div className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                                            {u.role}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
