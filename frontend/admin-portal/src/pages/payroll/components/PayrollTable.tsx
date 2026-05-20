/* eslint-disable @typescript-eslint/no-explicit-any */
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PayrollTableProps {
    records: any[];
    isLoading: boolean;
    onViewDetails: (id: string) => void;
    onBulkSubmit?: (payrollIds: string[]) => void;
}

export default function PayrollTable({ records, isLoading, onViewDetails, onBulkSubmit }: PayrollTableProps) {
    // Group records by branchName
    const groupedRecords = records.reduce((acc: any, record) => {
        const branch = record.branchName || 'Unassigned / HQ';
        if (!acc[branch]) acc[branch] = [];
        acc[branch].push(record);
        return acc;
    }, {});

    const sortedBranches = Object.keys(groupedRecords).sort();

    return (
        <div className="rounded-md border bg-surface overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Total Earnings</TableHead>
                        <TableHead>Total Deductions</TableHead>
                        <TableHead>Net Payable</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                {isLoading ? (
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Loading...
                            </TableCell>
                        </TableRow>
                    </TableBody>
                ) : records.length === 0 ? (
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-text-secondary">
                                No payroll records found for this period.
                            </TableCell>
                        </TableRow>
                    </TableBody>
                ) : (
                    sortedBranches.map(branch => {
                        const branchDrafts = groupedRecords[branch].filter((r: any) => r.status === 'Draft');
                        const hasDrafts = branchDrafts.length > 0;

                        return (
                            <TableBody key={branch} className="border-t-[3px] border-border/50">
                                {/* Branch Header Row */}
                                <TableRow className="bg-background/80 hover:bg-background/80">
                                    <TableCell colSpan={7} className="py-2.5 font-semibold text-primary-900 border-b border-border/50 bg-primary/5">
                                        <div className="flex justify-between items-center w-full">
                                            <div className="flex items-center">
                                                <Building2 className="w-4 h-4 mr-2" />
                                                {branch} <span className="ml-2 text-xs font-normal text-text-secondary">({groupedRecords[branch].length} employees)</span>
                                            </div>
                                            {onBulkSubmit && hasDrafts && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-xs bg-white text-primary border-primary hover:bg-primary/5"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onBulkSubmit(branchDrafts.map((r: any) => r.id));
                                                    }}
                                                >
                                                    Submit Branch
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                                {groupedRecords[branch].map((record: any) => (
                                    <TableRow key={record.id} className="cursor-pointer hover:bg-background/50 transition-colors" onClick={() => onViewDetails(record.id)}>
                                        <TableCell className="font-medium text-text-primary pl-8">{record.userName || record.userId}</TableCell>
                                        <TableCell>{record.month}/{record.year}</TableCell>
                                        <TableCell className="text-green-600 font-medium">+{parseFloat(record.totalEarnings).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="text-red-500 font-medium">-{parseFloat(record.totalDeductions).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="font-bold text-primary-900">LKR {parseFloat(record.netSalary).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${record.status === 'Draft' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                                record.status === 'Pending Approval' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    record.status === 'Approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        record.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewDetails(record.id); }}>
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        );
                    })
                )}
            </Table>
        </div>
    );
}
