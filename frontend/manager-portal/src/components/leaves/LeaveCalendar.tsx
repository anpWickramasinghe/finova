import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";

interface LeaveCalendarProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
}

export const LeaveCalendar: React.FC<LeaveCalendarProps> = ({ date, setDate }) => {
    return (
        <Card className="xl:col-span-1 border-none shadow-sm flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">June 2035</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex justify-center items-center p-0 scale-90 origin-top">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md"
                />
            </CardContent>
        </Card>
    );
};
