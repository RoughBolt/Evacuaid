import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { guestLogin, staffLogin } from '../services/api';

type Props = { navigation: any };

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'guest' | 'staff'>('guest');
  const [guestName, setGuestName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAppStore();

  const handleGuestLogin = async () => {
    if (!guestName.trim() || !roomNumber.trim()) {
      Alert.alert('Missing Info', 'Please enter your name and room number.');
      return;
    }
    setLoading(true);
    try {
      const res = await guestLogin(guestName.trim(), roomNumber.trim());
      await setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Unable to connect. Check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = async () => {
    if (!employeeId.trim() || !password.trim()) {
      Alert.alert('Missing Info', 'Please enter your Employee ID and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await staffLogin(employeeId.trim(), password.trim());
      await setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0E1A', '#0F172A', '#1A0A0A']} style={styles.gradient}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🚨</Text>
            <Text style={styles.appName}>EVACUAID</Text>
            <Text style={styles.tagline}>Crisis Response & Escape Guidance</Text>
            <View style={styles.divider} />
          </View>

          {/* Role Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'guest' && styles.tabActive]}
              onPress={() => setActiveTab('guest')}
              accessibilityLabel="Guest login tab"
            >
              <Text style={styles.tabIcon}>🧳</Text>
              <Text style={[styles.tabLabel, activeTab === 'guest' && styles.tabLabelActive]}>
                Guest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'staff' && styles.tabActiveStaff]}
              onPress={() => setActiveTab('staff')}
              accessibilityLabel="Staff login tab"
            >
              <Text style={styles.tabIcon}>👮</Text>
              <Text style={[styles.tabLabel, activeTab === 'staff' && styles.tabLabelActiveStaff]}>
                Staff
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.card}>
            {activeTab === 'guest' ? (
              <>
                <Text style={styles.formTitle}>Guest Check-In</Text>
                <Text style={styles.formSubtitle}>Enter your details as provided at reception</Text>
                <TextInput
                  id="guest-name-input"
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.textMuted}
                  value={guestName}
                  onChangeText={setGuestName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
                <TextInput
                  id="room-number-input"
                  style={styles.input}
                  placeholder="Room Number (e.g. 204)"
                  placeholderTextColor={Colors.textMuted}
                  value={roomNumber}
                  onChangeText={setRoomNumber}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={handleGuestLogin}
                />
                <TouchableOpacity
                  id="guest-login-btn"
                  style={[styles.btn, styles.btnGuest]}
                  onPress={handleGuestLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Enter Hotel App →</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.formTitle}>Staff Login</Text>
                <Text style={styles.formSubtitle}>Hotel staff and security personnel</Text>
                <TextInput
                  id="employee-id-input"
                  style={styles.input}
                  placeholder="Employee ID"
                  placeholderTextColor={Colors.textMuted}
                  value={employeeId}
                  onChangeText={setEmployeeId}
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                <TextInput
                  id="staff-password-input"
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleStaffLogin}
                />
                <TouchableOpacity
                  id="staff-login-btn"
                  style={[styles.btn, styles.btnStaff]}
                  onPress={handleStaffLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Staff Login →</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            Powered by EvacuAid Crisis Response System v1.0
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xxl },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logo: { fontSize: 56, marginBottom: Spacing.sm },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  tagline: { ...Typography.bodySmall, marginTop: Spacing.xs, textAlign: 'center' },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginTop: Spacing.md,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.xl - 4,
    gap: 6,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabActiveStaff: { backgroundColor: Colors.accent },
  tabIcon: { fontSize: 18 },
  tabLabel: { ...Typography.body, color: Colors.textSecondary, fontWeight: '600' },
  tabLabelActive: { color: '#fff' },
  tabLabelActiveStaff: { color: '#fff' },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  formTitle: { ...Typography.h3, marginBottom: 4 },
  formSubtitle: { ...Typography.bodySmall, marginBottom: Spacing.lg },
  input: {
    backgroundColor: Colors.bgCardAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    color: Colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    marginBottom: Spacing.sm,
  },
  btn: {
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  btnGuest: { backgroundColor: Colors.primary },
  btnStaff: { backgroundColor: Colors.accent },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { ...Typography.caption, textAlign: 'center', marginTop: Spacing.xl },
});
