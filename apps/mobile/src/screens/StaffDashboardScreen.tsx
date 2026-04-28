import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import { SeverityBadge, StatusBadge, IncidentTypeIcon } from '../components/Badges';
import { OfflineBanner } from '../components/OfflineBanner';
import { getIncidents } from '../services/api';
import { getSocket } from '../services/socket';
import { useAppStore } from '../store/useAppStore';
import { useSocket } from '../services/socket';
import { useConnectivity } from '../hooks/useConnectivity';

type Props = { navigation: any };

const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3,
};

export const StaffDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAppStore();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  useSocket();
  useConnectivity();

  const loadIncidents = useCallback(async () => {
    try {
      const res = await getIncidents();
      const sorted = [...res.data].sort(
        (a, b) =>
          (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
      );
      setIncidents(sorted);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    }
  }, []);

  useEffect(() => {
    loadIncidents();

    const socket = getSocket();
    socket.on('incident:created', (incident: any) => {
      setIncidents((prev) => [incident, ...prev]);
      Alert.alert('🚨 New Incident', `${incident.type} — ${incident.location}`, [
        { text: 'View', onPress: () => navigation.navigate('StaffIncidentDetail', { incident }) },
        { text: 'Dismiss' },
      ]);
    });

    socket.on('incident:updated', (data: any) => {
      setIncidents((prev) =>
        prev.map((inc) => (inc.id === data.id ? { ...inc, ...data } : inc))
      );
    });

    socket.on('alert:broadcast', (data: any) => {
      Alert.alert('📢 Broadcast Alert', data.message, [{ text: 'OK' }]);
    });

    return () => {
      socket.off('incident:created');
      socket.off('incident:updated');
      socket.off('alert:broadcast');
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIncidents();
    setRefreshing(false);
  };

  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED' && i.status !== 'REPORT_GENERATED');
  const resolvedIncidents = incidents.filter((i) => i.status === 'RESOLVED' || i.status === 'REPORT_GENERATED');

  const renderIncident = ({ item }: { item: any }) => (
    <TouchableOpacity
      id={`incident-card-${item.id}`}
      style={[
        styles.incidentCard,
        item.severity === 'CRITICAL' && styles.criticalCard,
      ]}
      onPress={() => navigation.navigate('StaffIncidentDetail', { incident: item })}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <IncidentTypeIcon type={item.type} size={28} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardType}>{item.type}</Text>
          <Text style={styles.cardLocation} numberOfLines={1}>📍 {item.location}</Text>
        </View>
        <SeverityBadge severity={item.severity} />
      </View>
      <View style={styles.cardFooter}>
        <StatusBadge status={item.status} />
        <Text style={styles.cardTime}>
          🕐 {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
        {item.assignedTo && (
          <Text style={styles.cardAssigned}>👮 {item.assignedTo.name}</Text>
        )}
      </View>
      {item.severity === 'CRITICAL' && (
        <View style={styles.criticalBadge}>
          <Text style={styles.criticalText}>⚠️ CRITICAL</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#0A0E1A', '#0A0E1A']} style={styles.gradient}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Staff Dashboard</Text>
            <Text style={styles.staffName}>👮 {user?.name}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              id="zone-map-btn"
              style={styles.iconBtn}
              onPress={() => navigation.navigate('ZoneMap', {})}
            >
              <Text style={styles.iconBtnText}>🗺️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              id="staff-logout-btn"
              style={styles.iconBtn}
              onPress={() => Alert.alert('Logout', 'Are you sure?', [
                { text: 'Cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout },
              ])}
            >
              <Text style={styles.iconBtnText}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>
        <OfflineBanner />

        {/* Stats bar */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: Colors.danger }]}>
            <Text style={styles.statNumber}>{activeIncidents.length}</Text>
            <Text style={styles.statLabel}>ACTIVE</Text>
          </View>
          <View style={[styles.statCard, { borderColor: Colors.warning }]}>
            <Text style={styles.statNumber}>
              {incidents.filter((i) => i.severity === 'CRITICAL').length}
            </Text>
            <Text style={styles.statLabel}>CRITICAL</Text>
          </View>
          <View style={[styles.statCard, { borderColor: Colors.accentGreen }]}>
            <Text style={styles.statNumber}>{resolvedIncidents.length}</Text>
            <Text style={styles.statLabel}>RESOLVED</Text>
          </View>
        </View>
      </View>

      {/* Incident List */}
      <FlatList
        data={[...activeIncidents, ...resolvedIncidents]}
        keyExtractor={(item) => item.id}
        renderItem={renderIncident}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>All Clear</Text>
            <Text style={styles.emptySubtitle}>No active incidents. Pull to refresh.</Text>
          </View>
        }
        ListHeaderComponent={
          activeIncidents.length > 0 ? (
            <Text style={styles.sectionHeader}>
              🔴 Active Incidents ({activeIncidents.length})
            </Text>
          ) : null
        }
        ListFooterComponent={
          resolvedIncidents.length > 0 ? (
            <Text style={[styles.sectionHeader, { color: Colors.accentGreen }]}>
              ✅ Resolved ({resolvedIncidents.length})
            </Text>
          ) : null
        }
      />

      {/* Create Incident FAB */}
      <TouchableOpacity
        id="staff-create-incident-btn"
        style={styles.fab}
        onPress={() => navigation.navigate('StaffCreateIncident')}
      >
        <Text style={styles.fabText}>+ Report Incident</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  greeting: { ...Typography.caption, letterSpacing: 1, textTransform: 'uppercase' },
  staffName: { ...Typography.h2 },
  headerActions: { flexDirection: 'row', gap: Spacing.xs },
  iconBtn: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { fontSize: 18 },

  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  statNumber: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary },
  statLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Colors.textMuted, marginTop: 2 },

  list: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  sectionHeader: {
    ...Typography.label,
    color: Colors.danger,
    marginVertical: Spacing.sm,
    letterSpacing: 0.5,
  },

  incidentCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  criticalCard: {
    borderColor: Colors.danger,
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  cardInfo: { flex: 1 },
  cardType: { ...Typography.h3, fontSize: 16 },
  cardLocation: { ...Typography.bodySmall, marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  cardTime: { ...Typography.caption, marginLeft: 'auto' },
  cardAssigned: { ...Typography.caption, color: Colors.accentBlue },
  criticalBadge: {
    position: 'absolute',
    top: -1,
    right: 12,
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  criticalText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { ...Typography.h2 },
  emptySubtitle: { ...Typography.bodySmall, textAlign: 'center' },

  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 20,
    paddingVertical: 14,
    ...Shadow.glow(Colors.accent),
  },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
