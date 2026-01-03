import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Calendar, Shield, Clock } from "lucide-react";

import type { User } from '../../pages/user-management/types';

interface UserDetailPanelProps {
    user: User | null;
    onUpdateUser: (user: User) => void;
}

const UserDetailPanel: React.FC<UserDetailPanelProps> = ({
    user,
    onUpdateUser,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<User>>({});

    useEffect(() => {
        if (user) {
            setFormData(user);
            setIsEditing(false);
        }
    }, [user]);

    if (!user) {
        return (
            <Card className="h-full flex items-center justify-center text-center p-6">
                <div className="text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-medium">No User Selected</h3>
                    <p className="text-sm">Select a user from the list to view details</p>
                </div>
            </Card>
        );
    }

    const handleSave = () => {
        onUpdateUser({ ...user, ...formData } as User);
        setIsEditing(false);
    };

    return (
        <Card className="h-full">
            <CardHeader className="relative pb-0">
                <div className="absolute top-4 right-4">
                    <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                        {user.status}
                    </Badge>
                </div>
                <div className="flex flex-col items-center text-center pb-6">
                    <Avatar className="w-24 h-24 mb-4">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-xl mb-1">{user.name}</CardTitle>
                    <CardDescription>{user.role} • {user.department}</CardDescription>
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6 space-y-6">
                {isEditing ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={formData.email || ''}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={formData.phone || ''}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Input
                                id="department"
                                value={formData.department || ''}
                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span>{user.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span>{user.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>Last active {new Date(user.lastActivity).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h4 className="text-sm font-medium mb-3">Permissions</h4>
                            <div className="flex flex-wrap gap-2">
                                {user.permissions.map((perm, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                        {perm}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h4 className="text-sm font-medium mb-3">Recent Activity</h4>
                            <div className="space-y-3">
                                {user.activityLog.slice(0, 3).map((log, index) => (
                                    <div key={index} className="flex items-start gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                                        <div>
                                            <p className="text-text-primary">{log.action}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
            <CardFooter>
                {isEditing ? (
                    <div className="flex w-full gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                            Cancel
                        </Button>
                        <Button className="flex-1" onClick={handleSave}>
                            Save Changes
                        </Button>
                    </div>
                ) : (
                    <Button className="w-full" onClick={() => setIsEditing(true)}>
                        Edit Profile
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

export default UserDetailPanel;
