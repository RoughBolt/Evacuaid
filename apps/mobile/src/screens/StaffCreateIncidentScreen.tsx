import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { EMERGENCY_TYPES, HOTEL_FLOORS } from '../constants';
import { createIncident } from '../services/api';
import { useAppStore } from '../store/useAppStore';

type Props = { navigation: any };

export const StaffCreateIncidentScreen: React.FC<Props> = ({ navigation }) => {
  const { setActiveIncidentId } = useAppStore() as any;
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType || !location.trim()) {
      Alert.alert('Missing Fields', 'Please select type and enter location.');
      return;
    }
    setLoading(true);
    try {
      const res = await createIncident({
        type: selectedType,
        location: location.trim(),
        floor: selectedFloor,
        description: description.trim() || undefined,
      });
      Alert.alert('✅ Incident Created', `ID: ${res.data.id}`, [
        { text: 'View', onPress: () => navigation.navigate('StaffIncidentDetail', { incident: res.data }) },
        { text: 'Back to Dashboard', onPress: () => navigation.navigate('StaffDashboard') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0E1A', '#0A0E1A']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📝 Report Incident</Text>
        <Text style={styles.subtitle}>Staff manual incident entry</Text>

        {/* Type grid */}
        <Text style={styles.sectionLabel}>Emergency Type</Text>
        <View style={styles.grid}>
          {EMERGENCY_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              id={`staff-type-${type.id.toLowerCase()}`}
              style={[
                styles.typeCard,
                selectedType === type.id && { borderColor: type.color, backgroundColor: `${type.color}18` },
              ]}
              onPress={() => setSelectedType(type.id)}
            >
              <Text style={styles.typeIcon}>{type.icon}</Text>
              <Text style={[styles.typeLabel, selectedType === type.id && { color: type.color }]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>📍 Location</Text>
        <TextInput
          id="staff-location-input"
          style={styles.input}
          placeholder="e.g. Room 304, Lobby, Restaurant..."
          placeholderTextColor={Colors.textMuted}
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.sectionLabel}>🏢 Floor</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorRow}>
          {HOTEL_FLOORS.map((floor) => (
            <TouchableOpacity
              key={floor.id}
              style={[styles.floorChip, selectedFloor === floor.id && styles.floorChipActive]}
              onPress={() => setSelectedFloor(floor.id)}
            >
              <Text style={[styles.floorText, selectedFloor === floor.id && styles.floorTextActive]}>
                {floor.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>📝 Description</Text>
        <TextInput
          id="staff-description-input"
          style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
          placeholder="Describe the situation..."
          placeholderTextColor={Colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity
          id="staff-submit-incident-btn"
          style={[styles.submitBtn, !selectedType && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={loading || !selectedType}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>🚨 Create Incident</Text>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { padding: Spacing.lg, paddingTop: 60 },
  backBtn: { marginBottom: Spacing.md },
  backText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  title: { ...Typography.h1, marginBottom: 4 },
  subtitle: { ...Typography.bodySmall, marginBottom: Spacing.lg },
  sectionLabel: { ...Typography.label, marginBottom: Spacing.xs, marginTop: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeCard: {
    width: '31%',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  typeIcon: { fontSize: 24 },
  typeLabel: { ...Typography.caption, fontWeight: '700', textAlign: 'center' },
  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    color: Colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  floorRow: { marginBottom: 4 },
  floorChip: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: Spacing.sm,
  },
  floorChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  floorText: { ...Typography.bodySmall, color: Colors.textSecondary },
  floorTextActive: { color: '#fff', fontWeight: '700' },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  submitText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});
