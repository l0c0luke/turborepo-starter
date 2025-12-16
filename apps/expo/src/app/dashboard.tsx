/**
 * Dashboard Screen
 *
 * Simple dashboard for the starter template
 */

import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { HamburgerMenu } from "~/components/ui/HamburgerMenu";
import { Header } from "~/components/ui/Header";
import { colors, spacing, typography } from "~/styles";
import { authClient } from "~/utils/auth";

export default function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();

  const menuOptions = [
    {
      label: "Settings",
      icon: "settings-outline" as const,
      onPress: () => router.push("/settings"),
    },
    {
      label: "Sign Out",
      icon: "log-out-outline" as const,
      onPress: async () => {
        await authClient.signOut();
        router.replace("/");
      },
      destructive: true,
    },
  ];

  if (isPending) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background.primary }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={typography.body}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background.primary }}
    >
      <Header
        title="Dashboard"
        showBackButton={false}
        rightComponent={<HamburgerMenu options={menuOptions} />}
      />

      <View
        style={{
          flex: 1,
          padding: spacing[4],
        }}
      >
        <Text style={[typography.h2, { marginBottom: spacing[4] }]}>
          Welcome, {session?.user?.name ?? "User"}!
        </Text>

        <View
          style={{
            backgroundColor: colors.background.secondary,
            padding: spacing[4],
            borderRadius: 12,
            marginBottom: spacing[4],
          }}
        >
          <Text style={[typography.h3, { marginBottom: spacing[2] }]}>
            Getting Started
          </Text>
          <Text style={typography.body}>
            This is a starter template with authentication already set up. You
            can start building your app from here!
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.background.secondary,
            padding: spacing[4],
            borderRadius: 12,
          }}
        >
          <Text style={[typography.h3, { marginBottom: spacing[2] }]}>
            Your Profile
          </Text>
          <Text style={typography.body}>Email: {session?.user?.email}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
