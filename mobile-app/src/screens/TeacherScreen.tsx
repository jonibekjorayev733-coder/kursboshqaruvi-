import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { SectionTitle } from '../components/SectionTitle';
import { colors } from '../theme/colors';

type TeacherScreenProps = {
  tab: 'home' | 'tasks' | 'notifications';
};

export function TeacherScreen({ tab }: TeacherScreenProps) {
  if (tab === 'tasks') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <SectionTitle title="Teacher Tasks" caption="Baholash va tekshiruv navbati" />
        <ListRow title="15 assignments to review" subtitle="Front-End Group A" />
        <ListRow title="Attendance close" subtitle="IELTS Evening" />
      </ScrollView>
    );
  }

  if (tab === 'notifications') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <SectionTitle title="Teacher Alerts" caption="Student status yangilanishlari" />
        <ListRow title="3 students accepted tasks" subtitle="Instant update" />
        <ListRow title="Payment completed" subtitle="Student: Akmal" />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle title="Teacher Home" caption="Classroom command center" />
      <View style={styles.gridRow}>
        <GlassCard title="Active Courses" value="4" subtitle="2 today" tone="purple" />
        <GlassCard title="Total Students" value="86" subtitle="+6 weekly" tone="teal" />
      </View>
      <View style={styles.gridRow}>
        <GlassCard title="Avg Score" value="81%" subtitle="Stable" tone="blue" />
        <GlassCard title="Attendance" value="89%" subtitle="Good" tone="teal" />
      </View>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Today Plan</Text>
        <Text style={styles.panelText}>• 09:00 - IELTS speaking</Text>
        <Text style={styles.panelText}>• 14:00 - JavaScript workshop</Text>
        <Text style={styles.panelText}>• 19:00 - Assignment review</Text>
      </View>
    </ScrollView>
  );
}

function ListRow({ title, subtitle }: { title: string; subtitle: string }) {
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
