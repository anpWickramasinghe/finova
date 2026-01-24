import { useEffect, useState } from "react";
import AttendanceStatCard from "../../components/attendance/AttendanceStatCard";
import AttendanceOverviewChart, { type AttendanceChartData } from "../../components/attendance/AttendanceOverviewChart";
import EmployeeAttendanceTable, { type EmployeeAttendance } from "../../components/attendance/EmployeeAttendanceTable";
import { attendanceService } from "../../services/attendanceService";
import { branchService } from "../../services/branchService";
import { useAuth } from "../../context/AuthContext";

const Attendance = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState<EmployeeAttendance[]>([]);
  const [chartData, setChartData] = useState<AttendanceChartData[]>([]);
  const [stats, setStats] = useState({
    present: { total: 0, onTime: 0, late: 0 },
    onLeave: { total: 0, annual: 0, sick: 0, other: 0 },
    absent: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const branchId = user._id;

      try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Chart Data Range (Last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

        // Fetch Data in optimization parallel
        const [employees, todaysAttendanceRecords, historicalAttendanceRecords] = await Promise.all([
          branchService.getBranchEmployees(branchId),
          attendanceService.getAllAttendance({ startDate: todayStr, endDate: todayStr }),
          attendanceService.getAllAttendance({ startDate: sixMonthsAgoStr, endDate: todayStr })
        ]);

        // Process Today's Data
        const processedData: EmployeeAttendance[] = employees.map(emp => {
          const record = todaysAttendanceRecords.find(a => a.userId === emp.id);

          let status = "Absent";
          let checkIn = "-";
          let checkOut = "-";
          let duration = "-";
          let overtime = "-";

          if (record) {
            status = record.status || "Present";
            if (record.checkInTime) {
              checkIn = new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            if (record.checkOutTime) {
              checkOut = new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            if (record.workHours) {
              const hours = parseFloat(record.workHours);
              if (!isNaN(hours)) {
                const h = Math.floor(hours);
                const m = Math.round((hours - h) * 60);
                duration = `${h}h ${m}m`;

                if (hours > 8) {
                  const ot = hours - 8;
                  const oth = Math.floor(ot);
                  const otm = Math.round((ot - oth) * 60);
                  overtime = `${oth}h ${otm}m`;
                }
              }
            }
          }

          return {
            id: emp.id,
            name: emp.name,
            role: emp.designation || emp.role || "Employee",
            date: today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            checkIn,
            checkOut,
            duration,
            overtime,
            status,
            avatar: emp.avatar || ""
          };
        });

        setAttendanceData(processedData);

        // Calculate stats
        const presentCount = processedData.filter(d => ['Present', 'Late', 'Checked In'].includes(d.status)).length;
        const onTimeCount = processedData.filter(d => ['Present', 'Checked In'].includes(d.status)).length;
        const lateCount = processedData.filter(d => d.status === 'Late').length;
        const absentCount = processedData.filter(d => d.status === 'Absent').length;

        setStats({
          present: { total: presentCount, onTime: onTimeCount, late: lateCount },
          onLeave: { total: 0, annual: 0, sick: 0, other: 0 },
          absent: absentCount
        });

        // Process Chart Data (Last 6 months)
        const chartStats: Record<string, { present: number }> = {};
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // Initialize last 6 months buckets
        for (let i = 0; i < 6; i++) {
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - i));
          const monthKey = `${months[d.getMonth()]}`;
          chartStats[monthKey] = { present: 0 };
        }

        // Group by Date first
        const attendanceByDate: Record<string, number> = {};
        historicalAttendanceRecords.forEach(rec => {
          const recDate = new Date(rec.recordDate);
          if (recDate >= sixMonthsAgo) {
            const dateKey = recDate.toISOString().split('T')[0];
            if (!attendanceByDate[dateKey]) attendanceByDate[dateKey] = 0;

            // If status implies presence
            if (!rec.status || ['Present', 'Late', 'Checked In'].includes(rec.status)) {
              attendanceByDate[dateKey]++;
            }
          }
        });

        const monthlyTotals: Record<string, { totalPresent: number, days: number }> = {};

        Object.entries(attendanceByDate).forEach(([dateStr, count]) => {
          const date = new Date(dateStr);
          const monthKey = months[date.getMonth()];

          if (!monthlyTotals[monthKey]) monthlyTotals[monthKey] = { totalPresent: 0, days: 0 };
          monthlyTotals[monthKey].totalPresent += count;
          monthlyTotals[monthKey].days += 1;
        });

        const finalChartData: AttendanceChartData[] = Object.keys(chartStats).map(monthName => {
          let presentPct = 0;
          if (monthlyTotals[monthName] && monthlyTotals[monthName].days > 0 && employees.length > 0) {
            const avgDailyPresent = monthlyTotals[monthName].totalPresent / monthlyTotals[monthName].days;
            presentPct = Math.round((avgDailyPresent / employees.length) * 100);
          }
          if (presentPct > 100) presentPct = 100;

          return {
            name: monthName,
            present: presentPct,
            absent: 100 - presentPct
          };
        });

        setChartData(finalChartData);

      } catch (error) {
        console.error("Failed to fetch attendance data", error);
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="p-6 space-y-8 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">
            Attendance overview for today.
          </p>
        </div>
      </div>

      {/* Top Stats Section */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-5">
        <div className="xl:col-span-1">
          <AttendanceStatCard
            title="Present"
            count={stats.present.total}
            subText="Employees"
            variant="success"
            stats={[
              { label: "On-Time", value: stats.present.onTime },
              { label: "Late", value: stats.present.late }
            ]}
          />
        </div>
        <div className="xl:col-span-1">
          <AttendanceStatCard
            title="On Leave"
            count={stats.onLeave.total}
            subText="Employees"
            variant="warning"
            stats={[
              { label: "Annual Leave", value: stats.onLeave.annual },
              { label: "Sick Leave", value: stats.onLeave.sick },
              { label: "Others", value: stats.onLeave.other }
            ]}
          />
        </div>
        <div className="xl:col-span-1">
          <AttendanceStatCard
            title="Absent"
            count={stats.absent}
            subText="Employees"
            variant="danger"
          />
        </div>
        <div className="md:col-span-3 xl:col-span-2">
          <AttendanceOverviewChart data={chartData} />
        </div>
      </div>

      {/* Main Content Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 ">
        <EmployeeAttendanceTable data={attendanceData} />
      </div>
    </div>
  );
}

export default Attendance;