import AttendanceStatCard from "../../components/attendance/AttendanceStatCard";
import AttendanceOverviewChart from "../../components/attendance/AttendanceOverviewChart";
import EmployeeAttendanceTable from "../../components/attendance/EmployeeAttendanceTable";

const Attendance = () => {
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
            count={93}
            subText="Employees"

            variant="success"
            stats={[
              { label: "On-Time", value: 82 },
              { label: "Late", value: 11 }
            ]}

          />
        </div>
        <div className="xl:col-span-1">
          <AttendanceStatCard
            title="On Leave"
            count={6}
            subText="Employees"

            variant="warning"
            stats={[
              { label: "Annual Leave", value: 3 },
              { label: "Sick Leave", value: 2 },
              { label: "Others", value: 1 }
            ]}

          />
        </div>
        <div className="xl:col-span-1">
          <AttendanceStatCard
            title="Absent"
            count={3}
            subText="Employees"

            variant="danger"
          />
        </div>
        <div className="md:col-span-3 xl:col-span-2">
          <AttendanceOverviewChart />
        </div>
      </div>

      {/* Main Content Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 ">
        <EmployeeAttendanceTable />
      </div>

    </div>
  )
}

export default Attendance