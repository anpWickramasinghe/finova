import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Users } from "lucide-react";

import type { Branch } from '../../pages/branch-management/types';

interface BranchTableProps {
    branches: Branch[];
    selectedBranches: (number | string)[];
    onBranchSelect: (branchId: number | string) => void;
    onSelectAll: () => void;
    onBranchClick: (branch: Branch) => void;
    selectedBranch: Branch | null;
    onViewEmployees: (branch: Branch) => void;
    onDeleteBranch: (branchId: number | string) => void;
}

const BranchTable: React.FC<BranchTableProps> = ({
    branches,
    selectedBranches,
    onBranchSelect,
    onSelectAll,
    onBranchClick,
    selectedBranch,
    onViewEmployees,
    onDeleteBranch,
}) => {
    const allSelected = branches.length > 0 && selectedBranches.length === branches.length;

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={onSelectAll}
                            />
                        </TableHead>
                        <TableHead>Branch Name</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Employees</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {branches.map((branch) => (
                        <TableRow
                            key={branch.id}
                            className={`cursor-pointer ${selectedBranch?.id === branch.id ? "bg-muted/50" : ""}`}
                            onClick={() => onBranchClick(branch)}
                        >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    checked={selectedBranches.includes(branch.id)}
                                    onCheckedChange={() => onBranchSelect(branch.id)}
                                />
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">{branch.name}</span>
                                    <span className="text-xs text-muted-foreground">{branch.contactNumber}</span>
                                </div>
                            </TableCell>
                            <TableCell>{branch.manager}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <span>{branch.employeeCount}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(branch.contactNumber)}>
                                            Copy Contact
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onViewEmployees(branch)}>
                                            <Users className="mr-2 h-4 w-4" /> View Employees
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onBranchClick(branch)}>
                                            <Edit className="mr-2 h-4 w-4" /> Edit Branch
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() => onDeleteBranch(branch.id)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default BranchTable;
