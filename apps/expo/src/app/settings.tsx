/**
 * Settings Screen
 *
 * Allows users to update their profile information.
 */

import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Header } from "~/components/ui/Header";
import {
  buttons,
  buttonText,
  cards,
  colors,
  inputs,
  spacing,
  typography,
} from "~/styles";
import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";

export default function SettingsPage() {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();
  const [name, setName] = useState(session?.user.name ?? "");

  // Fetch user profile
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => trpc.auth.getProfile.query(),
    enabled: !!session?.user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      return trpc.auth.update.mutate(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      Alert.alert("Success", "Profile updated successfully");
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to update profile");
    },
  });

  const handleSaveProfile = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }
    updateProfileMutation.mutate({ name: name.trim() });
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await authClient.signOut();
          router.replace("/");
        },
      },
    ]);
  };

  if (isLoadingProfile) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background.primary }}
      >
        <Header title="Settings" />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background.primary }}
    >
      <Header title="Settings" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing[4] }}
      >
        {/* Profile Section */}
        <View style={[cards.base, { marginBottom: spacing[4] }]}>
          <Text style={[typography.h3, { marginBottom: spacing[4] }]}>
            Profile
          </Text>

          <View style={{ marginBottom: spacing[4] }}>
            <Text style={[typography.label, { marginBottom: spacing[1] }]}>
              Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              style={inputs.base}
            />
          </View>

          <View style={{ marginBottom: spacing[4] }}>
            <Text style={[typography.label, { marginBottom: spacing[1] }]}>
              Email
            </Text>
            <Text style={typography.body}>{session?.user.email}</Text>
          </View>

          <Pressable
            onPress={handleSaveProfile}
            disabled={updateProfileMutation.isPending}
            style={[buttons.primary, { opacity: updateProfileMutation.isPending ? 0.6 : 1 }]}
          >
            {updateProfileMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={buttonText.primary}>Save Changes</Text>
            )}
          </Pressable>
        </View>

        {/* Account Section */}
        <View style={cards.base}>
          <Text style={[typography.h3, { marginBottom: spacing[4] }]}>
            Account
          </Text>

          <Pressable
            onPress={handleSignOut}
            style={[buttons.secondary, { borderColor: colors.error[500] }]}
          >
            <Text style={[buttonText.secondary, { color: colors.error[500] }]}>
              Sign Out
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
