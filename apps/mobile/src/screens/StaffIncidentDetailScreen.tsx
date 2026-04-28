import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import { SeverityBadge, StatusBadge, IncidentTypeIcon } from '../components/Badges';
import {
  getIncident,
  updateIncident,
  assignResponder,
  broadcastAlert,
  notifyAuthorities,
  getIncidentReport,
} from '../services/api';
import { getSocket } from '../services/socket';
import { useAppStore } from '../store/useAppStore';

type Props = { navigation: any; route: { params: { incident: any } } };

export const StaffIncidentDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAppStore();
  const [incident, setIncident] = useState(route.params.incident);
  const [updates, setUpdates] = useState<any[]>(route.params.incident.updates || []);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    // Refresh full incident
    getIncident(incident.id)
      .then((res) => {
        setIncident(res.data);
        setUpdates(res.data.updates || []);
      })
      .catch(console.error);

    const socket = getSocket();
    socket.on('incident:updated', (data: any) => {
      if (data.id === incident.id) {
        setIncident((prev: any) => ({ ...prev, ...data }));
      }
    });
    return () => { socket.off('incident:updated'); };
  }, []);

  const handleAssignSelf = async () => {
    setLoading('assign');
    try {
      await assignResponder(incident.id);
      await refreshIncident();
      Alert.alert('✅ Assigned', "You've been assigned as responder.");
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to assign');
    } finally {
      setLoading(null);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) {
      Alert.alert('Enter Message', 'Please type a broadcast message.');
      return;
    }
    setLoading('broadcast');
    try {
      await broadcastAlert(incident.id, broadcastMsg.trim());
      setBroadcastMsg('');
      Alert.alert('📢 Broadcast Sent', 'All staff notified.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to broadcast');
    } finally {
      setLoading(null);
    }
  };

  const handleResolve = () => {
    Alert.alert(
      '✅ Mark as Resolved',
      'Are you sure this incident has been handled?',
      [
        { text: 'Cancel' },
        {
          text: 'Resolve',
          onPress: async () => {
            setLoading('resolve');
            try {
              await updateIncident(incident.id, { status: 'RESOLVED' });
              setIncident((prev: any) => ({ ...prev, status: 'RESOLVED' }));
              Alert.alert('✅ Resolved', 'Incident marked as resolved. Report generated.');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error);
            } finally {
              setLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleNotifyAuthorities = async () => {
    Alert.alert(
      '📞 Notify Authorities',
      'This will send SMS to Police, Fire, and Ambulance. Confirm?',
      [
        { text: 'Cancel' },
        {
          text: 'Notify',
          style: 'destructive',
          onPress: async () => {
            setLoading('notify');
            try {
              await notifyAuthorities(incident.id);
              setIncident((prev: any) => ({ ...prev, authorityNotified: true }));
              Alert.alert('📞 Notified', 'Authorities have been alerted via SMS.');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to notify');
            } finally {
              setLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleViewReport = async () => {
    setLoading('report');
    try {
      const res = await getIncidentReport(incident.id);
      setReport(res.data.report);
      setShowReport(true);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Report not available yet');
    } finally {
      setLoading(null);
    }
  };

  const refreshIncident = async () => {
    const res = await getIncident(incident.id);
    setIncident(res.data);
    setUpdates(res.data.updates || []);
  };

  const isResolved = incident.status === 'RESOLVED' || incident.status === 'REPORT_GENERATED';

  return (
    <LinearGradient colors={['#0A0E1A', '#0A0E1A']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Dashboard</Text>
        </TouchableOpacity>

        {/* Incident header */}
        <View style={styles.incidentHeader}>
          <View style={styles.incidentHeaderRow}>
            <IncidentTypeIcon type={incident.type} size={36} />
            <View style={styles.incidentInfo}>
              <Text style={styles.incidentType}>{incident.type} EMERGENCY</Text>
              <Text style={styles.incidentId} numberOfLines={1}># {incident.id}</Text>
            </View>
          </View>
          <View style={styles.badgeRow}>
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
            {incident.authorityNotified && (
              <View style={styles.authorityBadge}>
                <Text style={styles.authorityBadgeText}>📞 Authorities Notified</Text>
              </View>
            )}
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <DetailRow label="📍 Location" value={incident.location} />
          {incident.floor != null && <DetailRow label="🏢 Floor" value={`Floor ${incident.floor}`} />}
          <DetailRow label="👤 Reported By" value={incident.createdBy?.name} />
          <DetailRow
            label="🕐 Time"
            value={new Date(incident.createdAt).toLocaleString()}
          />
          {incident.assignedTo && (
            <DetailRow label="👮 Assigned To" value={incident.assignedTo.name} />
          )}
          {incident.description && (
            <DetailRow label="📝 Description" value={incident.description} />
          )}
        </View>

        {/* Staff Actions */}
        {!isResolved && (
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Staff Actions</Text>

            {/* Assign Self */}
            <TouchableOpacity
              id="assign-responder-btn"
              style={[styles.actionBtn, styles.actionBtnBlue]}
              onPress={handleAssignSelf}
              disabled={!!loading}
            >
              {loading === 'assign' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionBtnText}>👮 Assign Myself as Responder</Text>
              )}
            </TouchableOpacity>

            {/* Broadcast */}
            <View style={styles.broadcastRow}>
              <TextInput
                id="broadcast-input"
                style={styles.broadcastInput}
                placeholder="Broadcast message to all staff..."
                placeholderTextColor={Colors.textMuted}
                value={broadcastMsg}
                onChangeText={setBroadcastMsg}
              />
              <TouchableOpacity
                id="broadcast-btn"
                style={styles.broadcastBtn}
                onPress={handleBroadcast}
                disabled={!!loading}
              >
                {loading === 'broadcast' ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.broadcastBtnText}>📢</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Notify Authorities */}
            {!incident.authorityNotified && (
              <TouchableOpacity
                id="notify-authorities-btn"
                style={[styles.actionBtn, styles.actionBtnOrange]}
                onPress={handleNotifyAuthorities}
                disabled={!!loading}
              >
                {loading === 'notify' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionBtnText}>📞 Notify Authorities (Police/Fire/Ambulance)</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Resolve */}
            <TouchableOpacity
              id="mark-resolved-btn"
              style={[styles.actionBtn, styles.actionBtnGreen]}
              onPress={handleResolve}
              disabled={!!loading}
            >
              {loading === 'resolve' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionBtnText}>✅ Mark Incident as Resolved</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* View Report */}
        {isResolved && (
          <TouchableOpacity
            id="view-report-btn"
            style={[styles.actionBtn, styles.actionBtnPurple, { marginHorizontal: 0 }]}
            onPress={handleViewReport}
            disabled={!!loading}
          >
            {loading === 'report' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionBtnText}>📋 View Incident Report</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Report Preview */}
        {showReport && report && (
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>📋 Incident Report</Text>
            <Text style={styles.reportGenerated}>
              Generated: {new Date(report.generatedAt).toLocaleString()}
            </Text>
            <DetailRow label="Duration" value={`${report.summary.durationMinutes ?? '—'} minutes`} />
            <DetailRow label="Responders" value={report.responders.map((r: any) => r.name).join(', ') || 'None'} />
            <DetailRow label="Authority Notified" value={report.summary.authorityNotified ? 'Yes' : 'No'} />
            <Text style={styles.timelineTitle}>Timeline</Text>
            {report.timeline.map((entry: any, i: number) => (
              <View key={i} style={styles.timelineItem}>
                <Text style={styles.timelineTime}>{new Date(entry.timestamp).toLocaleTimeString()}</Text>
                <Text style={styles.timelineMsg}>{entry.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Live Updates */}
        <View style={styles.updatesCard}>
          <Text style={styles.updatesTitle}>📡 Incident Timeline</Text>
          {updates.map((u: any) => (
            <View key={u.id} style={styles.updateItem}>
              <Text style={styles.updateTime}>{new Date(u.createdAt).toLocaleTimeString()}</Text>
              <Text style={styles.updateMessage}>{u.message}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
};

const DetailRow = ({ label, value }: { label: string; value?: string }) => (
  <View style={detailStyles.row}>
    <Text style={detailStyles.label}>{label}</Text>
    <Text style={detailStyles.value}>{value || '—'}</Text>
  </View>
);

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 8 },
  label: { ...Typography.label, flex: 1 },
  value: { ...Typography.body, fontSize: 14, flex: 2, textAlign: 'right' },
});

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { padding: Spacing.lg, paddingTop: 60 },
  backBtn: { marginBottom: Spacing.md },
  backText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },

  incidentHeader: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  incidentHeaderRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', marginBottom: Spacing.sm },
  incidentInfo: { flex: 1 },
  incidentType: { ...Typography.h2, fontSize: 18, color: Colors.primary },
  incidentId: { ...Typography.caption, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  authorityBadge: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.accentBlue,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  authorityBadgeText: { ...Typography.caption, color: Colors.accentBlue, fontWeight: '700' },

  detailsCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },

  actionsCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  actionsTitle: { ...Typography.h3, marginBottom: Spacing.xs },

  actionBtn: {
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnBlue: { backgroundColor: Colors.accentBlue },
  actionBtnOrange: { backgroundColor: Colors.accent },
  actionBtnGreen: { backgroundColor: Colors.accentGreen },
  actionBtnPurple: { backgroundColor: Colors.accentPurple },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  broadcastRow: { flexDirection: 'row', gap: Spacing.sm },
  broadcastInput: {
    flex: 1,
    backgroundColor: Colors.bgCardAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    fontSize: 14,
  },
  broadcastBtn: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  broadcastBtnText: { fontSize: 20 },

  reportCard: {
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.accentPurple,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  reportTitle: { ...Typography.h3, color: Colors.accentPurple, marginBottom: 4 },
  reportGenerated: { ...Typography.caption, marginBottom: Spacing.md },
  timelineTitle: { ...Typography.label, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  timelineItem: { borderLeftWidth: 2, borderLeftColor: Colors.accentPurple, paddingLeft: 8, marginBottom: 6 },
  timelineTime: { ...Typography.caption },
  timelineMsg: { ...Typography.bodySmall },

  updatesCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  updatesTitle: { ...Typography.h3, marginBottom: Spacing.md },
  updateItem: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.accentGreen,
    paddingLeft: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  updateTime: { ...Typography.caption },
  updateMessage: { ...Typography.body, fontSize: 14 },
});
