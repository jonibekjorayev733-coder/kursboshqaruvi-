import React, { PropsWithChildren } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

export function ScreenContainer({ children }: PropsWithChildren) {
  return (
    <View style={styles.screen}>
      <View style={styles.bgGlowTop} />
      <View style={styles.bgGlowBottom} />
      {children}
    </View>
  );
}

export function HeroHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroGlow} />
      <Text style={styles.heroTitle}>{title}</Text>
      {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function StudentTopBar({ name }: { name?: string }) {
  const initial = (name?.[0] || 'S').toUpperCase();
  const displayName = name || 'Student';
  return (
    <View style={styles.topBar}>
      <View style={styles.topLeft} />
      <View style={styles.topRight}>
        <View style={styles.bellWrap}>
          <Text style={styles.bellIcon}>{String.fromCodePoint(0x1F514)}</Text>
          <View style={styles.bellDot} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userRole}>O'QUVCHI</Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>
    </View>
  );
}

export function GlassCard({ children, style }: PropsWithChildren<{ style?: ViewStyle | ViewStyle[] }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ title, right }: { title: string; right?: string }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {right ? <Text style={styles.sectionRight}>{right}</Text> : null}
    </View>
  );
}

export const webShellStyles = StyleSheet.create({
  textMain: { color: '#e2e8f0' },
  textSubtle: { color: '#94a3b8' },
  error: {
    color: '#fecaca',
    backgroundColor: '#450a0a',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  empty: {
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 14,
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#08101f',
    position: 'relative',
  },
  bgGlowTop: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#1d4ed820',
    top: -110,
    right: -100,
  },
  bgGlowBottom: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#0ea5e915',
    bottom: -140,
    left: -120,
  },
  topBar: {
    height: 60,
    backgroundColor: '#08101f',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLeft: {
    width: 24,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellWrap: {
    position: 'relative',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 18,
  },
  bellDot: {
    position: 'absolute',
    right: 2,
    top: 2,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: '#08101f',
  },
  userInfo: {
    alignItems: 'flex-end',
  },
  userName: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  userRole: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    lineHeight: 14,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e3a8a',
    borderWidth: 2,
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#e0f2fe',
    fontSize: 13,
    fontWeight: '800',
  },
  hero: {
    marginTop: 12,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
    backgroundColor: '#102244',
    borderWidth: 1,
    borderColor: '#1e3a8a',
    overflow: 'hidden',
    shadowColor: '#2563eb',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroGlow: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#1d4ed840',
  },
  heroTitle: {
    color: '#f8fafc',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  heroSubtitle: {
    color: '#94a3b8',
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#0f172adf',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sectionRow: {
    marginTop: 8,
    marginBottom: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: '800',
  },
  sectionRight: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
});
