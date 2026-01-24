
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface AttendanceChartData {
    name: string;
    present: number;
    absent: number;
}

interface AttendanceOverviewChartProps {
    data?: AttendanceChartData[];
}

const AttendanceOverviewChart = ({ data = [] }: AttendanceOverviewChartProps) => {
    return (
        <Card className="h-full border-none shadow-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">Attendance Overview</CardTitle>
                <Select defaultValue="6months">
                    <SelectTrigger className="w-[130px] h-8 text-xs bg-gray-50 border-gray-200">
                        <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="6months">Last 6 Months</SelectItem>
                        <SelectItem value="30days">Last 30 Days</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4 mb-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-100"></span>
                        <span>Present</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[hsl(var(--chart-2))]"></span>
                        <span>On Leave</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        <span>Absent</span>
                    </div>
                </div>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{
                                top: 5,
                                right: 0,
                                left: -20,
                                bottom: 0,
                            }}
                            barSize={32}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            {/* Stacked Bars */}
                            <Bar dataKey="present" stackId="a" fill="#dcfce7" radius={[0, 0, 4, 4]} />
                            <Bar dataKey="onLeave" stackId="a" fill="hsl(var(--chart-2))" />
                            <Bar dataKey="absent" stackId="a" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export default AttendanceOverviewChart;
