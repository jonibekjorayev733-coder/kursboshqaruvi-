import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { SectionTitle } from '../components/SectionTitle';
import { colors } from '../theme/colors';

type StudentScreenProps = {
  tab: 'home' | 'tasks' | 'notifications';
};

export function StudentScreen({ tab }: StudentScreenProps) {
  if (tab === 'tasks') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <SectionTitle title="Student Tasks" caption="Homework va deadline tracking" />
        <TaskRow title="Math Assignment" status="Due Today" tone="warning" />
        <TaskRow title="English Essay" status="Submitted" tone="success" />
        <TaskRow title="Physics Quiz" status="Due Tomorrow" tone="warning" />
      </ScrollView>
    );
  }

  if (tab === 'notifications') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <SectionTitle title="Student Alerts" caption="Payment va assignment xabarlari" />
        <AlertCard title="Payment Reminder" message="Java course uchun to‘lov muddati ertaga." />
        <AlertCard title="Task Accepted" message="Teacher sizning task holatingizni tasdiqladi." />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle title="Student Home" caption="APK style premium dashboard" />

      <View style={styles.gridRow}>
        <GlassCard title="Avg Grade" value="88%" subtitle="+4% this month" tone="blue" />
        <GlassCard title="Attendance" value="92%" subtitle="Excellent" tone="teal" />
      </View>

      <View style={styles.gridRow}>
        <GlassCard title="Pending Tasks" value="3" subtitle="1 urgent" tone="purple" />
        <GlassCard title="Next Payment" value="$120" subtitle="Due in 4 days" tone="blue" />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Quick Overview</Text>
        <Text style={styles.panelText}>Kurslar: IELTS, Frontend, Math</Text>
        <Text style={styles.panelText}>Bugungi holat: 2 lesson completed</Text>
      </View>
    </ScrollView>
  );
}

function TaskRow({ title, status, tone }: { title: string; status: string; tone: 'warning' | 'success' }) {
  return (
    <View style={styles.taskRow}>
      <View>
        <Text style={styles.taskTitle}>{title}</Text>
        <Text style={styles.taskSub}>Student workflow</Text>
      </View>
      <Text style={[styles.taskBadge, tone === 'success' ? styles.badgeSuccess : styles.badgeWarning]}>{status}</Text>
    </View>
  );
}

function AlertCard({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.alertCard}>
      <Text style={styles.alertTitle}>{title}</Text>
      <Text style={styles.alertMsg}>{message}</Text>
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
  taskRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  taskSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  taskBadge: { fontSize: 11, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeWarning: { backgroundColor: '#3A2A12', color: colors.warning },
  badgeSuccess: { backgroundColor: '#123321', color: colors.success },
  alertCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  alertTitle: { color: colors.primary, fontSize: 14, fontWeight: '800', marginBottom: 4 },
  alertMsg: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
});
