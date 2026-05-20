/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { branchService } from '../../services/branchService';

interface BranchEmployeesModalProps {
    isOpen: boolean;
    onClose: () => void;
    branchId: string | number | null;
    branchName: string;
}

const BranchEmployeesModal: React.FC<BranchEmployeesModalProps> = ({
    isOpen,
    onClose,
    branchId,
    branchName,
}) => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && branchId) {
            fetchEmployees();
        }
    }, [isOpen, branchId]);

    const fetchEmployees = async () => {
        try {
            setIsLoading(true);
            const data = await branchService.getBranchEmployees(branchId!);
            setEmployees(data);
        } catch (error) {
            console.error('Failed to fetch branch employees:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Employees at {branchName}</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : employees.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No employees found in this branch.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Phone</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.map((employee) => (
                                <TableRow key={employee.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={employee.avatar} alt={employee.name} />
                                                <AvatarFallback>{employee.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{employee.name}</span>
                                                <span className="text-xs text-muted-foreground">{employee.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{employee.role}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={employee.status === 'Active' ? 'default' : 'secondary'}
                                            className={employee.status === 'Active' ? 'bg-green-500' : ''}
                                        >
                                            {employee.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{employee.phone || 'N/A'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default BranchEmployeesModal;
