export interface Branch {
    id: number | string;
    name: string;
    email?: string;
    manager: string;
    contactNumber: string;
    employeeCount: number;
    revenue: number;
    lastAudit: Date;
    auditLog: { action: string; timestamp: Date; user: string }[];
}
