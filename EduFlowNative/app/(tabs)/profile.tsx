import React from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { GlassCard, HeroHeader, ScreenContainer, SectionTitle, StudentTopBar } from '@/components/ui/web-shell';
import { useStudentSession } from '@/contexts/student-session';
import { studentApi } from '@/services/api';

export default function StudentProfileScreen() {
  const { user, logout, isBootstrapping } = useStudentSession();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (isBootstrapping) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loading}>Profil yuklanmoqda...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Kirish qilinmagan</Text>
        <Text style={styles.subtitle}>Iltimos, login sahifasi orqali tizimga kiring.</Text>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <StudentTopBar name={user.name} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <HeroHeader title="Mening Profilim" subtitle="Shaxsiy ma’lumotlar va sozlamalar" />

        <SectionTitle title="Shaxsiy ma’lumotlar" />
        <GlassCard>
          <Text style={styles.label}>Ism</Text>
          <Text style={styles.value}>{user.name}</Text>

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email}</Text>

          <Text style={styles.label}>Telefon</Text>
          <Text style={styles.value}>{user.phone || 'Kiritilmagan'}</Text>

          <Text style={styles.label}>Telegram</Text>
          <Text style={styles.value}>{user.telegram || 'Kiritilmagan'}</Text>
        </GlassCard>

        <SectionTitle title="System" />
        <GlassCard>
          <Text style={styles.label}>Backend API</Text>
          <Text style={styles.apiValue}>{studentApi.apiUrl}</Text>
        </GlassCard>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Chiqish</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 30,
    gap: 12,
  },
  centered: {
    flex: 1,
    backgroundColor: '#030712',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  loading: {
    color: '#94a3b8',
    fontSize: 16,
  },
  label: {
    color: '#7dd3fc',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginTop: 2,
  },
  value: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  apiValue: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
  },
  logoutButton: {
    marginTop: 8,
    backgroundColor: '#8b1f1f',
    borderWidth: 1,
    borderColor: '#991b1b',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 15,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
