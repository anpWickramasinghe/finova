import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DoughnutChart } from '@/components/charts/doughnut-chart';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useColor } from '@/hooks/useColor';

const MonthlyOvertimeChart = () => {
    const primary = useColor('primary');
    const muted = useColor('muted');

    const chartData = [
        { value: 75, color: primary, label: 'Worked' },
        { value: 25, color: muted, label: 'Remaining' }, 
    ];

    return (
        <Card style={styles.card}>
            <View style={styles.header}>
                <Text variant="subtitle" style={styles.title}>Monthly Overtime</Text>
               
            </View>
            <View style={styles.chartContainer}>
                <DoughnutChart
                    data={chartData}
                    config={{
                        height: 160,
                        innerRadius: 0.6,
                        showLabels: false,
                    }}
                />
                <View style={styles.centerLabel}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: primary }}>75%</Text>
                    <Text variant="body">Worked</Text>
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
        height: 160,
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

export default MonthlyOvertimeChart;
