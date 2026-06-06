import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { type TimelineEvent } from '@/data/schema';
import { colors, radii, spacing, typography } from '@/theme/tokens';
import { formatEventYear } from '@/timeline/formatYear';

type Props = {
  event: TimelineEvent | null;
  onClose: () => void;
};

export function EventDetailModal({ event, onClose }: Props) {
  const { t } = useTranslation();

  const timeRange = event
    ? `${formatEventYear(event.startYear, t)}${event.endYear !== undefined ? ` – ${formatEventYear(event.endYear, t)}` : ''}`
    : '';

  return (
    <Modal
      visible={!!event}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Detail schließen"
        accessibilityRole="button"
      >
        <Pressable
          style={styles.sheet}
          onPress={() => {}}
          accessibilityLabel={event ? `${event.title}, ${timeRange}` : undefined}
        >
          {event && (
            <ScrollView>
              <View
                style={[styles.colorBar, { backgroundColor: colors.category[event.category] }]}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <Text
                style={styles.category}
                accessibilityRole="text"
              >
                {t(`category.${event.category}`)}
              </Text>
              <Text style={styles.title} accessibilityRole="header">
                {event.title}
              </Text>
              <Text style={styles.range} accessibilityRole="text">
                {timeRange}
              </Text>
              {event.culture && (
                <Text style={styles.meta} accessibilityRole="text">
                  {t('event.culture')}: {event.culture}
                </Text>
              )}
              {event.description && (
                <Text style={styles.body} accessibilityRole="text">
                  {event.description}
                </Text>
              )}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  colorBar: {
    height: 4,
    width: 48,
    borderRadius: radii.pill,
    marginBottom: spacing.md,
  },
  category: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  range: {
    ...typography.subtitle,
    color: colors.accent,
    marginBottom: spacing.md,
  },
  meta: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
});
