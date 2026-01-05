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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { branchService } from '../../services/branchService';

interface BranchEmployeesModalProps {
    isOpen: boolean;
    onClose: () => void;
    branchName: string;
    branchId: string | number;
}

const BranchEmployeesModal: React.FC<BranchEmployeesModalProps> = ({
    isOpen,
    onClose,
    branchName,
    branchId,
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
            const data = await branchService.getBranchEmployees(branchId);
            setEmployees(data);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Employees - {branchName}</DialogTitle>
                </DialogHeader>
                <div className="mt-4 border rounded-md">
                    {isLoading ? (
                        <div className="p-4 text-center text-muted-foreground">Loading employees...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.map((employee) => (
                                    <TableRow key={employee.id}>
                                        <TableCell className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={employee.avatar} alt={employee.name} />
                                                <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{employee.name}</span>
                                        </TableCell>
                                        <TableCell>{employee.role}</TableCell>
                                        <TableCell className="text-muted-foreground">{employee.email}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={employee.status === 'Active' ? 'default' : 'secondary'}
                                                className={
                                                    employee.status === 'Active' ? 'bg-green-500 hover:bg-green-600' :
                                                        employee.status === 'On Leave' ? 'bg-yellow-500 hover:bg-yellow-600' : ''
                                                }
                                            >
                                                {employee.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BranchEmployeesModal;
