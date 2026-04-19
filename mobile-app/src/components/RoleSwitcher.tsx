import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Role } from '../types/role';
import { colors } from '../theme/colors';

type RoleSwitcherProps = {
  role: Role;
  onChange: (role: Role) => void;
};

const roles: Role[] = ['student', 'teacher', 'admin'];

export function RoleSwitcher({ role, onChange }: RoleSwitcherProps) {
  return (
    <View style={styles.wrap}>
      {roles.map((item) => {
        const active = item === role;
        return (
          <Pressable
            key={item}
            onPress={() => onChange(item)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{item.toUpperCase()}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    marginTop: 4,
  },
  chip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    alignItems: 'center',
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: '#0A2330',
  },
  text: {
    color: colors.textMuted,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  textActive: {
    color: colors.primary,
  },
});
