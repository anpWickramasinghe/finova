import React, { useState } from 'react';
import { View } from '@/components/ui/view';
import { Button } from '@/components/ui/button';
import { GroupedInput, GroupedInputItem } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { ScrollView, TouchableOpacity } from 'react-native';
import { Calendar } from 'lucide-react-native';

interface LeaveRequestFormProps {
    onSubmit: (data: { startDate: Date; endDate: Date; type: string; reason: string }) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Other Leave'];

export default function LeaveRequestForm({ onSubmit, onCancel, isLoading }: LeaveRequestFormProps) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [type, setType] = useState(LEAVE_TYPES[0]);
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const primary = useColor('primary');
    const border = useColor('border');
    const background = useColor('card');

    const handleSubmit = async () => {
        if (!startDate || !endDate || !reason) {
            setError('All fields are required');
            return;
        }

        // Basic date validation (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
            setError('Dates must be in YYYY-MM-DD format');
            return;
        }

        try {
            await onSubmit({
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                type,
                reason
            });
        } catch (e) {
            setError('Failed to submit request');
        }
    };

    return (
        <View style={{ gap: 24 }}>
            <View>
                <Text variant="caption" style={{ marginBottom: 8, marginLeft: 4 }}>Leave Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {LEAVE_TYPES.map((t) => (
                        <TouchableOpacity
                            key={t}
                            onPress={() => setType(t)}
                            style={{
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                borderRadius: 20,
                                backgroundColor: type === t ? primary : background,
                                borderWidth: 1,
                                borderColor: type === t ? primary : border,
                            }}
                        >
                            <Text style={{ color: type === t ? 'white' : undefined, fontWeight: '500', fontSize: 12 }}>
                                {t}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <GroupedInput title="Dates">
                <GroupedInputItem
                    label="Start"
                    placeholder="YYYY-MM-DD"
                    value={startDate}
                    onChangeText={setStartDate}
                    icon={Calendar}
                />
                <GroupedInputItem
                    label="End"
                    placeholder="YYYY-MM-DD"
                    value={endDate}
                    onChangeText={setEndDate}
                    icon={Calendar}
                />
            </GroupedInput>

            <GroupedInput title="Reason">
                <GroupedInputItem
                    type="textarea"
                    placeholder="Why are you requesting leave?"
                    value={reason}
                    onChangeText={setReason}
                    rows={4}
                />
            </GroupedInput>

            {error ? (
                <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>
            ) : null}

            <View style={{ gap: 12 }}>
                <Button onPress={handleSubmit} loading={isLoading}>
                    Submit Request
                </Button>
                <Button variant="outline" onPress={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
            </View>
        </View>
    );
}
