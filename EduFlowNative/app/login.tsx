import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStudentSession } from '@/contexts/student-session';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading, error, user, isBootstrapping } = useStudentSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  React.useEffect(() => {
    if (!isBootstrapping && user) {
      router.replace('/(tabs)');
    }
  }, [isBootstrapping, router, user]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Xato', 'Email va parolni kiriting');
      return;
    }
    const success = await login(email.trim(), password.trim());
    if (success) {
      router.replace('/(tabs)');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo / Title */}
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>🎓</Text>
        <Text style={styles.appName}>EduFlow</Text>
        <Text style={styles.subtitle}>Student Portal</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="email@example.com"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Parol</Text>
        <TextInput
          style={styles.input}
          placeholder="Parolingizni kiriting"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>❌ {error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.button, (loading || !email.trim() || !password.trim()) && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading || !email.trim() || !password.trim()}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Kirish</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Test hint */}
      <View style={styles.hintBox}>
        <Text style={styles.hintTitle}>🧪 Test akkauntlar:</Text>
        <Text style={styles.hintText}>📧 student@test.com  🔑 student123</Text>
        <Text style={styles.hintText}>📧 student1@test.com  🔑 student123</Text>
        <Text style={styles.hintText}>📧 ahmadjon@test.com  🔑 password123</Text>
        <Text style={styles.hintSub}>↑ Yuqoridagilardan birini kiriting</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    padding: 24,
    gap: 20,
  },
  logoBox: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 56,
    marginBottom: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  form: {
    gap: 4,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#1e293b',
    color: '#f8fafc',
  },
  errorBox: {
    backgroundColor: '#3f1d2e',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#1e3a6e',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  hintBox: {
    marginTop: 8,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  hintTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  hintText: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  hintSub: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
