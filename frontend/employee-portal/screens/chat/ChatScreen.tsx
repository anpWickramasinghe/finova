import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import Header from '@/components/header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSupportChat, SupportMessage } from '../../src/hooks/useSupportChat';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

import { useAuth } from '@/providers/auth-context';

export default function ChatScreen() {
    const primary = useColor('primary');
    const background = useColor('background');
    const border = useColor('border');

    const router = useRouter();
    const { user } = useAuth();

    const [isInbox, setIsInbox] = useState(true);
    const [chatMode, setChatMode] = useState<'support' | 'branch'>('support');
    
    const { chat, connected, unreadCount, sendMessage, markAsRead } = useSupportChat(
        user,
        chatMode,
        chatMode === 'branch' ? (user as any)?.branchId : undefined
    );

    const [inputValue, setInputValue] = useState('');
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (!isInbox) {
            markAsRead();
        }
    }, [chat?.messages.length, markAsRead, isInbox]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        sendMessage(inputValue.trim());
        setInputValue('');
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const handleAttach = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({});
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];

                const formData = new FormData();
                formData.append('file', {
                    uri: asset.uri,
                    name: asset.name,
                    type: asset.mimeType || 'application/octet-stream',
                } as any);

                const uploadRes = await axios.post(`${API_URL}/chat/upload`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                });

                sendMessage('', uploadRes.data.url);
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        } catch (err) {
            console.error('Attachment upload failed', err);
        }
    };

    const renderInboxItem = (title: string, subtitle: string, icon: string, mode: 'support' | 'branch', unread: number, time: string) => (
        <TouchableOpacity 
            style={[styles.inboxItem, { borderBottomColor: border }]} 
            onPress={() => {
                setChatMode(mode);
                setIsInbox(false);
            }}
        >
            <View style={[styles.avatar, { backgroundColor: primary + '20' }]}>
                <IconSymbol name={icon as any} size={24} color={primary} />
            </View>
            <View style={styles.inboxContent}>
                <View style={styles.inboxHeader}>
                    <Text style={styles.inboxTitle}>{title}</Text>
                    <Text style={styles.inboxTime}>{time}</Text>
                </View>
                <View style={styles.inboxFooter}>
                    <Text style={styles.inboxSubtitle} numberOfLines={1}>{subtitle}</Text>
                    {unread > 0 && (
                        <View style={[styles.badge, { backgroundColor: primary }]}>
                            <Text style={styles.badgeText}>{unread}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderMessage = ({ item }: { item: SupportMessage }) => {
        let isCurrentUser = item.senderType === 'user';
        if (chatMode === 'branch') {
            isCurrentUser = (item as any).userId === (user?._id || (user as any)?.id);
        }

        const isImage = item.attachmentUrl?.match(/\.(jpeg|jpg|gif|png)$/i);

        return (
            <View style={[styles.messageWrapper, isCurrentUser ? styles.messageWrapperUser : styles.messageWrapperAdmin]}>
                {chatMode === 'branch' && !isCurrentUser && 'userName' in item && (
                    <Text style={{ fontSize: 10, color: '#666', marginBottom: 2, marginLeft: 4 }}>{(item as any).userName}</Text>
                )}
                <View style={[styles.messageBubble, { backgroundColor: isCurrentUser ? primary : background, borderColor: border, borderWidth: isCurrentUser ? 0 : 1 }]}>
                    {item.attachmentUrl && (
                        <TouchableOpacity onPress={() => Linking.openURL(`${API_URL.replace('/api', '')}${item.attachmentUrl}`)}>
                            {isImage ? (
                                <Image
                                    source={{ uri: `${API_URL.replace('/api', '')}${item.attachmentUrl}` }}
                                    style={{ width: 200, height: 200, borderRadius: 10, marginBottom: item.content ? 8 : 0 }}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={{ padding: 8, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 8, marginBottom: item.content ? 8 : 0 }}>
                                    <Text style={{ color: isCurrentUser ? '#fff' : '#000', textDecorationLine: 'underline' }}>View Attachment</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}
                    {!!item.content && <Text style={{ color: isCurrentUser ? '#fff' : '#000' }}>{item.content}</Text>}
                </View>
                <Text style={styles.timestamp}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    if (isInbox) {
        return (
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
                <Header
                    title="Chats"
                    onNotificationPress={() => console.log('Notification pressed')}
                    onMenuPress={() => router.push('/sheet')}
                />
                <FlatList
                    data={[
                        { id: 'support', title: 'Support Team', subtitle: 'Our team is here to help with your queries', icon: 'person.fill', mode: 'support', unread: chatMode === 'support' ? unreadCount : 0, time: 'Now' },
                        { id: 'branch', title: 'Branch General', subtitle: 'Talk to your branch manager and staff', icon: 'building.2.fill', mode: 'branch', unread: chatMode === 'branch' ? unreadCount : 0, time: '1h' },
                        { id: 'ai', title: 'AI Assistant', subtitle: 'Instant answers to your company questions', icon: 'sparkles', mode: 'support', unread: 0, time: '24/7' },
                    ]}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => renderInboxItem(item.title, item.subtitle, item.icon, item.mode as any, item.unread, item.time)}
                    contentContainerStyle={{ paddingVertical: 8 }}
                />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <Header
                title={chatMode === 'support' ? "Support Chat" : "Branch General"}
                onNotificationPress={() => console.log('Notification pressed')}
                onMenuPress={() => router.push('/sheet')}
                showBackButton={true}
                onBack={() => setIsInbox(true)}
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Connection Status */}
                <View style={[styles.statusBanner, { backgroundColor: connected ? '#E8F5E9' : '#FFEBEE' }]}>
                    <Text style={{ fontSize: 12, color: connected ? '#2E7D32' : '#C62828', textAlign: 'center' }}>
                        {connected ? (chatMode === 'support' ? 'Connected to Support. Usually replies in 10 mins.' : 'Connected to Branch Group.') : 'Reconnecting...'}
                    </Text>
                </View>

                {/* Message List */}
                <FlatList
                    ref={flatListRef}
                    data={chat?.messages || []}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <IconSymbol name="envelope.fill" size={48} color={border} />
                            <Text style={styles.emptyText}>Hi {user?.name} 👋</Text>
                            <Text style={styles.emptySubText}>Send us a message and we'll reply as soon as we can.</Text>
                        </View>
                    }
                />

                {/* Input Area */}
                <View style={[styles.inputContainer, { borderTopColor: border }]}>
                    <TouchableOpacity onPress={handleAttach} style={styles.attachButton}>
                        <IconSymbol name="paperclip" size={24} color={primary} />
                    </TouchableOpacity>
                    <TextInput
                        style={[styles.input, { backgroundColor: background, borderColor: border }]}
                        placeholder="Write a message..."
                        value={inputValue}
                        onChangeText={setInputValue}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, { backgroundColor: primary, opacity: inputValue.trim() ? 1 : 0.5 }]}
                        onPress={handleSend}
                        disabled={!inputValue.trim()}
                    >
                        <IconSymbol name="paperplane.fill" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    statusBanner: {
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    messageList: {
        padding: 16,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        opacity: 0.6,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    messageWrapper: {
        marginBottom: 16,
        maxWidth: '80%',
    },
    messageWrapperUser: {
        alignSelf: 'flex-end',
        alignItems: 'flex-end',
    },
    messageWrapperAdmin: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
    },
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    inboxItem: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    inboxContent: {
        flex: 1,
    },
    inboxHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    inboxTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    inboxTime: {
        fontSize: 12,
        color: '#666',
    },
    inboxFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    inboxSubtitle: {
        fontSize: 14,
        color: '#666',
        flex: 1,
        marginRight: 8,
    },
    badge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    timestamp: {
        fontSize: 10,
        color: '#888',
        marginTop: 4,
        paddingHorizontal: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: 1,
        alignItems: 'flex-end',
        backgroundColor: '#fff',
    },
    attachButton: {
        padding: 10,
        marginRight: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        maxHeight: 120,
        fontSize: 16,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        marginBottom: 2,
    },
});
