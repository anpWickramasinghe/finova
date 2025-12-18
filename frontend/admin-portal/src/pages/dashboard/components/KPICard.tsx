import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, FileText, Shield, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIData {
    id: number;
    title: string;
    value: string;
    change: string;
    trend: string;
    icon: string;
    color: string;
    description: string;
}

interface KPICardProps {
    data: KPIData;
}

const iconMap: Record<string, React.ElementType> = {
    TrendingUp,
    TrendingDown,
    DollarSign,
    FileText,
    Shield,
    Activity
};

const KPICard: React.FC<KPICardProps> = ({ data }) => {
    const IconComponent = iconMap[data.icon] || Activity;
    const isPositive = data.trend === 'up';

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {data.title}
                </CardTitle>
                <div className={cn("p-2 rounded-full", {
                    "bg-green-100 text-green-600": data.color === 'success',
                    "bg-yellow-100 text-yellow-600": data.color === 'warning',
                    "bg-blue-100 text-blue-600": data.color === 'secondary',
                    "bg-indigo-100 text-indigo-600": data.color === 'primary',
                })}>
                    <IconComponent className="w-4 h-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{data.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                    <span className={cn("font-medium", isPositive ? "text-green-600" : "text-red-600")}>
                        {data.change}
                    </span>
                    {" "}{data.description}
                </p>
            </CardContent>
        </Card>
    );
};

export default KPICard;
