import React, { useEffect, useState } from 'react';
import { leaveService, type LeaveRequest } from '@/services/leaveService';
import { StatCard } from '@/components/leaves/StatCard';
import { LeaveOverview } from '@/components/leaves/LeaveOverview';
import { LeaveCalendar } from '@/components/leaves/LeaveCalendar';
import { EmployeeLeavesList } from '@/components/leaves/EmployeeLeavesList';
import { LeaveTypes } from '@/components/leaves/LeaveTypes';
import { LeaveActivityTable } from '@/components/leaves/LeaveActivityTable';
import { Briefcase, Stethoscope, Palmtree, UserMinus } from "lucide-react";


import { format } from 'date-fns';

const LeaveManagementPage: React.FC = () => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [stats, setStats] = useState<{
        totalOnLeave: number;
        distribution: { name: string; value: number; color: string }[];
        weekStats: { name: string; value: number }[];
        upcomingLeaves: any[];
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState<Date | undefined>(new Date());

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsData, requestsData] = await Promise.all([
                leaveService.getLeaveStats(),
                leaveService.getLeaveRequests()
            ]);
            setStats(statsData);
            setRequests(requestsData);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStatusUpdate = async (id: string, status: 'Approved' | 'Rejected') => {
        setProcessingId(id);
        try {
            await leaveService.updateLeaveStatus(id, status);
            // Refresh data to update stats and list
            fetchData();
        } catch (error) {
            console.error("Error updating status", error);
        } finally {
            setProcessingId(null);
        }
    };

    // Helper to extract count from distribution
    const getCount = (name: string) => stats?.distribution.find(d => d.name === name)?.value || 0;
    const totalLeaves = stats?.distribution.reduce((acc, curr) => acc + curr.value, 0) || 1; // Avoid div by 0

    // Helper to format upcoming leaves for the component
    const formattedUpcomingLeaves = stats?.upcomingLeaves.map(leave => {
        const typeColor =
            leave.type === 'Sick Leave' ? 'text-emerald-500 bg-emerald-50' :
                leave.type === 'Annual Leave' ? 'text-blue-500 bg-blue-50' :
                    'text-amber-500 bg-amber-50';

        return {
            name: leave.userName || 'Unknown',
            type: leave.type,
            date: format(new Date(leave.startDate), 'dd MMM yyyy'),
            avatar: (leave.userName || 'U').charAt(0),
            color: typeColor
        };
    }) || [];

    return (
        <div className="p-8 space-y-8 bg-slate-50/30 min-h-screen">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Leaves</h1>
                <p className="text-muted-foreground">
                    Leaves overview for today.
                </p>
            </div>
            {/* Stat Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total On Leave (Today)"
                    count={stats?.totalOnLeave || 0}
                    icon={UserMinus}
                    colorClass="text-emerald-600"
                    bgClass="bg-emerald-100/50"
                    isFeatured={true}
                />
                <StatCard
                    title="Annual Leave"
                    count={getCount('Annual Leave')}
                    subtitle={{ value: `${Math.round((getCount('Annual Leave') / totalLeaves) * 100)}%`, label: 'of total' }}
                    icon={Briefcase}
                    colorClass="text-blue-600"
                    bgClass="bg-blue-100/50"
                />
                <StatCard
                    title="Sick Leave"
                    count={getCount('Sick Leave')}
                    subtitle={{ value: `${Math.round((getCount('Sick Leave') / totalLeaves) * 100)}%`, label: 'of total' }}
                    icon={Stethoscope}
                    colorClass="text-rose-600"
                    bgClass="bg-rose-100/50"
                />
                <StatCard
                    title="Other Leaves"
                    count={getCount('Other Leave')}
                    subtitle={{ value: `${Math.round((getCount('Other Leave') / totalLeaves) * 100)}%`, label: 'of total' }}
                    icon={Palmtree}
                    colorClass="text-amber-600"
                    bgClass="bg-amber-100/50"
                />
            </div>

            {/* Middle Section: Chart | Calendar | Employee List | Leave Types */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <LeaveOverview data={stats?.weekStats || []} />
                <LeaveCalendar date={date} setDate={setDate} />
                <EmployeeLeavesList leaves={formattedUpcomingLeaves} />
                <LeaveTypes data={stats?.distribution || []} />
            </div>

            {/* Bottom Section: Leave Activity Table */}
            <LeaveActivityTable
                requests={requests}
                loading={loading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                handleStatusUpdate={handleStatusUpdate}
                processingId={processingId}
            />
        </div>
    );
};

export default LeaveManagementPage;
