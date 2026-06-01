import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CATEGORY_LABELS, type TimelineEvent } from '@/data/schema';
import { colors, radii, spacing, typography } from '@/theme/tokens';

type Props = {
  event: TimelineEvent | null;
  onClose: () => void;
};

function formatYear(y: number): string {
  if (Math.abs(y) >= 1_000_000) return `${(y / 1_000_000).toFixed(1)} Mio.`;
  if (Math.abs(y) >= 10_000) return `${(y / 1000).toFixed(1)} Tsd.`;
  if (y < 0) return `${Math.abs(y)} v.Chr.`;
  return `${y} n.Chr.`;
}

export function EventDetailModal({ event, onClose }: Props) {
  return (
    <Modal
      visible={!!event}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {event && (
            <ScrollView>
              <View
                style={[
                  styles.colorBar,
                  { backgroundColor: colors.category[event.category] },
                ]}
              />
              <Text style={styles.category}>{CATEGORY_LABELS[event.category]}</Text>
              <Text style={styles.title}>{event.title}</Text>
              <Text style={styles.range}>
                {formatYear(event.startYear)}
                {event.endYear !== undefined ? ` – ${formatYear(event.endYear)}` : ''}
              </Text>
              {event.culture && <Text style={styles.meta}>Kultur: {event.culture}</Text>}
              {event.description && <Text style={styles.body}>{event.description}</Text>}
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
