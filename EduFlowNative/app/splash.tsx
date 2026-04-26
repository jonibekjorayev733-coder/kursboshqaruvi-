import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useStudentSession } from '@/contexts/student-session';

export default function SplashScreen() {
  const router = useRouter();
  const { user, isBootstrapping } = useStudentSession();

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }

    const timer = setTimeout(() => {
      router.replace(user ? '/(tabs)' : '/login');
    }, 1500);
    return () => clearTimeout(timer);
  }, [isBootstrapping, router, user]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/splash-icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 180,
    height: 180,
  },
});
