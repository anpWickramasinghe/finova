import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { getAttendanceStatus, getMyAttendance } from '../../services/attendanceService';
import { Colors } from '../../theme/colors';
import Header from '../../components/header';

const AttendanceScreen = () => {
    const [status, setStatus] = useState<'Not Checked In' | 'Checked In' | 'Checked Out'>('Not Checked In');
    const [lastActionTime, setLastActionTime] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const [statusRes, historyRes] = await Promise.all([
                getAttendanceStatus(),
                getMyAttendance()
            ]);
            setStatus(statusRes.status);
            setLastActionTime(statusRes.lastActionTime);
            setHistory(historyRes);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch attendance data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const formatTime = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const renderHeader = () => (
    
        <View>
        <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Attendance</Text>

            <View style={styles.statusCard}>
                <Text style={styles.statusLabel}>Today's Status</Text>
                <Text style={[styles.statusValue,
                status === 'Checked In' ? styles.statusActive :
                    status === 'Checked Out' ? styles.statusCompleted : styles.statusPending
                ]}>
                    {status}
                </Text>
                {lastActionTime && (
                    <Text style={styles.lastActionText}>
                        Last {status === 'Checked In' ? 'Check In' : 'Check Out'}: {formatTime(lastActionTime)}
                    </Text>
                )}
                <Text style={styles.infoText}>
                    Attendance is automatically recorded via biometric devices.
                </Text>
            </View>

            <Text style={styles.historyTitle}>Recent History</Text>
        </View>
          </View>
    );

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.historyCard}>
            <View style={styles.historyDateContainer}>
                <Text style={styles.historyDate}>{formatDate(item.recordDate)}</Text>
                <View style={[styles.statusBadge, item.status === 'Late' ? styles.badgeLate : styles.badgePresent]}>
                    <Text style={styles.statusBadgeText}>{item.status || 'Present'}</Text>
                </View>
            </View>
            <View style={styles.historyDetails}>
                <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>In</Text>
                    <Text style={styles.timeValue}>{formatTime(item.checkInTime)}</Text>
                </View>
                <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>Out</Text>
                    <Text style={styles.timeValue}>{formatTime(item.checkOutTime)}</Text>
                </View>
                <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>Hours</Text>
                    <Text style={styles.timeValue}>{item.workHours ? item.workHours + 'h' : '-'}</Text>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={history}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={renderHeader}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={<Text style={styles.emptyText}>No attendance records found.</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
    },
    headerContainer: {
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 20,
    },
    statusCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 24,
    },
    statusLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statusValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    statusActive: {
        color: '#10b981',
    },
    statusCompleted: {
        color: '#6b7280',
    },
    statusPending: {
        color: '#f59e0b',
    },
    lastActionText: {
        fontSize: 14,
        color: '#888',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    historyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
        marginTop: 12,
    },
    historyCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    historyDateContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    historyDate: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgePresent: {
        backgroundColor: '#ecfdf5',
    },
    badgeLate: {
        backgroundColor: '#fffbeb',
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#059669', // Adjust for late if needed
    },
    historyDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeBlock: {
        alignItems: 'center',
    },
    timeLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    timeValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1a1a1a',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 20,
        fontSize: 16,
    },
});

export default AttendanceScreen;
