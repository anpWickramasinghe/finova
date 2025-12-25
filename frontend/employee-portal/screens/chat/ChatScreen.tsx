import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';

export default function ChatScreen() {
    const primary = useColor('primary');

    return (
        <View
            style={{
                flex: 1,
                padding: 24,
                justifyContent: 'center',
            }}
        >
            <Card>
                <View style={{ gap: 12 }}>
                    <Text
                        variant='heading'
                        style={{
                            textAlign: 'center',
                            color: primary,
                        }}
                    >
                        Chat
                    </Text>
                    <Text
                        variant='body'
                        style={{
                            textAlign: 'center',
                            opacity: 0.7,
                        }}
                    >
                        Chat with your colleagues and team members.
                    </Text>
                </View>
            </Card>
        </View>
    );
}
