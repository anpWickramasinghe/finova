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

interface AddBranchModalProps {
    onClose: () => void;
    onAddBranch: (branch: any) => void;
    isOpen: boolean;
}

const AddBranchModal = ({ onClose, onAddBranch, isOpen }: AddBranchModalProps) => {
    const [formData, setFormData] = useState({
        name: '',
        manager: '',
        contactNumber: '',
    });

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

        if (!formData.manager.trim()) {
            newErrors.manager = 'Manager is required';
        }

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
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1000));
                onAddBranch(formData);
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
                                <Label htmlFor="manager">Manager *</Label>
                                <Input
                                    id="manager"
                                    value={formData.manager}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('manager', e.target.value)}
                                    className={errors.manager ? 'border-red-500' : ''}
                                    placeholder="Enter manager name"
                                />
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
