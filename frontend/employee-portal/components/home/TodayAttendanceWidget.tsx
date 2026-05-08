import React from 'react';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { useColor } from '@/hooks/useColor';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

// Mock component for Today's Attendance until hooked up to backend
export default function TodayAttendanceWidget() {
    const primary = useColor('primary');
    const mutedForeground = useColor('mutedForeground');

    // Toggle this boolean to see checked in vs not checked in state
    const isCheckedIn = false;

    return (
        <Card style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View>
                    <Text variant="title">Today's Status</Text>
                    <Text variant="caption" style={{ color: mutedForeground, marginTop: 4 }}>
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="title" style={{ fontSize: 24, color: primary }}>
                        {isCheckedIn ? '4h 12m' : '--:--'}
                    </Text>
                    <Text variant="caption" style={{ color: mutedForeground }}>Elapsed Time</Text>
                </View>
            </View>

            {isCheckedIn ? (
                <View style={{ gap: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: primary + '10', padding: 12, borderRadius: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Icon name={LogIn} size={16} color={primary} />
                            <Text variant="body" style={{ color: primary, fontWeight: '500' }}>Checked In at</Text>
                        </View>
                        <Text variant="body" style={{ fontWeight: '600' }}>08:45 AM</Text>
                    </View>
                    <Button variant="destructive" style={{ width: '100%', flexDirection: 'row', gap: 8 }}>
                        <Icon name={LogOut} size={20} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Check Out</Text>
                    </Button>
                </View>
            ) : (
                <View style={{ gap: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8 }}>
                        <Text variant="body" style={{ color: mutedForeground }}>You haven't checked in yet.</Text>
                    </View>
                    <Button variant="default" style={{ width: '100%', flexDirection: 'row', gap: 8 }}>
                        <Icon name={LogIn} size={20} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Check In Now</Text>
                    </Button>
                </View>
            )}
        </Card>
    );
}
