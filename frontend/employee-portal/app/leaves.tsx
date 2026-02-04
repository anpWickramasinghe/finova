import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { getMyLeaveRequests, createLeaveRequest } from '@/services/leaveService';
import LeaveHistoryItem from '@/components/leaves/LeaveHistoryItem';
import LeaveRequestForm from '@/components/leaves/LeaveRequestForm';
import { Stack } from 'expo-router';
import { useColor } from '@/hooks/useColor';
import { Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LeavesScreen() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const background = useColor('background');
    const insets = useSafeAreaInsets();

    const fetchRequests = async () => {
        try {
            const data = await getMyLeaveRequests();
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRequests();
    };

    const handleCreate = async (data: any) => {
        setSubmitting(true);
        try {
            await createLeaveRequest(data);
            await fetchRequests();
            setShowForm(false);
        } catch (error) {
            console.error(error);
            alert('Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: background, paddingTop: insets.top }}>
            <Stack.Screen options={{ title: showForm ? 'New Request' : 'My Leaves' }} />

            {showForm ? (
                <View style={{ padding: 20 }}>
                    <LeaveRequestForm
                        onSubmit={handleCreate}
                        onCancel={() => setShowForm(false)}
                        isLoading={submitting}
                    />
                </View>
            ) : (
                <>
                    <ScrollView
                        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    >
                        {loading && !refreshing ? (
                            <ActivityIndicator />
                        ) : requests.length === 0 ? (
                            <Text style={{ textAlign: 'center', marginTop: 40, opacity: 0.5 }}>No leave requests found.</Text>
                        ) : (
                            requests.map((req) => (
                                <LeaveHistoryItem key={req.id} item={req} />
                            ))
                        )}
                    </ScrollView>

                    <View style={{ position: 'absolute', bottom: 20, right: 20, left: 20 }}>
                        <Button onPress={() => setShowForm(true)} icon={Plus}>
                            Request Leave
                        </Button>
                    </View>
                </>
            )}
        </View>
    );
}
