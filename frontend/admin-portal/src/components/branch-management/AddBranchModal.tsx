/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { getUsers } from '../../services/userService';

interface AddBranchModalProps {
    onClose: () => void;
    onAddBranch: (branch: any) => void;
    isOpen: boolean;
}

const AddBranchModal = ({ onClose, onAddBranch, isOpen }: AddBranchModalProps) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        manager: '',
        contactNumber: '',
    });

    const [managers, setManagers] = useState<any[]>([]);

    React.useEffect(() => {
        const fetchManagers = async () => {
            try {
                const data = await getUsers('Manager');
                setManagers(data);
            } catch (error) {
                console.error("Failed to fetch managers", error);
            }
        };
        if (isOpen) {
            fetchManagers();
        }
    }, [isOpen]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Branch Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password.trim()) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        // Manager is optional now

        if (!formData.contactNumber.trim()) {
            newErrors.contactNumber = 'Contact Number is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            setIsLoading(true);
            try {

                await new Promise(resolve => setTimeout(resolve, 1000));


                const branchData = {
                    ...formData,
                    manager: formData.manager === 'none' ? null : formData.manager
                };

                onAddBranch(branchData);
                onClose();
            } catch (error: any) {
                setErrors(prev => ({ ...prev, submit: error.message || 'Failed to create branch' }));
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add New Branch</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {errors.submit && (
                        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                            {errors.submit}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Branch Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                                    className={errors.name ? 'border-red-500' : ''}
                                    placeholder="Enter branch name"
                                />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                                    className={errors.email ? 'border-red-500' : ''}
                                    placeholder="Enter branch email"
                                />
                                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('password', e.target.value)}
                                    className={errors.password ? 'border-red-500' : ''}
                                    placeholder="Enter password"
                                />
                                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('confirmPassword', e.target.value)}
                                    className={errors.confirmPassword ? 'border-red-500' : ''}
                                    placeholder="Confirm password"
                                />
                                {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="manager">Manager *</Label>
                                <Select
                                    onValueChange={(value) => handleInputChange('manager', value)}
                                    value={formData.manager}
                                >
                                    <SelectTrigger className={errors.manager ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Select a manager" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {managers.map((manager) => (
                                            <SelectItem key={manager.id} value={manager.name}>
                                                {manager.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.manager && <p className="text-sm text-red-500">{errors.manager}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contactNumber">Contact Number *</Label>
                                <Input
                                    id="contactNumber"
                                    value={formData.contactNumber}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('contactNumber', e.target.value)}
                                    className={errors.contactNumber ? 'border-red-500' : ''}
                                    placeholder="Enter contact number"
                                />
                                {errors.contactNumber && <p className="text-sm text-red-500">{errors.contactNumber}</p>}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} >
                            {isLoading ? 'Adding...' : 'Add Branch'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddBranchModal;
