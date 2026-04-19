import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

type Tab = { key: string; label: string };

type BottomNavProps = {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
};

export function BottomNav({ tabs, activeKey, onChange }: BottomNavProps) {
  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8
  },
  tab: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center'
  },
  tabActive: {
    backgroundColor: '#0E2B3B'
  },
  text: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 12
  },
  textActive: {
    color: colors.primary
  }
});
