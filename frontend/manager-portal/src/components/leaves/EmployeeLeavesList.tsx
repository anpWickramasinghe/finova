import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ArrowRight } from "lucide-react";

interface Leave {
    name: string;
    type: string;
    date: string;
    avatar: string;
    color: string;
}

interface EmployeeLeavesListProps {
    leaves: Leave[];
}

export const EmployeeLeavesList: React.FC<EmployeeLeavesListProps> = ({ leaves }) => {
    return (
        <Card className="xl:col-span-1 border-none shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Employee Leaves</CardTitle>
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4 mt-2">
                {leaves.map((leave, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-semibold text-slate-500">
                            {leave.avatar}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{leave.name}</p>
                            <p className={`text-xs ${leave.color.split(' ')[0]} mt-0.5 truncate`}>{leave.type} • {leave.date.split('2035')[0]}</p>
                        </div>
                    </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground text-xs mt-2 hover:text-primary">
                    View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
            </CardContent>
        </Card>
    );
};
