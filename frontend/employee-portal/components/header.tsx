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
    greeting,
    title,
    onNotificationPress,
    onMenuPress,
    showBackButton,
    onBack,
}: HeaderProps) {

    const primary = useColor('primary');
    const insets = useSafeAreaInsets();

    const [currentTime, setCurrentTime] = React.useState('');

    React.useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            let hours = now.getHours();
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            setCurrentTime(`${hours}:${minutes} ${ampm}`);
        };

        updateTime();
        const intervalId = setInterval(updateTime, 60000); // update every minute
        return () => clearInterval(intervalId);
    }, []);

    // Dynamically calculate the greeting based on the current time of day if not explicitly passed
    const currentGreeting = greeting || (() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    })();

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
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={styles.greeting}>{currentGreeting}</Text>
                                    {currentTime ? (
                                        <Text style={[styles.greeting, { opacity: 0.75, fontWeight: '500' }]}>• {currentTime}</Text>
                                    ) : null}
                                </View>
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