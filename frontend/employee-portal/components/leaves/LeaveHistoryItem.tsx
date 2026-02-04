import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { Badge } from '@/components/ui/badge';
import { useColor } from '@/hooks/useColor';

interface LeaveRequest {
    id: string;
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string;
}

interface LeaveHistoryItemProps {
    item: LeaveRequest;
}

export default function LeaveHistoryItem({ item }: LeaveHistoryItemProps) {
    const mutedForeground = useColor('mutedForeground');

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Approved': return 'success';
            case 'Rejected': return 'destructive';
            default: return 'secondary'; // Pending
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <Card style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <View>
                    <Text variant="body" style={{ fontWeight: '600' }}>{item.type}</Text>
                    <Text variant="caption" style={{ color: mutedForeground }}>
                        {formatDate(item.startDate)} - {formatDate(item.endDate)}
                    </Text>
                </View>
                <Badge variant={getStatusVariant(item.status)}>
                    <Text>{item.status}</Text>
                </Badge>
            </View>
            {item.reason && (
                <Text variant="caption" numberOfLines={2} style={{ color: mutedForeground, marginTop: 4 }}>
                    {item.reason}
                </Text>
            )}
        </Card>
    );
}
