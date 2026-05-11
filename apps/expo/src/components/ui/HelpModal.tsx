/**
 * HelpModal Component
 *
 * A simple help/info modal for the app.
 */

import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { buttons, cards, colors, spacing, typography } from "~/styles";

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export function HelpModal({ visible, onClose }: HelpModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: spacing[4],
            borderBottomWidth: 1,
            borderBottomColor: colors.border.light,
          }}
        >
          <Text style={typography.h2}>Help</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={{ padding: spacing[4] }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[cards.base, { marginBottom: spacing[4] }]}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: spacing[3],
              }}
            >
              <Ionicons
                name="information-circle"
                size={24}
                color={colors.primary[500]}
              />
              <Text style={[typography.h3, { marginLeft: spacing[2] }]}>
                About This App
              </Text>
            </View>
            <Text style={typography.body}>
              This is a starter template for building full-stack applications.
              Customize this help section with information about your app!
            </Text>
          </View>

          <View style={[cards.base, { marginBottom: spacing[4] }]}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: spacing[3],
              }}
            >
              <Ionicons name="rocket" size={24} color={colors.success[500]} />
              <Text style={[typography.h3, { marginLeft: spacing[2] }]}>
                Getting Started
              </Text>
            </View>
            <Text style={typography.body}>
              Start by exploring the dashboard. You can access settings from the
              menu to update your profile.
            </Text>
          </View>

          <View style={cards.base}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: spacing[3],
              }}
            >
              <Ionicons
                name="help-circle"
                size={24}
                color={colors.warning[500]}
              />
              <Text style={[typography.h3, { marginLeft: spacing[2] }]}>
                Need Help?
              </Text>
            </View>
            <Text style={typography.body}>
              If you need assistance, check the documentation or reach out to
              support.
            </Text>
          </View>
        </ScrollView>

        {/* Close Button */}
        <View style={{ padding: spacing[4] }}>
          <Pressable style={buttons.primary} onPress={onClose}>
            <Text
              style={{ color: "white", fontWeight: "600", textAlign: "center" }}
            >
              Got it!
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
