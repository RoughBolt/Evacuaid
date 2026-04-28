import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import { EMERGENCY_TYPES, HOTEL_FLOORS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { createIncident } from '../services/api';
import { useConnectivity } from '../hooks/useConnectivity';
import { OfflineBanner } from '../components/OfflineBanner';

type Props = { navigation: any };

export const EmergencyTypeScreen: React.FC<Props> = ({ navigation }) => {
  const { user, roomNumber, addToOfflineQueue, setActiveIncidentId } = useAppStore() as any;
  const { isOffline } = useConnectivity();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [location, setLocation] = useState(
    user?.roomNumber ? `Room ${user.roomNumber}` : ''
  );
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Select Emergency Type', 'Please select the type of emergency.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Enter Location', 'Please enter your current location.');
      return;
    }

    setLoading(true);
    try {
      if (isOffline) {
        // BLE Simulation: queue locally
        const queuedId = `offline_${Date.now()}`;
        await addToOfflineQueue({
          id: queuedId,
          type: selectedType,
          location: location.trim(),
          floor: selectedFloor,
          description,
          queuedAt: new Date().toISOString(),
        });
        Alert.alert(
          '🔵 BLE Queued',
          'No internet detected. Your SOS has been queued and will be relayed via Bluetooth Mesh when a staff device is nearby.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      const res = await createIncident({
        type: selectedType,
        location: location.trim(),
        floor: selectedFloor,
        description: description.trim() || undefined,
      });

      setActiveIncidentId(res.data.id);
      navigation.navigate('SOSConfirm', { incident: res.data });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send SOS. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0E1A', '#1A0A0A']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Emergency Type</Text>
          <Text style={styles.subtitle}>Select what's happening</Text>
        </View>

        <OfflineBanner />

        {/* Emergency Type Grid */}
        <View style={styles.grid}>
          {EMERGENCY_TYPES.map((type) => (
            <TouchableOpacity
              id={`emergency-type-${type.id.toLowerCase()}`}
              key={type.id}
              style={[
                styles.typeCard,
                selectedType === type.id && {
                  borderColor: type.color,
                  backgroundColor: `${type.color}18`,
                },
              ]}
              onPress={() => setSelectedType(type.id)}
            >
              <Text style={styles.typeIcon}>{type.icon}</Text>
              <Text style={[styles.typeLabel, selectedType === type.id && { color: type.color }]}>
                {type.label}
              </Text>
              <Text style={styles.typeDesc}>{type.description}</Text>
              {selectedType === type.id && (
                <View style={[styles.selectedDot, { backgroundColor: type.color }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>📍 Your Location</Text>
          <TextInput
            id="location-input"
            style={styles.input}
            placeholder="Room number, floor, or area (e.g. Room 204)"
            placeholderTextColor={Colors.textMuted}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Floor Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>🏢 Which Floor?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorRow}>
            {HOTEL_FLOORS.map((floor) => (
              <TouchableOpacity
                id={`floor-btn-${floor.id}`}
                key={floor.id}
                style={[
                  styles.floorChip,
                  selectedFloor === floor.id && styles.floorChipActive,
                ]}
                onPress={() => setSelectedFloor(floor.id)}
              >
                <Text
                  style={[
                    styles.floorText,
                    selectedFloor === floor.id && styles.floorTextActive,
                  ]}
                >
                  {floor.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Optional description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>📝 Additional Details (optional)</Text>
          <TextInput
            id="description-input"
            style={[styles.input, styles.textArea]}
            placeholder="Describe what you see..."
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          id="send-sos-btn"
          style={[styles.submitBtn, !selectedType && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading || !selectedType}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitIcon}>{isOffline ? '🔵' : '🚨'}</Text>
              <Text style={styles.submitText}>
                {isOffline ? 'Queue via BLE Mesh' : 'SEND SOS ALERT'}
              </Text>
            </>
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
  header: { marginBottom: Spacing.lg },
  backBtn: { marginBottom: Spacing.md },
  backText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  title: { ...Typography.h1 },
  subtitle: { ...Typography.bodySmall, marginTop: 4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  typeCard: {
    width: '47%',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    position: 'relative',
    ...Shadow.card,
  },
  typeIcon: { fontSize: 32 },
  typeLabel: { ...Typography.h3, fontSize: 15, textAlign: 'center' },
  typeDesc: { ...Typography.caption, textAlign: 'center', lineHeight: 16 },
  selectedDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  section: { marginBottom: Spacing.md },
  sectionLabel: { ...Typography.label, marginBottom: Spacing.xs },
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
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 12 },

  floorRow: { marginTop: 4 },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    ...Shadow.glow(Colors.primary),
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitIcon: { fontSize: 20 },
  submitText: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 1 },
});
