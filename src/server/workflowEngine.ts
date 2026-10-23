import { dbService } from './db.ts';
import type {
  Candidate,
  Interview,
  Notification,
  PantryTask,
  PantryTaskCategory,
  PantryTaskType,
  PantryTaskItem,
  NotificationPriority,
  TimelineEvent,
  AuditLog,
  UserRole,
  StaffSession,
  DomainEvent,
  DomainEventType,
  CandidateResumeMetadata,
  OfficeSettings,
  Visitor,
  Room,
  User,
  VoiceAlertPayload,
  ArrivalVisualDetails,
} from '../types/index.ts';
import { normalizeInterviewRound } from '../utils/candidateHelpers.ts';

// SSE client subscriber interface with verified staff session
export interface SSEClient {
  id: string;
  session: StaffSession;
  role: UserRole;
  userId: string;
  res: any;
  connectedAt: string;
  lastPing: number;
}

export function sanitizeCandidateForRole(cand: Candidate, role: UserRole, settings?: OfficeSettings): any {
  if (role === 'PANTRY') {
    return {
      id: cand.id,
      fullName: cand.fullName,
      status: cand.status,
      currentLocation: cand.currentLocation,
      arrivalTime: cand.arrivalTime,
    };
  }

  const copy: any = {
    id: cand.id,
    fullName: cand.fullName,
    phone: cand.phone,
    email: cand.email,
    position: cand.position,
    department: cand.department,
    status: cand.status,
    currentLocation: cand.currentLocation,
    arrivalTime: cand.arrivalTime,
    purpose: cand.purpose,
    visitType: (cand as any).visitType || (cand.purpose?.includes('Scheduled') ? 'SCHEDULED' : 'WALK_IN'),
    personToMeet: cand.personToMeet,
    departmentToMeet: cand.departmentToMeet,
    appointmentTime: (cand as any).appointmentTime,
    referralSource: cand.referralSource,
    currentInterviewId: cand.currentInterviewId,
    livePhoto: cand.livePhoto,
    livePhotoCapturedAt: cand.livePhotoCapturedAt,
    arrivalPhoto: cand.arrivalPhoto,
    resumeUrl: cand.resumeUrl,
    resumeFileName: cand.resumeFileName,
    resumeFileSize: cand.resumeFileSize,
    resumeMimeType: cand.resumeMimeType,
    resumeUploadedAt: cand.resumeUploadedAt,
    createdAt: cand.createdAt,
    updatedAt: cand.updatedAt,
    assignedInterviewerId: (cand as any).assignedInterviewerId,
    assignedInterviewerName: (cand as any).assignedInterviewerName,
  };

  if (role === 'HR' || role === 'ADMIN' || role === 'CEO' || role === 'CO_FOUNDER' || role === 'SENIOR_HR') {
    copy.expectedSalary = cand.expectedSalary;
    copy.hrNotes = cand.hrNotes || cand.hrPrivateNotes;
    copy.address = cand.address || '';
    copy.city = cand.city || '';
    copy.state = cand.state || '';
    copy.pincode = cand.pincode || '';
  }

  return copy;
}

/**
 * Format proper honorific for natural speech (e.g. "Nisha Ma'am", "Sameer Sir", "Kimmi Ma'am")
 */
export function formatHonorificName(name: string): string {
  if (!name) return 'Host';
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  if (lower.includes('sir') || lower.includes('mam') || lower.includes("ma'am") || lower.includes('madam')) {
    return trimmed;
  }
  if (lower === 'nisha' || lower === 'shriyanshi' || lower === 'kimmi' || lower === 'ananya') {
    return `${trimmed} Ma'am`;
  }
  if (lower === 'sameer' || lower === 'lalit' || lower === 'vikram' || lower === 'ramesh') {
    return `${trimmed} Sir`;
  }
  return trimmed;
}

export interface HostResolutionResult {
  hostUserId?: string;
  hostName: string;
  honorificName: string;
  hostRole: UserRole;
  isReceptionAssistance: boolean;
  department?: string;
}

/**
 * Dynamically resolves the exact staff member a visitor/candidate came to meet.
 * Fallbacks to reception assistance workflow if unknown or unassigned.
 */
export function resolveHostDetails(
  params: {
    hostId?: string;
    personToMeet?: string;
    hostName?: string;
    interviewerId?: string;
    interviewerName?: string;
    departmentToMeet?: string;
    hostDepartment?: string;
    purpose?: string;
    isInterview?: boolean;
  },
  users: User[]
): HostResolutionResult {
  // 1. Explicit Reception Assistance check
  if (
    params.hostId === 'RECEPTION_ASSISTANCE' ||
    params.personToMeet === 'Front Desk / Reception Assistance' ||
    params.hostName === 'Front Desk / Reception Assistance'
  ) {
    return {
      hostUserId: undefined,
      hostName: 'Front Desk / Reception Assistance',
      honorificName: 'Front Desk',
      hostRole: 'RECEPTION',
      isReceptionAssistance: true,
      department: 'Front Desk & Reception',
    };
  }

  // 2. Direct ID match
  const rawId = params.hostId || params.interviewerId;
  if (rawId) {
    const matchedUser = users.find(
      (u) => u.id === rawId || (u as any).userId === rawId
    );
    if (matchedUser) {
      return {
        hostUserId: matchedUser.id,
        hostName: matchedUser.name,
        honorificName: formatHonorificName(matchedUser.name),
        hostRole: matchedUser.role,
        isReceptionAssistance: false,
        department: matchedUser.department,
      };
    }
  }

  // 3. Name match across personToMeet, hostName, interviewerName
  const rawNames = [
    params.personToMeet,
    params.hostName,
    params.interviewerName,
  ].filter(Boolean) as string[];

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/\b(sir|ma'am|mam|madam|mr|ms|mrs|dr)\b/gi, '')
      .replace(/[^a-z0-9]/g, ' ')
      .trim();

  for (const rawName of rawNames) {
    const norm = normalize(rawName);
    if (!norm) continue;

    // Direct user lookup
    const user = users.find((u) => {
      const uNorm = normalize(u.name);
      return (
        norm === uNorm ||
        norm.includes(uNorm) ||
        uNorm.includes(norm) ||
        (u.email && u.email.toLowerCase().includes(norm))
      );
    });

    if (user) {
      return {
        hostUserId: user.id,
        hostName: user.name,
        honorificName: formatHonorificName(user.name),
        hostRole: user.role,
        isReceptionAssistance: false,
        department: user.department,
      };
    }
  }

  // 4. Department fallback if specified
  const dept = (params.departmentToMeet || params.hostDepartment || '').toLowerCase();
  if (dept.includes('exec') || dept.includes('ceo') || dept.includes('managing director')) {
    const ceo = users.find((u) => u.role === 'CEO') || users.find((u) => u.id === 'usr-ceo-lalit');
    if (ceo) {
      return {
        hostUserId: ceo.id,
        hostName: ceo.name,
        honorificName: formatHonorificName(ceo.name),
        hostRole: ceo.role,
        isReceptionAssistance: false,
        department: ceo.department,
      };
    }
  }
  if (dept.includes('admin') || dept.includes('operation')) {
    const admin = users.find((u) => u.role === 'ADMIN') || users.find((u) => u.id === 'usr-admin-sameer');
    if (admin) {
      return {
        hostUserId: admin.id,
        hostName: admin.name,
        honorificName: formatHonorificName(admin.name),
        hostRole: admin.role,
        isReceptionAssistance: false,
        department: admin.department,
      };
    }
  }
  if (dept.includes('sales')) {
    const sales = users.find((u) => u.id === 'usr-sales-vikram') || users.find((u) => u.role === 'MANAGER');
    if (sales) {
      return {
        hostUserId: sales.id,
        hostName: sales.name,
        honorificName: formatHonorificName(sales.name),
        hostRole: sales.role,
        isReceptionAssistance: false,
        department: sales.department,
      };
    }
  }

  // 5. Default: No specific host identified -> Reception Assistance workflow
  return {
    hostUserId: undefined,
    hostName: params.personToMeet || params.hostName || 'Front Desk Assistance',
    honorificName: 'Front Desk',
    hostRole: 'RECEPTION',
    isReceptionAssistance: true,
    department: 'Front Desk & Reception',
  };
}

/**
 * Builds dynamic spoken arrival phrases matching the prompt's exact voice direction:
 * - "Nisha Ma'am, Rahul Sharma aapse interview ke liye milne aaye hain."
 * - "Sameer Sir, [Client Name] aapse [Purpose] ke liye milne aaye hain."
 * - "Kimmi Ma'am, [Visitor Name] aapse [Purpose] ke liye milne aaye hain."
 */
export function buildSpokenArrivalPhrases(params: {
  honorificHostName: string;
  visitorName: string;
  purpose: string;
  isInterview: boolean;
  position?: string;
}): { spokenTextHi: string; spokenTextEn: string } {
  const host = params.honorificHostName;
  const visitor = params.visitorName.trim();
  const purposeClause = params.isInterview
    ? 'interview'
    : (params.purpose || 'meeting').trim().toLowerCase().replace(/^client\s*/i, '').replace(/^vendor\s*/i, '') || 'meeting';

  // Hindi/Hinglish (Prompt specification: "Nisha Ma'am, Rahul Sharma aapse interview ke liye milne aaye hain.")
  const spokenTextHi = `${host}, ${visitor} aapse ${purposeClause} ke liye milne aaye hain.`;

  // English fallback:
  const spokenTextEn = `${host}, ${visitor} is here to meet you for ${purposeClause}.`;

  return { spokenTextHi, spokenTextEn };
}

class EventWorkflowEngine {
  private sseClients: Map<string, SSEClient> = new Map();

  public subscribeClient(client: SSEClient) {
    this.sseClients.set(client.id, client);
    console.log(
      `[REALTIME] connection opened & authenticated: ${client.id} | User: ${client.session.name} (${client.userId}) | Role: ${client.role}`
    );
  }

  public unsubscribeClient(clientId: string) {
    const client = this.sseClients.get(clientId);
    if (client) {
      console.log(
        `[REALTIME] connection closed: ${clientId} | User: ${client.session.name} (${client.userId})`
      );
      this.sseClients.delete(clientId);
    }
  }

  public getConnectedClientsCount(): number {
    return this.sseClients.size;
  }

  /**
   * Broadcast helper that delegates to publishDomainEvent
   */
  public broadcast(event: {
    type: string;
    payload?: any;
    targetRoles?: UserRole[];
    targetUserId?: string;
  }) {
    return this.publishDomainEvent({
      eventType: event.type as DomainEventType,
      candidateId: event.payload?.candidateId || (event.type.startsWith('CANDIDATE') ? event.payload?.id : undefined),
      visitId: event.payload?.visitId || event.payload?.visitorId || (event.type.startsWith('VISITOR') ? event.payload?.id : undefined),
      applicationId: event.payload?.applicationId,
      interviewId: event.payload?.interviewId,
      roomId: event.payload?.roomId,
      taskId: event.payload?.taskId,
      actorType: 'STAFF',
      source: 'STAFF_ACTION',
      targetRoles: event.targetRoles,
      targetUserId: event.targetUserId,
      metadata: event.payload,
    });
  }

  /**
   * Authoritative Domain Event Publisher with Database Persistence & Role-Based Filtering
   */
  public publishDomainEvent(eventData: {
    eventType: DomainEventType;
    candidateId?: string;
    visitId?: string;
    applicationId?: string;
    interviewId?: string;
    roomId?: string;
    taskId?: string;
    registrationSessionId?: string;
    actorType: 'SYSTEM' | 'CANDIDATE' | 'STAFF' | 'USER';
    source: 'CANDIDATE_REGISTRATION' | 'STAFF_ACTION' | 'WORKFLOW_ENGINE';
    targetRoles?: UserRole[];
    targetUserId?: string;
    metadata?: Record<string, any>;
  }): DomainEvent {
    const timestamp = new Date().toISOString();
    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const domainEvent: DomainEvent = {
      eventId,
      eventType: eventData.eventType,
      candidateId: eventData.candidateId,
      visitId: eventData.visitId || eventData.candidateId,
      applicationId: eventData.applicationId || eventData.candidateId,
      interviewId: eventData.interviewId,
      roomId: eventData.roomId,
      taskId: eventData.taskId,
      registrationSessionId: eventData.registrationSessionId,
      timestamp,
      actorType: eventData.actorType,
      source: eventData.source,
      targetRoles: eventData.targetRoles,
      targetUserId: eventData.targetUserId,
      metadata: eventData.metadata || {},
    };

    console.log(`[EVENT] event created: ${domainEvent.eventType} | ID: ${domainEvent.eventId}`);

    // Persist event into database domainEvents ring-buffer
    try {
      dbService.update((draft) => {
        draft.domainEvents = draft.domainEvents || [];
        draft.domainEvents.unshift(domainEvent);
        // Keep last 100 domain events in persistence
        if (draft.domainEvents.length > 100) {
          draft.domainEvents = draft.domainEvents.slice(0, 100);
        }
      });
      console.log(`[EVENT] event persisted: ${domainEvent.eventId} to authoritative storage`);
    } catch (err) {
      console.error(`[EVENT] Failed persisting domain event ${domainEvent.eventId}`, err);
    }

    // Deliver to connected authenticated staff SSE clients
    let deliveredCount = 0;
    for (const [id, client] of this.sseClients.entries()) {
      // 1. Target user filter: Only restrict entire event delivery if targetUserId is explicitly private (no targetRoles)
      if (domainEvent.targetUserId && !domainEvent.targetRoles && client.userId && client.userId !== domainEvent.targetUserId) {
        continue;
      }

      // 2. Target roles filter
      const allowedRoles = domainEvent.targetRoles
        ? (domainEvent.targetRoles.includes('HR') || domainEvent.targetRoles.includes('ADMIN')
            ? (domainEvent.targetRoles.includes('SENIOR_HR') ? domainEvent.targetRoles : [...domainEvent.targetRoles, 'SENIOR_HR' as UserRole])
            : domainEvent.targetRoles)
        : null;

      if (allowedRoles && !allowedRoles.includes(client.role)) {
        continue;
      }

      // 3. Role authorization check: Pantry must NEVER receive candidate confidential profile data
      if (client.role === 'PANTRY' && domainEvent.eventType === 'CANDIDATE_FORM_SUBMITTED') {
        // Pantry does not receive raw candidate intake events
        continue;
      }

      // Format role-safe sanitized payload
      const sanitizedPayload: any = {
        eventId: domainEvent.eventId,
        eventType: domainEvent.eventType,
        candidateId: domainEvent.candidateId,
        visitorId: domainEvent.visitId || domainEvent.metadata?.visitorId || domainEvent.metadata?.id,
        visitId: domainEvent.visitId,
        id: domainEvent.candidateId || domainEvent.visitId || domainEvent.metadata?.visitorId || domainEvent.metadata?.id,
        applicationId: domainEvent.applicationId,
        interviewId: domainEvent.interviewId,
        roomId: domainEvent.roomId,
        taskId: domainEvent.taskId,
        registrationSessionId: domainEvent.registrationSessionId,
        timestamp: domainEvent.timestamp,
        actorType: domainEvent.actorType,
        source: domainEvent.source,
        metadata: { ...domainEvent.metadata },
      };

      // Authoritative Candidate Record Attachment for Instant Dashboard Synchronization
      if (domainEvent.candidateId && domainEvent.eventType !== 'CANDIDATE_DELETED') {
        const db = dbService.get();
        const cand = db.candidates.find((c) => c.id === domainEvent.candidateId);
        if (cand && !(cand as any).isDeleted) {
          sanitizedPayload.candidate = sanitizeCandidateForRole(cand, client.role, db.settings);
        }
      }

      // Strip sensitive details if delivering to Reception or Pantry
      if (client.role === 'RECEPTION' || client.role === 'PANTRY') {
        if (sanitizedPayload.metadata) {
          delete sanitizedPayload.metadata.salary;
          delete sanitizedPayload.metadata.expectedSalary;
          delete sanitizedPayload.metadata.hrNotes;
          delete sanitizedPayload.metadata.hrPrivateNotes;
          delete sanitizedPayload.metadata.governmentIdNumber;
        }
      }

      // 4. SERVER-SIDE HOST VOICE ALERT FILTERING:
      // Strictly attach voiceAlert ONLY IF this connected client is the exact intended target host!
      const rawVoiceAlert = domainEvent.metadata?.voiceAlert;
      if (rawVoiceAlert && rawVoiceAlert.targetUserId && rawVoiceAlert.targetUserId === client.userId) {
        sanitizedPayload.voiceAlert = rawVoiceAlert;
        console.log(`[VOICE TARGET] Voice alert attached exclusively for host: ${client.session.name} (${client.userId})`);
      } else {
        // Explicitly delete voiceAlert so other users NEVER receive audio alert data!
        delete sanitizedPayload.voiceAlert;
        if (sanitizedPayload.metadata) {
          delete sanitizedPayload.metadata.voiceAlert;
        }
      }

      const sseMessage = `data: ${JSON.stringify({ type: domainEvent.eventType, payload: sanitizedPayload, eventId: domainEvent.eventId, timestamp: domainEvent.timestamp })}\n\n`;

      try {
        client.res.write(sseMessage);
        deliveredCount++;
        console.log(
          `[DASHBOARD] recipient resolved: ${client.session.name} (${client.role}) | event delivered: ${domainEvent.eventId}`
        );
      } catch (err) {
        console.error(`[DASHBOARD] Failed delivering event to client ${id}`, err);
        this.sseClients.delete(id);
      }
    }

    console.log(
      `[EVENT] event published: ${domainEvent.eventType} (${domainEvent.eventId}) -> delivered to ${deliveredCount} active dashboards`
    );

    return domainEvent;
  }

  /**
   * Resync missed events for reconnected clients
   */
  public getMissedEvents(
    sinceTimestamp?: string,
    lastEventId?: string,
    role: UserRole = 'HR'
  ): DomainEvent[] {
    const db = dbService.get();
    const events = db.domainEvents || [];
    if (!events.length) return [];

    let filtered = events;

    if (sinceTimestamp) {
      const sinceTime = new Date(sinceTimestamp).getTime();
      filtered = filtered.filter((e) => new Date(e.timestamp).getTime() > sinceTime);
    } else if (lastEventId) {
      const idx = filtered.findIndex((e) => e.eventId === lastEventId);
      if (idx !== -1) {
        filtered = filtered.slice(0, idx);
      }
    } else {
      // Default return latest 50
      filtered = filtered.slice(0, 50);
    }

    // Ensure old intake/arrival events for deleted candidates or deleted visitors are never replayed
    const activeCandIds = new Set(
      (db.candidates || []).filter((c) => !(c as any).isDeleted).map((c) => c.id)
    );
    const existingVisIds = new Set(
      (db.visitors || []).filter((v) => !(v as any).isDeleted).map((v) => v.id)
    );

    // Role and deletion filter
    return filtered.filter((e) => {
      if (e.targetRoles && !e.targetRoles.includes(role)) return false;
      if (role === 'PANTRY' && e.eventType === 'CANDIDATE_FORM_SUBMITTED') return false;

      // Do not replay outdated intake/arrival events for records that have been deleted
      if (e.candidateId && !activeCandIds.has(e.candidateId) && e.eventType !== 'CANDIDATE_DELETED') {
        return false;
      }
      const visId = e.visitId || (e.metadata as any)?.visitorId || (e.metadata as any)?.id;
      if (visId && !existingVisIds.has(visId) && e.eventType !== 'VISITOR_DELETED') {
        return false;
      }

      return true;
    });
  }

  // 1. CANDIDATE ARRIVAL & CHECK-IN EVENT
  public handleCandidateCheckIn(candidate: Candidate, interview?: Interview, checkInSessionToken?: string) {
    const timestamp = new Date().toISOString();
    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Step A: Generate Role-Based Notifications
    const notificationsToCreate: Notification[] = [];

    // HR Notification: FULL dossier
    notificationsToCreate.push({
      id: `notif-${Date.now()}-hr`,
      recipientRole: 'HR',
      title: 'New Candidate Checked In',
      message: `${candidate.fullName} has arrived for ${candidate.position} (${interview?.roundName || 'Interview'}). Scheduled: ${interview?.scheduledTime || 'Walk-in'}.`,
      priority: 'HIGH',
      eventType: 'CANDIDATE_ARRIVED',
      entityId: candidate.id,
      entityType: 'CANDIDATE',
      read: false,
      createdAt: timestamp,
      actionButtons: [
        { label: 'Assign Room', actionKey: 'ASSIGN_ROOM', payload: { candidateId: candidate.id, interviewId: interview?.id } },
        { label: 'View Profile', actionKey: 'VIEW_CANDIDATE', payload: { candidateId: candidate.id } },
      ],
      payload: {
        candidateName: candidate.fullName,
        position: candidate.position,
        stage: interview?.roundName || 'Round 1',
        interviewer: interview?.interviewerName || 'Unassigned',
        scheduled: interview?.scheduledTime || 'N/A',
        arrived: timeFormatted,
        phone: candidate.phone,
        email: candidate.email,
        experience: candidate.totalExperience,
        currentLocation: candidate.currentLocation,
        hasPhoto: !!candidate.livePhoto,
        hasResume: !!candidate.resumeUrl,
        livePhoto: candidate.livePhoto,
        resumeFileName: candidate.resumeFileName,
      },
    });

    // ADMIN Notification: Full operational
    notificationsToCreate.push({
      id: `notif-${Date.now()}-admin`,
      recipientRole: 'ADMIN',
      title: 'Candidate Checked In',
      message: `${candidate.fullName} checked in for ${candidate.position}. Status: Waiting in Reception.`,
      priority: 'HIGH',
      eventType: 'CANDIDATE_ARRIVED',
      entityId: candidate.id,
      entityType: 'CANDIDATE',
      read: false,
      createdAt: timestamp,
      actionButtons: [
        { label: 'View Record', actionKey: 'VIEW_CANDIDATE', payload: { candidateId: candidate.id } },
      ],
      payload: {
        candidateName: candidate.fullName,
        position: candidate.position,
        interviewer: interview?.interviewerName || 'Unassigned',
        arrived: timeFormatted,
        currentLocation: candidate.currentLocation,
        room: 'Not Assigned',
        photoAvailable: !!candidate.livePhoto,
        resumeAvailable: !!candidate.resumeUrl,
      },
    });

    // CEO Notification: Executive brief
    notificationsToCreate.push({
      id: `notif-${Date.now()}-ceo`,
      recipientRole: 'CEO',
      title: 'Candidate Arrived for Interview',
      message: `${candidate.fullName} (${candidate.position}) is in reception for ${interview?.roundName || 'Assessment'}.`,
      priority: 'NORMAL',
      eventType: 'CANDIDATE_ARRIVED',
      entityId: candidate.id,
      entityType: 'CANDIDATE',
      read: false,
      createdAt: timestamp,
      actionButtons: [
        { label: 'Executive Profile', actionKey: 'VIEW_CANDIDATE', payload: { candidateId: candidate.id } },
      ],
      payload: {
        candidateName: candidate.fullName,
        position: candidate.position,
        stage: interview?.roundName || 'Round 1',
        interviewer: interview?.interviewerName || 'Interview Panel',
        scheduled: interview?.scheduledTime || 'Today',
        arrived: timeFormatted,
        currentStatus: 'Waiting in Reception',
      },
    });

    // CO-FOUNDER Notification
    notificationsToCreate.push({
      id: `notif-${Date.now()}-cofounder`,
      recipientRole: 'CO_FOUNDER',
      title: 'Candidate Arrived for Interview',
      message: `${candidate.fullName} (${candidate.position}) checked in at Reception.`,
      priority: 'NORMAL',
      eventType: 'CANDIDATE_ARRIVED',
      entityId: candidate.id,
      entityType: 'CANDIDATE',
      read: false,
      createdAt: timestamp,
      actionButtons: [
        { label: 'View Profile', actionKey: 'VIEW_CANDIDATE', payload: { candidateId: candidate.id } },
      ],
      payload: {
        candidateName: candidate.fullName,
        position: candidate.position,
        stage: interview?.roundName || 'Round 1',
        interviewer: interview?.interviewerName || 'Interview Panel',
        arrived: timeFormatted,
      },
    });

    // ASSIGNED INTERVIEWER Notification
    if (interview?.interviewerId) {
      notificationsToCreate.push({
        id: `notif-${Date.now()}-intv`,
        recipientRole: 'INTERVIEWER',
        recipientUserId: interview.interviewerId,
        title: 'Your Candidate Has Arrived',
        message: `${candidate.fullName} has arrived for ${interview.roundName}. Waiting in Reception area.`,
        priority: 'HIGH',
        eventType: 'CANDIDATE_WAITING',
        entityId: candidate.id,
        entityType: 'INTERVIEW',
        read: false,
        createdAt: timestamp,
        actionButtons: [
          { label: 'View Candidate', actionKey: 'VIEW_CANDIDATE', payload: { candidateId: candidate.id } },
          { label: 'Start Interview', actionKey: 'START_INTERVIEW', payload: { interviewId: interview.id } },
        ],
        payload: {
          candidateName: candidate.fullName,
          position: candidate.position,
          stage: interview.roundName,
          arrived: timeFormatted,
          currentLocation: 'Waiting Area',
          room: 'Awaiting HR Room Assignment',
          experience: candidate.totalExperience,
          relevantExperience: candidate.relevantExperience,
          livePhoto: candidate.livePhoto,
        },
      });
    }

    // RECEPTION Notification: Operational assist
    notificationsToCreate.push({
      id: `notif-${Date.now()}-rec`,
      recipientRole: 'RECEPTION',
      title: 'Candidate Arrived at Front Desk',
      message: `${candidate.fullName} checked in for ${candidate.position}. Direct to Waiting Lounge.`,
      priority: 'HIGH',
      eventType: 'CANDIDATE_ARRIVED',
      entityId: candidate.id,
      entityType: 'CANDIDATE',
      read: false,
      createdAt: timestamp,
      actionButtons: [
        { label: 'Assist Candidate', actionKey: 'VIEW_CANDIDATE', payload: { candidateId: candidate.id } },
      ],
      payload: {
        candidateName: candidate.fullName,
        position: candidate.position,
        interviewer: interview?.interviewerName || 'Interviewer',
        status: 'Waiting in Lounge',
        action: 'Guide candidate to waiting area lounge and offer comfort',
        arrived: timeFormatted,
        livePhoto: candidate.livePhoto,
      },
    });

    // Step B: Update Database & Timeline
    dbService.update((draft) => {
      draft.notifications.unshift(...notificationsToCreate);

      draft.timelineEvents.unshift(
        {
          id: `tl-${Date.now()}-submit`,
          candidateId: candidate.id,
          timestamp,
          actorType: 'USER',
          actorName: candidate.fullName,
          eventType: 'CANDIDATE_FORM_SUBMITTED',
          description: `Candidate completed self-check-in with live photo and resume verification.`,
        },
        {
          id: `tl-${Date.now()}-alerts`,
          candidateId: candidate.id,
          timestamp,
          actorType: 'SYSTEM',
          actorName: 'Workflow Engine',
          eventType: 'ROLE_BASED_ALERTS_DISPATCHED',
          description: `Dispatched automated arrival alerts to HR, Interviewer (${interview?.interviewerName || 'Team'}), Admin, CEO, and Reception.`,
        }
      );

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp,
        actorType: 'SYSTEM',
        actorName: 'Self-CheckIn Engine',
        action: 'CANDIDATE_CHECKED_IN',
        details: `Candidate ${candidate.fullName} (${candidate.id}) arrived via QR token ${checkInSessionToken || 'N/A'}. Persisted to DB.`,
        entityId: candidate.id,
        entityType: 'CANDIDATE',
      });
    });

    // Step C: Real-time broadcast
    // Resolve intended host dynamically from appointment / interviewer / personToMeet
    const db = dbService.get();
    const hostDetails = resolveHostDetails(
      {
        personToMeet: candidate.personToMeet,
        interviewerId: interview?.interviewerId || (candidate as any).assignedInterviewerId,
        interviewerName: interview?.interviewerName || (candidate as any).assignedInterviewerName,
        departmentToMeet: candidate.departmentToMeet,
        purpose: candidate.purpose || 'Interview',
        isInterview: true,
      },
      db.users
    );

    const spokenPhrases = buildSpokenArrivalPhrases({
      honorificHostName: hostDetails.honorificName,
      visitorName: candidate.fullName,
      purpose: interview?.roundName || candidate.position || 'interview',
      isInterview: true,
      position: candidate.position,
    });

    const arrivalDetails: ArrivalVisualDetails = {
      visitorName: candidate.fullName,
      visitorType: 'CANDIDATE',
      purpose: interview?.roundName || candidate.position || 'Interview',
      personToMeet: hostDetails.honorificName,
      departmentToMeet: candidate.departmentToMeet || hostDetails.department,
      arrivalTime: timestamp,
      status: candidate.status || 'ARRIVED',
      isInterview: true,
      targetHostUserId: hostDetails.hostUserId,
      targetHostName: hostDetails.honorificName,
      isReceptionAssistance: hostDetails.isReceptionAssistance,
    };

    let voiceAlert: VoiceAlertPayload | undefined = undefined;
    if (hostDetails.hostUserId && !hostDetails.isReceptionAssistance) {
      voiceAlert = {
        id: `voice-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        targetUserId: hostDetails.hostUserId,
        targetHostName: hostDetails.honorificName,
        visitorName: candidate.fullName,
        purpose: 'interview',
        spokenText: spokenPhrases.spokenTextHi,
        spokenTextEn: spokenPhrases.spokenTextEn,
        timestamp,
      };
      console.log(`[HOST VOICE ALERT GENERATED] Targeted to ${hostDetails.honorificName} (${hostDetails.hostUserId}): "${spokenPhrases.spokenTextHi}"`);
    } else {
      console.log(`[RECEPTION ASSIST / UNKNOWN HOST] No single host voice alert generated. Visual arrival dispatched to Reception.`);
    }

    this.publishDomainEvent({
      eventType: 'CANDIDATE_ARRIVED',
      candidateId: candidate.id,
      interviewId: interview?.id,
      registrationSessionId: checkInSessionToken,
      actorType: 'CANDIDATE',
      source: 'CANDIDATE_REGISTRATION',
      targetRoles: ['HR', 'SENIOR_HR', 'ADMIN', 'CEO', 'CO_FOUNDER', 'INTERVIEWER', 'RECEPTION'],
      metadata: {
        candidateName: candidate.fullName,
        position: candidate.position,
        department: candidate.department,
        status: candidate.status,
        currentLocation: candidate.currentLocation,
        arrivalTime: timestamp,
        arrivalDetails,
        voiceAlert,
      },
    });
  }

  // 1B. VISITOR ARRIVAL & CHECK-IN EVENT (CLIENT, BUSINESS, VENDOR, GENERAL INQUIRY)
  public handleVisitorCheckIn(visitor: Visitor, checkInSessionToken?: string) {
    const timestamp = new Date().toISOString();
    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const notificationsToCreate: Notification[] = [];
    const db = dbService.get();

    // Dynamically resolve exact host person & department
    const hostDetails = resolveHostDetails(
      {
        hostId: visitor.hostId,
        personToMeet: visitor.hostName,
        hostName: visitor.hostName,
        hostDepartment: visitor.hostDepartment,
        purpose: visitor.purpose,
        isInterview: false,
      },
      db.users
    );

    const spokenPhrases = buildSpokenArrivalPhrases({
      honorificHostName: hostDetails.honorificName,
      visitorName: visitor.fullName,
      purpose: visitor.purpose || 'meeting',
      isInterview: false,
    });

    const arrivalDetails: ArrivalVisualDetails = {
      visitorName: visitor.fullName,
      visitorType: (visitor.visitorType as any) || 'VISITOR',
      purpose: visitor.purpose || 'Visitor Consultation',
      personToMeet: hostDetails.honorificName,
      departmentToMeet: visitor.hostDepartment || hostDetails.department,
      arrivalTime: timestamp,
      status: visitor.status || 'CHECKED_IN',
      isInterview: false,
      targetHostUserId: hostDetails.hostUserId,
      targetHostName: hostDetails.honorificName,
      isReceptionAssistance: hostDetails.isReceptionAssistance,
    };

    let voiceAlert: VoiceAlertPayload | undefined = undefined;
    if (hostDetails.hostUserId && !hostDetails.isReceptionAssistance) {
      voiceAlert = {
        id: `voice-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        targetUserId: hostDetails.hostUserId,
        targetHostName: hostDetails.honorificName,
        visitorName: visitor.fullName,
        purpose: visitor.purpose || 'meeting',
        spokenText: spokenPhrases.spokenTextHi,
        spokenTextEn: spokenPhrases.spokenTextEn,
        timestamp,
      };
      console.log(`[HOST VOICE ALERT GENERATED] Targeted to ${hostDetails.honorificName} (${hostDetails.hostUserId}): "${spokenPhrases.spokenTextHi}"`);
    } else {
      console.log(`[RECEPTION ASSIST / UNKNOWN HOST] No single host voice alert generated. Visual arrival dispatched to Reception.`);
    }

    const hostRole: UserRole = hostDetails.hostRole;
    const hostUserId: string | undefined = hostDetails.hostUserId;

    const visitorLabel =
      visitor.visitorType === 'CLIENT'
        ? 'Client'
        : visitor.visitorType === 'VENDOR'
        ? 'Vendor'
        : 'Visitor';

    // 1. Notification for the Host (Targeted role & user)
    notificationsToCreate.push({
      id: `notif-${Date.now()}-host`,
      recipientRole: hostRole,
      recipientUserId: hostUserId,
      title: `${visitorLabel} Arrived: ${visitor.fullName}`,
      message: `${visitor.fullName} (${visitor.company || 'Visitor'}) has arrived to meet you for "${visitor.purpose}". Waiting in Reception.`,
      priority: 'HIGH',
      eventType: 'VISITOR_CHECKED_IN',
      entityId: visitor.id,
      entityType: 'VISITOR',
      read: false,
      createdAt: timestamp,
      payload: {
        visitorName: visitor.fullName,
        company: visitor.company,
        purpose: visitor.purpose,
        hostName: hostDetails.honorificName,
        hostDepartment: visitor.hostDepartment,
        phone: visitor.phone,
        email: visitor.email,
        arrived: timeFormatted,
        photo: visitor.photo,
      },
    });

    // 2. Notification for Reception desk
    notificationsToCreate.push({
      id: `notif-${Date.now()}-rec-vis`,
      recipientRole: 'RECEPTION',
      title: `${visitorLabel} Checked In at Front Desk`,
      message: `${visitor.fullName} arrived to meet ${hostDetails.honorificName} (${visitor.hostDepartment || 'Front Desk'}). Direct to Lounge.`,
      priority: 'HIGH',
      eventType: 'VISITOR_CHECKED_IN',
      entityId: visitor.id,
      entityType: 'VISITOR',
      read: false,
      createdAt: timestamp,
      payload: {
        visitorName: visitor.fullName,
        company: visitor.company,
        purpose: visitor.purpose,
        hostName: hostDetails.honorificName,
        arrived: timeFormatted,
      },
    });

    dbService.update((draft) => {
      draft.notifications.unshift(...notificationsToCreate);
      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-vis-arr`,
        timestamp,
        actorType: 'USER',
        actorName: visitor.fullName,
        action: 'VISITOR_CHECKED_IN',
        details: `${visitorLabel} ${visitor.fullName} (${visitor.company || 'Direct'}) checked in to meet ${hostDetails.honorificName}.`,
        entityId: visitor.id,
        entityType: 'VISITOR',
      });
    });

    // Authoritative SSE Broadcast to all authorized staff roles
    this.publishDomainEvent({
      eventType: 'VISITOR_CHECKED_IN',
      visitId: visitor.id,
      registrationSessionId: checkInSessionToken,
      actorType: 'USER',
      source: 'CANDIDATE_REGISTRATION',
      targetRoles: ['RECEPTION', 'ADMIN', hostRole, 'HR', 'SENIOR_HR', 'CEO', 'CO_FOUNDER'],
      metadata: {
        visitorId: visitor.id,
        visitorName: visitor.fullName,
        visitorType: visitor.visitorType,
        company: visitor.company,
        purpose: visitor.purpose,
        hostName: hostDetails.honorificName,
        hostDepartment: visitor.hostDepartment,
        arrivalTime: timestamp,
        arrivalDetails,
        voiceAlert,
      },
    });
  }

  // 2. ROOM ASSIGNMENT BY HR
  public handleRoomAssigned(
    hrUserId: string,
    hrName: string,
    candidateId: string,
    interviewId: string,
    roomId: string
  ) {
    const timestamp = new Date().toISOString();
    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let candidateName = '';
    let roomName = '';
    let interviewerId = '';
    let interviewerName = '';
    let position = '';
    let pantryTaskId = '';

    dbService.update((draft) => {
      const room = draft.rooms.find((r) => r.id === roomId);
      const cand = draft.candidates.find((c) => c.id === candidateId);
      let intv = draft.interviews.find((i) => i.id === interviewId);
      if (!intv && candidateId) {
        intv = draft.interviews.find(
          (i) =>
            i.candidateId === candidateId &&
            i.status !== 'INTERVIEW_COMPLETED' &&
            i.status !== 'CANCELLED'
        );
      }

      if (!room || !cand) {
        throw new Error('Room or Candidate not found');
      }

      if (room.isActive === false) {
        throw new Error(`Cannot assign: "${room.name}" is currently deactivated.`);
      }

      // Room unavailable while cleaning
      if (room.status === 'CLEANING' || room.status === 'NEEDS_CLEANING') {
        throw new Error(
          `Cannot assign: "${room.name}" is currently undergoing cleaning & sanitization by Pantry. Please wait until cleaning is completed or select another room.`
        );
      }

      // Backend Double-Booking Protection:
      if (
        (room.status === 'OCCUPIED' || room.status === 'ASSIGNED') &&
        room.currentCandidateId &&
        room.currentCandidateId !== candidateId
      ) {
        throw new Error(
          `Double-booking prevented: "${room.name}" is currently occupied by ${room.currentCandidateName || 'another candidate'}. Please select another room.`
        );
      }

      // Vacate candidate's previously assigned room if any
      const previousRoom = draft.rooms.find(
        (r) => r.id !== roomId && (r.currentCandidateId === candidateId || r.id === cand.assignedRoomId)
      );
      if (previousRoom) {
        previousRoom.status = 'AVAILABLE';
        previousRoom.currentCandidateId = undefined;
        previousRoom.currentCandidateName = undefined;
        previousRoom.currentInterviewId = undefined;
        previousRoom.assignedInterviewerName = undefined;
        previousRoom.updatedAt = timestamp;
      }

      candidateName = cand.fullName;
      roomName = room.name;
      position = cand.position;
      interviewerId = intv?.interviewerId || '';
      interviewerName = intv?.interviewerName || 'Interviewer';

      // 1. Reserve Room
      room.status = 'ASSIGNED';
      room.currentCandidateId = cand.id;
      room.currentCandidateName = cand.fullName;
      room.currentInterviewId = intv?.id;
      room.assignedInterviewerName = interviewerName;
      room.updatedAt = timestamp;

      // 2. Update Candidate Location & Status
      cand.assignedRoomId = room.id;
      cand.currentLocation = room.name;
      cand.status = 'ROOM_ASSIGNED';

      // 3. Update Interview Record
      if (intv) {
        intv.roomId = room.id;
        intv.roomName = room.name;
        intv.status = 'ROOM_ASSIGNED';
      }

      // 4. Automatically create Pantry Preparation Task
      if (draft.settings.autoAssignPantryOnRoom) {
        pantryTaskId = `pantry-task-${Date.now()}`;
        const pantryTask: PantryTask = {
          id: pantryTaskId,
          roomId: room.id,
          roomName: room.name,
          candidateId: cand.id,
          candidateName: cand.fullName,
          taskType: 'ROOM_PREP',
          description: `Prepare ${room.name}: Sanitization, setup, and 2 bottles of premium mineral water.`,
          requiredItems: ['2x Bottled Mineral Water', 'Room Setup & Lights Check', 'Whiteboard markers'],
          priority: 'HIGH',
          status: 'PENDING',
          createdAt: timestamp,
        };
        draft.pantryTasks.unshift(pantryTask);

        // PANTRY ALERT: WHAT, WHERE, WHEN (No confidential data!)
        draft.notifications.unshift({
          id: `notif-${Date.now()}-pan`,
          recipientRole: 'PANTRY',
          title: 'Room Hospitality Preparation',
          message: `Task: Prepare ${room.name} for interview. Required: Water + Room Preparation. Time: ${timeFormatted}.`,
          priority: 'HIGH',
          eventType: 'ROOM_PREPARATION_REQUIRED',
          entityId: pantryTask.id,
          entityType: 'PANTRY_TASK',
          read: false,
          createdAt: timestamp,
          actionButtons: [
            { label: 'Mark Complete', actionKey: 'COMPLETE_PANTRY_TASK', payload: { taskId: pantryTask.id } },
          ],
          payload: {
            task: 'Prepare Room',
            room: room.name,
            candidate: cand.fullName,
            time: timeFormatted,
            required: 'Water + Room Preparation',
          },
        });
      }

      // 5. Notify Interviewer: Room assigned
      draft.notifications.unshift({
        id: `notif-${Date.now()}-intv-room`,
        recipientRole: 'INTERVIEWER',
        recipientUserId: interviewerId,
        title: `Room Assigned: ${room.name}`,
        message: `${cand.fullName} has been assigned to ${room.name}. You may proceed to start the interview.`,
        priority: 'HIGH',
        eventType: 'ROOM_ASSIGNED',
        entityId: intv?.id || cand.id,
        entityType: 'INTERVIEW',
        read: false,
        createdAt: timestamp,
        actionButtons: [
          { label: 'Start Interview', actionKey: 'START_INTERVIEW', payload: { interviewId: intv?.id } },
        ],
        payload: {
          candidate: cand.fullName,
          room: room.name,
          stage: intv?.roundName,
          status: 'Ready in Room',
        },
      });

      // 6. Notify Reception: Guide candidate
      draft.notifications.unshift({
        id: `notif-${Date.now()}-rec-guide`,
        recipientRole: 'RECEPTION',
        title: 'Escort Candidate to Room',
        message: `Escort ${cand.fullName} to ${room.name} for interview with ${interviewerName}.`,
        priority: 'NORMAL',
        eventType: 'ROOM_ASSIGNED',
        entityId: cand.id,
        entityType: 'CANDIDATE',
        read: false,
        createdAt: timestamp,
        payload: {
          candidate: cand.fullName,
          room: room.name,
          interviewer: interviewerName,
          action: `Guide candidate to ${room.name}`,
        },
      });

      // 7. Timeline events
      draft.timelineEvents.unshift(
        {
          id: `tl-${Date.now()}-hr-room`,
          candidateId: cand.id,
          timestamp,
          actorType: 'USER',
          actorName: hrName,
          eventType: 'ROOM_ASSIGNED_BY_HR',
          description: `HR assigned ${room.name} to candidate ${cand.fullName}.`,
        },
        {
          id: `tl-${Date.now()}-sys-pantry`,
          candidateId: cand.id,
          timestamp,
          actorType: 'SYSTEM',
          actorName: 'Workflow Engine',
          eventType: 'PANTRY_TASK_AUTOMATED',
          description: `Automated hospitality task generated for Pantry to prepare ${room.name} with water & room setup.`,
        }
      );

      // 8. Audit log
      draft.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp,
        actorType: 'USER',
        actorName: hrName,
        actorRole: 'HR',
        action: 'ASSIGN_ROOM',
        details: `Assigned room ${room.name} (${room.id}) to candidate ${cand.fullName} (${cand.id}). Automated downstream workflow tasks.`,
        entityId: room.id,
        entityType: 'ROOM',
      });
    });

    // Broadcast Real-time Domain Event
    this.publishDomainEvent({
      eventType: 'ROOM_ASSIGNED',
      candidateId,
      interviewId,
      roomId,
      actorType: 'STAFF',
      source: 'STAFF_ACTION',
      metadata: {
        candidateName,
        roomId,
        roomName,
        interviewerId,
        interviewerName,
        status: 'ROOM_ASSIGNED',
      },
    });

    if (pantryTaskId) {
      this.publishDomainEvent({
        eventType: 'PANTRY_TASK_CREATED',
        taskId: pantryTaskId,
        roomId,
        candidateId,
        actorType: 'SYSTEM',
        source: 'WORKFLOW_ENGINE',
        targetRoles: ['PANTRY', 'ADMIN', 'HR'],
        metadata: {
          taskId: pantryTaskId,
          roomName,
          candidateName,
          taskType: 'ROOM_PREP',
        },
      });
    }
  }

  // 2.5 CREATE / ASSIGN PANTRY TASK
  public handleCreatePantryTask(
    actorIdOrOptions:
      | string
      | {
          category?: PantryTaskCategory;
          taskType?: PantryTaskType;
          candidateName?: string;
          candidateId?: string;
          roomId?: string;
          roomName?: string;
          location?: string;
          instructions?: string;
          description?: string;
          requiredItems?: string[];
          itemsWithQuantities?: PantryTaskItem[];
          priority?: NotificationPriority;
          assignedSteward?: string;
          assignedStaffId?: string;
          assignedTeam?: string;
          dueTime?: string;
          actorId?: string;
          actorName?: string;
          actorRole?: string;
        },
    legacyActorName?: string,
    legacyActorRole?: string,
    legacyRoomId?: string,
    legacyTaskType?: PantryTaskType,
    legacyDescription?: string,
    legacyRequiredItems?: string[],
    legacyCandidateName?: string,
    legacyPriority: NotificationPriority = 'HIGH',
    legacyCandidateId?: string
  ) {
    const timestamp = new Date().toISOString();
    let createdTask: PantryTask | null = null;

    let category: PantryTaskCategory = 'HOSPITALITY';
    let actorId = 'usr-pantry-suresh';
    let actorName = 'Pantry Steward';
    let actorRole = 'PANTRY';
    let targetRoomId = '';
    let targetRoomName = '';
    let targetLocation = '';
    let targetInstructions = '';
    let taskType: PantryTaskType = 'ROOM_PREP';
    let description = '';
    let requiredItems: string[] = [];
    let itemsWithQuantities: PantryTaskItem[] = [];
    let candidateName = '';
    let candidateId = '';
    let priority: NotificationPriority = 'HIGH';
    let assignedSteward = 'Suresh Kumar (Floor 2 Pantry)';
    let assignedStaffId = '';
    let assignedTeam = 'Pantry Team Alpha';
    let dueTime = 'Immediate';

    if (typeof actorIdOrOptions === 'object') {
      const opts = actorIdOrOptions;
      category = opts.category || 'HOSPITALITY';
      actorId = opts.actorId || 'usr-staff';
      actorName = opts.actorName || 'Authorized Staff';
      actorRole = opts.actorRole || 'STAFF';
      targetRoomId = opts.roomId || '';
      targetRoomName = opts.roomName || '';
      targetLocation = opts.location || opts.roomName || '';
      targetInstructions = opts.instructions || opts.description || '';
      taskType = opts.taskType || 'ROOM_PREP';
      description = opts.description || opts.instructions || 'Hospitality task';
      requiredItems = opts.requiredItems || [];
      itemsWithQuantities = opts.itemsWithQuantities || [];
      candidateName = opts.candidateName || '';
      candidateId = opts.candidateId || '';
      priority = opts.priority || 'HIGH';
      assignedSteward = opts.assignedSteward || 'Suresh Kumar (Floor 2 Pantry)';
      assignedStaffId = opts.assignedStaffId || '';
      assignedTeam = opts.assignedTeam || 'Pantry Team Alpha';
      dueTime = opts.dueTime || 'Within 15 mins';
    } else {
      actorId = actorIdOrOptions || 'usr-pantry-suresh';
      actorName = legacyActorName || 'Pantry Steward';
      actorRole = legacyActorRole || 'PANTRY';
      targetRoomId = legacyRoomId || '';
      taskType = legacyTaskType || 'ROOM_PREP';
      description = legacyDescription || '';
      requiredItems = legacyRequiredItems || [];
      candidateName = legacyCandidateName || '';
      priority = legacyPriority || 'HIGH';
      candidateId = legacyCandidateId || '';
      targetLocation = description;
      targetInstructions = description;
    }

    dbService.update((draft) => {
      let matchedRoom = draft.rooms.find((r) => r.id === targetRoomId || r.roomId === targetRoomId);
      if (!matchedRoom && targetRoomName) {
        matchedRoom = draft.rooms.find((r) => r.name.toLowerCase() === targetRoomName.toLowerCase());
      }

      const finalRoomId = matchedRoom ? matchedRoom.id : (targetRoomId || 'room-custom');
      const finalRoomName = matchedRoom ? matchedRoom.name : (targetRoomName || targetLocation || 'Office Suite');

      const taskId = `pantry-task-${Date.now()}`;
      const defaultItems =
        requiredItems && requiredItems.length > 0
          ? requiredItems
          : ['2x Mineral Water Bottles', 'Sanitized Glassware & Coasters'];

      const pantryTask: PantryTask = {
        id: taskId,
        category,
        roomId: finalRoomId,
        roomName: finalRoomName,
        location: targetLocation || finalRoomName,
        instructions: targetInstructions || description || `Hospitality task for ${finalRoomName}`,
        candidateId: candidateId || (matchedRoom ? matchedRoom.currentCandidateId : '') || '',
        candidateName: candidateName || (matchedRoom ? matchedRoom.currentCandidateName : '') || 'Guest / Candidate',
        taskType,
        description: description || targetInstructions || `Hospitality preparation for ${finalRoomName}`,
        requiredItems: defaultItems,
        itemsWithQuantities: itemsWithQuantities.length > 0 ? itemsWithQuantities : defaultItems.map((it) => ({ item: it, quantity: 1 })),
        priority: priority || 'HIGH',
        status: 'PENDING',
        dueTime: dueTime || 'Immediate',
        assignedSteward: assignedSteward || 'Suresh Kumar (Floor 2 Pantry)',
        assignedStaffId: assignedStaffId || '',
        assignedTeam: assignedTeam || 'Pantry Team Alpha',
        createdById: actorId,
        createdByName: actorName,
        createdByRole: (actorRole as UserRole) || 'HR',
        createdAt: timestamp,
        assignedAt: timestamp,
        auditTrail: [
          {
            timestamp,
            status: 'PENDING',
            actorName,
            actorRole,
            note: `Task created and assigned to ${assignedSteward || 'Pantry Staff'}.`,
          },
        ],
      };

      draft.pantryTasks.unshift(pantryTask);
      createdTask = pantryTask;

      // Broadcast notification to PANTRY role
      draft.notifications.unshift({
        id: `notif-${Date.now()}-pan-assigned`,
        recipientRole: 'PANTRY',
        title: `Task Assigned: ${finalRoomName}`,
        message: `${actorName} assigned: ${pantryTask.instructions || pantryTask.description}`,
        priority: pantryTask.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        eventType: 'ROOM_PREPARATION_REQUIRED',
        entityId: pantryTask.id,
        entityType: 'PANTRY_TASK',
        read: false,
        createdAt: timestamp,
        actionButtons: [
          { label: 'Accept Task', actionKey: 'ACCEPT_PANTRY_TASK', payload: { taskId: pantryTask.id } },
          { label: 'Mark Complete', actionKey: 'COMPLETE_PANTRY_TASK', payload: { taskId: pantryTask.id } },
        ],
        payload: {
          task: pantryTask.description,
          room: finalRoomName,
          candidate: pantryTask.candidateName,
          dueTime: pantryTask.dueTime,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      });

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-pan-assign`,
        timestamp,
        actorType: 'USER',
        actorName,
        actorRole: (actorRole as any) || 'STAFF',
        action: 'ASSIGN_PANTRY_TASK',
        details: `Assigned ${category} task (${taskType}) for ${finalRoomName} (Due: ${pantryTask.dueTime}).`,
        entityId: taskId,
        entityType: 'PANTRY_TASK',
      });
    });

    this.publishDomainEvent({
      eventType: 'PANTRY_TASK_CREATED',
      actorType: 'STAFF',
      source: 'STAFF_ACTION',
      metadata: {
        task: createdTask,
        taskId: createdTask ? (createdTask as PantryTask).id : '',
        roomId: createdTask ? (createdTask as PantryTask).roomId : '',
        roomName: createdTask ? (createdTask as PantryTask).roomName : '',
        taskType: createdTask ? (createdTask as PantryTask).taskType : '',
      },
    });

    this.broadcast({
      type: 'PANTRY_TASKS_UPDATED',
      payload: { taskId: createdTask ? (createdTask as PantryTask).id : '' },
    });

    return createdTask;
  }

  // 2.6 ACCEPT PANTRY TASK
  public handleAcceptPantryTask(taskId: string, stewardName: string, stewardRole: string = 'PANTRY') {
    const timestamp = new Date().toISOString();
    let updatedTask: PantryTask | null = null;

    dbService.update((draft) => {
      const task = draft.pantryTasks.find((t) => t.id === taskId);
      if (!task) throw new Error('Pantry task not found');

      task.status = 'ACCEPTED';
      task.acceptedAt = timestamp;
      task.assignedSteward = stewardName || task.assignedSteward;

      task.auditTrail = task.auditTrail || [];
      task.auditTrail.unshift({
        timestamp,
        status: 'ACCEPTED',
        actorName: stewardName,
        actorRole: stewardRole,
        note: 'Task accepted and acknowledged by pantry steward.',
      });

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-pan-accept`,
        timestamp,
        actorType: 'USER',
        actorName: stewardName,
        actorRole: 'PANTRY',
        action: 'ACCEPT_PANTRY_TASK',
        details: `Accepted task for ${task.roomName}.`,
        entityId: taskId,
        entityType: 'PANTRY_TASK',
      });

      updatedTask = task;
    });

    this.publishDomainEvent({
      eventType: 'PANTRY_TASK_UPDATED',
      actorType: 'STAFF',
      source: 'STAFF_ACTION',
      metadata: { task: updatedTask, taskId, status: 'ACCEPTED', stewardName },
    });

    this.broadcast({
      type: 'PANTRY_TASKS_UPDATED',
      payload: { taskId, status: 'ACCEPTED' },
    });

    return updatedTask;
  }

  // 2.7 START PANTRY TASK
  public handleStartPantryTask(taskId: string, stewardName: string, stewardRole: string = 'PANTRY') {
    const timestamp = new Date().toISOString();
    let updatedTask: PantryTask | null = null;

    dbService.update((draft) => {
      const task = draft.pantryTasks.find((t) => t.id === taskId);
      if (!task) throw new Error('Pantry task not found');

      task.status = 'IN_PROGRESS';
      task.startedAt = timestamp;

      task.auditTrail = task.auditTrail || [];
      task.auditTrail.unshift({
        timestamp,
        status: 'IN_PROGRESS',
        actorName: stewardName,
        actorRole: stewardRole,
        note: 'Task started and service currently in progress.',
      });

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-pan-start`,
        timestamp,
        actorType: 'USER',
        actorName: stewardName,
        actorRole: 'PANTRY',
        action: 'START_PANTRY_TASK',
        details: `Started work on task in ${task.roomName}.`,
        entityId: taskId,
        entityType: 'PANTRY_TASK',
      });

      updatedTask = task;
    });

    this.publishDomainEvent({
      eventType: 'PANTRY_TASK_UPDATED',
      actorType: 'STAFF',
      source: 'STAFF_ACTION',
      metadata: { task: updatedTask, taskId, status: 'IN_PROGRESS', stewardName },
    });

    this.broadcast({
      type: 'PANTRY_TASKS_UPDATED',
      payload: { taskId, status: 'IN_PROGRESS' },
    });

    return updatedTask;
  }

  // 3. PANTRY COMPLETES PREPARATION (STAFF-REPORTED COMPLETION)
  public handlePantryTaskCompleted(taskId: string, stewardName: string) {
    const timestamp = new Date().toISOString();
    let roomName = '';
    let roomId = '';
    let candidateName = '';
    let completedTask: PantryTask | null = null;

    dbService.update((draft) => {
      const task = draft.pantryTasks.find((t) => t.id === taskId);
      if (!task) throw new Error('Pantry task not found');

      task.status = 'COMPLETED';
      task.completedAt = timestamp;
      task.completedBy = stewardName;
      task.isStaffReportedCompleted = true;
      task.staffReportedCompletedAt = timestamp;
      roomName = task.roomName;
      roomId = task.roomId;
      candidateName = task.candidateName;

      // Calculate task duration in minutes
      const startRef = task.startedAt || task.acceptedAt || task.createdAt;
      const diffMs = Math.max(0, new Date(timestamp).getTime() - new Date(startRef).getTime());
      const mins = Math.max(1, Math.round(diffMs / 60000));
      task.completionDurationMinutes = mins;
      task.timeTakenFormatted = diffMs < 60000 ? `${Math.max(1, Math.round(diffMs / 1000))}s` : `${mins} min${mins > 1 ? 's' : ''}`;

      task.auditTrail = task.auditTrail || [];
      task.auditTrail.unshift({
        timestamp,
        status: 'COMPLETED',
        actorName: stewardName,
        actorRole: 'PANTRY',
        note: `Staff reported task completion in ${task.timeTakenFormatted}.`,
      });

      // Update timeline
      const room = draft.rooms.find((r) => r.id === roomId);
      if (room && (task.taskType === 'ROOM_RESET' || room.status === 'CLEANING' || room.status === 'NEEDS_CLEANING')) {
        room.status = 'AVAILABLE';
        room.lastCleanedAt = timestamp;
        room.lastCleanedBy = stewardName;
        room.updatedAt = timestamp;
      }

      if (room?.currentCandidateId) {
        draft.timelineEvents.unshift({
          id: `tl-${Date.now()}-pantry-done`,
          candidateId: room.currentCandidateId,
          timestamp,
          actorType: 'USER',
          actorName: stewardName,
          eventType: 'PANTRY_PREPARATION_COMPLETED',
          description: `${roomName} hospitality & water setup marked complete by Pantry (${task.timeTakenFormatted}).`,
        });
      }

      // Notify task creator and Admin of staff-reported completion
      if (task.createdByRole) {
        draft.notifications.unshift({
          id: `notif-${Date.now()}-pan-done`,
          recipientRole: task.createdByRole,
          recipientUserId: task.createdById,
          title: `Task Completed: ${roomName}`,
          message: `${stewardName} marked task completed in ${task.timeTakenFormatted}. Ready for verification.`,
          priority: 'NORMAL',
          eventType: 'PANTRY_TASK_COMPLETED',
          entityId: taskId,
          entityType: 'PANTRY_TASK',
          read: false,
          createdAt: timestamp,
          payload: {
            taskId,
            room: roomName,
            timeTaken: task.timeTakenFormatted,
            steward: stewardName,
          },
        });
      }

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp,
        actorType: 'USER',
        actorName: stewardName,
        actorRole: 'PANTRY',
        action: 'COMPLETE_PANTRY_TASK',
        details: `Completed hospitality preparation for ${roomName} in ${task.timeTakenFormatted} (Staff-Reported).`,
        entityId: taskId,
        entityType: 'PANTRY_TASK',
      });

      completedTask = task;
    });

    this.publishDomainEvent({
      eventType: 'PANTRY_TASK_COMPLETED',
      taskId,
      roomId,
      actorType: 'STAFF',
      source: 'STAFF_ACTION',
      metadata: { task: completedTask, taskId, roomId, roomName, candidateName, stewardName },
    });
    this.broadcast({
      type: 'ROOMS_UPDATED',
      payload: { roomId },
    });
    this.broadcast({
      type: 'PANTRY_TASKS_UPDATED',
      payload: { taskId, status: 'COMPLETED' },
    });

    return completedTask;
  }

  // 3.1 REPORT ISSUE ON PANTRY TASK
  public handleReportIssuePantryTask(taskId: string, reason: string, stewardName: string) {
    const timestamp = new Date().toISOString();
    let updatedTask: PantryTask | null = null;

    dbService.update((draft) => {
      const task = draft.pantryTasks.find((t) => t.id === taskId);
      if (!task) throw new Error('Pantry task not found');

      task.status = 'ISSUE_REPORTED';
      task.issueReportedAt = timestamp;
      task.issueReason = reason;

      task.auditTrail = task.auditTrail || [];
      task.auditTrail.unshift({
        timestamp,
        status: 'ISSUE_REPORTED',
        actorName: stewardName,
        actorRole: 'PANTRY',
        note: `Issue reported: ${reason}`,
      });

      // Send High Priority Notification to Creator and Admin
      draft.notifications.unshift({
        id: `notif-${Date.now()}-pan-issue`,
        recipientRole: 'ADMIN',
        title: `Pantry Issue Reported: ${task.roomName}`,
        message: `${stewardName} reported: "${reason}" on task for ${task.candidateName}.`,
        priority: 'HIGH',
        eventType: 'PANTRY_TASK_ISSUE',
        entityId: taskId,
        entityType: 'PANTRY_TASK',
        read: false,
        createdAt: timestamp,
      });

      if (task.createdByRole && task.createdByRole !== 'ADMIN') {
        draft.notifications.unshift({
          id: `notif-${Date.now()}-pan-issue-creator`,
          recipientRole: task.createdByRole,
          recipientUserId: task.createdById,
          title: `Pantry Issue Reported: ${task.roomName}`,
          message: `${stewardName} reported: "${reason}".`,
          priority: 'HIGH',
          eventType: 'PANTRY_TASK_ISSUE',
          entityId: taskId,
          entityType: 'PANTRY_TASK',
          read: false,
          createdAt: timestamp,
        });
      }

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-pan-issue`,
        timestamp,
        actorType: 'USER',
        actorName: stewardName,
        actorRole: 'PANTRY',
        action: 'REPORT_PANTRY_ISSUE',
        details: `Reported issue on ${task.roomName}: ${reason}`,
        entityId: taskId,
        entityType: 'PANTRY_TASK',
      });

      updatedTask = task;
    });

    this.publishDomainEvent({
      eventType: 'PANTRY_TASK_UPDATED',
      actorType: 'STAFF',
      source: 'STAFF_ACTION',
      metadata: { task: updatedTask, taskId, status: 'ISSUE_REPORTED', reason, stewardName },
    });

    this.broadcast({
      type: 'PANTRY_TASKS_UPDATED',
      payload: { taskId, status: 'ISSUE_REPORTED' },
    });

    return updatedTask;
  }

  // 3.2 VERIFY PANTRY TASK COMPLETION (ADMIN / CREATOR ONLY)
  public handleVerifyPantryTask(taskId: string, verifierName: string, verifierRole: string) {
    const timestamp = new Date().toISOString();
    let updatedTask: PantryTask | null = null;

    dbService.update((draft) => {
      const task = draft.pantryTasks.find((t) => t.id === taskId);
      if (!task) throw new Error('Pantry task not found');

      task.isVerifiedCompleted = true;
      task.verifiedAt = timestamp;
      task.verifiedBy = verifierName;

      task.auditTrail = task.auditTrail || [];
      task.auditTrail.unshift({
        timestamp,
        status: task.status,
        actorName: verifierName,
        actorRole: verifierRole,
        note: 'Task completion verified and approved by supervisor.',
      });

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-pan-verify`,
        timestamp,
        actorType: 'USER',
        actorName: verifierName,
        actorRole: verifierRole,
        action: 'VERIFY_PANTRY_TASK',
        details: `Verified completion of ${task.category || 'Hospitality'} task for ${task.roomName}.`,
        entityId: taskId,
        entityType: 'PANTRY_TASK',
      });

      updatedTask = task;
    });

    this.publishDomainEvent({
      eventType: 'PANTRY_TASK_UPDATED',
      actorType: 'STAFF',
      source: 'STAFF_ACTION',
      metadata: { task: updatedTask, taskId, isVerifiedCompleted: true, verifierName },
    });

    this.broadcast({
      type: 'PANTRY_TASKS_UPDATED',
      payload: { taskId, isVerifiedCompleted: true },
    });

    return updatedTask;
  }

  // 3.3 CANCEL PANTRY TASK (ADMIN / CREATOR ONLY)
  public handleCancelPantryTask(taskId: string, cancellerName: string, cancellerRole: string, reason?: string) {
    const timestamp = new Date().toISOString();
    let updatedTask: PantryTask | null = null;

    dbService.update((draft) => {
      const task = draft.pantryTasks.find((t) => t.id === taskId);
      if (!task) throw new Error('Pantry task not found');

      task.status = 'CANCELLED';
      task.cancelledAt = timestamp;
      task.cancelledBy = cancellerName;
      task.cancellationReason = reason || 'Cancelled by authorized requester';

      task.auditTrail = task.auditTrail || [];
      task.auditTrail.unshift({
        timestamp,
        status: 'CANCELLED',
        actorName: cancellerName,
        actorRole: cancellerRole,
        note: `Task cancelled: ${task.cancellationReason}`,
      });

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-pan-cancel`,
        timestamp,
        actorType: 'USER',
        actorName: cancellerName,
        actorRole: cancellerRole,
        action: 'CANCEL_PANTRY_TASK',
        details: `Cancelled task for ${task.roomName}: ${task.cancellationReason}.`,
        entityId: taskId,
        entityType: 'PANTRY_TASK',
      });

      updatedTask = task;
    });

    this.publishDomainEvent({
      eventType: 'PANTRY_TASK_UPDATED',
      actorType: 'STAFF',
      source: 'STAFF_ACTION',
      metadata: { task: updatedTask, taskId, status: 'CANCELLED', cancellerName },
    });

    this.broadcast({
      type: 'PANTRY_TASKS_UPDATED',
      payload: { taskId, status: 'CANCELLED' },
    });

    return updatedTask;
  }

  // 3B. PANTRY MARKS ROOM CLEANING -> CLEANED / READY DIRECTLY
  public handleRoomMarkedCleaned(roomId: string, stewardName: string = 'Suresh Kumar (Pantry)') {
    const timestamp = new Date().toISOString();
    let roomName = '';
    let updatedRoom: Room | null = null;

    dbService.update((draft) => {
      const room = draft.rooms.find((r) => r.id === roomId || r.roomId === roomId);
      if (!room) throw new Error('Room not found');

      room.status = 'AVAILABLE';
      room.currentCandidateId = undefined;
      room.currentCandidateName = undefined;
      room.currentInterviewId = undefined;
      room.assignedInterviewerName = undefined;
      room.lastCleanedAt = timestamp;
      room.lastCleanedBy = stewardName;
      room.updatedAt = timestamp;
      roomName = room.name;
      updatedRoom = { ...room };

      // Mark all pending cleaning/reset tasks for this room as COMPLETED
      draft.pantryTasks.forEach((t) => {
        if ((t.roomId === roomId || t.roomId === room.id) && t.status !== 'COMPLETED') {
          t.status = 'COMPLETED';
          t.completedAt = timestamp;
          t.completedBy = stewardName;
        }
      });

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-clean`,
        timestamp,
        actorType: 'USER',
        actorName: stewardName,
        actorRole: 'PANTRY',
        action: 'ROOM_CLEANED_READY',
        details: `Room "${room.name}" marked CLEANED / READY by ${stewardName}. Room is now available.`,
        entityId: room.id,
        entityType: 'ROOM',
      });
    });

    this.broadcast({
      type: 'ROOM_CLEANED_READY',
      payload: { roomId, roomName, stewardName, timestamp, room: updatedRoom },
    });
    this.broadcast({
      type: 'ROOMS_UPDATED',
      payload: { room: updatedRoom },
    });
  }

  // 4. INTERVIEWER STARTS INTERVIEW
  public handleInterviewStarted(interviewId: string, interviewerName: string) {
    const timestamp = new Date().toISOString();
    let candId = '';
    let candName = '';
    let roomName = '';
    let roomId = '';

    dbService.update((draft) => {
      const intv = draft.interviews.find((i) => i.id === interviewId);
      if (!intv) throw new Error('Interview not found');

      intv.status = 'INTERVIEW_STARTED';
      intv.startedAt = timestamp;
      candId = intv.candidateId;
      candName = intv.candidateName;

      const cand = draft.candidates.find((c) => c.id === intv.candidateId);
      if (cand) {
        cand.status = 'IN_INTERVIEW';
      }

      if (intv.roomId) {
        roomId = intv.roomId;
        const room = draft.rooms.find((r) => r.id === intv.roomId);
        if (room) {
          room.status = 'OCCUPIED';
          roomName = room.name;
        }
      }

      draft.timelineEvents.unshift({
        id: `tl-${Date.now()}-intv-started`,
        candidateId: candId,
        timestamp,
        actorType: 'USER',
        actorName: interviewerName,
        eventType: 'INTERVIEW_STARTED',
        description: `Interview started by ${interviewerName} (${intv.roundName}) in ${roomName || 'assigned room'}.`,
      });

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp,
        actorType: 'USER',
        actorName: interviewerName,
        actorRole: 'INTERVIEWER',
        action: 'START_INTERVIEW',
        details: `Started interview ${interviewId} with candidate ${candName} in ${roomName}.`,
        entityId: interviewId,
        entityType: 'INTERVIEW',
      });
    });

    this.publishDomainEvent({
      eventType: 'INTERVIEW_STARTED',
      interviewId,
      candidateId: candId,
      roomId,
      actorType: 'STAFF',
      source: 'STAFF_ACTION',
      metadata: { interviewId, candidateId: candId, candidateName: candName, roomName, interviewerName },
    });
  }

  // 5. INTERVIEWER ENDS INTERVIEW WITH HUMAN DECISION
  public handleInterviewCompleted(
    interviewId: string,
    interviewerName: string,
    outcome: 'NEXT_INTERVIEW' | 'HOLD' | 'REJECTED' | 'SELECTED',
    notes: string,
    nextInterviewerId?: string,
    nextRoundName?: string,
    nextRoomId?: string
  ) {
    const timestamp = new Date().toISOString();
    let candId = '';
    let candName = '';
    let previousRoomId = '';
    let previousRoomName = '';
    let nextInterviewerName = '';
    let newInterviewId = '';

    dbService.update((draft) => {
      const intv = draft.interviews.find((i) => i.id === interviewId);
      if (!intv) throw new Error('Interview not found');

      intv.status = 'INTERVIEW_COMPLETED';
      intv.completedAt = timestamp;
      intv.outcome = outcome;
      intv.interviewerFeedback = notes;
      candId = intv.candidateId;
      candName = intv.candidateName;
      previousRoomId = intv.roomId || '';

      const cand = draft.candidates.find((c) => c.id === intv.candidateId);
      const room = draft.rooms.find((r) => r.id === previousRoomId);

      if (room) {
        previousRoomName = room.name;
        // Room remains unavailable until cleaning is completed by Pantry
        room.status = 'CLEANING';
        room.cleaningRequestedAt = timestamp;
        room.currentCandidateId = undefined;
        room.currentCandidateName = undefined;
        room.currentInterviewId = undefined;
        room.assignedInterviewerName = undefined;
        room.updatedAt = timestamp;

        // Pantry sees ONLY the required cleaning task (no candidate resume, ID, or sensitive details)
        draft.pantryTasks.unshift({
          id: `pantry-clean-${Date.now()}`,
          roomId: room.id,
          roomName: room.name,
          candidateName: '', // Redacted for pantry confidentiality
          taskType: 'ROOM_RESET',
          description: `Clean ${room.name} after candidate interview.`,
          requiredItems: ['Sanitize conference table & chairs', 'Clear used glasses / bottles', 'Restock fresh mineral water'],
          priority: 'HIGH',
          status: 'PENDING',
          createdAt: timestamp,
        });
      }

      if (outcome === 'NEXT_INTERVIEW') {
        const nextIntvUser = draft.users.find((u) => u.id === nextInterviewerId);
        nextInterviewerName =
          nextInterviewerId === 'usr-cofounder-kimmi' || nextIntvUser?.name?.includes('Kimmi')
            ? 'Kimmi Mam – Senior HR Interview'
            : nextIntvUser?.name || 'Next Interviewer';
        const isSenior = nextInterviewerId === 'usr-cofounder-kimmi' || nextInterviewerName.includes('Kimmi') || (cand && /senior|director|lead|vp|head|manager/i.test(cand.position));
        const targetRoundName = isSenior ? 'Senior HR Interview' : (nextRoundName || 'Next Evaluation Round');
        const targetCategory = normalizeInterviewRound(targetRoundName);

        // Check if an interview for this next round already exists
        const existingNext = draft.interviews.find(
          (i) =>
            i.candidateId === candId &&
            !(i as any).isDeleted &&
            normalizeInterviewRound(i.roundName) === targetCategory &&
            i.status !== 'INTERVIEW_COMPLETED'
        );

        let activeNextIntv: Interview;
        if (existingNext) {
          newInterviewId = existingNext.id;
          existingNext.status = 'CANDIDATE_ARRIVED';
          if (nextInterviewerId) existingNext.interviewerId = nextInterviewerId;
          if (nextInterviewerName) existingNext.interviewerName = nextInterviewerName;
          existingNext.updatedAt = timestamp;
          activeNextIntv = existingNext;
        } else {
          newInterviewId = `intv-${Date.now()}`;
          const newIntv: Interview = {
            id: newInterviewId,
            candidateId: candId,
            candidateName: candName,
            position: cand?.position || intv.position,
            roundName: targetRoundName,
            interviewerId: nextInterviewerId || '',
            interviewerName: nextInterviewerName,
            scheduledTime: 'Immediate / Today',
            status: 'CANDIDATE_ARRIVED',
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          draft.interviews.push(newIntv);
          activeNextIntv = newIntv;
        }

        if (cand) {
          cand.status = 'WAITING';
          cand.currentLocation = isSenior ? 'With Kimmi Mam – Senior HR Interview' : 'Waiting Area / Lounge';
          cand.currentInterviewId = activeNextIntv.id;
        }

        // Optional Immediate Room Allocation for Next Round
        if (nextRoomId) {
          const roomToAssign = draft.rooms.find((r) => r.id === nextRoomId || r.roomId === nextRoomId);
          if (roomToAssign) {
            roomToAssign.status = 'ASSIGNED';
            roomToAssign.currentCandidateId = candId;
            roomToAssign.currentCandidateName = candName;
            roomToAssign.currentInterviewId = newInterviewId;
            roomToAssign.assignedInterviewerName = nextInterviewerName;
            activeNextIntv.roomId = roomToAssign.id;
            activeNextIntv.roomName = roomToAssign.name;
            activeNextIntv.status = 'ROOM_ASSIGNED';
            if (cand) {
              cand.assignedRoomId = roomToAssign.id;
              cand.assignedRoomName = roomToAssign.name;
              cand.status = 'ROOM_ASSIGNED';
              cand.currentLocation = roomToAssign.name;
            }
          }
        }

        if (nextInterviewerId) {
          draft.notifications.unshift({
            id: `notif-${Date.now()}-next-intv`,
            recipientRole: 'INTERVIEWER',
            recipientUserId: nextInterviewerId,
            title: 'Candidate Ready for Next Round',
            message: `${candName} has cleared ${intv.roundName} and is waiting for ${activeNextIntv.roundName} with you.`,
            priority: 'HIGH',
            eventType: 'NEXT_INTERVIEW_CREATED',
            entityId: activeNextIntv.id,
            entityType: 'INTERVIEW',
            read: false,
            createdAt: timestamp,
            actionButtons: [
              { label: 'View Profile', actionKey: 'VIEW_CANDIDATE', payload: { candidateId: candId } },
            ],
          });
        }

        draft.notifications.unshift({
          id: `notif-${Date.now()}-hr-next`,
          recipientRole: 'HR',
          title: `Stage Cleared: ${candName}`,
          message: `${candName} advanced to ${activeNextIntv.roundName} with ${nextInterviewerName}. Room assignment required.`,
          priority: 'HIGH',
          eventType: 'NEXT_INTERVIEW_CREATED',
          entityId: candId,
          entityType: 'CANDIDATE',
          read: false,
          createdAt: timestamp,
          actionButtons: [
            { label: 'Assign Room', actionKey: 'ASSIGN_ROOM', payload: { candidateId: candId, interviewId: activeNextIntv.id } },
          ],
        });

        draft.timelineEvents.unshift({
          id: `tl-${Date.now()}-next`,
          candidateId: candId,
          timestamp,
          actorType: 'USER',
          actorName: interviewerName,
          eventType: 'ADVANCED_TO_NEXT_STAGE',
          description: `Candidate advanced to ${activeNextIntv.roundName} with ${nextInterviewerName}. Candidate moved back to Waiting Lounge.`,
        });
      } else {
        if (cand) {
          cand.status = outcome === 'SELECTED' ? 'OFFERED' : outcome === 'REJECTED' ? 'REJECTED' : 'COMPLETED';
          cand.currentLocation = 'Reception - Awaiting Checkout';
        }

        draft.notifications.unshift({
          id: `notif-${Date.now()}-rec-co`,
          recipientRole: 'RECEPTION',
          title: 'Candidate Completed Interview - Ready for Checkout',
          message: `${candName} has finished their interview process. Assist with visitor exit and checkout.`,
          priority: 'NORMAL',
          eventType: 'READY_FOR_CHECKOUT',
          entityId: candId,
          entityType: 'CANDIDATE',
          read: false,
          createdAt: timestamp,
          actionButtons: [
            { label: 'Process Checkout', actionKey: 'CHECKOUT_CANDIDATE', payload: { candidateId: candId } },
          ],
        });

        draft.timelineEvents.unshift({
          id: `tl-${Date.now()}-end-intv`,
          candidateId: candId,
          timestamp,
          actorType: 'USER',
          actorName: interviewerName,
          eventType: 'INTERVIEW_OUTCOME_RECORDED',
          description: `Interview concluded with outcome: ${outcome}. Feedback recorded. Room ${previousRoomName} released.`,
        });
      }

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp,
        actorType: 'USER',
        actorName: interviewerName,
        actorRole: 'INTERVIEWER',
        action: 'COMPLETE_INTERVIEW',
        details: `Concluded interview ${interviewId} for ${candName} with outcome ${outcome}.`,
        entityId: interviewId,
        entityType: 'INTERVIEW',
      });
    });

    this.publishDomainEvent({
      eventType: 'INTERVIEW_COMPLETED',
      interviewId,
      candidateId: candId,
      actorType: 'STAFF',
      source: 'STAFF_ACTION',
      metadata: {
        interviewId,
        candidateId: candId,
        candidateName: candName,
        outcome,
        previousRoomName,
        nextInterviewId: newInterviewId || undefined,
      },
    });
  }

  // 6. VISITOR / CANDIDATE CHECKOUT BY RECEPTION
  public handleCheckout(candidateId: string, receptionistName: string) {
    const timestamp = new Date().toISOString();
    let candName = '';
    let durationMinutes = 0;

    dbService.update((draft) => {
      const cand = draft.candidates.find((c) => c.id === candidateId);
      if (!cand) throw new Error('Candidate not found');

      candName = cand.fullName;
      cand.status = 'CHECKED_OUT';
      cand.assignedRoomId = undefined;
      cand.currentLocation = 'Departed / Checked Out';
      cand.checkOutTime = timestamp;

      // Free room if still assigned to this candidate
      const occupiedRoom = draft.rooms.find((r) => r.currentCandidateId === candidateId);
      if (occupiedRoom) {
        occupiedRoom.status = 'AVAILABLE';
        occupiedRoom.currentCandidateId = undefined;
        occupiedRoom.currentCandidateName = undefined;
        occupiedRoom.currentInterviewId = undefined;
        occupiedRoom.assignedInterviewerName = undefined;
        occupiedRoom.updatedAt = timestamp;
      }

      if (cand.arrivalTime) {
        const arrTime = new Date(cand.arrivalTime).getTime();
        const depTime = new Date(timestamp).getTime();
        durationMinutes = Math.max(1, Math.round((depTime - arrTime) / 60000));
        cand.totalDurationMinutes = durationMinutes;
      }

      draft.timelineEvents.unshift({
        id: `tl-${Date.now()}-checkout`,
        candidateId,
        timestamp,
        actorType: 'USER',
        actorName: receptionistName,
        eventType: 'VISITOR_CHECKED_OUT',
        description: `Candidate physical exit processed. Total visit duration: ${durationMinutes} minutes. Complete audit log sealed.`,
      });

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp,
        actorType: 'USER',
        actorName: receptionistName,
        actorRole: 'RECEPTION',
        action: 'VISITOR_CHECKOUT',
        details: `Processed physical checkout for ${candName} (${candidateId}). Duration: ${durationMinutes} mins.`,
        entityId: candidateId,
        entityType: 'CANDIDATE',
      });
    });

    this.publishDomainEvent({
      eventType: 'CANDIDATE_CHECKED_OUT',
      candidateId,
      actorType: 'STAFF',
      source: 'STAFF_ACTION',
      metadata: { candidateId, candidateName: candName, durationMinutes },
    });
  }

  public onCandidateLivePhotoCaptured(
    candidateId: string,
    arrivalPhoto: string,
    capturedBy: string,
    capturedByName: string,
    capturedAtIso?: string
  ) {
    const timestamp = capturedAtIso || new Date().toISOString();
    const uploadTimestamp = new Date().toISOString();
    let candName = 'Candidate';

    dbService.update((draft) => {
      const cand = draft.candidates.find((c) => c.id === candidateId);
      if (!cand) throw new Error('Candidate not found');
      candName = cand.fullName;
      cand.arrivalPhoto = arrivalPhoto;
      cand.arrivalPhotoCapturedAt = timestamp;
      cand.arrivalPhotoCapturedBy = capturedBy;
      cand.arrivalPhotoCapturedByName = capturedByName;
      cand.receptionPhotoUrl = arrivalPhoto;
      cand.receptionPhotoCapturedAt = timestamp;
      cand.photoUrl = arrivalPhoto;
      cand.livePhoto = arrivalPhoto;
      cand.livePhotoCapturedAt = timestamp;
      cand.livePhotoCapturedBy = capturedByName;
      cand.photoUploadStatus = 'SUCCESS';
      cand.photoUploadedAt = uploadTimestamp;
      cand.photoMetadata = {
        photoUrl: arrivalPhoto,
        capturedAt: timestamp,
        capturedBy: capturedBy || 'RECEPTION',
        capturedByName: capturedByName || 'Reception Staff',
        captureSource: 'RECEPTION_LIVE_CAMERA',
        uploadStatus: 'SUCCESS',
        uploadedAt: uploadTimestamp,
      };
      cand.updatedAt = uploadTimestamp;

      draft.timelineEvents.unshift({
        id: `tl-${Date.now()}-photo`,
        candidateId,
        timestamp,
        actorType: 'USER',
        actorName: capturedByName || 'Reception Staff',
        eventType: 'LIVE_PHOTO_CAPTURED',
        description: `Physical live arrival photo captured & verified at reception desk by ${capturedByName || 'Reception Staff'}.`,
      });

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-rec-photo`,
        timestamp: uploadTimestamp,
        actorType: 'USER',
        actorName: capturedByName || 'Reception Staff',
        actorRole: 'RECEPTION',
        action: 'CAPTURE_RECEPTION_LIVE_PHOTO',
        details: `Receptionist ${capturedByName} captured verified live arrival photo for candidate ${candName} (${candidateId}).`,
        entityId: candidateId,
        entityType: 'CANDIDATE',
      });
    });

    this.publishDomainEvent({
      eventType: 'CANDIDATE_LIVE_PHOTO_CAPTURED',
      candidateId,
      actorType: 'STAFF',
      source: 'STAFF_ACTION',
      metadata: {
        candidateId,
        candidateName: candName,
        capturedAt: timestamp,
        uploadedAt: uploadTimestamp,
        capturedByName,
        photoUrl: arrivalPhoto,
      },
    });
  }

  public onCandidateResumeUploaded(candidateId: string, resumeMetadata: CandidateResumeMetadata) {
    const timestamp = new Date().toISOString();
    let candName = 'Candidate';

    dbService.update((draft) => {
      const cand = draft.candidates.find((c) => c.id === candidateId);
      if (cand) {
        candName = cand.fullName;
        cand.resumeMetadata = resumeMetadata;
        cand.resumeFileName = resumeMetadata.originalFileName;
        cand.resumeFileSize = resumeMetadata.fileSize;
        cand.resumeMimeType = resumeMetadata.mimeType;
        cand.resumeUploadedAt = resumeMetadata.uploadedAt;
        cand.updatedAt = timestamp;

        draft.timelineEvents.unshift({
          id: `tl-${Date.now()}-res`,
          candidateId,
          timestamp,
          actorType: 'USER',
          actorName: candName,
          eventType: 'RESUME_UPLOADED',
          description: `Resume document "${resumeMetadata.originalFileName}" (${resumeMetadata.fileSize}) uploaded & verified in persistent storage.`,
        });

        draft.auditLogs.unshift({
          id: `aud-${Date.now()}-res-upload`,
          timestamp,
          actorType: 'USER',
          actorName: candName,
          action: 'UPLOAD_RESUME',
          details: `Candidate ${candName} (${candidateId}) uploaded resume "${resumeMetadata.originalFileName}".`,
          entityId: candidateId,
          entityType: 'CANDIDATE',
        });
      }
    });

    this.publishDomainEvent({
      eventType: 'CANDIDATE_RESUME_UPLOADED',
      candidateId,
      actorType: 'CANDIDATE',
      source: 'CANDIDATE_REGISTRATION',
      metadata: {
        candidateId,
        candidateName: candName,
        fileName: resumeMetadata.originalFileName,
        fileSize: resumeMetadata.fileSize,
      },
    });
  }
}

export const eventWorkflowEngine = new EventWorkflowEngine();
