/**
 * HelpModal — contextual help for the screen on display. Content comes from
 * `~/help` (`screenHelp.<screen>`); `NavigationBar` opens it from its "?"
 * button, or a screen without a navigation bar renders it directly.
 */

import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { ScreenHelp } from "~/help";
import { buttons, cards, colors, spacing, typography } from "~/styles";
import { buttonA11y } from "~/utils/accessibility";

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
  help: ScreenHelp;
}

export function HelpModal({ visible, onClose, help }: HelpModalProps) {
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
          <Text style={typography.h2}>{help.title}</Text>
          <Pressable onPress={onClose} {...buttonA11y("Close help")}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={typography.body}>{help.intro}</Text>
          {help.tips.map((tip) => (
            <View
              key={tip}
              style={[cards.base, { flexDirection: "row", gap: spacing[3] }]}
            >
              <Ionicons name="bulb" size={20} color={colors.primary[500]} />
              <Text style={[typography.body, { flex: 1 }]}>{tip}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={{ padding: spacing[4] }}>
          <Pressable style={buttons.primary} onPress={onClose}>
            <Text
              style={{
                color: colors.text.inverse,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              Got it
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
