import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Badge } from "@/components/ui/badge";
import { useColor } from "@/hooks/useColor";
import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { getMyAttendance } from "@/services/attendanceService";

type OvertimeRecord = {
  id: string;
  recordDate: string;
  overtimeHours: string | null;
  calculatedOvertimeMinutes: string | null;
  overtimeStatus: string;
  isWeekend: boolean;
  isHoliday: boolean;
};

export default function OvertimeHistoryList({ records }: { records: OvertimeRecord[] }) {
  const primary = useColor("primary");
  const cardColor = useColor("card");
  const borderColor = useColor("border");

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Approved":
        return "success";
      case "Rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getOvertimeType = (isWeekend: boolean, isHoliday: boolean) => {
    if (isHoliday) return "Holiday OT";
    if (isWeekend) return "Weekend OT";
    return "Regular OT";
  };

  const getTypeBadgeVariant = (isWeekend: boolean, isHoliday: boolean) => {
    if (isHoliday) return "destructive"; // Highlights premium holiday
    if (isWeekend) return "default";
    return "outline";
  };

  const renderList = (items: OvertimeRecord[]) => {
    if (items.length === 0) {
      return (
        <View style={{ padding: 24, alignItems: "center" }}>
          <Text variant="body" style={{ color: "#6b7280" }}>
            No records found.
          </Text>
        </View>
      );
    }

    return (
      <View style={{ gap: 12, paddingVertical: 8 }}>
        {items.map((item) => (
          <View
            key={item.id}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: cardColor,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: borderColor,
            }}
          >
            <View style={{ gap: 4 }}>
              <Text variant="body" style={{ fontWeight: "600", fontSize: 16 }}>
                {new Date(item.recordDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text variant="caption" style={{ color: "#6b7280" }}>
                  {item.overtimeHours ? `${item.overtimeHours} hrs` : `${item.calculatedOvertimeMinutes} mins`}
                </Text>
                <Badge variant={getTypeBadgeVariant(item.isWeekend, item.isHoliday)} style={{ paddingVertical: 2, paddingHorizontal: 6 }}>
                  <Text style={{ fontSize: 10 }}>{getOvertimeType(item.isWeekend, item.isHoliday)}</Text>
                </Badge>
              </View>
            </View>
            
            <View>
              <Badge variant={getStatusBadgeVariant(item.overtimeStatus || 'Pending')}>
                <Text style={{ fontSize: 12, fontWeight: "600" }}>{item.overtimeStatus || 'Pending'}</Text>
              </Badge>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const pendingItems = records.filter((item) => (item.overtimeStatus || 'Pending') === "Pending");
  const approvedItems = records.filter((item) => item.overtimeStatus === "Approved");
  const rejectedItems = records.filter((item) => item.overtimeStatus === "Rejected");

  return (
    <Tabs defaultValue="all" style={{ width: "100%" }}>
      <TabsList style={{ backgroundColor: "transparent", marginBottom: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <TabsTrigger
            value="all"
            style={{ borderRadius: 20, backgroundColor: cardColor, borderWidth: 1, borderColor }}
            activeStyle={{ backgroundColor: primary, borderColor: primary }}
            activeTextStyle={{ color: "#fff" }}
          >
            All
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            style={{ borderRadius: 20, backgroundColor: cardColor, borderWidth: 1, borderColor }}
            activeStyle={{ backgroundColor: primary, borderColor: primary }}
            activeTextStyle={{ color: "#fff" }}
          >
            Pending
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            style={{ borderRadius: 20, backgroundColor: cardColor, borderWidth: 1, borderColor }}
            activeStyle={{ backgroundColor: primary, borderColor: primary }}
            activeTextStyle={{ color: "#fff" }}
          >
            Approved
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            style={{ borderRadius: 20, backgroundColor: cardColor, borderWidth: 1, borderColor }}
            activeStyle={{ backgroundColor: primary, borderColor: primary }}
            activeTextStyle={{ color: "#fff" }}
          >
            Rejected
          </TabsTrigger>
        </ScrollView>
      </TabsList>

      <TabsContent value="all">
        {renderList(records)}
      </TabsContent>

      <TabsContent value="pending">
        {renderList(pendingItems)}
      </TabsContent>

      <TabsContent value="approved">
        {renderList(approvedItems)}
      </TabsContent>

      <TabsContent value="rejected">
        {renderList(rejectedItems)}
      </TabsContent>
    </Tabs>
  );
}
