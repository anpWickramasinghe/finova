import { ScrollView } from 'react-native';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import Header from '@/components/header';
import LeavesChart from '@/components/home/LeavesChart';
import WorkHoursChart from '@/components/home/WorkHoursChart';
import { useAuth } from '@/providers/auth-context';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
    const primary = useColor('primary');
    const { user } = useAuth();
    const router = useRouter();

    return (
        <View style={{ flex: 1 }}>
            <Header
                userName={user?.name}
                onNotificationPress={() => console.log('Notification pressed')}
                onMenuPress={() => router.push('/sheet')}
            />
            <ScrollView
                contentContainerStyle={{
                    padding: 24,
                    gap: 16,
                }}
            >
                {/* <Card>
                    <View style={{ gap: 12 }}>
                        <Text
                            variant='heading'
                            style={{
                                textAlign: 'center',
                                color: primary,
                            }}
                        >
                            Welcome to Employee Portal
                        </Text>
                        <Text
                            variant='body'
                            style={{
                                textAlign: 'center',
                                opacity: 0.7,
                            }}
                        >
                            Manage your leaves, overtime, and chat with colleagues.
                        </Text>
                    </View>
                </Card> */}

                <LeavesChart />
                <WorkHoursChart />
            </ScrollView>
        </View>
    );
}
