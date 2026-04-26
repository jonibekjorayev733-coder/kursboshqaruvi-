import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassCard, HeroHeader, ScreenContainer, SectionTitle, StudentTopBar, webShellStyles } from '@/components/ui/web-shell';
import { useStudentSession } from '@/contexts/student-session';
import { studentApi } from '@/services/api';
import type { Payment } from '@/types/student';

export default function StudentPaymentsScreen() {
  const { user, isBootstrapping } = useStudentSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = useCallback(async (refresh = false) => {
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
      const data = await studentApi.getStudentPayments(user.id);
      setPayments(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'To‘lovlar yuklanmadi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isBootstrapping) {
      loadPayments();
    }
  }, [isBootstrapping, loadPayments]);

  const stats = useMemo(() => {
    return {
      paid: payments.filter((item) => item.status === 'paid').reduce((sum, item) => sum + (item.amount || 0), 0),
      pending: payments.filter((item) => item.status === 'pending').reduce((sum, item) => sum + (item.amount || 0), 0),
    };
  }, [payments]);

  if (isBootstrapping || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1e6789ff" />
        <Text style={styles.loadingText}>To‘lovlar yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <StudentTopBar name={user?.name} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPayments(true)} />}>
        <HeroHeader title="To‘lovlar" subtitle="Sizning kurslaringiz bo‘yicha holat" />
        {error ? <Text style={webShellStyles.error}>{error}</Text> : null}

        <SectionTitle title="Hisob-kitob" right={`${payments.length} ta`} />
        <View style={styles.summaryRow}>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={styles.summaryValue}>${stats.paid.toFixed(0)}</Text>
          </GlassCard>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.summaryValue}>${stats.pending.toFixed(0)}</Text>
          </GlassCard>
        </View>

        <SectionTitle title="To‘lov tarixi" />
        {payments.map((item) => (
          <GlassCard key={item.id}>
            <View style={styles.topRow}>
              <Text style={styles.month}>{item.month}</Text>
              <Text style={[styles.badge, item.status === 'paid' ? styles.paid : item.status === 'pending' ? styles.pending : styles.failed]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.amount}>${item.amount}</Text>
            <Text style={styles.meta}>Due: {item.due_date || 'N/A'}</Text>
            {item.paid_date ? <Text style={styles.meta}>Paid: {item.paid_date}</Text> : null}
          </GlassCard>
        ))}

        {payments.length === 0 && !error ? <Text style={webShellStyles.empty}>Hozircha to‘lovlar yo‘q.</Text> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 44, gap: 12 },
  centered: { flex: 1, backgroundColor: '#030712', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#94a3b8', marginTop: 10 },
  summaryRow: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  summaryCard: { width: '48%' },
  summaryLabel: { color: '#7dd3fc', fontSize: 12, textTransform: 'uppercase', fontWeight: '700' },
  summaryValue: { color: '#f8fafc', fontSize: 28, fontWeight: '800', marginTop: 6 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  month: { color: '#f8fafc', fontSize: 18, fontWeight: '800', flex: 1, marginRight: 8 },
  amount: { color: '#f8fafc', fontSize: 28, fontWeight: '800' },
  meta: { color: '#94a3b8', fontSize: 12 },
  badge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  paid: { backgroundColor: '#14532d', color: '#4ade80' },
  pending: { backgroundColor: '#92400e', color: '#fde047' },
  failed: { backgroundColor: '#7f1d1d', color: '#fca5a5' },
});
