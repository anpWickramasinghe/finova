import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { ScrollView } from "react-native";
import { useColor } from "@/hooks/useColor";
import {
    ArrowRight,
    Calendar,
    Briefcase,
    AlertCircle,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/header";

export default function LeaveScreen() {
    const primary = useColor("primary");
    const muted = useColor("muted");
    const cardColor = useColor("card");

    const leaveTypes = [
        {
            title: "All Leaves",
            count: 24,
            status: "Ongoing",
            icon: Calendar,
            color: "#3b82f6", // blue-500
            bgColor: "#eff6ff", // blue-50
        },
        {
            title: "Annual Leaves",
            count: 12,
            status: "In Process",
            icon: Briefcase,
            color: "#eab308", // yellow-500
            bgColor: "#fefce8", // yellow-50
        },
        {
            title: "Sick Leaves",
            count: 8,
            status: "On-hold",
            icon: AlertCircle,
            color: "#ef4444", // red-500
            bgColor: "#fef2f2", // red-50
        },
    ];

    return (
        <View style={{ flex: 1 }}>
            <Header title="Leave Management" />
            <SafeAreaView style={{ flex: 1 }} edges={["bottom", "left", "right"]}>
                <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
                    {/* <Text variant='heading' style={{ marginBottom: 8 }}>
                        Leave Management
                    </Text> */}

                    <View
                        style={{ flexDirection: "row", gap: 16, alignItems: "stretch" }}
                    >
                        {leaveTypes.map((item, index) => (
                            <Card
                                key={index}
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    backgroundColor: item.bgColor,
                                    borderWidth: 0,
                                    shadowOpacity: 0,
                                }}
                            >
                                <CardContent style={{ padding: 10, flex: 1 }}>
                                    <View
                                        style={{ gap: 8, flex: 1, justifyContent: "space-between" }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                            }}
                                        >
                                            <Text style={{ fontWeight: "600", fontSize: 14 }}>
                                                {item.title}
                                            </Text>
                                        </View>

                                        <Text style={{ fontSize: 14, color: muted, marginTop: 4 }}>
                                            {item.status}
                                        </Text>

                                        <View
                                            style={{
                                                flexDirection: "row",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginTop: 16,
                                            }}
                                        >
                                            <Text style={{ color: item.color, fontWeight: "600" }}>
                                                View
                                            </Text>
                                            <ArrowRight size={20} color={item.color} />
                                        </View>
                                    </View>
                                </CardContent>
                            </Card>
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
