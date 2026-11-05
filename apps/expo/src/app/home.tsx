import { useEffect } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { NavigationBar } from "~/components/NavigationBar";
import { Skeleton } from "~/components/ui/Skeleton";
import { containers } from "~/styles";
import { authClient } from "~/utils/auth";

/**
 * Home — the authenticated landing screen.
 *
 * The login screen (`index.tsx`) navigates here after a successful sign-in.
 * Styled with NativeWind (Tailwind `className`); the design tokens in
 * `src/styles` remain available for components that prefer `StyleSheet`.
 */
export default function HomeScreen() {
  const { data: session, isPending } = authClient.useSession();

  // Send unauthenticated users back to the login screen.
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/");
    }
  }, [isPending, session]);

  return (
    <SafeAreaView style={containers.safeArea} edges={["bottom"]}>
      <NavigationBar title="Home" showBack={false} />
      <View className="flex-1 p-4">
        <View className="rounded-2xl border border-gray-200 bg-white p-5">
          <Text className="text-xl font-semibold text-gray-900">Welcome</Text>
          {session?.user ? (
            <Text className="mt-2 text-base text-gray-600">
              Signed in as {session.user.email}
            </Text>
          ) : (
            // Skeleton, not "Loading…": the layout appears instantly.
            <Skeleton width="70%" height={20} style={{ marginTop: 8 }} />
          )}
          <Text className="mt-3 text-sm text-gray-400">
            This is your authenticated home screen. Start building your app from
            here.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
