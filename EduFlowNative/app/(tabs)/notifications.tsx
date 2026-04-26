import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassCard, HeroHeader, ScreenContainer, SectionTitle, StudentTopBar, webShellStyles } from '@/components/ui/web-shell';
import { useStudentSession } from '@/contexts/student-session';
import { studentApi } from '@/services/api';
import type { Notification } from '@/types/student';

export default function StudentNotificationsScreen() {
  const { user, isBootstrapping } = useStudentSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<number | null>(null);

  const loadNotifications = useCallback(async (refresh = false) => {
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
      const data = await studentApi.getNotifications(user.id);
      setNotifications(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bildirishnomalar yuklanmadi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isBootstrapping) {
      loadNotifications();
    }
  }, [isBootstrapping, loadNotifications]);

  const handleMarkRead = async (id: number) => {
    try {
      setMarkingId(id);
      await studentApi.markNotificationRead(id);
      setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Read status o‘zgarmadi');
    } finally {
      setMarkingId(null);
    }
  };

  if (isBootstrapping || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Bildirishnomalar yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <StudentTopBar name={user?.name} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} />}>
        <HeroHeader title="Bildirishnomalar" subtitle="To‘lovlar va vazifalar bo‘yicha xabarlar" />
        {error ? <Text style={webShellStyles.error}>{error}</Text> : null}

        <SectionTitle title="Xabarlar" right={`${notifications.length} ta`} />
        {notifications.map((item) => (
          <GlassCard key={item.id}>
            <View style={[styles.statusBar, item.read ? styles.noticeRead : styles.noticeUnread]} />
            <Text style={styles.noticeTitle}>{item.title}</Text>
            <Text style={styles.noticeMessage}>{item.message}</Text>
            <View style={styles.noticeFooter}>
              <Text style={styles.noticeMeta} numberOfLines={1}>{item.type}</Text>
              {item.read ? (
                <Text style={styles.done}>Read</Text>
              ) : (
                <Pressable
                  onPress={() => handleMarkRead(item.id)}
                  disabled={markingId === item.id}
                  style={({ pressed }) => [styles.markBtn, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.markBtnText}>{markingId === item.id ? 'Saving...' : 'Mark read'}</Text>
                </Pressable>
              )}
            </View>
          </GlassCard>
        ))}

        {notifications.length === 0 && !error ? <Text style={webShellStyles.empty}>Hozircha bildirishnoma yo‘q.</Text> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 44, gap: 12 },
  centered: { flex: 1, backgroundColor: '#030712', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#94a3b8', marginTop: 10 },
  statusBar: { height: 4, borderRadius: 999, marginBottom: 4 },
  noticeUnread: { backgroundColor: '#0ea5e9' },
  noticeRead: { backgroundColor: '#334155' },
  noticeTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  noticeMessage: { color: '#cbd5e1', lineHeight: 20 },
  noticeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  noticeMeta: { color: '#94a3b8', fontSize: 12, flex: 1, marginRight: 8, textTransform: 'capitalize' },
  done: { color: '#4ade80', fontSize: 12, fontWeight: '700' },
  markBtn: { backgroundColor: '#0c4a6e', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  markBtnText: { color: '#e0f2fe', fontSize: 12, fontWeight: '700' },
});
