import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { ArrowRight } from 'lucide-react-native';
import { useColor } from '@/hooks/useColor';

interface CardStatsProps {
    title: string;
    count?: number | string;
    status?: string;
    icon?: any;
    color?: string;
    bgColor?: string;
}

export function CardStats({ title, count, status, icon: Icon, color, bgColor }: CardStatsProps) {
    const muted = useColor('muted');

    return (
        <Card
            style={{
                width: '47%',
                backgroundColor: bgColor,
                borderWidth: 0,
                shadowOpacity: 0,
            }}
        >
            <CardContent style={{ padding: 16 }}>
                <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text style={{ fontWeight: '600', fontSize: 16 }}>
                            {title}
                        </Text>
                        {Icon && <Icon size={20} color={color} />}
                    </View>

                    {status && (
                        <Text style={{ fontSize: 14, color: muted, marginTop: 4 }}>
                            {status}
                        </Text>
                    )}

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                        <Text style={{ color: color, fontWeight: '600' }}>
                            View
                        </Text>
                        <ArrowRight size={20} color={color} />
                    </View>
                </View>
            </CardContent>
        </Card>
    );
}
