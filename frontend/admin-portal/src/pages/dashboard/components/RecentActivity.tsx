import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RecentActivityProps {
    userRole?: string;
}

const activities = [
    {
        id: 1,
        user: "Sarah Johnson",
        action: "created a new invoice for",
        target: "TechSolutions Inc.",
        time: "2 hours ago",
        avatar: "https://randomuser.me/api/portraits/women/32.jpg",
        initials: "SJ"
    },
    {
        id: 2,
        user: "Mike Chen",
        action: "approved expense report for",
        target: "Q4 Marketing",
        time: "4 hours ago",
        avatar: "https://randomuser.me/api/portraits/men/45.jpg",
        initials: "MC"
    },
    {
        id: 3,
        user: "System",
        action: "generated monthly financial report",
        target: "January 2024",
        time: "6 hours ago",
        avatar: "",
        initials: "SYS"
    },
    {
        id: 4,
        user: "Emily Davis",
        action: "updated client details for",
        target: "Green Earth Co.",
        time: "1 day ago",
        avatar: "https://randomuser.me/api/portraits/women/28.jpg",
        initials: "ED"
    }
];

const RecentActivity: React.FC<RecentActivityProps> = () => {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {activities.map((activity) => (
                        <div key={activity.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={activity.avatar} alt={activity.user} />
                                <AvatarFallback>{activity.initials}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {activity.user} <span className="font-normal text-muted-foreground">{activity.action}</span> {activity.target}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {activity.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default RecentActivity;
