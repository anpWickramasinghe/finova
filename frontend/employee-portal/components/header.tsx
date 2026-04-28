import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { Bell, Menu, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
    userName?: string;
    greeting?: string;
    title?: string;
    onNotificationPress?: () => void;
    onMenuPress?: () => void;
    showBackButton?: boolean;
    onBack?: () => void;
}

export default function Header({
    userName = 'Nethmina !',
    greeting = 'Good Morning',
    title,
    onNotificationPress,
    onMenuPress,
    showBackButton,
    onBack,
}: HeaderProps) {

    const primary = useColor('primary');
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: primary,
                    paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : 20),
                },
            ]}
        >
            <View style={styles.content}>
                <View style={styles.textContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {showBackButton && (
                            <TouchableOpacity onPress={onBack}>
                                <ChevronLeft size={28} color="white" />
                            </TouchableOpacity>
                        )}
                        {title ? (
                            <Text style={styles.title}>{title}</Text>
                        ) : (
                            <View>
                                <Text style={styles.greeting}>{greeting}</Text>
                                <Text style={styles.userName}>{userName}</Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={styles.iconContainer}>
                    {!showBackButton && (
                        <TouchableOpacity onPress={onNotificationPress} style={styles.iconButton}>
                            <Bell size={24} color="white" />
                            <View style={styles.badge} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
                        <Menu size={28} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    textContainer: {
        gap: 4,
    },
    greeting: {
        color: 'white',
        opacity: 0.8,
        fontSize: 14,
    },
    userName: {
        color: 'white',
        fontSize: 24,
        fontWeight: '600',
    },
    title: {
        color: 'white',
        fontSize: 20,
        fontWeight: '600',
    },
    iconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconButton: {
        padding: 4,
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF9F0A',
        borderWidth: 1.5,
        borderColor: '#2a3c97',
    },
});