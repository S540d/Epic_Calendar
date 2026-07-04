import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { ALL_EVENTS } from '@/data/events';
import type { TimelineEvent } from '@/data/schema';
import { formatEventYear } from '@/timeline/formatYear';
import { parseYearQuery, searchEvents, type SearchResult } from '@/timeline/search';
import { useTheme, type ThemeColors } from '@/theme/ThemeContext';
import { radii, spacing, typography } from '@/theme/tokens';
import { CATEGORY_COLORS } from '@/theme/categories';

type YearJumpResult = { kind: 'year'; year: number; label: string };
type EventJumpResult = { kind: 'event'; result: SearchResult };
type JumpResult = YearJumpResult | EventJumpResult;

const MAX_RESULTS = 30;

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Selecting a result yields either a year to center on, or an event to jump to. */
  onSelectEvent: (event: TimelineEvent) => void;
  onSelectYear: (year: number) => void;
};

export function SearchModal({ visible, onClose, onSelectEvent, onSelectYear }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [query, setQuery] = useState('');

  const results: JumpResult[] = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) return [];

    const out: JumpResult[] = [];
    const year = parseYearQuery(trimmed);
    if (year !== null) {
      out.push({ kind: 'year', year, label: formatEventYear(year, t) });
    }
    const eventResults = searchEvents(ALL_EVENTS, trimmed).slice(0, MAX_RESULTS);
    for (const result of eventResults) {
      out.push({ kind: 'event', result });
    }
    return out;
  }, [query, t]);

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const handleSelect = (item: JumpResult) => {
    if (item.kind === 'year') {
      onSelectYear(item.year);
    } else {
      onSelectEvent(item.result.event);
    }
    setQuery('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      accessibilityViewIsModal
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder={t('search.placeholder')}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              accessibilityLabel={t('search.placeholder')}
              returnKeyType="search"
              onSubmitEditing={() => {
                const first = results[0];
                if (first) handleSelect(first);
              }}
            />
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              accessibilityLabel={t('search.close')}
              accessibilityRole="button"
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {query.trim().length > 0 && query.trim().length < 2 && (
            <Text style={styles.hint}>{t('search.minChars')}</Text>
          )}

          {query.trim().length >= 2 && results.length === 0 && (
            <Text style={styles.hint}>{t('search.noResults')}</Text>
          )}

          <FlatList
            data={results}
            keyExtractor={(item, i) =>
              item.kind === 'year' ? `year-${item.year}` : `event-${item.result.event.id}-${i}`
            }
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => handleSelect(item)}
                accessibilityRole="button"
              >
                {item.kind === 'year' ? (
                  <>
                    <View style={[styles.dot, { backgroundColor: colors.accent }]} />
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {t('search.jumpToYear', { year: item.label })}
                    </Text>
                  </>
                ) : (
                  <>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: CATEGORY_COLORS[item.result.event.category] },
                      ]}
                    />
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {item.result.event.title}
                      </Text>
                      <Text style={styles.rowSubtitle} numberOfLines={1}>
                        {formatEventYear(item.result.event.startYear, t)}
                        {item.result.event.culture ? ` · ${item.result.event.culture}` : ''}
                      </Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.bgElevated,
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
      maxHeight: '80%',
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: radii.pill,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    input: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginRight: spacing.sm,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    hint: {
      ...typography.caption,
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    list: {
      flexGrow: 0,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: spacing.sm,
    },
    rowText: {
      flex: 1,
    },
    rowTitle: {
      ...typography.body,
      color: colors.textPrimary,
    },
    rowSubtitle: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
  });
}
