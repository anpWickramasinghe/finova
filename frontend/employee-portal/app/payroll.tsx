import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Platform,
    Share,
    Clipboard,
} from 'react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Stack, useRouter } from 'expo-router';
import { useColor } from '@/hooks/useColor';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMyPayrollRecords, getMyPayrollById } from '@/services/payrollService';
import {
    Banknote,
    Calendar,
    ChevronRight,
    Download,
    Copy,
    Share2,
    X,
    FileText,
    TrendingUp,
    Shield,
    Clock,
    DollarSign,
    CheckCircle2
} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function PayrollScreen() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(false);

    const router = useRouter();
    const insets = useSafeAreaInsets();

    const background = useColor('background');
    const primary = useColor('primary');
    const textMuted = useColor('textMuted');
    const border = useColor('border');
    const primaryForeground = useColor('primaryForeground');

    const fetchRecords = async () => {
        try {
            const data = await getMyPayrollRecords();
            // Sort by year and month descending (latest first)
            const sorted = data.sort((a: any, b: any) => {
                const yearA = parseInt(a.year);
                const yearB = parseInt(b.year);
                if (yearB !== yearA) return yearB - yearA;
                return parseInt(b.month) - parseInt(a.month);
            });
            setRecords(sorted);
        } catch (error) {
            console.error('Error fetching payroll records:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRecords();
    };

    const handleSelectRecord = async (record: any) => {
        setDetailsLoading(true);
        setSelectedRecord(record); // Set basic record first
        try {
            const detailed = await getMyPayrollById(record.id);
            setSelectedRecord(detailed);
        } catch (error) {
            console.error('Error fetching payslip details:', error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const getMonthName = (monthStr: string) => {
        const monthNum = parseInt(monthStr);
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthNum - 1] || monthStr;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Paid':
                return { bg: '#e6f7ed', text: '#10b981' }; // Green
            case 'Approved':
                return { bg: '#e0f2fe', text: '#0284c7' }; // Blue
            case 'Pending Approval':
                return { bg: '#fef3c7', text: '#d97706' }; // Amber
            default:
                return { bg: '#f3f4f6', text: '#6b7280' }; // Gray
        }
    };

    const copyToClipboard = (text: string) => {
        Clipboard.setString(text);
        setCopiedIndex(true);
        setTimeout(() => setCopiedIndex(false), 2000);
    };

    const handleShare = async (record: any) => {
        try {
            await Share.share({
                message: `Finova Payslip - ${getMonthName(record.month)} ${record.year}\nNet Salary Paid: LKR ${parseFloat(record.netSalary).toFixed(2)}\nRef: ${record.paymentReference || 'N/A'}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleDownloadPDF = async (record: any) => {
        try {
            const month = getMonthName(record.month);
            const year = record.year;
            const netSalary = parseFloat(record.netSalary).toFixed(2);
            const status = record.status;
            const workedDays = record.workedDays;
            const workHours = parseFloat(record.totalWorkHours).toFixed(2);
            const overtimeHours = parseFloat(record.totalOvertimeHours).toFixed(2);
            const totalEarnings = parseFloat(record.totalEarnings).toFixed(2);
            const totalDeductions = parseFloat(record.totalDeductions).toFixed(2);
            const paymentMethod = record.paymentMethod || 'Bank Wire Payout';
            const paymentReference = record.paymentReference || `PAY-${record.id.substring(0, 8)}`;

            let breakdownHtml = '';
            if (record.items && record.items.length > 0) {
                // Filter out Employer EPF and Employer ETF
                const filteredItems = record.items.filter((item: any) => {
                    const name = item.componentName.toLowerCase();
                    return !name.includes('employer epf') && !name.includes('employer etf');
                });
                breakdownHtml = filteredItems.map((item: any) => {
                    const isDeduction = item.type.includes('Deduction');
                    return `
                        <div class="row">
                            <span class="name">${item.componentName}</span>
                            <span class="value ${isDeduction ? 'deductions' : 'earnings'}">
                                ${isDeduction ? '-' : '+'}LKR ${parseFloat(item.amount).toFixed(2)}
                            </span>
                        </div>
                    `;
                }).join('');
            } else {
                breakdownHtml = `
                    <div class="row">
                        <span class="name">Basic Salary</span>
                        <span class="value earnings">+LKR ${parseFloat(record.baseSalary).toFixed(2)}</span>
                    </div>
                `;
                if (parseFloat(record.totalEarnings) > parseFloat(record.baseSalary)) {
                    breakdownHtml += `
                        <div class="row">
                            <span class="name">Overtime & Allowances</span>
                            <span class="value earnings">+LKR ${(parseFloat(record.totalEarnings) - parseFloat(record.baseSalary)).toFixed(2)}</span>
                        </div>
                    `;
                }
                if (parseFloat(record.totalDeductions) > 0) {
                    breakdownHtml += `
                        <div class="row">
                            <span class="name">EPF & Statutory Deductions</span>
                            <span class="value deductions">-LKR ${parseFloat(record.totalDeductions).toFixed(2)}</span>
                        </div>
                    `;
                }
            }

            const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payslip Receipt</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333333;
            margin: 0;
            padding: 40px;
            background-color: #ffffff;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: 700;
            color: #6366f1;
            letter-spacing: 0.5px;
        }
        .title {
            text-align: right;
        }
        .title h1 {
            margin: 0;
            font-size: 20px;
            color: #1e293b;
        }
        .title p {
            margin: 5px 0 0 0;
            font-size: 13px;
            color: #64748b;
        }
        .banner {
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            border-radius: 12px;
            padding: 24px;
            color: #ffffff;
            text-align: center;
            margin-bottom: 30px;
        }
        .banner-subtitle {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.8;
            margin: 0 0 8px 0;
        }
        .banner-value {
            font-size: 36px;
            font-weight: 800;
            margin: 0 0 10px 0;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            background-color: rgba(255, 255, 255, 0.2);
            color: #ffffff;
        }
        .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 24px 0 12px 0;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 6px;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 13px;
            border-bottom: 1px dashed #e2e8f0;
        }
        .row:last-child {
            border-bottom: none;
        }
        .name {
            color: #64748b;
        }
        .value {
            font-weight: 600;
            color: #0f172a;
        }
        .earnings {
            color: #10b981;
        }
        .deductions {
            color: #ef4444;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 14px;
            font-weight: 600;
        }
        .net-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            font-size: 16px;
            font-weight: 700;
            border-top: 2px solid #e2e8f0;
            margin-top: 10px;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">FINOVA</div>
        <div class="title">
            <h1>Payslip Receipt</h1>
            <p>${month} ${year}</p>
        </div>
    </div>

    <div class="banner">
        <p class="banner-subtitle">NET AMOUNT PAID</p>
        <p class="banner-value">LKR ${netSalary}</p>
        <span class="status-badge">${status}</span>
    </div>

    <div class="section-title">Attendance Summary</div>
    <div class="table">
        <div class="row">
            <span class="name">Worked Days</span>
            <span class="value">${workedDays} Days</span>
        </div>
        <div class="row">
            <span class="name">Standard Work Hours</span>
            <span class="value">${workHours}h</span>
        </div>
        <div class="row">
            <span class="name">Approved Overtime</span>
            <span class="value">${overtimeHours}h</span>
        </div>
    </div>

    <div class="section-title">Salary Breakdown</div>
    <div class="table">
        ${breakdownHtml}
        <div class="summary-row" style="border-top: 1px solid #e2e8f0; margin-top: 8px;">
            <span class="name" style="font-weight: 600;">Gross Earnings</span>
            <span class="value">LKR ${totalEarnings}</span>
        </div>
        <div class="summary-row">
            <span class="name" style="font-weight: 600;">Total Deductions</span>
            <span class="value deductions">-LKR ${totalDeductions}</span>
        </div>
        <div class="net-row">
            <span>Net Paid</span>
            <span class="earnings">LKR ${netSalary}</span>
        </div>
    </div>

    <div class="section-title">Payout Audit Trail</div>
    <div class="table">
        <div class="row">
            <span class="name">Payout Method</span>
            <span class="value">${paymentMethod}</span>
        </div>
        <div class="row">
            <span class="name">Reference ID</span>
            <span class="value" style="font-family: monospace;">${paymentReference}</span>
        </div>
        <div class="row">
            <span class="name">Secure Stamp</span>
            <span class="value" style="color: #10b981;">VERIFIED SECURE</span>
        </div>
    </div>

    <div class="footer">
        This is a system generated document and requires no physical signature.<br>
        &copy; ${year} Finova Inc. All rights reserved.
    </div>
</body>
</html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            
            if (Platform.OS === 'ios') {
                await Sharing.shareAsync(uri);
            } else {
                await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Download Payslip PDF', UTI: 'com.adobe.pdf' });
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Could not generate PDF payslip. Please try again.');
        }
    };

    // Calculate YTD Net Paid
    const ytdNet = records
        .filter(r => r.status === 'Paid')
        .reduce((sum, r) => sum + parseFloat(r.netSalary || '0'), 0);

    const totalHoursYtd = records
        .filter(r => r.status === 'Paid')
        .reduce((sum, r) => sum + parseFloat(r.totalWorkHours || '0'), 0);

    return (
        <View style={{ flex: 1, backgroundColor: background, paddingTop: insets.top }}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Payslips & Payroll',
                    headerStyle: { backgroundColor: primary },
                    headerTintColor: '#ffffff',
                    headerShadowVisible: false,
                }}
            />

            {/* Header Gradient Top Styling Block */}
            <View style={[styles.gradientHeader, { backgroundColor: primary }]}>
                <View style={styles.dashboardCard}>
                    <View style={styles.cardRow}>
                        <View>
                            <Text style={styles.cardLabel}>YTD Net Salary</Text>
                            <Text style={styles.cardValue}> LKR {ytdNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        </View>
                        <View style={styles.badgeContainer}>
                            <TrendingUp size={20} color="#10b981" />
                        </View>
                    </View>
                    <View style={styles.cardDivider} />
                    <View style={styles.cardStatsRow}>
                        <View style={styles.statItem}>
                            <Clock size={16} color={primary} />
                            <Text style={styles.statText}>{totalHoursYtd.toFixed(0)} Hrs Worked</Text>
                        </View>
                        <View style={styles.statItem}>
                            <CheckCircle2 size={16} color="#10b981" />
                            <Text style={styles.statText}>{records.filter(r => r.status === 'Paid').length} Paid Payslips</Text>
                        </View>
                    </View>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={primary} />
                    <Text style={{ marginTop: 12, opacity: 0.6 }}>Loading payroll records...</Text>
                </View>
            ) : records.length === 0 ? (
                <ScrollView
                    contentContainerStyle={styles.emptyContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    <FileText size={64} color={textMuted} style={{ opacity: 0.4 }} />
                    <Text style={styles.emptyTitle}>No Payslips Available</Text>
                    <Text style={styles.emptySubtitle}>When payroll is generated by HR, your itemized monthly payslips will appear here.</Text>
                </ScrollView>
            ) : (
                <ScrollView
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    <Text style={styles.sectionTitle}>Payment History</Text>
                    {records.map((item) => {
                        const statusColors = getStatusColor(item.status);
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.payrollCard}
                                onPress={() => handleSelectRecord(item)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={styles.dateBlock}>
                                        <View style={[styles.calendarIconBg, { backgroundColor: '#f0f4ff' }]}>
                                            <Calendar size={20} color={primary} />
                                        </View>
                                        <View>
                                            <Text style={styles.monthName}>{getMonthName(item.month)} {item.year}</Text>
                                            <Text style={styles.salaryType}>{item.salaryType === 'FixedWithOvertime' ? 'Fixed + Overtime' : item.salaryType}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                                        <Text style={[styles.statusText, { color: statusColors.text }]}>{item.status}</Text>
                                    </View>
                                </View>

                                <View style={styles.cardDivider} />

                                <View style={styles.cardFooter}>
                                    <View>
                                        <Text style={styles.workedDaysLabel}>{item.workedDays} Days Worked</Text>
                                        <Text style={{ fontSize: 12, color: textMuted }}>OT Hours: {item.totalOvertimeHours}h</Text>
                                    </View>
                                    <View style={styles.netBlock}>
                                        <Text style={styles.netLabel}>Net Salary</Text>
                                        <Text style={styles.netValue}>LKR{parseFloat(item.netSalary).toFixed(2)}</Text>
                                    </View>
                                    <ChevronRight size={20} color={textMuted} style={{ marginLeft: 8 }} />
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {/* Payslip Detailed Receipt Overlay Modal */}
            <Modal
                visible={selectedRecord !== null}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedRecord(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Payslip Receipt</Text>
                                {selectedRecord && (
                                    <Text style={{ fontSize: 13, color: textMuted }}>
                                        {getMonthName(selectedRecord.month)} {selectedRecord.year}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setSelectedRecord(null)} style={styles.closeButton}>
                                <X size={20} color="#000000" />
                            </TouchableOpacity>
                        </View>

                        {selectedRecord && (
                            <ScrollView contentContainerStyle={styles.modalScroll}>
                                {/* Official Summary Banner */}
                                <View style={styles.receiptBanner}>
                                    <Text style={styles.bannerSubtitle}>NET AMOUNT PAID</Text>
                                    <Text style={styles.bannerValue}> LKR {parseFloat(selectedRecord.netSalary).toFixed(2)}</Text>
                                    <View style={[styles.statusBadge, { alignSelf: 'center', marginTop: 10, backgroundColor: getStatusColor(selectedRecord.status).bg }]}>
                                        <Text style={[styles.statusText, { color: getStatusColor(selectedRecord.status).text }]}>
                                            {selectedRecord.status}
                                        </Text>
                                    </View>
                                </View>

                                {/* Work Summary Section */}
                                <Text style={styles.receiptSectionTitle}>Attendance Summary</Text>
                                <View style={styles.detailsTable}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailName}>Worked Days</Text>
                                        <Text style={styles.detailValue}>{selectedRecord.workedDays} Days</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailName}>Standard Work Hours</Text>
                                        <Text style={styles.detailValue}>{parseFloat(selectedRecord.totalWorkHours).toFixed(2)}h</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailName}>Approved Overtime</Text>
                                        <Text style={styles.detailValue}>{parseFloat(selectedRecord.totalOvertimeHours).toFixed(2)}h</Text>
                                    </View>
                                </View>

                                {/* Itemized Breakdown Section */}
                                <Text style={styles.receiptSectionTitle}>Salary Breakdown</Text>
                                <View style={styles.detailsTable}>
                                    {detailsLoading ? (
                                        <View style={{ padding: 20 }}>
                                            <ActivityIndicator color={primary} />
                                            <Text style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: textMuted }}>Fetching component details...</Text>
                                        </View>
                                    ) : selectedRecord.items && selectedRecord.items.length > 0 ? (
                                        selectedRecord.items
                                            .filter((item: any) => {
                                                const name = item.componentName.toLowerCase();
                                                return !name.includes('employer epf') && !name.includes('employer etf');
                                            })
                                            .map((item: any) => {
                                                const isDeduction = item.type.includes('Deduction');
                                                return (
                                                    <View key={item.id} style={styles.detailRow}>
                                                        <Text style={styles.detailName}>{item.componentName}</Text>
                                                        <Text style={[styles.detailValue, { color: isDeduction ? '#ef4444' : '#10b981' }]}>
                                                            {isDeduction ? '-' : '+'}${parseFloat(item.amount).toFixed(2)}
                                                        </Text>
                                                    </View>
                                                );
                                            })
                                    ) : (
                                        <>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailName}>Basic Salary</Text>
                                                <Text style={[styles.detailValue, { color: '#10b981' }]}> LKR {parseFloat(selectedRecord.baseSalary).toFixed(2)}</Text>
                                            </View>
                                            {parseFloat(selectedRecord.totalEarnings) > parseFloat(selectedRecord.baseSalary) && (
                                                <View style={styles.detailRow}>
                                                    <Text style={styles.detailName}>Overtime & Allowances</Text>
                                                    <Text style={[styles.detailValue, { color: '#10b981' }]}> LKR {(parseFloat(selectedRecord.totalEarnings) - parseFloat(selectedRecord.baseSalary)).toFixed(2)}</Text>
                                                </View>
                                            )}
                                            {parseFloat(selectedRecord.totalDeductions) > 0 && (
                                                <View style={styles.detailRow}>
                                                    <Text style={styles.detailName}>EPF & Statutory Deductions</Text>
                                                    <Text style={[styles.detailValue, { color: '#ef4444' }]}>-LKR{parseFloat(selectedRecord.totalDeductions).toFixed(2)}</Text>
                                                </View>
                                            )}
                                        </>
                                    )}

                                    {/* Final Summary Row */}
                                    <View style={styles.totalRow}>
                                        <Text style={styles.totalName}>Gross Earnings</Text>
                                        <Text style={styles.totalValue}>${parseFloat(selectedRecord.totalEarnings).toFixed(2)}</Text>
                                    </View>
                                    <View style={styles.totalRow}>
                                        <Text style={styles.totalName}>Total Deductions</Text>
                                        <Text style={[styles.totalValue, { color: '#ef4444' }]}>-${parseFloat(selectedRecord.totalDeductions).toFixed(2)}</Text>
                                    </View>
                                    <View style={styles.netRow}>
                                        <Text style={styles.netReceiptLabel}>Net Paid</Text>
                                        <Text style={styles.netReceiptValue}>LKR {parseFloat(selectedRecord.netSalary).toFixed(2)}</Text>
                                    </View>
                                </View>

                                {/* Transaction Audit Trail */}
                                <Text style={styles.receiptSectionTitle}>Payout Audit Trail</Text>
                                <View style={styles.auditTable}>
                                    <View style={styles.auditRow}>
                                        <Text style={styles.auditLabel}>Payout Method</Text>
                                        <Text style={styles.auditValue}>{selectedRecord.paymentMethod || 'Bank Wire Payout'}</Text>
                                    </View>
                                    <View style={styles.auditRow}>
                                        <Text style={styles.auditLabel}>Reference ID</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Text style={styles.auditValue} numberOfLines={1} ellipsizeMode="middle">
                                                {selectedRecord.paymentReference || `PAY-${selectedRecord.id.substring(0, 8)}`}
                                            </Text>
                                            <TouchableOpacity onPress={() => copyToClipboard(selectedRecord.paymentReference || selectedRecord.id)}>
                                                <Copy size={14} color={copiedIndex ? '#10b981' : textMuted} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View style={styles.auditRow}>
                                        <Text style={styles.auditLabel}>System Secure Stamp</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <Shield size={14} color="#10b981" />
                                            <Text style={[styles.auditValue, { color: '#10b981', fontWeight: '500' }]}>Verified</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Interaction Action Row */}
                                <View style={styles.actionButtonContainer}>
                                    <Button
                                        variant="outline"
                                        style={{ flex: 1 }}
                                        icon={Share2}
                                        onPress={() => handleShare(selectedRecord)}
                                    >
                                        Share Receipt
                                    </Button>
                                    <Button
                                        variant="default"
                                        style={{ flex: 1 }}
                                        icon={Download}
                                        onPress={() => handleDownloadPDF(selectedRecord)}
                                    >
                                        Download PDF
                                    </Button>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    gradientHeader: {
        paddingHorizontal: 20,
        paddingBottom: 28,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    dashboardCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 6,
        marginTop: 10,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1f2937',
        marginTop: 4,
    },
    badgeContainer: {
        padding: 10,
        borderRadius: 16,
        backgroundColor: '#e6f7ed',
    },
    cardDivider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginVertical: 16,
    },
    cardStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#4b5563',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        gap: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1f2937',
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 16,
    },
    payrollCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    calendarIconBg: {
        padding: 10,
        borderRadius: 12,
    },
    monthName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    salaryType: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    workedDaysLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    netBlock: {
        alignItems: 'flex-end',
    },
    netLabel: {
        fontSize: 11,
        color: '#6b7280',
        textTransform: 'uppercase',
    },
    netValue: {
        fontSize: 17,
        fontWeight: '700',
        color: '#10b981',
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        maxHeight: '90%',
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
    },
    closeButton: {
        padding: 8,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
    },
    modalScroll: {
        padding: 20,
    },
    receiptBanner: {
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 24,
    },
    bannerSubtitle: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748b',
        letterSpacing: 1,
    },
    bannerValue: {
        fontSize: 36,
        fontWeight: '800',
        color: '#0f172a',
        marginTop: 8,
    },
    receiptSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
        marginTop: 8,
    },
    detailsTable: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 24,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    detailName: {
        fontSize: 14,
        color: '#64748b',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#0f172a',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    totalName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#334155',
    },
    totalValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
    netRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 16,
    },
    netReceiptLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
    },
    netReceiptValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#10b981',
    },
    auditTable: {
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 24,
    },
    auditRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    auditLabel: {
        fontSize: 13,
        color: '#64748b',
    },
    auditValue: {
        fontSize: 13,
        fontWeight: '500',
        color: '#334155',
        maxWidth: 160,
    },
    actionButtonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
});
