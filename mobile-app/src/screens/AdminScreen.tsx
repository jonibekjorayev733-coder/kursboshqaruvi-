import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { SectionTitle } from '../components/SectionTitle';
import { colors } from '../theme/colors';

type AdminScreenProps = {
  tab: 'home' | 'tasks' | 'notifications';
};

export function AdminScreen({ tab }: AdminScreenProps) {
  if (tab === 'tasks') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <SectionTitle title="Admin Tasks" caption="Platform boshqaruvi" />
        <Row title="Finance report approval" subtitle="Due today" />
        <Row title="Teacher onboarding" subtitle="2 new requests" />
      </ScrollView>
    );
  }

  if (tab === 'notifications') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <SectionTitle title="Admin Alerts" caption="System va payment signallari" />
        <Row title="Revenue +12% this month" subtitle="Healthy growth" />
        <Row title="4 overdue payments" subtitle="Need reminder" />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle title="Admin Home" caption="Business analytics in mobile style" />
      <View style={styles.gridRow}>
        <GlassCard title="Revenue" value="$12.4K" subtitle="Monthly" tone="blue" />
        <GlassCard title="Active Users" value="312" subtitle="Online 74" tone="purple" />
      </View>
      <View style={styles.gridRow}>
        <GlassCard title="Teachers" value="18" subtitle="2 pending" tone="teal" />
        <GlassCard title="Students" value="268" subtitle="+19 this week" tone="blue" />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Admin Insights</Text>
        <Text style={styles.panelText}>• Payment collection: 84%</Text>
        <Text style={styles.panelText}>• Attendance index: 91%</Text>
        <Text style={styles.panelText}>• New enrollments: 23</Text>
      </View>
    </ScrollView>
  );
}

function Row({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowSub}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 26 },
  gridRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  panel: {
    marginTop: 6,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  panelTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 8 },
  panelText: { color: colors.textMuted, fontSize: 13, marginBottom: 4 },
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    padding: 12,
    marginBottom: 10,
  },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  rowSub: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});
