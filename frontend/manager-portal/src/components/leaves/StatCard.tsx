import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    count: number;
    subtitle?: {
        value: string;
        label: string;
    };
    icon: LucideIcon;
    colorClass: string;
    bgClass: string;
    isFeatured?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, count, subtitle, icon: Icon, colorClass, bgClass, isFeatured }) => (
    <Card className={`border-none shadow-sm hover:shadow-md transition-shadow ${isFeatured ? 'bg-emerald-50' : 'bg-white'}`}>
        <CardContent className="p-5">
            <div className="flex items-start justify-between">
                <div>
                    <div className={`p-2 w-fit rounded-lg ${isFeatured ? 'bg-emerald-500 text-white' : bgClass}`}>
                        <Icon className={`h-5 w-5 ${isFeatured ? 'text-white' : colorClass}`} />
                    </div>
                    <h3 className="mt-4 text-sm font-medium text-muted-foreground">{title}</h3>
                    <div className="flex items-end gap-2 mt-1">
                        <span className="text-3xl font-bold tracking-tight">{count}</span>
                        <span className="text-xs text-muted-foreground mb-1">Employees</span>
                    </div>
                </div>
            </div>
            {subtitle && (
                <div className="mt-3 text-xs flex items-center">
                    <span className={`font-medium ${bgClass} ${colorClass} px-1.5 py-0.5 rounded text-[10px]`}>
                        {subtitle.value}
                    </span>
                    <span className="text-muted-foreground ml-2">{subtitle.label}</span>
                </div>
            )}
        </CardContent>
    </Card>
);
