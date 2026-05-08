import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import Header from '@/components/header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-gesture-handler';
import MonthlyOvertimeChart from '@/components/overtime/MonthlyOvertimeChart';
import OvertimeHistoryList from '@/components/overtime/OvertimeHistoryList';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { getMyAttendance } from '@/services/attendanceService';
import { ActivityIndicator } from 'react-native';

export default function OvertimeScreen() {
    const primary = useColor('primary');
    const router = useRouter();

    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const data = await getMyAttendance();
                // Filter attendance records that have some overtime
                const otRecords = data.filter((record: any) => 
                    record.overtimeHours && parseFloat(record.overtimeHours) > 0 ||
                    record.calculatedOvertimeMinutes && parseFloat(record.calculatedOvertimeMinutes) > 0
                );
                setRecords(otRecords);
            } catch (error) {
                console.error("Failed to fetch overtime data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, []);

    // Calculate summaries
    const calculateTotalHours = (items: any[]) => {
        return items.reduce((total, item) => {
            const hrs = parseFloat(item.overtimeHours || '0');
            const mins = parseFloat(item.calculatedOvertimeMinutes || '0') / 60;
            return total + (hrs > 0 ? hrs : mins);
        }, 0).toFixed(1);
    };

    const totalHours = calculateTotalHours(records);
    const approvedHours = calculateTotalHours(records.filter(r => r.overtimeStatus === 'Approved'));
    const pendingHours = calculateTotalHours(records.filter(r => (r.overtimeStatus || 'Pending') === 'Pending'));

    return (
        <View style={{ flex: 1 }}>
            <Header
                title="Overtime"
                onNotificationPress={() => console.log('Notification pressed')}
                onMenuPress={() => router.push('/sheet')}
            />
            <ScrollView
                contentContainerStyle={{
                    padding: 24,
                    gap: 16,
                }}
            >
                <MonthlyOvertimeChart />
                
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Card style={{ flex: 1, padding: 16, alignItems: 'center' }}>
                        <Text variant="caption" style={{ color: '#6b7280', marginBottom: 4 }}>Total Hrs</Text>
                        <Text variant="title" style={{ fontSize: 24 }}>{loading ? '-' : totalHours}</Text>
                    </Card>
                    <Card style={{ flex: 1, padding: 16, alignItems: 'center' }}>
                        <Text variant="caption" style={{ color: '#6b7280', marginBottom: 4 }}>Approved</Text>
                        <Text variant="title" style={{ fontSize: 24, color: '#22c55e' }}>{loading ? '-' : approvedHours}</Text>
                    </Card>
                    <Card style={{ flex: 1, padding: 16, alignItems: 'center' }}>
                        <Text variant="caption" style={{ color: '#6b7280', marginBottom: 4 }}>Pending</Text>
                        <Text variant="title" style={{ fontSize: 24, color: '#eab308' }}>{loading ? '-' : pendingHours}</Text>
                    </Card>
                </View>

                <Text variant="title" style={{ marginTop: 8 }}>Overtime History</Text>
                {loading ? (
                    <View style={{ padding: 24, alignItems: "center" }}>
                        <ActivityIndicator size="small" color={primary} />
                    </View>
                ) : (
                    <OvertimeHistoryList records={records} />
                )}

            </ScrollView>
        </View>
    );
}
