import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassCard, HeroHeader, ScreenContainer, SectionTitle, StudentTopBar, webShellStyles } from '@/components/ui/web-shell';
import { useStudentSession } from '@/contexts/student-session';
import { studentApi } from '@/services/api';
import type { Attendance, Payment } from '@/types/student';

export default function StudentDashboardScreen() {
  const { user, isBootstrapping } = useStudentSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseCount, setCourseCount] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);

  const loadDashboard = useCallback(async (refresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      setError(null);
      const [courses, paymentData, attendanceData] = await Promise.all([
        studentApi.getStudentCourses(user.id),
        studentApi.getStudentPayments(user.id),
        studentApi.getStudentAttendance(user.id),
      ]);

      setCourseCount(courses.length);
      setPayments(paymentData);
      setAttendance(attendanceData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ma’lumot yuklanmadi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isBootstrapping) {
      loadDashboard();
    }
  }, [isBootstrapping, loadDashboard]);

  const pendingAmount = useMemo(() => {
    return payments.filter((item) => item.status === 'pending').reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [payments]);

  const paidAmount = useMemo(() => {
    return payments.filter((item) => item.status === 'paid').reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [payments]);

  const attendanceRate = useMemo(() => {
    if (!attendance.length) return 0;
    const presentCount = attendance.filter((item) => item.status?.toLowerCase() === 'present').length;
    return Math.round((presentCount / attendance.length) * 100);
  }, [attendance]);

  if (isBootstrapping || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Dashboard yuklanmoqda...</Text>
      </View>
    );
  }


  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Kirish talab qilinadi</Text>
        <Text style={styles.subtitle}>Iltimos, qayta login qiling.</Text>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <StudentTopBar name={user.name} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} />}>
        <HeroHeader title="Salom!" subtitle="O‘quv progressingizni kuzatib boring" />

        {error ? <Text style={webShellStyles.error}>{error}</Text> : null}

        <SectionTitle title="O‘quvchi paneli" right="LIVE" />
        <View style={styles.metricGrid}>
          <GlassCard style={styles.metricCard}>
            <Text style={styles.metricLabel}>Kurslar</Text>
            <Text style={styles.metricValue}>{courseCount}</Text>
          </GlassCard>

          <GlassCard style={styles.metricCard}>
            <Text style={styles.metricLabel}>Davomat</Text>
            <Text style={styles.metricValue}>{attendanceRate}%</Text>
          </GlassCard>

          <GlassCard style={styles.metricCard}>
            <Text style={styles.metricLabel}>Pending</Text>
            <Text style={styles.metricValue}>${pendingAmount.toFixed(0)}</Text>
          </GlassCard>

          <GlassCard style={styles.metricCard}>
            <Text style={styles.metricLabel}>Paid</Text>
            <Text style={styles.metricValue}>${paidAmount.toFixed(0)}</Text>
          </GlassCard>
        </View>

        <SectionTitle title="So‘nggi to‘lovlar" />
        <GlassCard>
          {payments.slice(0, 4).map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.rowTitle} numberOfLines={1}>{item.month}</Text>
              <Text style={styles.rowRight} numberOfLines={1}>${item.amount} • {item.status}</Text>
            </View>
          ))}
          {payments.length === 0 ? <Text style={webShellStyles.empty}>To‘lovlar topilmadi</Text> : null}
        </GlassCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  centered: { flex: 1, backgroundColor: '#030712', alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { color: '#94a3b8', marginTop: 10 },
  title: { color: '#f8fafc', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#94a3b8', marginTop: 8, textAlign: 'center' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  metricCard: { width: '48%' },
  metricLabel: { color: '#7dd3fc', fontSize: 12, textTransform: 'uppercase', fontWeight: '700' },
  metricValue: { color: '#f8fafc', fontSize: 30, fontWeight: '800' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingVertical: 10,
  },
  rowTitle: { color: '#e2e8f0', fontWeight: '700', flex: 1, marginRight: 10 },
  rowRight: { color: '#94a3b8', fontSize: 12, textTransform: 'capitalize', maxWidth: '52%', textAlign: 'right' },
});
