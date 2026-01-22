

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data
const employees = [
    {
        id: "EMP-0234",
        name: "Olivia Mason",
        role: "Marketing",
        subRole: "Executive Marketing",
        date: "19 Jun 2035",
        workModel: "Hybrid",
        checkIn: "08:55 AM",
        checkOut: "05:05 PM",
        duration: "8h 10m",
        overtime: "10m",
        status: "On-Time",
        avatar: "https://randomuser.me/api/portraits/women/1.jpg",
    },
    {
        id: "EMP-0178",
        name: "Ethan Ray",
        role: "UI Designer",
        subRole: "Product Design",
        date: "19 Jun 2035",
        workModel: "Remote",
        checkIn: "09:14 AM",
        checkOut: "05:20 PM",
        duration: "8h 6m",
        overtime: "6m",
        status: "Late",
        avatar: "https://randomuser.me/api/portraits/men/2.jpg",
    },
    {
        id: "EMP-0312",
        name: "Lina Armand",
        role: "Lab Analyst",
        subRole: "R&D",
        date: "19 Jun 2035",
        workModel: "On-Site",
        checkIn: "-",
        checkOut: "-",
        duration: "-",
        overtime: "-",
        status: "On Leave",
        avatar: "https://randomuser.me/api/portraits/women/3.jpg",
    },
    {
        id: "EMP-0115",
        name: "Jacob Yuen",
        role: "Site Supervisor",
        subRole: "Operations",
        date: "19 Jun 2035",
        workModel: "On-Site",
        checkIn: "-",
        checkOut: "-",
        duration: "-",
        overtime: "-",
        status: "Absent",
        avatar: "https://randomuser.me/api/portraits/men/4.jpg",
    },
    {
        id: "EMP-0289",
        name: "Mia Torres",
        role: "HR Officer",
        subRole: "Human Resources",
        date: "19 Jun 2035",
        workModel: "Hybrid",
        checkIn: "08:59 AM",
        checkOut: "05:10 PM",
        duration: "8h 11m",
        overtime: "11m",
        status: "On-Time",
        avatar: "https://randomuser.me/api/portraits/women/5.jpg",
    },
    {
        id: "EMP-0356",
        name: "Sara Kim",
        role: "Customer Support",
        subRole: "Customer Service",
        date: "19 Jun 2035",
        workModel: "On-Site",
        checkIn: "09:02 AM",
        checkOut: "05:00 PM",
        duration: "7h 58m",
        overtime: "-",
        status: "Late",
        avatar: "https://randomuser.me/api/portraits/women/6.jpg",
    },
    {
        id: "EMP-0291",
        name: "Daniel Cheung",
        role: "Compliance Specialist",
        subRole: "Operations",
        date: "19 Jun 2035",
        workModel: "Remote",
        checkIn: "08:48 AM",
        checkOut: "05:00 PM",
        duration: "8h 12m",
        overtime: "12m",
        status: "On-Time",
        avatar: "https://randomuser.me/api/portraits/men/7.jpg",
    },
    {
        id: "EMP-0275",
        name: "Anya Rodriguez",
        role: "Graphic Designer",
        subRole: "Marketing",
        date: "19 Jun 2035",
        workModel: "Remote",
        checkIn: "09:10 AM",
        checkOut: "05:15 PM",
        duration: "8h 5m",
        overtime: "5m",
        status: "Late",
        avatar: "https://randomuser.me/api/portraits/women/8.jpg",
    },
];



const getBadgeStyle = (status: string) => {
    if (status === "On-Time") return "bg-[hsl(var(--chart-2))] hover:bg-[hsl(var(--chart-2))]/90 text-white border-0 font-normal";
    if (status === "Late") return "bg-green-100 hover:bg-green-100/90 text-green-800 border-0 font-normal";
    if (status === "On Leave") return "bg-muted hover:bg-muted/90 text-muted-foreground border-0 font-normal";
    if (status === "Absent") return "bg-primary hover:bg-primary/90 text-primary-foreground border-0 font-normal";
    return "";
}




const EmployeeAttendanceTable = () => {
    const totalResults = 102;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Employee Attendance</h2>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input placeholder="Search employee" className="pl-9 w-[280px] bg-gray-50 border-none" />
                    </div>
                    <Button variant="outline" className="gap-2 bg-gray-50 border-none hover:bg-gray-100">
                        <Filter className="w-4 h-4" />
                        Filter
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Sort by:</span>
                        <Select defaultValue="name">
                            <SelectTrigger className="w-[100px] h-9 bg-gray-50 border-none">
                                <SelectValue placeholder="Sort" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">Name</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="status">Status</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="border-none rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow className="border-none hover:bg-transparent text-gray-400 text-xs uppercase">
                            <TableHead className="font-medium h-10">Name <ChevronsUpDown className="inline w-3 h-3 ml-1" /></TableHead>
                            <TableHead className="font-medium h-10">Job Title <ChevronsUpDown className="inline w-3 h-3 ml-1" /></TableHead>
                            <TableHead className="font-medium h-10">Date <ChevronsUpDown className="inline w-3 h-3 ml-1" /></TableHead>
                            <TableHead className="font-medium h-10">Check In <ChevronsUpDown className="inline w-3 h-3 ml-1" /></TableHead>
                            <TableHead className="font-medium h-10">Check Out <ChevronsUpDown className="inline w-3 h-3 ml-1" /></TableHead>
                            <TableHead className="font-medium h-10">Duration <ChevronsUpDown className="inline w-3 h-3 ml-1" /></TableHead>
                            <TableHead className="font-medium h-10">Overtime <ChevronsUpDown className="inline w-3 h-3 ml-1" /></TableHead>
                            <TableHead className="font-medium h-10 text-right">Status <ChevronsUpDown className="inline w-3 h-3 ml-1" /></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.map((employee) => (
                            <TableRow key={employee.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={employee.avatar} />
                                            <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium text-sm text-gray-900">{employee.name}</div>
                                            <div className="text-xs text-gray-400">{employee.id}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <div className="font-medium text-sm text-gray-900">{employee.role}</div>
                                        <div className="text-xs text-gray-400">{employee.subRole}</div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">{employee.date}</TableCell>
                                <TableCell className="text-sm text-gray-600">{employee.checkIn}</TableCell>
                                <TableCell className="text-sm text-gray-600">{employee.checkOut}</TableCell>
                                <TableCell className="text-sm text-gray-600 font-medium">{employee.duration}</TableCell>
                                <TableCell className="text-sm text-gray-600">{employee.overtime}</TableCell>
                                <TableCell className="text-right">
                                    <Badge className={cn("px-3 py-0.5 rounded-full", getBadgeStyle(employee.status))}>
                                        {employee.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    Show
                    <Select defaultValue="10">
                        <SelectTrigger className="w-[60px] h-8 bg-gray-50 border-none">
                            <SelectValue placeholder="10" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                    of {totalResults} results
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 disabled:opacity-50" disabled>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" className="h-8 w-8 bg-primary text-primary-foreground border-0 hover:bg-primary/90 hover:text-white">1</Button>
                    <Button variant="ghost" className="h-8 w-8">2</Button>
                    <Button variant="ghost" className="h-8 w-8">3</Button>
                    <span className="text-gray-400">...</span>
                    <Button variant="ghost" className="h-8 w-8">11</Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default EmployeeAttendanceTable;
