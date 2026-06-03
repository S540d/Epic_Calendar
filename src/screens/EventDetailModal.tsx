import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { type TimelineEvent } from '@/data/schema';
import { colors, radii, spacing, typography } from '@/theme/tokens';

type Props = {
  event: TimelineEvent | null;
  onClose: () => void;
};

function formatYear(y: number, t: (key: string) => string): string {
  const suffix = y < 0 ? ` ${t('event.bce')}` : ` ${t('event.ce')}`;
  const a = Math.abs(y);
  if (a >= 1_000_000) return `${(a / 1_000_000).toFixed(1)} ${t('event.million')}${suffix}`;
  if (a >= 10_000) return `${(a / 1_000).toFixed(1)} ${t('event.thousand')}${suffix}`;
  return `${a}${suffix}`;
}

export function EventDetailModal({ event, onClose }: Props) {
  const { t } = useTranslation();

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
              <Text style={styles.category}>{t(`category.${event.category}`)}</Text>
              <Text style={styles.title}>{event.title}</Text>
              <Text style={styles.range}>
                {formatYear(event.startYear, t)}
                {event.endYear !== undefined ? ` – ${formatYear(event.endYear, t)}` : ''}
              </Text>
              {event.culture && (
                <Text style={styles.meta}>{t('event.culture')}: {event.culture}</Text>
              )}
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
