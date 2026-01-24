import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Loader2, X } from "lucide-react";
import { format } from 'date-fns';
import type { LeaveRequest } from '@/services/leaveService';

interface LeaveActivityTableProps {
    requests: LeaveRequest[];
    loading: boolean;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    handleStatusUpdate: (id: string, status: 'Approved' | 'Rejected') => void;
    processingId: string | null;
}

export const LeaveActivityTable: React.FC<LeaveActivityTableProps> = ({
    requests,
    loading,
    searchTerm,
    setSearchTerm,
    handleStatusUpdate,
    processingId
}) => {

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Approved':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 font-normal">Approved</Badge>;
            case 'Rejected':
                return <Badge variant="destructive" className="font-normal">Rejected</Badge>;
            default:
                return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 font-normal hover:bg-amber-100">Pending</Badge>;
        }
    };

    return (
        <Card className="border-none shadow-sm">
            <CardHeader className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold">Leave Activity</CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[300px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search employee, ID, etc..."
                            className="pl-9 bg-slate-50 border-none focus-visible:ring-1"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="gap-2 bg-white border-slate-200">
                        <Filter className="h-4 w-4" />
                        Filter
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                            <TableHead className="w-[50px] pl-6"></TableHead>
                            <TableHead className="font-medium text-slate-900">Name</TableHead>
                            <TableHead className="font-medium text-slate-900">Type</TableHead>
                            <TableHead className="font-medium text-slate-900">Submit Date</TableHead>
                            <TableHead className="font-medium text-slate-900">Period</TableHead>
                            <TableHead className="font-medium text-slate-900">Duration</TableHead>
                            <TableHead className="font-medium text-slate-900">Reason</TableHead>
                            <TableHead className="text-right font-medium text-slate-900 pr-6">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                    No leave requests found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            requests.filter(r =>
                                (r.userName || r.userId).toLowerCase().includes(searchTerm.toLowerCase())
                            ).map((req) => (
                                <TableRow key={req.id} className="hover:bg-slate-50/50 border-b border-slate-50">
                                    <TableCell className="pl-6">
                                        {/* Checkbox placeholder */}
                                        <div className="h-4 w-4 rounded border border-slate-300"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                                                {(req.userName || 'E').charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm text-slate-900">{req.userName || req.userId}</div>
                                                <div className="text-xs text-muted-foreground">EMP-0{req.userId.substring(0, 3)}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600">{req.type}</TableCell>
                                    <TableCell className="text-sm text-slate-600">{format(new Date(req.createdAt), 'dd MMM yyyy')}</TableCell>
                                    <TableCell className="text-sm text-slate-600">
                                        {format(new Date(req.startDate), 'dd MMM')} – {format(new Date(req.endDate), 'dd MMM yyyy')}
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600">
                                        {Math.ceil((new Date(req.endDate).getTime() - new Date(req.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} Days
                                    </TableCell>
                                    <TableCell className="max-w-[150px] truncate text-sm text-slate-600" title={req.reason}>
                                        <span className="bg-slate-100 px-2 py-1 rounded text-xs">{req.reason || 'No reason'}</span>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        {req.status === 'Pending' ? (
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    className="h-7 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-medium shadow-none"
                                                    onClick={() => handleStatusUpdate(req.id, 'Approved')}
                                                    disabled={processingId === req.id}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full"
                                                    onClick={() => handleStatusUpdate(req.id, 'Rejected')}
                                                    disabled={processingId === req.id}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            getStatusBadge(req.status)
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
