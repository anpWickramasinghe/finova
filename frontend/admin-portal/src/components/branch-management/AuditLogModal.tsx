import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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

interface AuditLogModalProps {
    onClose: () => void;
    branches: any[];
}

const AuditLogModal: React.FC<AuditLogModalProps> = ({
    onClose,
    branches,
}) => {
    // Flatten and sort all activity logs
    const allLogs = branches.flatMap(branch =>
        (branch.auditLog || []).map((log: any) => ({
            ...log,
            branchName: branch.name,
        }))
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Branch Audit Log</DialogTitle>
                    <DialogDescription>
                        View all branch activities and system events.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-auto mt-4 border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allLogs.map((log, index) => (
                                <TableRow key={index}>
                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="font-medium">{log.branchName}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{log.user}</Badge>
                                    </TableCell>
                                    <TableCell>{log.action}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AuditLogModal;
