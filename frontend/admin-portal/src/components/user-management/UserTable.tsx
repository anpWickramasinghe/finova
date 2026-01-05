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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Shield } from "lucide-react";

import type { User } from '../../pages/user-management/types';

interface UserTableProps {
    users: User[];
    selectedUsers: (number | string)[];
    onUserSelect: (userId: number | string) => void;
    onSelectAll: () => void;
    onUserClick: (user: User) => void;
    selectedUser: User | null;
    branches?: any[];
}

const UserTable: React.FC<UserTableProps> = ({
    users,
    selectedUsers,
    onUserSelect,
    onSelectAll,
    onUserClick,
    selectedUser,
    branches = [],
}) => {
    const allSelected = users.length > 0 && selectedUsers.length === users.length;

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
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow
                            key={user.id}
                            className={`cursor-pointer ${selectedUser?.id === user.id ? "bg-muted/50" : ""}`}
                            onClick={() => onUserClick(user)}
                        >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    checked={selectedUsers.includes(user.id)}
                                    onCheckedChange={() => onUserSelect(user.id)}
                                />
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={user.avatar} alt={user.name} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user.name}</span>
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="capitalize">
                                    {user.role}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {branches.find(b => String(b.id) === String(user.branchId))?.name || 'N/A'}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={user.status === 'Active' ? 'default' : 'secondary'}
                                    className={user.status === 'Active' ? 'bg-green-500 hover:bg-green-600' : ''}
                                >
                                    {user.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {new Date(user.lastActivity).toLocaleDateString()}
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
                                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email)}>
                                            Copy Email
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>
                                            <Edit className="mr-2 h-4 w-4" /> Edit User
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Shield className="mr-2 h-4 w-4" /> Permissions
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600">
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

export default UserTable;
