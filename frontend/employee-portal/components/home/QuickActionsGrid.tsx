import React from 'react';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { useColor } from '@/hooks/useColor';
import { TouchableOpacity } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Calendar, Clock, Banknote, MessageSquare } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function QuickActionsGrid() {
    const primary = useColor('primary');
    const router = useRouter();

    const actions = [
        {
            title: 'Leaves',
            icon: Calendar,
            route: '/leaves',
            color: '#3b82f6', // Blue
        },
        {
            title: 'Overtime',
            icon: Clock,
            route: '/overtime',
            color: '#f59e0b', // Amber
        },
        {
            title: 'Payslips',
            icon: Banknote,
            route: '/payroll',
            color: '#10b981', // Emerald
        },
        {
            title: 'Chat',
            icon: MessageSquare,
            route: '/chat',
            color: '#8b5cf6', // Violet
        },
    ];

    return (
        <View style={{ gap: 8 }}>
            <Text variant="title" style={{ marginBottom: 4 }}>Quick Actions</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {actions.map((action, index) => (
                    <View key={index} style={{ width: '48%' }}>
                        <TouchableOpacity onPress={() => router.push(action.route as any)}>
                            <Card style={{ padding: 16, alignItems: 'center', gap: 8 }}>
                                <View style={{ 
                                    width: 48, 
                                    height: 48, 
                                    borderRadius: 24, 
                                    backgroundColor: action.color + '20', 
                                    alignItems: 'center', 
                                    justifyContent: 'center' 
                                }}>
                                    <Icon name={action.icon} size={24} color={action.color} />
                                </View>
                                <Text variant="body" style={{ fontWeight: '500' }}>{action.title}</Text>
                            </Card>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </View>
    );
}
