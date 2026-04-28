/**
 * Guidance Service
 * Generates step-by-step escape guidance based on incident type and floor.
 */

export interface EscapeGuidance {
  incidentId: string;
  steps: string[];
  nearestExit: string;
  zonesToAvoid: string[];
  safeAssemblyPoint: string;
}

const GUIDANCE_TEMPLATES: Record<string, {
  steps: string[];
  exits: Record<number, string>;
  avoid: string[];
  assembly: string;
}> = {
  FIRE: {
    steps: [
      '🚨 FIRE ALERT — Do NOT use elevators',
      '1. Feel the door before opening — if hot, do NOT open',
      '2. Stay low to avoid smoke inhalation',
      '3. Follow illuminated EXIT signs to the nearest stairwell',
      '4. Proceed to the outdoor Assembly Point',
      '5. Do NOT re-enter the building until cleared by Fire Department',
    ],
    exits: {
      1: 'Main Entrance (Ground Floor North)',
      2: 'Emergency Stairwell B (East Wing)',
      3: 'Emergency Stairwell A (West Wing)',
      4: 'Roof Access Stairwell C (if ground floors blocked)',
    },
    avoid: ['Elevators', 'Lobby if smoke-filled', 'Zone A (Danger)'],
    assembly: 'Hotel Car Park — Assembly Point A (marked in green)',
  },
  MEDICAL: {
    steps: [
      '🏥 MEDICAL EMERGENCY — Remain calm',
      '1. Stay at your current location unless directed to move',
      '2. Call hotel reception: Ext. 0 for immediate assistance',
      '3. If trained, provide basic first aid while help arrives',
      '4. Keep pathways clear for medical responders',
      '5. Follow staff instructions for room clearance if needed',
    ],
    exits: {
      1: 'Main Entrance (Ground Floor)',
      2: 'Side Entrance (East Wing)',
    },
    avoid: ['Blocking corridors', 'Elevator during medical transport'],
    assembly: 'Hotel Lobby — Await staff instructions',
  },
  FLOOD: {
    steps: [
      '🌊 FLOOD ALERT — Move to higher floors immediately',
      '1. Do NOT use basement or ground-floor stairwells',
      '2. Take emergency supplies if available (water, phone charger)',
      '3. Move to Floor 3 or above via Stairwell A or B',
      '4. Do NOT attempt to wade through floodwater',
      '5. Await further instructions from hotel staff',
    ],
    exits: {
      1: 'Stairwell A — West Wing (go UP)',
      2: 'Stairwell B — East Wing (go UP)',
    },
    avoid: ['Basement', 'Ground Floor Lobby', 'Parking Area'],
    assembly: 'Floor 3 — Ballroom (Designated Flood Refuge)',
  },
  EARTHQUAKE: {
    steps: [
      '🏚️ EARTHQUAKE ALERT — Drop, Cover, Hold On',
      '1. DROP to hands and knees immediately',
      '2. Take COVER under a sturdy desk or against an interior wall',
      '3. HOLD ON and protect your head and neck',
      '4. Stay away from windows and exterior walls',
      '5. After shaking stops, evacuate via safest stairwell',
      '6. Expect aftershocks — remain vigilant',
    ],
    exits: {
      1: 'Main Entrance (if structurally safe)',
      2: 'Emergency Exit — East Wing Ground Floor',
    },
    avoid: ['Elevators', 'Exterior walls', 'Windows', 'Pool Area'],
    assembly: 'Hotel Car Park — Assembly Point B (open area away from building)',
  },
  THEFT: {
    steps: [
      '🔒 SECURITY ALERT — Please stay calm',
      '1. Lock your room door immediately',
      '2. Do NOT confront any suspicious individuals',
      '3. Call hotel security: Ext. 1 or dial 100',
      '4. If you see the suspect, note description but do NOT engage',
      '5. Remain in your room unless instructed to evacuate by security',
    ],
    exits: {
      1: 'Main Entrance (if needed)',
    },
    avoid: ['Confronting suspects', 'Empty corridors if unsafe'],
    assembly: 'Hotel Lobby — Await security clearance',
  },
  OTHER: {
    steps: [
      '⚠️ EMERGENCY ALERT — Please remain calm',
      '1. Stay in your room or current location',
      '2. Await instructions from hotel staff',
      '3. If you see any danger, call Ext. 0 immediately',
      '4. Follow any emergency announcements on the PA system',
    ],
    exits: {
      1: 'Main Entrance',
      2: 'Emergency Exit — East Wing',
    },
    avoid: ['Unauthorized areas'],
    assembly: 'Hotel Lobby',
  },
};

export const guidanceService = {
  generateGuidance(incidentId: string, type: string, floor?: number): EscapeGuidance {
    const template = GUIDANCE_TEMPLATES[type] || GUIDANCE_TEMPLATES['OTHER'];
    const currentFloor = floor || 1;
    const nearestExit = template.exits[currentFloor] || template.exits[1];

    return {
      incidentId,
      steps: template.steps,
      nearestExit,
      zonesToAvoid: template.avoid,
      safeAssemblyPoint: template.assembly,
    };
  },
};
