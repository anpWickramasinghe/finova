import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BarChart } from '@/components/charts/bar-chart';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';

const WorkHoursChart = () => {
    const primary = useColor('primary');
    const secondary = useColor('secondary');
    const mutedForeground = useColor('mutedForeground');

    const chartData = [
        { value: 8, label: 'M', color: primary },
        { value: 7.5, label: 'T', color: primary },
        { value: 8, label: 'W', color: primary },
        { value: 9, label: 'T', color: primary },
        { value: 8.5, label: 'F', color: primary },
        { value: 4, label: 'S', color: secondary },
        { value: 0, label: 'S', color: secondary },
    ];

    return (
        <Card style={styles.card}>
            <View style={styles.header}>
                <Text variant="subtitle" style={styles.title}>Weekly Work Hours</Text>
                <Text variant="caption" style={{ color: mutedForeground }}>Total: 45h</Text>
            </View>
            <View style={styles.chartContainer}>
                <BarChart
                    data={chartData}
                    config={{
                        height: 200,
                        showLabels: true,
                    }}
                />
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontWeight: '600',
    },
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
});

export default WorkHoursChart;
