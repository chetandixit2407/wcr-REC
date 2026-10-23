import fs from 'fs';
import path from 'path';
import type {
  User,
  Candidate,
  Interview,
  Room,
  Notification,
  PantryTask,
  TimelineEvent,
  AuditLog,
  CheckInSession,
  Visitor,
  OfficeSettings,
  RoleFieldVisibility,
  CandidateChangeRequest,
  PasswordResetRequest,
  DomainEvent,
  ChatMessage,
  ChatChannel,
  ActionTask,
} from '../types/index.ts';
import { hashPassword, ROLE_PERMISSIONS } from './auth.ts';
import { normalizeInterviewRound } from '../utils/candidateHelpers.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'wcr_database.json');

export interface DatabaseSchema {
  users: User[];
  candidates: Candidate[];
  interviews: Interview[];
  rooms: Room[];
  notifications: Notification[];
  pantryTasks: PantryTask[];
  actionTasks?: ActionTask[];
  timelineEvents: TimelineEvent[];
  auditLogs: AuditLog[];
  checkInSessions: CheckInSession[];
  visitors: Visitor[];
  settings: OfficeSettings;
  changeRequests?: CandidateChangeRequest[];
  passwordResetRequests?: PasswordResetRequest[];
  domainEvents?: DomainEvent[];
  chatMessages?: ChatMessage[];
  chatChannels?: ChatChannel[];
}

const defaultFieldVisibility: Record<string, RoleFieldVisibility> = {
  HR: {
    candidateName: true,
    phone: true,
    email: true,
    address: true,
    resume: true,
    governmentId: true,
    validationResults: true,
    livePhoto: true,
    hrNotes: true,
    interviewStatus: true,
    room: true,
    pantryTask: true,
    salary: true,
  },
  SENIOR_HR: {
    candidateName: true,
    phone: true,
    email: true,
    address: true,
    resume: true,
    governmentId: true,
    validationResults: true,
    livePhoto: true,
    hrNotes: true,
    interviewStatus: true,
    room: true,
    pantryTask: false,
    salary: false,
  },
  ADMIN: {
    candidateName: true,
    phone: true,
    email: true,
    address: true,
    resume: true,
    governmentId: true,
    validationResults: true,
    livePhoto: true,
    hrNotes: true,
    interviewStatus: true,
    room: true,
    pantryTask: true,
    salary: true,
  },
  CEO: {
    candidateName: true,
    phone: true,
    email: true,
    address: true,
    resume: true,
    governmentId: true,
    validationResults: true,
    livePhoto: true,
    hrNotes: true,
    interviewStatus: true,
    room: true,
    pantryTask: true,
    salary: true,
  },
  CO_FOUNDER: {
    candidateName: true,
    phone: true,
    email: true,
    address: true,
    resume: true,
    governmentId: true,
    validationResults: true,
    livePhoto: true,
    hrNotes: true,
    interviewStatus: true,
    room: true,
    pantryTask: true,
    salary: true,
  },
  INTERVIEWER: {
    candidateName: true,
    phone: true,
    email: true,
    address: false,
    resume: true,
    governmentId: false,
    validationResults: true,
    livePhoto: true,
    hrNotes: true,
    interviewStatus: true,
    room: true,
    pantryTask: false,
    salary: false,
  },
  RECEPTION: {
    candidateName: true,
    phone: true,
    email: true,
    address: true,
    resume: true,
    governmentId: true,
    validationResults: true,
    livePhoto: true,
    hrNotes: false,
    interviewStatus: true,
    room: true,
    pantryTask: true,
    salary: false,
  },
  PANTRY: {
    candidateName: true,
    phone: false,
    email: false,
    address: false,
    resume: false,
    governmentId: false,
    validationResults: false,
    livePhoto: false,
    hrNotes: false,
    interviewStatus: false,
    room: true,
    pantryTask: true,
    salary: false,
  },
};

const defaultUsers: User[] = [
  {
    id: 'usr-ceo-lalit',
    userId: 'usr-ceo-lalit',
    name: 'Lalit Sir',
    email: 'lalit@whitecollarrealty.com',
    username: 'lalit.sir',
    passwordHash: hashPassword('wcr123'),
    role: 'CEO',
    designation: 'CEO',
    department: 'Executive Leadership',
    permissions: ROLE_PERMISSIONS.CEO,
    isActive: true,
    phone: '+91 98100 00001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-cofounder-kimmi',
    userId: 'usr-cofounder-kimmi',
    name: 'Kimmi Mam',
    email: 'kimmi@whitecollarrealty.com',
    username: 'kimmi.mam',
    passwordHash: hashPassword('wcr123'),
    role: 'SENIOR_HR',
    designation: 'Senior HR Interviewer',
    department: 'HR & Senior Leadership',
    permissions: ROLE_PERMISSIONS.SENIOR_HR,
    isActive: true,
    phone: '+91 98100 00002',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-hr-nisha',
    userId: 'usr-hr-nisha',
    name: 'Nisha',
    email: 'nisha@whitecollarrealty.com',
    username: 'nisha.hr',
    passwordHash: hashPassword('wcr123'),
    role: 'HR',
    designation: 'Senior HR Manager',
    department: 'HR',
    permissions: ROLE_PERMISSIONS.HR,
    isActive: true,
    phone: '+91 98100 00003',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-hr-shriyanshi',
    userId: 'usr-hr-shriyanshi',
    name: 'Shriyanshi',
    email: 'shriyanshi@whitecollarrealty.com',
    username: 'shriyanshi.hr',
    passwordHash: hashPassword('wcr123'),
    role: 'HR',
    designation: 'HR Executive',
    department: 'HR',
    permissions: ROLE_PERMISSIONS.HR,
    isActive: true,
    phone: '+91 98100 00004',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-admin-sameer',
    userId: 'usr-admin-sameer',
    name: 'Sameer Sir',
    email: 'sameer@whitecollarrealty.com',
    username: 'sameer.admin',
    passwordHash: hashPassword('wcr123'),
    role: 'ADMIN',
    designation: 'Admin',
    department: 'Administration & Operations',
    permissions: ROLE_PERMISSIONS.ADMIN,
    isActive: true,
    phone: '+91 98100 00005',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-rec-ananya',
    userId: 'usr-rec-ananya',
    name: 'Ananya Sen',
    email: 'reception@whitecollarrealty.com',
    username: 'reception',
    passwordHash: hashPassword('wcr123'),
    role: 'RECEPTION',
    designation: 'Front Desk Coordinator',
    department: 'Front Desk & Reception',
    permissions: ROLE_PERMISSIONS.RECEPTION,
    isActive: true,
    phone: '+91 98100 00006',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-pan-ramesh',
    userId: 'usr-pan-ramesh',
    name: 'Ramesh Kumar',
    email: 'pantry@whitecollarrealty.com',
    username: 'pantry',
    passwordHash: hashPassword('wcr123'),
    role: 'PANTRY',
    designation: 'Hospitality & Pantry Executive',
    department: 'Pantry & Hospitality',
    permissions: ROLE_PERMISSIONS.PANTRY,
    isActive: true,
    phone: '+91 98100 00007',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-sales-vikram',
    userId: 'usr-sales-vikram',
    name: 'Vikram Malhotra',
    email: 'vikram@whitecollarrealty.com',
    username: 'vikram.sales',
    passwordHash: hashPassword('wcr123'),
    role: 'MANAGER',
    designation: 'Sales Director',
    department: 'Sales & Real Estate',
    permissions: ROLE_PERMISSIONS.MANAGER,
    isActive: true,
    phone: '+91 98100 00008',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-intv-rahul',
    userId: 'usr-intv-rahul',
    name: 'Rahul Sharma',
    email: 'interviewer@whitecollarrealty.com',
    username: 'interviewer',
    passwordHash: hashPassword('wcr123'),
    role: 'INTERVIEWER',
    designation: 'Technical & Sales Interviewer',
    department: 'Talent Acquisition & Technical Evaluation',
    permissions: ROLE_PERMISSIONS.INTERVIEWER,
    isActive: true,
    phone: '+91 98100 00009',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultRooms: Room[] = [
  {
    id: 'room-conf-a',
    roomId: 'room-conf-a',
    name: 'Conference Room A',
    roomName: 'Conference Room A',
    type: 'MEETING_ROOM',
    roomType: 'MEETING_ROOM',
    status: 'AVAILABLE',
    isActive: true,
    preferredFor: 'Executive & Technical Interview Panels',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room-lalit-cabin',
    roomId: 'room-lalit-cabin',
    name: 'Lalit Sir Cabin',
    roomName: 'Lalit Sir Cabin',
    type: 'CABIN',
    roomType: 'CABIN',
    status: 'AVAILABLE',
    isActive: true,
    isReservedNextRound: true,
    preferredFor: 'CEO & High-Level Strategic Decisions',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room-kimmi-cabin',
    roomId: 'room-kimmi-cabin',
    name: 'Elegance Suite',
    roomName: 'Elegance Suite',
    type: 'CABIN',
    roomType: 'CABIN',
    status: 'AVAILABLE',
    isActive: true,
    isReservedNextRound: true,
    preferredFor: 'Co-Founder & Strategic Advisory',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room-prestige-loft',
    roomId: 'room-prestige-loft',
    name: 'The Prestige Loft (Waiting Area)',
    roomName: 'The Prestige Loft (Waiting Area)',
    type: 'WAITING_AREA',
    roomType: 'WAITING_AREA',
    status: 'AVAILABLE',
    isActive: true,
    preferredFor: 'Candidate & VIP Guest Reception Lounge',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room-skyline',
    roomId: 'room-skyline',
    name: 'The Skyline',
    roomName: 'The Skyline',
    type: 'MEETING_ROOM',
    roomType: 'MEETING_ROOM',
    status: 'AVAILABLE',
    isActive: true,
    preferredFor: 'Senior Leadership & Sales Panel Evaluations',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room-community',
    roomId: 'room-community',
    name: 'The Community',
    roomName: 'The Community',
    type: 'MEETING_ROOM',
    roomType: 'MEETING_ROOM',
    status: 'AVAILABLE',
    isActive: true,
    preferredFor: 'Group Interviews & Departmental Rounds',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room-summit',
    roomId: 'room-summit',
    name: 'The Summit',
    roomName: 'The Summit',
    type: 'MEETING_ROOM',
    roomType: 'MEETING_ROOM',
    status: 'AVAILABLE',
    isActive: true,
    preferredFor: 'Executive Board & Final Hiring Rounds',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room-wcr-air',
    roomId: 'room-wcr-air',
    name: 'WCR AIR',
    roomName: 'WCR AIR',
    type: 'MEETING_ROOM',
    roomType: 'MEETING_ROOM',
    status: 'AVAILABLE',
    isActive: true,
    preferredFor: 'Fast-Track Screenings & Technical Assessments',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room-prime-loft',
    roomId: 'room-prime-loft',
    name: 'Prime Loft',
    roomName: 'Prime Loft',
    type: 'MEETING_ROOM',
    roomType: 'MEETING_ROOM',
    status: 'AVAILABLE',
    isActive: true,
    preferredFor: 'HR Fitment & Initial Intake Interviews',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room-regency',
    roomId: 'room-regency',
    name: 'Regency',
    roomName: 'Regency',
    type: 'MEETING_ROOM',
    roomType: 'MEETING_ROOM',
    status: 'AVAILABLE',
    isActive: true,
    preferredFor: 'Confidential Client & Candidate Discussions',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const defaultChatChannels: ChatChannel[] = [
  {
    id: 'general',
    name: 'general',
    description: 'All-staff announcements & general office coordination',
  },
  {
    id: 'hr-desk',
    name: 'hr-desk',
    description: 'HR recruitment pipeline, interview handoffs & updates',
    allowedRoles: ['HR', 'SENIOR_HR', 'ADMIN', 'CEO', 'INTERVIEWER'],
  },
  {
    id: 'reception',
    name: 'reception',
    description: 'Front desk arrivals, visitor welcomes & escort requests',
    allowedRoles: ['RECEPTION', 'HR', 'SENIOR_HR', 'ADMIN', 'CEO', 'PANTRY'],
  },
  {
    id: 'pantry',
    name: 'pantry',
    description: 'Refreshments, water service & room turnarounds',
    allowedRoles: ['PANTRY', 'HR', 'SENIOR_HR', 'ADMIN', 'CEO', 'RECEPTION'],
  },
  {
    id: 'leadership',
    name: 'leadership',
    description: 'Executive management, strategic approvals & senior rounds',
    allowedRoles: ['CEO', 'SENIOR_HR', 'ADMIN'],
  },
];

export const defaultChatMessages: ChatMessage[] = [
  {
    id: 'msg-seed-1',
    senderId: 'usr-rec-ananya',
    senderName: 'Ananya Sen',
    senderRole: 'RECEPTION',
    senderDepartment: 'Front Desk & Reception',
    channelId: 'general',
    content: 'Good morning team! Front desk is set up for today’s interview sessions and business visitors.',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    readBy: ['usr-rec-ananya', 'usr-hr-nisha'],
  },
  {
    id: 'msg-seed-2',
    senderId: 'usr-hr-nisha',
    senderName: 'Nisha',
    senderRole: 'HR',
    senderDepartment: 'HR',
    channelId: 'hr-desk',
    content: 'Rahul Sharma has checked in for the Sales Manager role. Dossier and verified documents are ready.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    readBy: ['usr-hr-nisha', 'usr-hr-shriyanshi'],
    candidateId: 'cand-1',
    candidateName: 'Rahul Sharma',
  },
  {
    id: 'msg-seed-3',
    senderId: 'usr-pan-ramesh',
    senderName: 'Ramesh Kumar',
    senderRole: 'PANTRY',
    senderDepartment: 'Pantry & Hospitality',
    channelId: 'pantry',
    content: 'Water bottles and refreshments replenished across all interview rooms and lobby.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    readBy: ['usr-pan-ramesh'],
  },
  {
    id: 'msg-seed-4',
    senderId: 'usr-cofounder-kimmi',
    senderName: 'Kimmi Mam',
    senderRole: 'SENIOR_HR',
    senderDepartment: 'HR & Senior Leadership',
    channelId: 'leadership',
    content: 'Elegance Suite is prepared for next round senior evaluations today. Let me know when candidate is ready.',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    readBy: ['usr-cofounder-kimmi', 'usr-ceo-lalit'],
  },
];

const defaultCandidates: Candidate[] = [
  {
    id: 'cand-1',
    fullName: 'Rahul Sharma',
    phone: '+91 98112 34567',
    email: 'rahul.sharma@example.com',
    address: 'B-402, Golf Course Road',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122002',
    position: 'Sales Manager - Luxury Residential',
    department: 'Sales & Business Development',
    totalExperience: '6.5 Years',
    relevantExperience: '5 Years in Prime Real Estate',
    currentCompany: 'DLF Crest Real Estate',
    qualification: 'MBA in Marketing',
    noticePeriod: '15 Days',
    expectedSalary: '₹18,00,000 p.a.',
    referralSource: 'LinkedIn Job Portal',
    status: 'SCHEDULED',
    currentLocation: 'Waiting Area',
    appointmentId: 'appt-1',
    currentInterviewId: 'intv-1',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'cand-2',
    fullName: 'Sneha Kapoor',
    phone: '+91 98223 45678',
    email: 'sneha.kapoor@example.com',
    address: 'Plot 18, Sector 43',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122009',
    position: 'Commercial Leasing Executive',
    department: 'Commercial Real Estate',
    totalExperience: '4 Years',
    relevantExperience: '3.5 Years',
    currentCompany: 'JLL India',
    qualification: 'B.Com & Real Estate Finance',
    noticePeriod: 'Immediate',
    expectedSalary: '₹12,50,000 p.a.',
    referralSource: 'Employee Referral - Rohan Gupta',
    status: 'SCHEDULED',
    currentLocation: 'Waiting Area',
    appointmentId: 'appt-2',
    currentInterviewId: 'intv-2',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

const defaultInterviews: Interview[] = [
  {
    id: 'intv-1',
    candidateId: 'cand-1',
    candidateName: 'Rahul Sharma',
    position: 'Sales Manager - Luxury Residential',
    roundName: 'Round 1 - Technical Assessment',
    interviewerId: 'usr-int-1',
    interviewerName: 'Nisha Verma',
    scheduledTime: '11:00 AM',
    status: 'SCHEDULED',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'intv-2',
    candidateId: 'cand-2',
    candidateName: 'Sneha Kapoor',
    position: 'Commercial Leasing Executive',
    roundName: 'Round 1 - Technical Assessment',
    interviewerId: 'usr-int-2',
    interviewerName: 'Rohan Gupta',
    scheduledTime: '01:30 PM',
    status: 'SCHEDULED',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

const defaultCheckInSessions: CheckInSession[] = [
  {
    id: 'session-1',
    token: 'WCR-APPT-901',
    qrType: 'APPOINTMENT',
    candidateId: 'cand-1',
    candidateName: 'Rahul Sharma',
    position: 'Sales Manager - Luxury Residential',
    department: 'Sales & Business Development',
    appointmentTime: '11:00 AM',
    interviewerId: 'usr-int-1',
    interviewerName: 'Nisha Verma',
    interviewRound: 'Round 1 - Technical Assessment',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'session-2',
    token: 'WCR-APPT-902',
    qrType: 'APPOINTMENT',
    candidateId: 'cand-2',
    candidateName: 'Sneha Kapoor',
    position: 'Commercial Leasing Executive',
    department: 'Commercial Real Estate',
    appointmentTime: '01:30 PM',
    interviewerId: 'usr-int-2',
    interviewerName: 'Rohan Gupta',
    interviewRound: 'Round 1 - Technical Assessment',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'session-walkin',
    token: 'WCR-RECEPTION-WALKIN',
    qrType: 'GENERAL_RECEPTION',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

export function deduplicateInterviewsList(
  interviews: Interview[],
  candidates?: Candidate[]
): {
  cleaned: Interview[];
  removedDuplicates: { candidateId: string; candidateName: string; keptId: string; removedId: string; round: string }[];
} {
  if (!interviews || !Array.isArray(interviews)) {
    return { cleaned: [], removedDuplicates: [] };
  }

  const candMap = new Map<string, Candidate>((candidates || []).map((c) => [c.id, c]));
  const seenRoundMap = new Map<string, Interview>();
  const removedDuplicates: { candidateId: string; candidateName: string; keptId: string; removedId: string; round: string }[] = [];

  // Sort so that prioritized records (designated room, active/started status, latest timestamp) take precedence
  const sorted = [...interviews].sort((a, b) => {
    // 1. Priority to interviews with designated room assigned
    const aHasRoom = a.roomId || a.status === 'ROOM_ASSIGNED' ? 1 : 0;
    const bHasRoom = b.roomId || b.status === 'ROOM_ASSIGNED' ? 1 : 0;
    if (aHasRoom !== bHasRoom) return bHasRoom - aHasRoom;

    // 2. Priority by status lifecycle advancement
    const statusWeight = (s: string) => {
      switch (s) {
        case 'INTERVIEW_COMPLETED': return 5;
        case 'INTERVIEW_STARTED': return 4;
        case 'ROOM_ASSIGNED': return 3;
        case 'CANDIDATE_ARRIVED': return 2;
        case 'SCHEDULED': return 1;
        case 'CANCELLED': return 0;
        default: return 0;
      }
    };
    const sDiff = statusWeight(b.status) - statusWeight(a.status);
    if (sDiff !== 0) return sDiff;

    // 3. Fallback to newest updated or created timestamp
    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  for (const intv of sorted) {
    const roundCategory = normalizeInterviewRound(intv.roundName);
    const key = `${intv.candidateId}::${roundCategory}`;

    if (!seenRoundMap.has(key)) {
      seenRoundMap.set(key, { ...intv });
    } else {
      const existing = seenRoundMap.get(key)!;
      const cand = candMap.get(intv.candidateId);

      // Determine which interview candidate record currently references
      const candPrefersThis = cand && cand.currentInterviewId === intv.id;
      const candPrefersExisting = cand && cand.currentInterviewId === existing.id;

      if (candPrefersThis && !candPrefersExisting) {
        // Swap to this one as primary, merge room or details
        const merged: Interview = {
          ...existing,
          ...intv,
          roomId: intv.roomId || existing.roomId,
          roomName: intv.roomName || existing.roomName,
        };
        seenRoundMap.set(key, merged);
        removedDuplicates.push({
          candidateId: intv.candidateId,
          candidateName: intv.candidateName,
          keptId: intv.id,
          removedId: existing.id,
          round: intv.roundName,
        });
      } else {
        // Keep existing as primary, merge room if needed
        if (!existing.roomId && intv.roomId) {
          existing.roomId = intv.roomId;
          existing.roomName = intv.roomName;
        }
        if (existing.status === 'SCHEDULED' && intv.status === 'CANDIDATE_ARRIVED') {
          existing.status = 'CANDIDATE_ARRIVED';
        }
        removedDuplicates.push({
          candidateId: intv.candidateId,
          candidateName: intv.candidateName,
          keptId: existing.id,
          removedId: intv.id,
          round: intv.roundName,
        });

        // Ensure candidate currentInterviewId points to the kept interview
        if (cand && cand.currentInterviewId === intv.id) {
          cand.currentInterviewId = existing.id;
        }
      }
    }
  }

  const cleaned = Array.from(seenRoundMap.values());
  const keptIds = new Set(cleaned.map((i) => i.id));
  if (candidates) {
    candidates.forEach((cand) => {
      if (cand.currentInterviewId && !keptIds.has(cand.currentInterviewId)) {
        const match = cleaned.find((i) => i.candidateId === cand.id);
        if (match) {
          cand.currentInterviewId = match.id;
        }
      }
    });
  }

  return { cleaned, removedDuplicates };
}

export function deduplicateCandidatesList(
  candidates: Candidate[],
  db?: Partial<DatabaseSchema>
): { cleaned: Candidate[]; idMap: Map<string, string> } {
  if (!candidates || !Array.isArray(candidates)) {
    return { cleaned: [], idMap: new Map() };
  }

  const idMap = new Map<string, string>();
  const groups = new Map<string, Candidate[]>();

  const getCanonicalKey = (c: Candidate): string => {
    const rawName = (c.fullName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const rawEmail = (c.email || '').toLowerCase().trim();
    const rawPhone = (c.phone || '').replace(/\D/g, '');

    if (rawName.length >= 3) {
      return `name:${rawName}`;
    }

    if (rawPhone.length >= 7) return `phone:${rawPhone.slice(-10)}`;

    if (rawEmail && rawEmail.includes('@') && !rawEmail.includes('example.com')) {
      return `email:${rawEmail}`;
    }

    return `id:${c.id}`;
  };

  for (const cand of candidates) {
    if ((cand as any).isDeleted) continue;
    const key = getCanonicalKey(cand);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(cand);
  }

  const cleaned: Candidate[] = [];

  for (const group of groups.values()) {
    if (group.length === 1) {
      cleaned.push(group[0]);
      idMap.set(group[0].id, group[0].id);
      continue;
    }

    // Sort group to find best primary record
    group.sort((a, b) => {
      const aDocs = (a.governmentId ? 2 : 0) + (a.receptionPhotoUrl || a.photoUrl || a.livePhoto ? 2 : 0) + (a.resumeUrl ? 1 : 0);
      const bDocs = (b.governmentId ? 2 : 0) + (b.receptionPhotoUrl || b.photoUrl || b.livePhoto ? 2 : 0) + (b.resumeUrl ? 1 : 0);
      if (aDocs !== bDocs) return bDocs - aDocs;

      const statusRank = (s?: string) => {
        if (!s) return 0;
        if (s.includes('Offer') || s.includes('Selected') || s.includes('Hired')) return 5;
        if (s.includes('Interview') || s.includes('With')) return 4;
        if (s.includes('Arrived') || s.includes('Checked In')) return 3;
        return 1;
      };
      const rDiff = statusRank(b.status) - statusRank(a.status);
      if (rDiff !== 0) return rDiff;

      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });

    const primary = { ...group[0] };

    // Merge missing fields from duplicate records into primary
    for (let i = 1; i < group.length; i++) {
      const dup = group[i];
      idMap.set(dup.id, primary.id);

      if (!primary.email && dup.email) primary.email = dup.email;
      if (!primary.phone && dup.phone) primary.phone = dup.phone;
      if (!primary.resumeUrl && dup.resumeUrl) {
        primary.resumeUrl = dup.resumeUrl;
        primary.resumeFileName = dup.resumeFileName;
        primary.resumeMimeType = dup.resumeMimeType;
      }
      if (!primary.governmentId && dup.governmentId) primary.governmentId = dup.governmentId;
      if (!primary.livePhoto && dup.livePhoto) primary.livePhoto = dup.livePhoto;
      if (!primary.receptionPhotoUrl && dup.receptionPhotoUrl) primary.receptionPhotoUrl = dup.receptionPhotoUrl;
      if (!primary.assignedRoomId && dup.assignedRoomId) primary.assignedRoomId = dup.assignedRoomId;
      if (!primary.totalExperience && dup.totalExperience) primary.totalExperience = dup.totalExperience;
      if (!primary.expectedSalary && dup.expectedSalary) primary.expectedSalary = dup.expectedSalary;
      if (!primary.skills && dup.skills) primary.skills = dup.skills;
    }

    idMap.set(primary.id, primary.id);
    cleaned.push(primary);
  }

  // Update references in DB if provided
  if (db) {
    if (db.interviews && Array.isArray(db.interviews)) {
      db.interviews.forEach((i) => {
        if (idMap.has(i.candidateId)) {
          i.candidateId = idMap.get(i.candidateId)!;
        }
      });
    }
    if (db.timelineEvents && Array.isArray(db.timelineEvents)) {
      db.timelineEvents.forEach((te) => {
        if (te.candidateId && idMap.has(te.candidateId)) {
          te.candidateId = idMap.get(te.candidateId)!;
        }
      });
    }
    if (db.checkInSessions && Array.isArray(db.checkInSessions)) {
      db.checkInSessions.forEach((s) => {
        if (s.candidateId && idMap.has(s.candidateId)) {
          s.candidateId = idMap.get(s.candidateId)!;
        }
      });
    }
    if (db.pantryTasks && Array.isArray(db.pantryTasks)) {
      db.pantryTasks.forEach((pt) => {
        if (pt.candidateId && idMap.has(pt.candidateId)) {
          pt.candidateId = idMap.get(pt.candidateId)!;
        }
      });
    }
    if (db.actionTasks && Array.isArray(db.actionTasks)) {
      db.actionTasks.forEach((at) => {
        if (at.candidateId && idMap.has(at.candidateId)) {
          at.candidateId = idMap.get(at.candidateId)!;
        }
      });
    }
  }

  return { cleaned, idMap };
}

export function deduplicateVisitorsList(visitors: Visitor[]): Visitor[] {
  if (!visitors || !Array.isArray(visitors)) return [];

  const seen = new Map<string, Visitor>();

  for (const vis of visitors) {
    if ((vis as any).isDeleted) continue;

    const rawName = (vis.fullName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const rawPhone = (vis.phone || '').replace(/\D/g, '');
    const rawEmail = (vis.email || '').toLowerCase().trim();

    let key = vis.id;
    if (rawName.length >= 3) key = `name:${rawName}`;
    else if (rawPhone.length >= 7) key = `phone:${rawPhone.slice(-10)}`;
    else if (rawEmail && rawEmail.includes('@') && !rawEmail.includes('example.com')) key = `email:${rawEmail}`;

    if (!seen.has(key)) {
      seen.set(key, { ...vis });
    } else {
      const existing = seen.get(key)!;
      if (!existing.photo && vis.photo) existing.photo = vis.photo;
      if (!existing.company && vis.company) existing.company = vis.company;
      if (!existing.roomAssigned && vis.roomAssigned) existing.roomAssigned = vis.roomAssigned;
      if (existing.status !== 'CHECKED_IN' && vis.status === 'CHECKED_IN') existing.status = 'CHECKED_IN';
    }
  }

  return Array.from(seen.values());
}

export function deduplicateRoomsList(rooms: Room[]): Room[] {
  if (!rooms || !Array.isArray(rooms)) return [];

  const seen = new Map<string, Room>();

  for (const r of rooms) {
    const key = (r.id || r.roomId || r.name || r.roomName || '').toLowerCase().trim();
    if (!key) continue;

    if (!seen.has(key)) {
      seen.set(key, { ...r });
    } else {
      const existing = seen.get(key)!;
      if (existing.status === 'AVAILABLE' && r.status === 'OCCUPIED') {
        existing.status = 'OCCUPIED';
        existing.currentCandidateId = r.currentCandidateId;
        existing.currentCandidateName = r.currentCandidateName;
      }
    }
  }

  return Array.from(seen.values());
}

export function deduplicateUsersList(users: User[]): User[] {
  if (!users || !Array.isArray(users)) return [];

  const seen = new Map<string, User>();

  for (const u of users) {
    if ((u as any).isDeleted) continue;
    const key = (u.email || u.username || u.id).toLowerCase().trim();
    if (!key) continue;

    if (!seen.has(key)) {
      seen.set(key, { ...u });
    } else {
      const existing = seen.get(key)!;
      if (existing.isActive === false && u.isActive !== false) {
        seen.set(key, { ...u });
      }
    }
  }

  return Array.from(seen.values());
}

export function deduplicateNotificationsList(notifications: Notification[]): Notification[] {
  if (!notifications || !Array.isArray(notifications)) return [];
  const seen = new Set<string>();
  return notifications.filter((n) => {
    const key = `${n.recipientRole}::${n.title}::${n.message}::${n.entityId || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function deduplicateActionTasksList(actionTasks: ActionTask[]): ActionTask[] {
  if (!actionTasks || !Array.isArray(actionTasks)) return [];
  const seen = new Set<string>();
  return actionTasks.filter((at) => {
    const key = `${at.candidateId}::${at.taskType}::${at.status}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

class DatabaseService {
  private db: DatabaseSchema;

  constructor() {
    this.db = this.initDatabase();
  }

  private initDatabase(): DatabaseSchema {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        // 0. Permanently purge any soft-deleted records from legacy state
        if (parsed.candidates && Array.isArray(parsed.candidates)) {
          parsed.candidates = parsed.candidates.filter((c: any) => !c.isDeleted);
        }
        if (parsed.visitors && Array.isArray(parsed.visitors)) {
          parsed.visitors = parsed.visitors.filter((v: any) => !v.isDeleted);
        }
        const activeBootCandIds = new Set((parsed.candidates || []).map((c: any) => c.id));
        if (parsed.interviews && Array.isArray(parsed.interviews)) {
          parsed.interviews = parsed.interviews.filter(
            (i: any) => !i.isDeleted && activeBootCandIds.has(i.candidateId)
          );
        }

        // 1. Preserve rooms from Room Management (or initialize if empty)
        if (!parsed.rooms || !Array.isArray(parsed.rooms) || parsed.rooms.length === 0) {
          parsed.rooms = defaultRooms;
        } else {
          // Strip any obsolete floor/capacity attributes from existing rooms
          parsed.rooms = parsed.rooms.map((r: any) => {
            const { floor: _f, capacity: _c, seatingCapacity: _sc, ...cleanRoom } = r;
            return cleanRoom;
          });
        }

        const validRoomMap = new Map<string, Room>(parsed.rooms.map((r: Room) => [r.id, r]));

        // 1.5 Sanitize pantryTasks to strictly resolve against valid rooms (Never keep phantom demo rooms)
        if (parsed.pantryTasks && Array.isArray(parsed.pantryTasks)) {
          parsed.pantryTasks = parsed.pantryTasks
            .filter((task: PantryTask) => {
              // If task references a room that exists in Room Management, keep and sync roomName
              const room = validRoomMap.get(task.roomId);
              if (room) {
                task.roomName = room.name;
                return true;
              }
              // If task has no valid room in Room Management, purge orphan/demo task
              return false;
            })
            .map((task: PantryTask) => {
              const room = validRoomMap.get(task.roomId);
              if (room) {
                task.roomName = room.name;
              }
              return task;
            });
        } else {
          parsed.pantryTasks = [];
        }

        // 1.6 Sanitize candidates & active room allocations
        if (parsed.candidates && Array.isArray(parsed.candidates)) {
          parsed.candidates = parsed.candidates.map((c: any) => {
            if (c.assignedRoomId) {
              const room = validRoomMap.get(c.assignedRoomId);
              if (room) {
                c.currentLocation = room.name;
              } else {
                c.assignedRoomId = undefined;
                if (c.currentLocation && !c.currentLocation.includes('Waiting') && !c.currentLocation.includes('Departed')) {
                  c.currentLocation = 'Waiting Area / Lounge';
                }
              }
            } else if (c.currentLocation) {
              const oldNames = ['Boardroom Alpha', 'Meeting Room 1', 'Meeting Room 2', 'Interview Pod A', 'Interview Pod B'];
              if (oldNames.includes(c.currentLocation)) {
                c.currentLocation = 'Waiting Area / Lounge';
              }
            }
            return c;
          });
        }

        // 1.7 Sanitize interviews
        if (parsed.interviews && Array.isArray(parsed.interviews)) {
          parsed.interviews = parsed.interviews.map((intv: any) => {
            if (intv.roomId) {
              const room = validRoomMap.get(intv.roomId);
              if (room) {
                intv.roomName = room.name;
              } else {
                intv.roomId = undefined;
                intv.roomName = undefined;
              }
            }
            return intv;
          });

          // 1.75 Deduplicate interviews using canonical round categories (preserving legitimate separate interview rounds e.g. Round 1 vs Senior HR Interview)
          const { cleaned, removedDuplicates } = deduplicateInterviewsList(parsed.interviews, parsed.candidates);
          parsed.interviews = cleaned;
          if (removedDuplicates.length > 0) {
            console.log(`[DB Boot] Safely cleaned ${removedDuplicates.length} accidental duplicate interview stubs from persistent storage.`);
          }
        }

        // 1.8 Sanitize past notifications, timeline events, and audit logs
        const demoNames = ['Boardroom Alpha', 'Meeting Room 1', 'Meeting Room 2', 'Interview Pod A', 'Interview Pod B'];
        const sanitizeText = (txt: string): string => {
          let res = txt;
          demoNames.forEach((d) => {
            if (res.includes(d)) {
              res = res.split(d).join('Assigned Office Room');
            }
          });
          return res;
        };

        if (parsed.notifications && Array.isArray(parsed.notifications)) {
          parsed.notifications = parsed.notifications.map((n: any) => {
            if (n.title) n.title = sanitizeText(n.title);
            if (n.message) n.message = sanitizeText(n.message);
            if (n.payload) {
              if (n.payload.room) n.payload.room = sanitizeText(n.payload.room);
              if (n.payload.action) n.payload.action = sanitizeText(n.payload.action);
            }
            return n;
          });
        }

        if (parsed.timelineEvents && Array.isArray(parsed.timelineEvents)) {
          parsed.timelineEvents = parsed.timelineEvents.map((te: any) => {
            if (te.description) te.description = sanitizeText(te.description);
            return te;
          });
        }

        if (parsed.auditLogs && Array.isArray(parsed.auditLogs)) {
          parsed.auditLogs = parsed.auditLogs.map((al: any) => {
            if (al.details) al.details = sanitizeText(al.details);
            return al;
          });
        }

        // 2. Preserve staff users and ensure at least one administrative profile exists
        if (!parsed.users || !Array.isArray(parsed.users) || parsed.users.length === 0) {
          parsed.users = defaultUsers;
        } else {
          // If all administrative accounts were removed, ensure primary admin exists
          const hasExecutive = parsed.users.some((u: any) => u.role === 'ADMIN' || u.role === 'CEO' || u.role === 'HR');
          if (!hasExecutive) {
            parsed.users.unshift(defaultUsers[0], defaultUsers[4]);
          }
        }

        // 3. Ensure changeRequests & passwordResetRequests arrays exist
        parsed.changeRequests = parsed.changeRequests || [];
        parsed.passwordResetRequests = parsed.passwordResetRequests || [];

        // 4. Ensure field visibility has all modern fields + CO_FOUNDER
        if (!parsed.settings) parsed.settings = {};
        parsed.settings.fieldVisibility = {
          ...defaultFieldVisibility,
          ...(parsed.settings.fieldVisibility || {}),
          HR: {
            ...defaultFieldVisibility.HR,
            ...(parsed.settings.fieldVisibility?.HR || {}),
            governmentId: true,
            validationResults: true,
          },
          ADMIN: {
            ...defaultFieldVisibility.ADMIN,
            ...(parsed.settings.fieldVisibility?.ADMIN || {}),
            governmentId: true,
            validationResults: true,
          },
          CEO: {
            ...defaultFieldVisibility.CEO,
            ...(parsed.settings.fieldVisibility?.CEO || {}),
            governmentId: true,
            validationResults: true,
          },
          SENIOR_HR: {
            ...defaultFieldVisibility.SENIOR_HR,
            ...(parsed.settings.fieldVisibility?.SENIOR_HR || {}),
            governmentId: true,
            validationResults: true,
          },
          CO_FOUNDER: defaultFieldVisibility.CO_FOUNDER,
          RECEPTION: {
            ...defaultFieldVisibility.RECEPTION,
            ...(parsed.settings.fieldVisibility?.RECEPTION || {}),
            governmentId: true,
            validationResults: true,
            resume: true,
            email: true,
            address: true,
            candidateName: true,
            phone: true,
            livePhoto: true,
            room: true,
            pantryTask: true,
            salary: false,
            hrNotes: false,
          },
          PANTRY: {
            ...defaultFieldVisibility.PANTRY,
            governmentId: false,
            resume: false,
            hrNotes: false,
            salary: false,
          },
        };

        // Ensure Elegance Suite and isReservedNextRound flags on rooms
        if (parsed.rooms && Array.isArray(parsed.rooms)) {
          parsed.rooms.forEach((r: Room) => {
            if (r.id === 'room-kimmi-cabin' || r.roomId === 'room-kimmi-cabin') {
              r.name = 'Elegance Suite';
              r.roomName = 'Elegance Suite';
              r.isReservedNextRound = true;
            }
            if (r.id === 'room-lalit-cabin' || r.roomId === 'room-lalit-cabin') {
              r.isReservedNextRound = true;
            }
          });
        }

        // Deduplicate all collections permanently
        if (parsed.candidates && Array.isArray(parsed.candidates)) {
          const { cleaned: dedupCands } = deduplicateCandidatesList(parsed.candidates, parsed);
          parsed.candidates = dedupCands;
        }
        if (parsed.visitors && Array.isArray(parsed.visitors)) {
          parsed.visitors = deduplicateVisitorsList(parsed.visitors);
        }
        if (parsed.rooms && Array.isArray(parsed.rooms)) {
          parsed.rooms = deduplicateRoomsList(parsed.rooms);
        }
        if (parsed.users && Array.isArray(parsed.users)) {
          parsed.users = deduplicateUsersList(parsed.users);
        }
        if (parsed.notifications && Array.isArray(parsed.notifications)) {
          parsed.notifications = deduplicateNotificationsList(parsed.notifications);
        }
        if (parsed.actionTasks && Array.isArray(parsed.actionTasks)) {
          parsed.actionTasks = deduplicateActionTasksList(parsed.actionTasks);
        }

        this.persist(parsed);
        return parsed;
      } catch (err) {
        console.error('Failed to parse database file, resetting to defaults', err);
      }
    }

    const initialDb: DatabaseSchema = {
      users: defaultUsers,
      candidates: defaultCandidates,
      interviews: defaultInterviews,
      rooms: defaultRooms,
      chatChannels: defaultChatChannels,
      chatMessages: defaultChatMessages,
      actionTasks: [],
      notifications: [
        {
          id: 'notif-welcome',
          recipientRole: 'ADMIN',
          title: 'System Initialized',
          message: 'WCR Office Operations Automation platform is active and ready.',
          priority: 'NORMAL',
          eventType: 'SYSTEM_BOOTSTRAP',
          entityId: 'system',
          entityType: 'VISITOR',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
      pantryTasks: [],
      timelineEvents: [
        {
          id: 'tl-init',
          candidateId: 'cand-1',
          timestamp: new Date().toISOString(),
          actorType: 'SYSTEM',
          actorName: 'Workflow Engine',
          eventType: 'INTERVIEW_SCHEDULED',
          description: 'Candidate Rahul Sharma scheduled for Round 1 with Nisha Verma (11:00 AM). QR pass WCR-APPT-901 active.',
        },
      ],
      auditLogs: [
        {
          id: 'aud-init',
          timestamp: new Date().toISOString(),
          actorType: 'SYSTEM',
          actorName: 'System Bootstrapper',
          action: 'INIT_DATABASE',
          details: 'WCR office operations database initialized with default rooms, staff roles, and scheduled interviews.',
        },
      ],
      checkInSessions: defaultCheckInSessions,
      visitors: [],
      settings: {
        autoAssignPantryOnRoom: true,
        pantryWaterRequired: true,
        requireLivePhoto: true,
        requireResume: true,
        requireGovernmentId: true,
        allowedGovernmentIdTypes: ['AADHAAR', 'PAN', 'DRIVING_LICENSE', 'PASSPORT', 'VOTER_ID', 'OTHER'],
        allowedUploadFormats: ['pdf', 'png', 'jpg', 'jpeg'],
        qrSessionExpiryMinutes: 30,
        fieldVisibility: defaultFieldVisibility as any,
      },
    };

    this.persist(initialDb);
    return initialDb;
  }

  private persist(data: DatabaseSchema): void {
    try {
      const tmpFile = `${DB_FILE}.tmp`;
      const json = JSON.stringify(data);
      fs.writeFileSync(tmpFile, json, 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Atomic rename write failed, attempting direct sync write:', err);
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data), 'utf-8');
      } catch (fallbackErr) {
        console.error('Fatal: Failed to write database file', fallbackErr);
        throw fallbackErr;
      }
    }
  }

  public get(): DatabaseSchema {
    return this.db;
  }

  public update(updater: (draft: DatabaseSchema) => void): DatabaseSchema {
    updater(this.db);
    if (this.db.candidates && Array.isArray(this.db.candidates)) {
      this.db.candidates = this.db.candidates.filter((c: any) => !c.isDeleted);
      const { cleaned } = deduplicateCandidatesList(this.db.candidates, this.db);
      this.db.candidates = cleaned;
    }
    if (this.db.visitors && Array.isArray(this.db.visitors)) {
      this.db.visitors = this.db.visitors.filter((v: any) => !v.isDeleted);
      this.db.visitors = deduplicateVisitorsList(this.db.visitors);
    }
    if (this.db.rooms && Array.isArray(this.db.rooms)) {
      this.db.rooms = deduplicateRoomsList(this.db.rooms);
    }
    if (this.db.users && Array.isArray(this.db.users)) {
      this.db.users = deduplicateUsersList(this.db.users);
    }
    if (this.db.notifications && Array.isArray(this.db.notifications)) {
      this.db.notifications = deduplicateNotificationsList(this.db.notifications);
    }
    if (this.db.actionTasks && Array.isArray(this.db.actionTasks)) {
      this.db.actionTasks = deduplicateActionTasksList(this.db.actionTasks);
    }
    if (this.db.interviews && Array.isArray(this.db.interviews)) {
      const activeCandIds = new Set((this.db.candidates || []).map((c) => c.id));
      this.db.interviews = this.db.interviews.filter(
        (i: any) => !i.isDeleted && activeCandIds.has(i.candidateId)
      );
      const { cleaned } = deduplicateInterviewsList(this.db.interviews, this.db.candidates);
      this.db.interviews = cleaned;
    }
    this.persist(this.db);
    return this.db;
  }
}

export const dbService = new DatabaseService();
