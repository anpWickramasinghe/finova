import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Download, FileSpreadsheet, Users, Clock, Receipt, Loader2, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { reportService } from '@/services/reportService';
import type { ReportStats } from '@/services/reportService';
import { toast } from 'sonner';


const Reports = () => {
    const [startDate, setStartDate] = useState(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [loading, setLoading] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('attendance');
    const [statsData, setStatsData] = useState<ReportStats | null>(null);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        fetchStats();
    }, [startDate, endDate]);

    const fetchStats = async () => {
        setFetching(true);
        try {
            const data = await reportService.getStats(startDate, endDate);
            setStatsData(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
            toast.error("Failed to fetch report statistics");
        } finally {
            setFetching(false);
        }
    };

    const handleGenerate = (type: string, format: 'pdf' | 'csv') => {
        setLoading(`${type}-${format}`);
        setTimeout(() => {
            setLoading(null);
            
            let content = "";
            if (format === 'csv') {
                if (type === 'attendance' && statsData?.attendance) {
                    content = "Date,Count\n" + statsData.attendance.map(d => `${d.name},${d.count}`).join("\n");
                } else if (type === 'overtime' && statsData?.overtime) {
                    content = "Week,Hours\n" + statsData.overtime.map(d => `${d.name},${d.hours}`).join("\n");
                } else if (type === 'transactions' && statsData?.transactions) {
                    content = "Month,Volume\n" + statsData.transactions.map(d => `${d.name},${d.volume}`).join("\n");
                }
            } else {
                content = `${type.toUpperCase()} REPORT (${format.toUpperCase()})\nStart Date: ${startDate}\nEnd Date: ${endDate}\n\nSummary Metrics:\n` + 
                          `Total Items: ${statsData?.summary?.totalReports ?? 0}\nActive Employees: ${statsData?.summary?.activeEmployees ?? 0}\n\n` +
                          `Generated on: ${new Date().toLocaleString()}`;
            }

            const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}-report-${new Date().toISOString().slice(0, 10)}.${format}`;
            a.click();
            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report generated successfully`);
        }, 1500);
    };

    const stats = [
        { title: "Total Transactions", value: statsData?.summary?.totalReports !== undefined ? statsData.summary.totalReports.toLocaleString() : "...", change: "From selected period", icon: <FileSpreadsheet className="w-4 h-4 text-primary" /> },
        { title: "Active Employees", value: statsData?.summary?.activeEmployees !== undefined ? statsData.summary.activeEmployees.toLocaleString() : "...", change: "Current branch count", icon: <Users className="w-4 h-4 text-blue-500" /> },
        { title: "System Health", value: statsData?.summary?.systemHealth ?? "...", change: "All services operational", icon: <TrendingUp className="w-4 h-4 text-green-500" /> }
    ];


    return (
        <div className="min-h-screen pb-12 font-sans bg-background/50 text-foreground">
            {/* Header Section */}
            <div className="px-6 py-8 border-b shadow-sm bg-card">
                <div className="mx-auto max-w-7xl">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col justify-between gap-4 md:flex-row md:items-center"
                    >
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports Intelligence Center</h1>
                            <p className="mt-2 text-lg text-muted-foreground">
                                Comprehensive insights and data exports for your organization.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 p-2 border bg-muted/50 rounded-xl border-border/50">
                             <div className="flex items-center gap-2 px-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Today: {new Date().toLocaleDateString()}</span>
                             </div>
                        </div>
                    </motion.div>

                    {/* Top Stats */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-3"
                    >
                        {stats.map((stat, i) => (
                            <Card key={i} className="transition-all shadow-sm bg-background/60 backdrop-blur-sm border-border/50 hover:shadow-md">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                                        <div className="p-2 rounded-md bg-muted">
                                            {stat.icon}
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <h3 className="text-3xl font-bold">{stat.value}</h3>
                                        <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-6 mx-auto mt-8 max-w-7xl">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full max-w-2xl grid-cols-3 p-1 mb-8 bg-muted/50 rounded-xl">
                        <TabsTrigger value="attendance" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all py-2.5">
                            <Users className="w-4 h-4" /> Attendance
                        </TabsTrigger>
                        <TabsTrigger value="overtime" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all py-2.5">
                            <Clock className="w-4 h-4" /> Overtime
                        </TabsTrigger>
                        <TabsTrigger value="transactions" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all py-2.5">
                            <Receipt className="w-4 h-4" /> Transactions
                        </TabsTrigger>
                    </TabsList>

            {fetching && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {!fetching && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'attendance' && (
                            <ReportPanel 
                                type="attendance"
                                title="Employee Attendance Report" 
                                description="Track daily check-ins, absences, and calculate total working hours for payroll processing."
                                icon={<Users className="w-6 h-6 text-blue-600" />}
                                chartData={statsData?.attendance || []}
                                chartColor="#2563eb"
                                dataKey="count"
                                startDate={startDate}
                                endDate={endDate}
                                onStartChange={setStartDate}
                                onEndChange={setEndDate}
                                onGenerate={handleGenerate}
                                loading={loading}
                            />
                        )}
                        {activeTab === 'overtime' && (
                            <ReportPanel 
                                type="overtime"
                                title="Overtime Analytics" 
                                description="Analyze extra hours worked by staff to manage resources and budget effectively."
                                icon={<Clock className="w-6 h-6 text-orange-600" />}
                                chartData={statsData?.overtime || []}
                                chartColor="#ea580c"
                                dataKey="hours"
                                startDate={startDate}
                                endDate={endDate}
                                onStartChange={setStartDate}
                                onEndChange={setEndDate}
                                onGenerate={handleGenerate}
                                loading={loading}
                            />
                        )}
                        {activeTab === 'transactions' && (
                            <ReportPanel 
                                type="transactions"
                                title="Financial Transactions" 
                                description="Detailed ledger of all inward and outward system transactions for the given period."
                                icon={<Receipt className="w-6 h-6 text-green-600" />}
                                chartData={statsData?.transactions || []}
                                chartColor="#16a34a"
                                dataKey="volume"
                                startDate={startDate}
                                endDate={endDate}
                                onStartChange={setStartDate}
                                onEndChange={setEndDate}
                                onGenerate={handleGenerate}
                                loading={loading}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            )}

                </Tabs>
            </div>
        </div>
    );
};

interface ReportPanelProps {
    type: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    chartData: any[];
    chartColor: string;
    dataKey: string;
    startDate: string;
    endDate: string;
    onStartChange: (val: string) => void;
    onEndChange: (val: string) => void;
    onGenerate: (type: string, format: 'pdf' | 'csv') => void;
    loading: string | null;
}

const ReportPanel: React.FC<ReportPanelProps> = ({ 
    type, title, description, icon, chartData, chartColor, dataKey, 
    startDate, endDate, onStartChange, onEndChange, onGenerate, loading 
}) => {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
                <Card className="flex flex-col h-full shadow-sm border-border/50">
                    <CardHeader className="pb-6 border-b bg-muted/10 border-border/50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-background rounded-xl border border-border/50 shadow-sm">
                                {icon}
                            </div>
                            <CardTitle className="text-xl">{title}</CardTitle>
                        </div>
                        <CardDescription className="mt-2 text-sm leading-relaxed">{description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow pt-6 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 text-sm font-medium border-b text-muted-foreground">
                                <AlertCircle className="w-4 h-4" /> Filter Parameters
                            </div>
                            <div className="space-y-2">
                                <label htmlFor={`${type}-start`} className="text-sm font-medium">
                                    Start Date
                                </label>
                                <Input 
                                    id={`${type}-start`} 
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e) => onStartChange(e.target.value)} 
                                    className="bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor={`${type}-end`} className="text-sm font-medium">
                                    End Date
                                </label>
                                <Input 
                                    id={`${type}-end`} 
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e) => onEndChange(e.target.value)} 
                                    className="bg-background"
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 p-6 border-t bg-muted/10 border-border/50">
                        <Button 
                            className="w-full text-base shadow-sm h-11" 
                            disabled={loading !== null} 
                            onClick={() => onGenerate(type, 'csv')}
                        >
                            {loading === `${type}-csv` ? (
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                                <FileSpreadsheet className="w-5 h-5 mr-2" />
                            )}
                            Generate CSV Export
                        </Button>
                        <Button 
                            variant="outline" 
                            className="w-full text-base h-11 bg-background" 
                            disabled={loading !== null} 
                            onClick={() => onGenerate(type, 'pdf')}
                        >
                            {loading === `${type}-pdf` ? (
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                                <Download className="w-5 h-5 mr-2" />
                            )}
                            Download PDF Summary
                        </Button>
                    </CardFooter>
                </Card>
            </div>
            
            <div className="lg:col-span-2">
                <Card className="flex flex-col h-full shadow-sm border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium text-muted-foreground">Recent Trend Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow min-h-[350px]">
                        <div className="w-full h-full pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id={`color-${type}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                                        dx={-10}
                                    />
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey={dataKey} 
                                        stroke={chartColor} 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill={`url(#color-${type})`} 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Reports;
