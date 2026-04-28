/**
 * Notification Service
 * Handles Expo push notifications and Twilio SMS for authority alerts.
 */
import { config } from '../config';
import { prisma } from '../config/prisma';

// Lazy-load Twilio only if credentials are provided
let twilioClient: any = null;
const getTwilio = () => {
  if (!twilioClient && config.twilio.accountSid && config.twilio.authToken) {
    const twilio = require('twilio');
    twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
  }
  return twilioClient;
};

export const notificationService = {
  async broadcastToStaff(title: string, body: string): Promise<void> {
    try {
      // Collect all staff push tokens
      const staffUsers = await prisma.user.findMany({
        where: { role: { in: ['STAFF', 'ADMIN'] }, pushToken: { not: null } },
        select: { pushToken: true },
      });

      const tokens = staffUsers.map((u) => u.pushToken).filter(Boolean) as string[];
      if (tokens.length === 0) {
        console.log('[NOTIFY] No staff push tokens registered');
        return;
      }

      // Send via Expo Push API
      const messages = tokens.map((token) => ({
        to: token,
        sound: 'default',
        title,
        body,
        data: { type: 'INCIDENT_ALERT' },
        priority: 'high',
      }));

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      console.log(`[NOTIFY] Push sent to ${tokens.length} staff devices`, result);
    } catch (err) {
      console.error('[NOTIFY] Push notification failed:', err);
    }
  },

  async notifyAuthorities(incident: any): Promise<void> {
    const client = getTwilio();
    if (!client) {
      console.warn('[NOTIFY] Twilio not configured — skipping authority SMS. Incident:', incident.id);
      return;
    }

    const message = [
      `🚨 EMERGENCY ALERT — ${config.hotelName}`,
      `Incident ID: ${incident.id}`,
      `Type: ${incident.type}`,
      `Severity: ${incident.severity}`,
      `Location: ${incident.location}`,
      `Floor: ${incident.floor || 'Unknown'}`,
      `Time: ${new Date(incident.createdAt).toLocaleString()}`,
      `Hotel: ${config.hotelName}`,
    ].join('\n');

    const contacts = config.hotelEmergencyContacts;
    const recipients: string[] = [];

    if (incident.type === 'FIRE') {
      recipients.push(contacts.fire, contacts.ambulance);
    } else if (incident.type === 'MEDICAL') {
      recipients.push(contacts.ambulance);
    } else if (incident.type === 'EARTHQUAKE' || incident.type === 'FLOOD') {
      recipients.push(contacts.police, contacts.fire, contacts.ambulance);
    } else {
      recipients.push(contacts.police);
    }
    recipients.push(contacts.hotelSecurity);

    await Promise.allSettled(
      recipients.map((to) =>
        client.messages.create({
          body: message,
          from: config.twilio.fromNumber,
          to,
        })
      )
    );

    console.log(`[NOTIFY] Authority SMS sent for incident ${incident.id} to: ${recipients.join(', ')}`);
  },

  async sendGuestUpdate(guestPushToken: string, message: string): Promise<void> {
    if (!guestPushToken) return;
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: guestPushToken,
          sound: 'default',
          title: '🚨 EvacuAid Update',
          body: message,
          data: { type: 'GUIDANCE_UPDATE' },
          priority: 'high',
        }),
      });
    } catch (err) {
      console.error('[NOTIFY] Guest push failed:', err);
    }
  },
};
