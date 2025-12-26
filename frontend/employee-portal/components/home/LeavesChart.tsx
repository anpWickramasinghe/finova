import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DoughnutChart } from '@/components/charts/doughnut-chart';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useColor } from '@/hooks/useColor';

const LeavesChart = () => {
    const primary = useColor('primary');
    const muted = useColor('muted');

    const chartData = [
        { value: 12, color: primary, label: 'Available' },
        { value: 8, color: muted, label: 'Used' },
    ];

    return (
        <Card style={styles.card}>
            <View style={styles.header}>
                <Text variant="subtitle" style={styles.title}>Available Leaves</Text>
                <Button size="sm" variant="outline" onPress={() => { }}>
                    <Text>Apply</Text>
                </Button>
            </View>
            <View style={styles.chartContainer}>
                <DoughnutChart
                    data={chartData}
                    config={{
                        height: 200,
                        innerRadius: 0.6,
                        showLabels: false,
                    }}
                />
                <View style={styles.centerLabel}>
                    <Text style={{ fontSize: 30, fontWeight: 'bold', color: primary }}>12</Text>
                    <Text variant="body">Available</Text>
                </View>
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
        height:200,
        marginBottom: 16,
        position: 'relative',
    },
    centerLabel: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 60,
    },
});

export default LeavesChart;
