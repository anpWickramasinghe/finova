import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface LeaveType {
    name: string;
    value: number;
    color: string;
    [key: string]: any;
}

interface LeaveTypesProps {
    data: LeaveType[];
}

export const LeaveTypes: React.FC<LeaveTypesProps> = ({ data }) => {
    return (
        <Card className="xl:col-span-1 border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Leave Types</CardTitle>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="h-[280px] relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                    <div className="text-center">
                        <span className="text-3xl font-bold">6</span>
                        <p className="text-xs text-muted-foreground">Employees</p>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-[-20px]">
                    {data.map((entry, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                <span className="text-muted-foreground">{entry.name}</span>
                            </div>
                            <span className="font-medium">{entry.value} employee</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
