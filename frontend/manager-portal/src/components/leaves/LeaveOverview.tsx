import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface LeaveOverviewProps {
    data: { name: string; value: number }[];
}

export const LeaveOverview: React.FC<LeaveOverviewProps> = ({ data }) => {
    return (
        <Card className="xl:col-span-1 border-none shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Leave Overview</CardTitle>
                    <Button variant="outline" size="sm" className="h-7 text-xs">This Week</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} tickMargin={10} />
                            <Tooltip cursor={{ fill: '#f1f5f9', radius: 4 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 6, 6]} barSize={16} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
