import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Let's use Lucide icons for check circle.
import { Circle, CheckCircle2 } from "lucide-react";

interface PendingTasksProps {
    userRole?: string;
}

const tasks = [
    { id: 1, title: "Review Q4 Financials", due: "Today", completed: false },
    { id: 2, title: "Approve Tax Returns", due: "Tomorrow", completed: false },
    { id: 3, title: "Client Meeting: TechCorp", due: "Wed, 2pm", completed: false },
    { id: 4, title: "Update Software License", due: "Next Week", completed: true },
];

const PendingTasks: React.FC<PendingTasksProps> = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {tasks.map((task) => (
                        <div key={task.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer">
                            {task.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div className="flex-1 space-y-1">
                                <p className={`text-sm font-medium leading-none ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {task.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Due: {task.due}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default PendingTasks;
