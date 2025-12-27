import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import React from "react";

export function TabsDisabled() {
  const primary = useColor("primary");

  const allItems = [
    { date: "2025-12-27", time: "120 min", status: "Waiting" },
    { date: "2025-12-25", time: "45 min", status: "Waiting" },
    { date: "2025-12-24", time: "60 min", status: "Approved" },
    { date: "2025-12-23", time: "90 min", status: "Approved" },
    { date: "2025-12-22", time: "30 min", status: "Rejected" },
    { date: "2025-12-21", time: "15 min", status: "Rejected" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Waiting":
        return "#eab308";
      case "Approved":
        return "#22c55e";
      case "Rejected":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const renderList = (items: typeof allItems) => (
    <View style={{ padding: 4 }}>
      {items.map((item, idx) => (
        <View
          key={idx}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
            backgroundColor: "#fff",
            borderRadius: 8,
            padding: 8,
          }}
        >
          <View>
            <Text variant="body" style={{ fontWeight: "500" }}>
              {item.date}
            </Text>
            <Text variant="body" style={{ color: "#6b7280", fontSize: 12 }}>
              {item.time}
            </Text>
          </View>
          <Text
            variant="body"
            style={{
              color: getStatusColor(item.status),
              fontWeight: "600",
            }}
          >
            {item.status}
          </Text>
        </View>
      ))}
    </View>
  );

  const pendingItems = allItems.filter((item) =>
    ["Waiting"].includes(item.status)
  );
  const approvedItems = allItems.filter((item) => item.status === "Approved");
  const rejectedItems = allItems.filter((item) => item.status === "Rejected");

  return (
    <Tabs
      defaultValue="pending"
      style={{
        width: "100%",
      }}
    >
      <TabsList
        style={{
          backgroundColor: "transparent",
          marginBottom: 16,
        }}
      >
        <TabsTrigger
          value="pending"
          style={{ borderRadius: 0, backgroundColor: "transparent" }}
          activeStyle={{
            borderBottomWidth: 2,
            borderBottomColor: primary,
            backgroundColor: "transparent",
          }}
        >
          Pending
        </TabsTrigger>
        <TabsTrigger
          value="approved"
          style={{ borderRadius: 0, backgroundColor: "transparent" }}
          activeStyle={{
            borderBottomWidth: 2,
            borderBottomColor: primary,
            backgroundColor: "transparent",
          }}
        >
          Approved
        </TabsTrigger>
        <TabsTrigger
          value="rejected"
          style={{ borderRadius: 0, backgroundColor: "transparent" }}
          activeStyle={{
            borderBottomWidth: 2,
            borderBottomColor: primary,
            backgroundColor: "transparent",
          }}
        >
          Rejected
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pending">
        <View style={{ padding: 4 }}>
          <Text variant="title" style={{ marginBottom: 8 }}>
            Pending Items
          </Text>
          {renderList(pendingItems)}
        </View>
      </TabsContent>

      <TabsContent value="approved">
        <View style={{ padding: 4 }}>
          <Text variant="title" style={{ marginBottom: 8 }}>
            Approved Features
          </Text>
          {renderList(approvedItems)}
        </View>
      </TabsContent>

      <TabsContent value="rejected">
        <View style={{ padding: 4 }}>
          <Text variant="title" style={{ marginBottom: 8 }}>
            Rejected Features
          </Text>
          {renderList(rejectedItems)}
        </View>
      </TabsContent>
    </Tabs>
  );
}
