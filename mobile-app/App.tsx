import React, { useMemo, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { BottomNav } from './src/components/BottomNav';
import { RoleSwitcher } from './src/components/RoleSwitcher';
import { StudentScreen } from './src/screens/StudentScreen';
import { TeacherScreen } from './src/screens/TeacherScreen';
import { AdminScreen } from './src/screens/AdminScreen';
import { colors } from './src/theme/colors';
import type { Role } from './src/types/role';

type TabKey = 'home' | 'tasks' | 'notifications';

export default function App() {
  const [role, setRole] = useState<Role>('student');
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  const tabs = useMemo(() => [
    { key: 'home', label: 'Home' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'notifications', label: 'Alerts' },
  ], []);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.content}>
        <RoleSwitcher role={role} onChange={setRole} />

        {role === 'student' && <StudentScreen tab={activeTab} />}
        {role === 'teacher' && <TeacherScreen tab={activeTab} />}
        {role === 'admin' && <AdminScreen tab={activeTab} />}
      </View>

      <BottomNav
        tabs={tabs}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
});
