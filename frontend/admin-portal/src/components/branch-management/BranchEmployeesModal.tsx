import React from 'react';
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

interface BranchEmployeesModalProps {
    isOpen: boolean;
    onClose: () => void;
    branchName: string;
}

const BranchEmployeesModal: React.FC<BranchEmployeesModalProps> = ({
    isOpen,
    onClose,
    branchName,
}) => {
    // Mock employee data
    const employees = [
        { id: 1, name: "Alice Johnson", role: "Manager", email: "alice@example.com", status: "Active", avatar: "https://randomuser.me/api/portraits/women/1.jpg" },
        { id: 2, name: "Bob Smith", role: "Sales Associate", email: "bob@example.com", status: "Active", avatar: "https://randomuser.me/api/portraits/men/2.jpg" },
        { id: 3, name: "Charlie Brown", role: "Technician", email: "charlie@example.com", status: "On Leave", avatar: "https://randomuser.me/api/portraits/men/3.jpg" },
        { id: 4, name: "Diana Prince", role: "Customer Support", email: "diana@example.com", status: "Active", avatar: "https://randomuser.me/api/portraits/women/4.jpg" },
        { id: 5, name: "Evan Wright", role: "Sales Associate", email: "evan@example.com", status: "Inactive", avatar: "https://randomuser.me/api/portraits/men/5.jpg" },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Employees - {branchName}</DialogTitle>
                </DialogHeader>
                <div className="mt-4 border rounded-md">
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
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BranchEmployeesModal;
