import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface AddUserModalProps {
    onClose: () => void;
    onAddUser: (user: any) => void;
    isOpen: boolean;
}

const AddUserModal = ({ onClose, onAddUser, isOpen }: AddUserModalProps) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'Labour',
        branch: '',
        permissions: [] as string[],
        status: 'Active',
        sendInvite: true
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const availablePermissions = [
        'Full Access',
        'User Management',
        'Transaction Management',
        'Financial Reports',
        'Bank Reconciliation',
        'Tax Compliance',
        'Client Portal',
        'View Reports',
        'Export Data',
        'Audit Logs'
    ];

    const rolePermissions: Record<string, string[]> = {
        'Admin': ['Full Access', 'User Management', 'Transaction Management', 'Financial Reports', 'Bank Reconciliation', 'Tax Compliance', 'Client Portal', 'View Reports', 'Export Data', 'Audit Logs'],
        'Manager': ['Transaction Management', 'Financial Reports', 'Bank Reconciliation', 'Tax Compliance', 'View Reports', 'Export Data'],
        'Labour': ['View Reports'],
        'Security': ['View Reports']
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleRoleChange = (role: string) => {
        setFormData(prev => ({
            ...prev,
            role,
            permissions: rolePermissions[role] || []
        }));
    };

    const handlePermissionToggle = (permission: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permission)
                ? prev.permissions.filter(p => p !== permission)
                : [...prev.permissions, permission]
        }));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        }

        if (!formData.branch.trim()) {
            newErrors.branch = 'Branch is required';
        }

        if (formData.permissions.length === 0) {
            newErrors.permissions = 'At least one permission must be selected';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onAddUser(formData);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                                    className={errors.name ? 'border-red-500' : ''}
                                    placeholder="Enter full name"
                                />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                                    className={errors.email ? 'border-red-500' : ''}
                                    placeholder="Enter email address"
                                />
                                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number *</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phone', e.target.value)}
                                    className={errors.phone ? 'border-red-500' : ''}
                                    placeholder="Enter phone number"
                                />
                                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="branch">Branch *</Label>
                                <Input
                                    id="branch"
                                    value={formData.branch}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('branch', e.target.value)}
                                    className={errors.branch ? 'border-red-500' : ''}
                                    placeholder="Enter branch"
                                />
                                {errors.branch && <p className="text-sm text-red-500">{errors.branch}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Role and Status */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Role & Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Role *</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={handleRoleChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                        <SelectItem value="Manager">Manager</SelectItem>
                                        <SelectItem value="Labour">Labour</SelectItem>
                                        <SelectItem value="Security">Security</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status *</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => handleInputChange('status', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Permissions */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Permissions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {availablePermissions.map((permission) => (
                                <div key={permission} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-accent cursor-pointer" onClick={() => handlePermissionToggle(permission)}>
                                    <Checkbox
                                        id={`perm-${permission}`}
                                        checked={formData.permissions.includes(permission)}
                                        onCheckedChange={() => handlePermissionToggle(permission)}
                                    />
                                    <Label htmlFor={`perm-${permission}`} className="cursor-pointer">{permission}</Label>
                                </div>
                            ))}
                        </div>
                        {errors.permissions && <p className="text-sm text-red-500">{errors.permissions}</p>}
                    </div>

                    {/* Additional Options */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Additional Options</h3>
                        <div className="flex items-center space-x-2 p-2 border rounded-md hover:bg-accent cursor-pointer" onClick={() => handleInputChange('sendInvite', !formData.sendInvite)}>
                            <Checkbox
                                id="sendInvite"
                                checked={formData.sendInvite}
                                onCheckedChange={(checked) => handleInputChange('sendInvite', checked)}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="sendInvite" className="cursor-pointer">
                                    Send invitation email
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    User will receive an email with login instructions
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Add User
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddUserModal;
