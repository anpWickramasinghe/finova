export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    permissions: string[];
    status: string;
    lastActivity: Date;
    avatar: string;
    phone: string;
    branch: string;
    joinDate: Date;
    loginHistory: { date: Date; ip: string; device: string }[];
    activityLog: { action: string; timestamp: Date }[];
}
