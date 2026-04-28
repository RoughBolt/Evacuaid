# EvacuAid 🚨

🎥 **[Watch the Demo Video](https://drive.google.com/file/d/1DUhAJjuVzXQEWjyn658ilmGaL8HRkGZl/view?usp=drivesdk)**

**EvacuAid** is a real-time emergency management and rapid-response platform designed for large, high-occupancy facilities like hotels and corporate campuses. 

During a crisis (such as a fire, medical emergency, or security threat), traditional communication breaks down. EvacuAid bridges this gap by providing a unified crisis management engine that connects guests directly to staff, automates emergency protocols, and ensures no one is left behind.

---

## 🌟 Key Features

*   **Dual-Persona Interface**: Distinct, streamlined workflows for Guests (One-Tap SOS) and Staff (Crisis Dashboard).
*   **Real-Time Synchronization**: Zero-latency incident tracking and status updates powered by Socket.IO.
*   **Automated Crisis Engine**: Auto-classifies incidents by severity and generates dynamic evacuation guidance.
*   **External Authority Escalation**: Integrates with Twilio to automatically dispatch SMS alerts to emergency services for critical incidents.
*   **Offline Resilience**: Mobile app queues actions when disconnected and syncs automatically upon network restoration.
*   **Zone Mapping**: Visualizes facility zones to identify safe vs. dangerous areas during an emergency.
*   **Automated Emergency Triage Agent (Dialogflow CX)**: Acts as a first-responder conversational AI during mass panic scenarios. It interacts with guests using natural language to rapidly extract vital missing information (e.g., "Are injuries severe?", "Is the stairwell accessible?") and feeds this structured data directly into the Crisis Engine to prevent staff dashboard flooding.

---

## 📸 Screenshots

| Screenshot | Description |
| :---: | :--- |
| <img src="screenshots/01-guest-home-sos.jpeg" width="200" /> | **Guest Home Screen**<br>The main interface for guests, featuring a prominent, high-contrast SOS button for instant emergency triggering. |
| <img src="screenshots/02-emergency-type.jpeg" width="200" /> | **Emergency Triage**<br>Guests can select the specific type of emergency (Fire, Medical, Earthquake) to provide immediate context to the Crisis Engine. |
| <img src="screenshots/03-escape-guidance.jpeg" width="200" /> | **Escape Guidance**<br>Dynamic, step-by-step survival and evacuation instructions tailored specifically to the type of emergency reported. |
| <img src="screenshots/04-hotel-zone-map.jpeg" width="200" /> | **Interactive Zone Map**<br>A live visual map of the facility highlighting danger zones (red) and safe zones (green) to guide safe evacuation routing. |
| <img src="screenshots/05-staff-dashboard.jpeg" width="200" /> | **Staff Dashboard**<br>A real-time overview for security and management, displaying all active, critical, and resolved incidents sorted by severity. |
| <img src="screenshots/06-report-incident.jpeg" width="200" /> | **Manual Incident Reporting**<br>Staff members can manually log incidents they discover directly into the system, bypassing the guest workflow. |
| <img src="screenshots/07-incident-details.jpeg" width="200" /> | **Incident Details & Assignment**<br>The detailed view where staff can assign themselves as responders and execute resolution actions. |
| <img src="screenshots/08-broadcast-sent.jpeg" width="200" /> | **Emergency Broadcasts**<br>Staff can instantly broadcast messages or alerts to all other personnel via the live Socket.IO connection. |
| <img src="screenshots/09-incident-resolved.jpeg" width="200" /> | **Automated Incident Reports**<br>Once an emergency is marked as resolved, the system generates a full timeline report of all actions taken for auditing. |

---

## 🛠 Tech Stack

EvacuAid is built using a modern, full-stack monorepo architecture (via NPM Workspaces).

### Frontend (Mobile App - `apps/mobile`)
*   **Framework**: React Native with Expo (SDK 51)
*   **Language**: TypeScript
*   **State Management**: Zustand
*   **Navigation**: React Navigation
*   **Networking/Real-time**: Axios & Socket.IO Client

### Backend (API - `packages/api`)
*   **Framework**: Node.js & Express
*   **Language**: TypeScript
*   **Real-time Communication**: Socket.IO (Server)
*   **Database Engine**: PostgreSQL
*   **ORM**: Prisma
*   **Caching/PubSub**: Redis

### AI & Google Services
*   **Conversational AI**: Google Dialogflow CX ✅ *(Implemented in Prototype)*
*   **Generative AI**: Google Gemini API (`gemini-2.0-flash`) — Dynamic guidance & incident reports *(Planned)*
*   **Maps**: Google Maps Platform — Interactive zone visualization *(Planned)*
*   **Push Notifications**: Firebase Cloud Messaging (FCM) *(Planned)*

---

## 🤖 Google AI Integrations

EvacuAid is built with Google's AI ecosystem at its core, enabling intelligent, real-time emergency response that goes far beyond traditional rule-based systems. This section details both the **implemented** AI integration in the current prototype and the **planned** enhancements for future releases.

---

### ✅ Implemented — Google Dialogflow CX (Emergency Triage Agent)

During a mass panic event, guests are scared and unable to fill structured forms. The **Dialogflow CX agent** acts as an AI-powered first-responder that communicates with guests in plain, natural language — collecting critical triage information calmly and efficiently.

#### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                     EMERGENCY SCENARIO                          │
│                                                                 │
│  Guest triggers SOS  ──►  Dialogflow CX Agent (NLU)            │
│                                    │                            │
│              Natural Language Conversation:                     │
│         "Are you injured?" / "Which floor?" / "Safe exit?"     │
│                                    │                            │
│                     Structured Data Extracted                   │
│                                    │                            │
│              Webhook ──► POST /api/webhook/dialogflow           │
│                                    │                            │
│              Crisis Engine processes triage payload             │
│                                    │                            │
│         Staff Dashboard receives real-time Socket.IO update     │
└─────────────────────────────────────────────────────────────────┘
```

#### Agent Conversation Flows

| Flow | Example Dialogue | Purpose |
|------|-----------------|---------|
| **Injury Triage** | *"Is anyone injured? Can you describe how severe?"* | Determines if ambulance escalation is needed |
| **Location Pinning** | *"Which floor are you on right now?"* | Feeds precise location into the Crisis Engine |
| **Escape Assessment** | *"Is the stairwell near you accessible or blocked?"* | Updates zone danger status dynamically |
| **Panic De-escalation** | *"Stay calm. Help is on the way. Here's what to do next…"* | Reduces guest panic while staff mobilize |

#### Technical Integration

*   **Platform**: Google Dialogflow CX (regional agent)
*   **Webhook**: `POST /api/webhook/dialogflow` — receives fulfillment requests, updates incident records via Prisma, and emits Socket.IO events to the `hotel_staff` room.
*   **Key Benefit**: Prevents the staff dashboard from being flooded with incomplete, panic-typed messages by collecting structured data upfront.

---

### 🔜 Planned — Gemini API (`gemini-2.0-flash`)

The current `guidanceService.ts` uses **fully static, hardcoded templates** for evacuation instructions. The Gemini API will replace this with **dynamic, context-aware guidance** generated on-the-fly.

#### Feature 1 — Dynamic Evacuation Guidance
> Generates personalized step-by-step survival instructions based on incident type, guest's exact floor, zone status, and severity level — no more one-size-fits-all templates.

```typescript
// packages/api/src/services/guidanceService.ts (Planned)
const prompt = `
  A ${type} emergency (severity: ${severity}) has occurred on Floor ${floor}
  at ${location}. Zones blocked: ${dangerZones.join(', ')}.
  Generate calm, numbered evacuation instructions for a hotel guest.
`;
const result = await gemini.generateContent(prompt);
```

#### Feature 2 — AI Severity Re-Classification
> Analyzes free-text incident descriptions to intelligently override the static severity map.
> Example: *"small kitchen fire, already extinguished"* → downgraded from **CRITICAL** to **MEDIUM**.

#### Feature 3 — Auto-Generated Incident Reports
> On incident resolution, Gemini reads the full `IncidentUpdate` log and composes a formal management report with timeline, response summary, and improvement recommendations.

---

### 🔜 Planned — Google Maps Platform

Upgrades `ZoneMapScreen.tsx` from a static graphic to a **live interactive map** with:
*   🔴 Danger zone polygons rendered in real-time
*   🟢 Safe zone overlays and evacuation route paths
*   📍 Guest location pin for nearest exit calculation

---

### 🔜 Planned — Firebase Cloud Messaging (FCM)

Replaces the current direct Expo Push API calls in `notificationService.ts` with **Firebase Cloud Messaging** for:
*   Guaranteed delivery with receipts
*   Notification analytics dashboard
*   Topic-based broadcasting (e.g., `hotel_staff`, `hotel_guests`)

---


## 🚀 Getting Started

Follow these steps to get the project running locally.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18+)
*   [Docker](https://www.docker.com/) & Docker Compose
*   [Expo Go App](https://expo.dev/client) installed on your physical mobile device.

### 1. Installation
Clone the repository and install dependencies across all workspaces:
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in `packages/api/` based on the provided example:
```bash
cp packages/api/.env.example packages/api/.env
```
*Note: You must ensure `TWILIO_ACCOUNT_SID` starts with `AC` or is left empty to avoid initialization crashes during local development.*

### 3. Start Infrastructure (Database & Redis)
Ensure Docker is running, then spin up the required services:
```bash
docker-compose up -d
```

### 4. Database Setup & Seeding
Push the Prisma schema to the database:
```bash
npm run dev:db-push
```

### 5. Start the Backend API
From the root of the project, start the Express server:
```bash
npm run dev:api
```
The API will be available at `http://localhost:4000`.

### 6. Start the Mobile App
Open a new terminal, ensure you are connected to the same Wi-Fi network as your phone, and start the Expo server:
```bash
cd apps/mobile
npx expo start -c
```
Scan the generated QR code with the Expo Go app on your phone, or manually enter the `exp://<YOUR-LOCAL-IP>:8081` URL.

---

## 🧪 Testing

The project includes an automated end-to-end (E2E) Bash script that simulates the entire incident lifecycle (Login → Incident Creation → Guidance → Assignment → Resolution).

To run the E2E smoke tests against your local environment:
1. Ensure your backend and database are running.
2. Execute the script from the root directory:
```bash
bash test_e2e.sh
```

---

## 📁 Project Structure

```text
EvacuAid/
├── apps/
│   └── mobile/          # React Native (Expo) frontend
├── packages/
│   ├── api/             # Express/Node.js backend
│   └── shared/          # Shared TypeScript interfaces & types
├── docker-compose.yml   # Postgres & Redis infrastructure
├── test_e2e.sh          # E2E Smoke test script
└── README.md            # Project documentation & AI integration overview
```
