import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassCard, HeroHeader, ScreenContainer, SectionTitle, StudentTopBar, webShellStyles } from '@/components/ui/web-shell';
import { useStudentSession } from '@/contexts/student-session';
import { studentApi } from '@/services/api';
import type { Course } from '@/types/student';

export default function StudentCoursesScreen() {
  const { user, isBootstrapping } = useStudentSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async (refresh = false) => {
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
      const data = await studentApi.getStudentCourses(user.id);
      setCourses(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kurslar yuklanmadi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isBootstrapping) {
      loadCourses();
    }
  }, [isBootstrapping, loadCourses]);

  const sortedCourses = useMemo(() => {
    return [...courses].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [courses]);

  if (isBootstrapping || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Kurslar yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <StudentTopBar name={user?.name} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCourses(true)} />}>
        <HeroHeader title="Mening Kurslarim" subtitle="Biriktirilgan kurslar va progress" />
        {error ? <Text style={webShellStyles.error}>{error}</Text> : null}

        <SectionTitle title="Biriktirilgan kurslar" right={`${sortedCourses.length} ta`} />
        {sortedCourses.map((course) => {
          const total = course.total_lessons || 0;
          const completed = course.completed_lessons || 0;
          const progress = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

          return (
            <GlassCard key={course.id}>
              <View style={styles.rowTop}>
                <Text style={styles.courseName} numberOfLines={2}>{course.name}</Text>
                <Text style={styles.level}>{course.level || 'Beginner'}</Text>
              </View>

              <Text style={styles.meta}>{course.instructor || 'Instructor'} • {course.duration || 'N/A'}</Text>
              {course.description ? <Text style={styles.description}>{course.description}</Text> : null}

              <View style={styles.progressWrap}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{completed}/{total || 0} lessons • {progress}%</Text>
            </GlassCard>
          );
        })}

        {sortedCourses.length === 0 && !error ? <Text style={webShellStyles.empty}>Sizga biriktirilgan kurslar topilmadi.</Text> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 44, gap: 12 },
  centered: { flex: 1, backgroundColor: '#030712', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#94a3b8', marginTop: 10 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  courseName: { color: '#f8fafc', fontSize: 17, fontWeight: '700', flex: 1, lineHeight: 23 },
  level: {
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: '#0c4a6e66',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  meta: { color: '#94a3b8', fontSize: 12 },
  description: { color: '#cbd5e1', fontSize: 13, lineHeight: 20 },
  progressWrap: { height: 8, backgroundColor: '#020617', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#0ea5e9' },
  progressText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
});
