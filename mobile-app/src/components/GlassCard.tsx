import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type GlassCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  tone?: 'blue' | 'purple' | 'teal';
};

const toneMap = {
  blue: colors.cardBlue,
  purple: colors.cardPurple,
  teal: colors.cardTeal,
};

export function GlassCard({ title, value, subtitle, tone = 'blue' }: GlassCardProps) {
  return (
    <View style={[styles.card, { borderColor: toneMap[tone] }]}> 
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    minHeight: 98,
  },
  title: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  value: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.primary,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '700',
  },
});
