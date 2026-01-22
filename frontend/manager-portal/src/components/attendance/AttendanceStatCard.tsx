import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SubStat {
    label: string;
    value: number;
}

interface AttendanceStatCardProps {
    title: string;
    count: number;
    subText: string;
    stats?: SubStat[];
    variant?: "success" | "warning" | "danger" | "default";
}

const AttendanceStatCard = ({
    title,
    count,
    subText,
    stats = [],
    variant = "default",
}: AttendanceStatCardProps) => {

    const variantStyles = {
        success: "bg-red-50 text-red-800",
        warning: "bg-chart-2 text-white",
        danger: "bg-primary text-primary-foreground",
        default: "bg-card text-card-foreground"
    };

    const isTeal = variant === 'warning';
    const isDark = variant === 'danger';


    return (
        <Card className={cn(
            "border-none shadow-sm h-full transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer",
            variantStyles[variant]
        )}>
            <CardContent className="p-6 flex flex-col justify-between h-full">
                <div>
                    <h3 className={cn("font-medium mb-1", isTeal || isDark ? "text-white/90" : "text-muted-foreground")}>{title}</h3>
                    <div className="flex items-end justify-between mt-4">
                        <div className="flex flex-col">
                            <span className={cn("text-5xl font-bold tracking-tight", isTeal || isDark ? "text-white" : "text-foreground")}>
                                {count}
                            </span>
                            <span className={cn("text-sm mt-1", isTeal || isDark ? "text-white/80" : "text-muted-foreground")}>
                                {subText}
                            </span>
                        </div>
                    </div>
                </div>

                {stats.length > 0 && (
                    <div className={cn("mt-6 flex flex-wrap gap-4 pt-4 border-t", isTeal || isDark ? "border-white/10" : "border-border")}>
                        {stats.map((stat, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <span className={cn("font-bold text-lg", isTeal || isDark ? "text-white" : "text-foreground")}>{stat.value}</span>
                                <span className={cn("text-sm", isTeal || isDark ? "text-white/80" : "text-muted-foreground")}>{stat.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default AttendanceStatCard;
