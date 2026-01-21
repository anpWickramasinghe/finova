import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import Header from '@/components/header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-gesture-handler';
import MonthlyOvertimeChart from '@/components/overtime/MonthlyOvertimeChart';
import { TabsDisabled } from '@/components/demo/tabs/tabs-disabled';
import { useRouter } from 'expo-router';

export default function OvertimeScreen() {
    const primary = useColor('primary');
    const router = useRouter();

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
                <TabsDisabled />

            </ScrollView>
        </View>
    );
}
