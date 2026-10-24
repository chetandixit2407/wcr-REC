import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type {
  UserRole,
  Candidate,
  Interview,
  Room,
  Notification,
  PantryTask,
  Visitor,
  User,
  ChatMessage,
  ActionTask,
} from './types/index.ts';
import { useRealtimeEvents } from './hooks/useRealtimeEvents.ts';
import { SidebarNav, type NavSection } from './components/SidebarNav.tsx';
import { TopHeader } from './components/TopHeader.tsx';
import { MobileNavigation } from './components/MobileNavigation.tsx';
import { OperationsCommandHeader } from './components/OperationsCommandHeader.tsx';
import {
  VisitorArrivalTimeline,
  VisitorJourneyOverview,
  computeArrivalStage,
  computeVisitorArrivalStage,
  type ArrivalStage,
} from './components/VisitorArrivalTimeline.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import { NotificationDrawer } from './components/NotificationDrawer.tsx';
import { CandidateCheckInForm } from './components/CandidateCheckInForm.tsx';
import { GeneralNewCandidateRegister } from './components/GeneralNewCandidateRegister.tsx';
import { CandidateDossierModal } from './components/CandidateDossierModal.tsx';
import { AssignRoomModal } from './components/AssignRoomModal.tsx';
import { EndInterviewModal } from './components/EndInterviewModal.tsx';
import { QRPassModal } from './components/QRPassModal.tsx';
import { WalkInModal } from './components/WalkInModal.tsx';
import { CreatePantryTaskModal } from './components/CreatePantryTaskModal.tsx';
import { PantryRealtimeMonitorModal } from './components/PantryRealtimeMonitorModal.tsx';
import { SecureDocumentViewerModal } from './components/SecureDocumentViewerModal.tsx';
import { ForgotPasswordModal } from './components/ForgotPasswordModal.tsx';
import { ResetPasswordView } from './components/ResetPasswordView.tsx';
import { InternalChatModal } from './components/InternalChatModal.tsx';
import {
  DashboardCardDetailsModal,
  type DashboardModalTarget,
} from './components/DashboardCardDetailsModal.tsx';
import type { DeleteRecordType } from './components/modals/DeleteConfirmModal.tsx';
import {
  authenticatedFetch,
  safeJson,
  getStoredStaffToken,
  setStoredStaffToken,
  clearStoredStaffToken,
  getStoredStaffRole,
  setStoredStaffRole,
} from './utils/apiClient.ts';
import { normalizeInterviewRound, getInterviewRoundKey } from './utils/candidateHelpers.ts';

// Role Dashboards
import { HRDashboard } from './components/dashboards/HRDashboard.tsx';
import { AdminDashboard } from './components/dashboards/AdminDashboard.tsx';
import { CEODashboard } from './components/dashboards/CEODashboard.tsx';
import { InterviewerDashboard } from './components/dashboards/InterviewerDashboard.tsx';
import { SeniorHRDashboard } from './components/dashboards/SeniorHRDashboard.tsx';
import { ReceptionDashboard } from './components/dashboards/ReceptionDashboard.tsx';
import { PantryDashboard } from './components/dashboards/PantryDashboard.tsx';
import { useSettings } from './context/SettingsContext.tsx';
import { ApplicationSettingsView } from './components/ApplicationSettingsView.tsx';
import { SecondaryOperationsMoreView } from './components/SecondaryOperationsMoreView.tsx';
import { HRSubProfileView } from './components/HRSubProfileView.tsx';
import { DashboardWatermark } from './components/DashboardWatermark.tsx';
import { CinematicBackground } from './components/CinematicBackground.tsx';
import { PostLoginLogoAnimation } from './components/PostLoginLogoAnimation.tsx';
import { smoothEase, pageMotion } from './utils/motion.ts';

import {
  Sparkles,
  QrCode,
  UserCheck,
  Smartphone,
  UserPlus,
  Shield,
  Key,
  X,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { dispatchHostVoiceAlert, playTestVoiceAlert, unlockSpeechSynthesis } from './utils/voiceAlertService.ts';

export default function App() {
  const { settings, t } = useSettings();
  const [routePath, setRoutePath] = useState<string>(() => window.location.pathname);
  const [currentRole, setCurrentRole] = useState<UserRole>(() => (getStoredStaffRole() as UserRole) || 'HR');
  const [currentUserId, setCurrentUserId] = useState<string>('usr-hr-nisha');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string>(() => getStoredStaffToken());

  // Floating Realtime Intake & Arrival Alert Toast
  const [realtimeToast, setRealtimeToast] = useState<{
    id: string;
    title: string;
    message: string;
    candidateId?: string;
    timestamp: string;
    isVoiceTarget?: boolean;
    personToMeet?: string;
    visitorName?: string;
    purpose?: string;
    status?: string;
  } | null>(null);

  // Application Data States
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pantryTasks, setPantryTasks] = useState<PantryTask[]>([]);
  const [actionTasks, setActionTasks] = useState<ActionTask[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);

  // Modals & Drawers
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<
    | 'GENERAL_REGISTER'
    | 'CHECK_IN'
    | 'QR_PASS'
    | 'WALK_IN'
    | 'DOSSIER'
    | 'ASSIGN_ROOM'
    | 'END_INTERVIEW'
    | 'STAFF_LOGIN'
    | 'FORGOT_PASSWORD'
    | 'CREATE_PANTRY_TASK'
    | 'PANTRY_MONITOR'
    | null
  >(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [checkInToken, setCheckInToken] = useState<string>('WCR-APPT-901');

  // Active Navigation & Cinematic Stage Filter States
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [moreInitialTab, setMoreInitialTab] = useState<'all' | 'lounge' | 'meetings' | 'checkout'>('all');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [filterStage, setFilterStage] = useState<ArrivalStage | null>(null);
  const [dashboardDetailsModalTarget, setDashboardDetailsModalTarget] = useState<DashboardModalTarget | null>(null);

  // Staff Login State
  const [loginEmail, setLoginEmail] = useState<string>('nisha@whitecollarrealty.com');
  const [loginPassword, setLoginPassword] = useState<string>('wcr123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);
  const [showPostLoginAnimation, setShowPostLoginAnimation] = useState<boolean>(false);
  const [animatingUser, setAnimatingUser] = useState<User | null>(null);

  // Internal Office Chat State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [chatRecipientId, setChatRecipientId] = useState<string>('');
  const [chatChannelId, setChatChannelId] = useState<string>('general');
  const [chatPrefillCandidateId, setChatPrefillCandidateId] = useState<string>('');
  const [chatPrefillRoomId, setChatPrefillRoomId] = useState<string>('');
  const [chatPrefillMessage, setChatPrefillMessage] = useState<string>('');
  const [chatToast, setChatToast] = useState<{
    id: string;
    senderName: string;
    senderRole: string;
    content: string;
    candidateId?: string;
    candidateName?: string;
    roomId?: string;
    roomName?: string;
    isPriority?: boolean;
    channelId?: string;
    recipientId?: string;
    timestamp: string;
  } | null>(null);

  const openChatWithContext = useCallback(
    (options?: {
      candidateId?: string;
      roomId?: string;
      channelId?: string;
      recipientId?: string;
      initialMessage?: string;
    }) => {
      if (options?.candidateId) setChatPrefillCandidateId(options.candidateId);
      if (options?.roomId) setChatPrefillRoomId(options.roomId);
      if (options?.initialMessage) setChatPrefillMessage(options.initialMessage);
      if (options?.channelId) setChatChannelId(options.channelId);
      if (options?.recipientId) setChatRecipientId(options.recipientId);
      setIsChatOpen(true);
      setUnreadChatCount(0);
    },
    []
  );

  useEffect(() => {
    if (currentUser?.id) {
      authenticatedFetch(`/api/chat/unread?userId=${currentUser.id}`)
        .then((r) => safeJson(r, { success: false, total: 0 }))
        .then((d) => {
          if (d.success && typeof d.total === 'number') {
            setUnreadChatCount(d.total);
          }
        })
        .catch((err) => console.warn('Failed unread count fetch', err));
    }
  }, [currentUser?.id]);

  // Initialize Authenticated Staff Session from backend on mount
  useEffect(() => {
    authenticatedFetch('/api/auth/me')
      .then((r) => safeJson(r, { success: false, authenticated: false }))
      .then((data) => {
        if (data.success && data.authenticated && data.user) {
          setCurrentUser(data.user);
          setCurrentRole(data.user.role);
          setCurrentUserId(data.user.id);
          setStoredStaffRole(data.user.role);
          const tok = data.session?.token || data.token;
          if (tok) {
            setSessionToken(tok);
            setStoredStaffToken(tok);
          }
        } else {
          clearStoredStaffToken();
          setSessionToken('');
          setCurrentUser(null);
        }
      })
      .catch((err) => {
        console.warn('Auth check error', err);
        clearStoredStaffToken();
        setSessionToken('');
        setCurrentUser(null);
      });
  }, []);

  // Listen to popstate for browser back/forward routing
  useEffect(() => {
    const handlePopState = () => {
      setRoutePath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check routes
  const isResetPasswordRoute =
    routePath === '/reset-password' ||
    routePath.startsWith('/reset-password');
  const resetPasswordToken =
    new URLSearchParams(window.location.search).get('token') || '';

  const isGeneralRegisterRoute =
    routePath === '/register' ||
    routePath.startsWith('/register/') ||
    routePath.startsWith('/candidate/register');

  const isDashboardRoute =
    routePath === '/dashboard' ||
    routePath.startsWith('/dashboard/');

  const isCompleteRoute =
    routePath === '/registration-complete' ||
    routePath === '/thank-you' ||
    routePath === '/about';

  const registerTokenMatch = routePath.match(/\/register\/([^/?#]+)/) || routePath.match(/\/candidate\/register\/([^/?#]+)/);
  const dedicatedRegisterToken = registerTokenMatch ? registerTokenMatch[1] : undefined;

  const isCandidateRoute = routePath.startsWith('/candidate/check-in');
  const urlTokenMatch = routePath.match(/\/candidate\/check-in\/([^/?#]+)/);
  const queryToken = new URLSearchParams(window.location.search).get('token');
  const dedicatedToken = urlTokenMatch ? urlTokenMatch[1] : (queryToken || 'WCR-APPT-901');

  // Direct staff candidate profile route e.g. /candidate/:candidateId or /candidates/:candidateId
  const directCandidateMatch = routePath.match(/^\/(?:candidate|candidates)\/([^/?#]+)$/);
  const directCandidateId =
    directCandidateMatch && !['check-in', 'register'].includes(directCandidateMatch[1])
      ? directCandidateMatch[1]
      : null;

  useEffect(() => {
    if (directCandidateId) {
      if (currentRole === 'PANTRY') {
        setSelectedCandidateId('');
        setActiveModal(null);
        return;
      }
      setSelectedCandidateId(directCandidateId);
      setActiveModal('DOSSIER');
    }
  }, [directCandidateId, currentRole]);

  useEffect(() => {
    if (routePath === '/staff/login') {
      setActiveModal('STAFF_LOGIN');
    }
  }, [routePath]);

  // Dedicated in-app document viewer route
  // e.g. /app/candidates/:candidateId/resume/view
  const docViewerMatch = routePath.match(/\/(?:app\/)?candidates\/([^/?#]+)\/resume\/view/);
  const docCandidateId = docViewerMatch ? docViewerMatch[1] : null;
  const docViewerType: 'RESUME' | null = docViewerMatch ? 'RESUME' : null;

  const [routeCandidate, setRouteCandidate] = useState<Candidate | null>(null);
  const [routeCandidateLoading, setRouteCandidateLoading] = useState<boolean>(false);

  // Real-time deletion tracking to prevent stale SSE events, late API responses, or reconnects from restoring deleted records
  const deletedCandidateIdsRef = React.useRef<Set<string>>(new Set());
  const deletedVisitorIdsRef = React.useRef<Set<string>>(new Set());

  // Instant client-side record removal on confirmed deletion
  const handleRecordDeleted = useCallback(
    (id: string, type: DeleteRecordType) => {
      if (type === 'CANDIDATE') {
        deletedCandidateIdsRef.current.add(id);
        setCandidates((prev) => prev.filter((c) => c.id !== id && !(c as any).isDeleted));
        setInterviews((prev) => prev.filter((i) => i.candidateId !== id && !(i as any).isDeleted));
        setRooms((prev) =>
          prev.map((r) =>
            r.currentCandidateId === id || (r as any).currentCandidateName?.includes(id)
              ? { ...r, status: 'AVAILABLE', currentCandidateId: undefined, currentCandidateName: undefined, currentInterviewId: undefined }
              : r
          )
        );
        setPantryTasks((prev) => prev.filter((pt) => (pt as any).candidateId !== id));
        setActionTasks((prev) => prev.filter((at) => at.candidateId !== id));
        setNotifications((prev) => prev.filter((n) => (n as any).candidateId !== id && n.entityId !== id && n.payload?.candidateId !== id));
        if (selectedCandidateId === id) {
          setSelectedCandidateId('');
          setActiveModal((prev) => (prev === 'DOSSIER' || prev === 'ASSIGN_ROOM' ? null : prev));
        }
        if (routeCandidate?.id === id) {
          setRouteCandidate(null);
        }
      } else if (type === 'VISITOR') {
        deletedVisitorIdsRef.current.add(id);
        setVisitors((prev) => prev.filter((v) => v.id !== id && !(v as any).isDeleted));
        setRooms((prev) =>
          prev.map((r) =>
            r.currentCandidateId === id || (r as any).currentCandidateName?.includes(id)
              ? { ...r, status: 'AVAILABLE', currentCandidateId: undefined, currentCandidateName: undefined }
              : r
          )
        );
        setNotifications((prev) => prev.filter((n) => (n as any).visitorId !== id && n.entityId !== id));
      } else if (type === 'INTERVIEW') {
        setInterviews((prev) => prev.filter((i) => i.id !== id && !(i as any).isDeleted));
        setCandidates((prev) =>
          prev.map((c) => (c.currentInterviewId === id ? { ...c, currentInterviewId: undefined } : c))
        );
        setRooms((prev) =>
          prev.map((r) =>
            r.currentInterviewId === id
              ? { ...r, status: 'AVAILABLE', currentInterviewId: undefined, currentCandidateId: undefined, currentCandidateName: undefined }
              : r
          )
        );
      } else if (type === 'ROOM') {
        setRooms((prev) => prev.filter((r) => r.id !== id && !(r as any).isDeleted));
        setCandidates((prev) =>
          prev.map((c) =>
            c.assignedRoomId === id
              ? { ...c, assignedRoomId: undefined, assignedRoomName: undefined, currentLocation: 'Reception / Waiting Lounge' }
              : c
          )
        );
        setInterviews((prev) =>
          prev.map((i) => (i.roomId === id ? { ...i, roomId: undefined, roomName: undefined } : i))
        );
      } else if (type === 'ACTION_TASK') {
        setActionTasks((prev) => prev.filter((t) => t.id !== id));
      } else if (type === 'NOTIFICATION') {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    },
    [selectedCandidateId, routeCandidate?.id]
  );

  // Global listener for immediate local deletion across all modals and components
  useEffect(() => {
    const handleCustomDeleted = (e: any) => {
      const detail = e.detail;
      if (detail?.id && detail?.type) {
        handleRecordDeleted(detail.id, detail.type as DeleteRecordType);
      }
    };
    window.addEventListener('wcr:record-deleted', handleCustomDeleted);
    return () => window.removeEventListener('wcr:record-deleted', handleCustomDeleted);
  }, [handleRecordDeleted]);

  // Fetch all live data from server with authenticated credentials
  const fetchAllData = useCallback(async () => {
    try {
      // Pantry role must NOT request candidate profiles, interviews, or visitors over network
      if (currentRole === 'PANTRY') {
        const [rRes, nRes, pRes, aRes] = await Promise.all([
          authenticatedFetch('/api/rooms'),
          authenticatedFetch(`/api/notifications?role=${currentRole}&userId=${currentUserId}`),
          authenticatedFetch('/api/pantry/tasks'),
          authenticatedFetch('/api/action-tasks'),
        ]);

        const [rData, nData, pData, aData] = await Promise.all([
          safeJson(rRes, { success: false, rooms: [] }),
          safeJson(nRes, { success: false, notifications: [] }),
          safeJson(pRes, { success: false, tasks: [] }),
          safeJson(aRes, { success: false, tasks: [] }),
        ]);

        if (rData.success && Array.isArray(rData.rooms)) setRooms(rData.rooms);
        if (nData.success && Array.isArray(nData.notifications)) setNotifications(nData.notifications);
        if (pData.success && Array.isArray(pData.tasks)) setPantryTasks(pData.tasks);
        if (aData.success && Array.isArray(aData.tasks)) setActionTasks(aData.tasks);
        setCandidates([]);
        setInterviews([]);
        setVisitors([]);
        return;
      }

      const [cRes, iRes, rRes, nRes, pRes, vRes, aRes] = await Promise.all([
        authenticatedFetch(`/api/candidates?role=${currentRole}`),
        authenticatedFetch('/api/interviews'),
        authenticatedFetch('/api/rooms'),
        authenticatedFetch(`/api/notifications?role=${currentRole}&userId=${currentUserId}`),
        authenticatedFetch('/api/pantry/tasks'),
        authenticatedFetch('/api/visitors'),
        authenticatedFetch('/api/action-tasks'),
      ]);

      const [cData, iData, rData, nData, pData, vData, aData] = await Promise.all([
        safeJson(cRes, { success: false, candidates: [] }),
        safeJson(iRes, { success: false, interviews: [] }),
        safeJson(rRes, { success: false, rooms: [] }),
        safeJson(nRes, { success: false, notifications: [] }),
        safeJson(pRes, { success: false, tasks: [] }),
        safeJson(vRes, { success: false, visitors: [] }),
        safeJson(aRes, { success: false, tasks: [] }),
      ]);

      if (cData.success && Array.isArray(cData.candidates)) {
        const seenCandIds = new Set<string>();
        const uniqueCands = cData.candidates.filter(
          (c: Candidate) => {
            if (!c?.id || seenCandIds.has(c.id) || deletedCandidateIdsRef.current.has(c.id) || (c as any).isDeleted) {
              return false;
            }
            seenCandIds.add(c.id);
            return true;
          }
        );
        setCandidates(uniqueCands);
      }
      if (iData.success && Array.isArray(iData.interviews)) {
        const activeList = iData.interviews.filter(
          (i: any) =>
            !i.isDeleted &&
            !deletedCandidateIdsRef.current.has(i.candidateId)
        );
        const seenRounds = new Map<string, any>();
        activeList.forEach((intv: any) => {
          const key = getInterviewRoundKey(intv.candidateId, intv.roundName);
          if (!seenRounds.has(key)) {
            seenRounds.set(key, intv);
          } else {
            const existing = seenRounds.get(key);
            const preferNew =
              (!existing.roomId && intv.roomId) ||
              (existing.status === 'CANDIDATE_ARRIVED' && (intv.status === 'ROOM_ASSIGNED' || intv.status === 'INTERVIEW_STARTED')) ||
              new Date(intv.updatedAt || intv.createdAt).getTime() > new Date(existing.updatedAt || existing.createdAt).getTime();
            if (preferNew) {
              seenRounds.set(key, { ...existing, ...intv });
            }
          }
        });
        setInterviews(Array.from(seenRounds.values()));
      }
      if (rData.success && Array.isArray(rData.rooms)) setRooms(rData.rooms);
      if (nData.success && Array.isArray(nData.notifications)) setNotifications(nData.notifications);
      if (pData.success && Array.isArray(pData.tasks)) setPantryTasks(pData.tasks);
      if (vData.success && Array.isArray(vData.visitors)) {
        setVisitors(
          vData.visitors.filter(
            (v: any) => !deletedVisitorIdsRef.current.has(v.id) && !v.isDeleted
          )
        );
      }
      if (aData.success && Array.isArray(aData.tasks)) setActionTasks(aData.tasks);
    } catch (err) {
      console.error('Failed fetching data snapshot', err);
    }
  }, [currentRole, currentUserId]);

  // Handlers for real-time Action Tasks
  const handleAcknowledgeActionTask = async (taskId: string) => {
    try {
      const res = await authenticatedFetch(`/api/action-tasks/${encodeURIComponent(taskId)}/acknowledge`, {
        method: 'POST',
      });
      const data = await safeJson(res, { success: false });
      if (data.success && data.task) {
        setActionTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...data.task } : t))
        );
      }
      fetchAllData();
    } catch (err) {
      console.error('Failed to acknowledge action task', err);
    }
  };

  const handleCompleteActionTask = async (taskId: string) => {
    try {
      const res = await authenticatedFetch(`/api/action-tasks/${encodeURIComponent(taskId)}/complete`, {
        method: 'POST',
      });
      const data = await safeJson(res, { success: false });
      if (data.success && data.task) {
        setActionTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...data.task } : t))
        );
      }
      fetchAllData();
    } catch (err) {
      console.error('Failed to complete action task', err);
    }
  };

  // Hook into Realtime Server-Sent Events (SSE)
  const {
    connected: isRealtimeConnected,
    connectionStatus,
    reconnect: reconnectRealtime,
  } = useRealtimeEvents({
    enabled: Boolean(currentUser && sessionToken),
    role: currentRole,
    userId: currentUserId,
    sessionToken,
    onEvent: (event) => {
      console.log('[REALTIME EVENT RECEIVED ON DASHBOARD]', event);

      // Instant Real-Time Deletion Synchronization
      if (event.type === 'CANDIDATE_DELETED') {
        const deletedCandId = event.payload?.candidateId || event.payload?.id || event.payload?.metadata?.candidateId;
        if (deletedCandId) {
          handleRecordDeleted(deletedCandId, 'CANDIDATE');
        }
      } else if (event.type === 'VISITOR_DELETED') {
        const deletedVisId = event.payload?.visitorId || event.payload?.visitId || event.payload?.id || event.payload?.metadata?.visitorId;
        if (deletedVisId) {
          handleRecordDeleted(deletedVisId, 'VISITOR');
        }
      } else if (event.type === 'INTERVIEW_DELETED') {
        const deletedIntvId = event.payload?.interviewId || event.payload?.id;
        if (deletedIntvId) {
          handleRecordDeleted(deletedIntvId, 'INTERVIEW');
        }
      } else if (event.type === 'ROOM_DELETED') {
        const deletedRoomId = event.payload?.roomId || event.payload?.id;
        if (deletedRoomId) {
          handleRecordDeleted(deletedRoomId, 'ROOM');
        }
      }

      // Instant in-memory synchronization of incoming candidate record (safeguarded against restoring deleted records)
      if (event.payload?.candidate) {
        const incomingCand = event.payload.candidate;
        if (deletedCandidateIdsRef.current.has(incomingCand.id) || (incomingCand as any).isDeleted) {
          return;
        }
        setCandidates((prev) => {
          if (deletedCandidateIdsRef.current.has(incomingCand.id)) return prev;
          const idx = prev.findIndex((c) => c.id === incomingCand.id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...incomingCand };
            return next;
          }
          return [incomingCand, ...prev];
        });
      } else if (event.type === 'CANDIDATE_ASSIGNED_TO_KIMMI' && event.payload?.candidateId) {
        const targetCandId = event.payload.candidateId;
        if (deletedCandidateIdsRef.current.has(targetCandId)) return;
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === targetCandId
              ? {
                  ...c,
                  status: 'With Kimmi Mam – Senior HR Interview' as any,
                  assignedInterviewerId: 'usr-cofounder-kimmi',
                  assignedInterviewerName: 'Kimmi Mam',
                  currentLocation: 'Senior HR Cabin / Room',
                }
              : c
          )
        );
      }

      // Real-time Action Task synchronization (Instant alert on Dashboard outside chat)
      if (event.type === 'ACTION_TASK_CREATED' && event.payload?.task) {
        const incomingTask: ActionTask = event.payload.task;
        setActionTasks((prev) => {
          const existingIdx = prev.findIndex((t) => t.id === incomingTask.id);
          if (existingIdx !== -1) {
            const next = [...prev];
            next[existingIdx] = incomingTask;
            return next;
          }
          return [incomingTask, ...prev];
        });
      } else if (event.type === 'ACTION_TASK_UPDATED' && event.payload?.task) {
        const updatedTask: ActionTask = event.payload.task;
        setActionTasks((prev) =>
          prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
        );
      }

      // Instant in-memory synchronization of incoming interview record
      if (event.payload?.interview) {
        const incomingIntv = event.payload.interview;
        setInterviews((prev) => {
          const idx = prev.findIndex((i) => i.id === incomingIntv.id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...incomingIntv };
            return next;
          }
          const incomingKey = getInterviewRoundKey(incomingIntv.candidateId, incomingIntv.roundName);
          const dupIdx = prev.findIndex(
            (i) => getInterviewRoundKey(i.candidateId, i.roundName) === incomingKey
          );
          if (dupIdx !== -1) {
            const next = [...prev];
            next[dupIdx] = { ...next[dupIdx], ...incomingIntv };
            return next;
          }
          return [incomingIntv, ...prev];
        });
      }

      // 1. Host-Specific Spoken Voice Alert (Enforced on client + server)
      // Dispatches voice announcement ONLY IF current user is the exact intended target host!
      if (event.payload?.voiceAlert) {
        dispatchHostVoiceAlert({
          voiceAlert: event.payload.voiceAlert,
          currentUserId,
          isVoiceAlertsEnabled: settings.voiceAlerts,
          language: settings.voiceAlertLanguage,
        });
      }

      // 2. Visual arrival notification for other authorized staff + host
      if (
        event.type === 'CANDIDATE_FORM_SUBMITTED' ||
        event.type === 'CANDIDATE_ARRIVED' ||
        event.type === 'VISITOR_CHECKED_IN' ||
        event.type === 'WALKIN_REGISTERED'
      ) {
        const meta = event.payload?.metadata || event.payload;
        const arrival = event.payload?.arrivalDetails || meta?.arrivalDetails;
        const visitorName =
          arrival?.visitorName ||
          meta?.candidateName ||
          meta?.visitorName ||
          event.payload?.candidate?.fullName ||
          'Guest';
        const purpose =
          arrival?.purpose ||
          meta?.purpose ||
          meta?.position ||
          event.payload?.candidate?.position ||
          'Visit / Meeting';
        const personToMeet =
          arrival?.personToMeet ||
          meta?.hostName ||
          meta?.personToMeet ||
          'Reception Assistance';
        const status = arrival?.status || meta?.status || 'Arrived';
        const candId = event.payload?.candidateId || event.payload?.candidate?.id || meta?.candidateId;
        const isTargetHost = Boolean(
          event.payload?.voiceAlert && event.payload.voiceAlert.targetUserId === currentUserId
        );

        setRealtimeToast({
          id: `toast-${Date.now()}`,
          title: isTargetHost
            ? `🔊 Your Visitor Has Arrived: ${visitorName}`
            : `Visitor Arrival: ${visitorName}`,
          message: `${visitorName} has arrived to meet ${personToMeet} for "${purpose}". Status: ${status}.`,
          candidateId: candId,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isVoiceTarget: isTargetHost,
          personToMeet,
          visitorName,
          purpose,
          status,
        });

        // Auto-dismiss toast after 10 seconds
        setTimeout(() => {
          setRealtimeToast((prev) => (prev?.id ? null : prev));
        }, 10000);
      }

      // Internal Office Chat real-time event dispatch
      if (event.type === 'INTERNAL_CHAT_MESSAGE') {
        const chatMsg: ChatMessage = event.payload?.metadata || event.payload;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('wcr:chat-message', { detail: chatMsg }));
        }
        if (!isChatOpen) {
          setUnreadChatCount((prev) => prev + 1);

          // If the message is from another staff member, show real-time in-app notification toast
          if (chatMsg && chatMsg.senderId !== currentUserId) {
            setChatToast({
              id: chatMsg.id || `toast-${Date.now()}`,
              senderName: chatMsg.senderName,
              senderRole: chatMsg.senderRole,
              content: chatMsg.content,
              candidateId: chatMsg.candidateId,
              candidateName: chatMsg.candidateName,
              roomId: chatMsg.roomId,
              roomName: chatMsg.roomName,
              isPriority: chatMsg.isPriority,
              channelId: chatMsg.channelId,
              recipientId: chatMsg.recipientId,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });

            // Auto dismiss toast after 8 seconds
            setTimeout(() => {
              setChatToast((prev) => (prev?.id === chatMsg.id ? null : prev));
            }, 8000);
          }
        }
      }

      // Seamless zero-refresh authoritative state update on any backend event
      fetchAllData();
    },
  });

  // Re-fetch when switching roles or mounting
  useEffect(() => {
    if (!isCandidateRoute && !isGeneralRegisterRoute) {
      fetchAllData();
    }
  }, [fetchAllData, isCandidateRoute, isGeneralRegisterRoute]);

  // Load candidate record if on a direct document viewer route
  useEffect(() => {
    if (docCandidateId) {
      const existing = candidates.find((c) => c.id === docCandidateId);
      if (existing) {
        setRouteCandidate(existing);
      } else {
        setRouteCandidateLoading(true);
        authenticatedFetch(`/api/candidates/${encodeURIComponent(docCandidateId)}?role=${encodeURIComponent(currentRole)}`)
          .then((r) => safeJson(r, { success: false }))
          .then((data) => {
            if (data.success && data.candidate) {
              setRouteCandidate(data.candidate);
            }
          })
          .catch((err) => console.warn('[Doc Route Sync]', err))
          .finally(() => setRouteCandidateLoading(false));
      }
    } else {
      setRouteCandidate(null);
    }
  }, [docCandidateId, candidates, currentRole]);

  // Handle Role Persona Switching
  const handleSelectRole = async (role: UserRole) => {
    setCurrentRole(role);
    setStoredStaffRole(role);
    if (role === 'RECEPTION') setActiveSection('reception');
    else if (role === 'PANTRY') setActiveSection('hospitality');
    else if (role === 'ADMIN') setActiveSection('rooms');
    else if (role === 'INTERVIEWER') setActiveSection('interviews');
    else if (role === 'HR' || role === 'SENIOR_HR') setActiveSection('candidates');
    else if (role === 'CEO' || role === 'CO_FOUNDER') setActiveSection('dashboard');

    try {
      const res = await authenticatedFetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await safeJson(res, { success: false });
      if (data.success) {
        setCurrentUser(data.user);
        setCurrentUserId(data.user.id);
        const tok = data.session?.token || data.token;
        if (tok) {
          setSessionToken(tok);
          setStoredStaffToken(tok);
        }
      }
    } catch (err) {
      console.warn('Role switch error', err);
    }
  };

  // Reset intake flow filter when navigating between sections or switching roles
  useEffect(() => {
    setFilterStage(null);
  }, [activeSection, currentRole]);

  // Handle Sidebar and Mobile Section Selection
  const handleSelectSection = (section: NavSection) => {
    // Pantry role is strictly restricted to its dedicated task-only dashboard
    if (currentRole === 'PANTRY') {
      if (section !== 'dashboard' && section !== 'settings' && section !== 'notifications') {
        setActiveSection('dashboard');
        return;
      }
    }

    setActiveSection(section);
    if (section === 'reception' || section === 'visitors') {
      handleSelectRole('RECEPTION');
    } else if (section === 'interviews') {
      handleSelectRole('INTERVIEWER');
    } else if (section === 'candidates') {
      handleSelectRole('HR');
    } else if (section === 'rooms') {
      handleSelectRole('ADMIN');
    } else if (section === 'hospitality') {
      handleSelectRole('PANTRY');
    } else if (section === 'settings') {
      setActiveSection('settings');
    } else if (section === 'more') {
      setMoreInitialTab('all');
    } else if (section === 'hr-nisha' || section === 'hr-shriyanshi') {
      handleSelectRole('HR');
      setActiveSection(section);
    }
  };

  const handleOpenMore = (subTab: 'all' | 'lounge' | 'meetings' | 'checkout' = 'all') => {
    setMoreInitialTab(subTab);
    setActiveSection('more');
  };

  // Staff Login Handler
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccess(null);

    try {
      const res = await authenticatedFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await safeJson(res, { success: false, error: 'Authentication failed' });
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      setCurrentUser(data.user);
      setCurrentRole(data.user.role);
      setCurrentUserId(data.user.id);
      setStoredStaffRole(data.user.role);
      const tok = data.session?.token || data.token;
      if (tok) {
        setSessionToken(tok);
        setStoredStaffToken(tok);
      }

      // Close login modal if open
      setActiveModal(null);
      setLoginSuccess(null);
      setLoginError(null);

      // Trigger post-login logo animation overlay
      setAnimatingUser(data.user);
      setShowPostLoginAnimation(true);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    }
  };

  // Staff Logout Handler
  const handleStaffLogout = async () => {
    try {
      await authenticatedFetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          userName: currentUser?.name,
          userRole: currentRole,
        }),
      });
    } catch (err) {
      console.warn('Logout error', err);
    } finally {
      clearStoredStaffToken();
      setSessionToken('');
      setCurrentUser(null);
      setShowPostLoginAnimation(false);
      setAnimatingUser(null);
      setActiveModal('STAFF_LOGIN');
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/staff/login');
        setRoutePath('/staff/login');
      }
    }
  };

  // Notification action handler
  const handleNotificationAction = (actionKey: string, payload?: any) => {
    if (actionKey === 'ASSIGN_ROOM') {
      setSelectedCandidateId(payload?.candidateId || '');
      setSelectedInterview(payload?.interviewId ? interviews.find((i) => i.id === payload.interviewId) || null : null);
      setActiveModal('ASSIGN_ROOM');
    } else if (actionKey === 'VIEW_CANDIDATE') {
      setSelectedCandidateId(payload?.candidateId || '');
      setActiveModal('DOSSIER');
    } else if (actionKey === 'START_INTERVIEW') {
      if (payload?.interviewId) {
        handleStartInterview(payload.interviewId);
      }
    } else if (actionKey === 'COMPLETE_PANTRY_TASK') {
      if (payload?.taskId) {
        handleCompletePantryTask(payload.taskId);
      }
    } else if (actionKey === 'CHECKOUT_CANDIDATE') {
      if (payload?.candidateId) {
        handleCheckout(payload.candidateId);
      }
    } else if (actionKey === 'OPEN_CHAT') {
      setNotificationDrawerOpen(false);
      openChatWithContext({
        candidateId: payload?.candidateId,
        roomId: payload?.roomId,
      });
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Interviewer actions
  const handleStartInterview = async (interviewId: string) => {
    try {
      await fetch(`/api/interviews/${interviewId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewerName: 'Nisha Verma (Senior Director)' }),
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Pantry complete task
  const handleCompletePantryTask = async (taskId: string) => {
    try {
      await fetch(`/api/pantry/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stewardName: 'Suresh Kumar (Pantry)' }),
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Pantry / Admin mark room cleaned & ready
  const handleMarkRoomCleaned = async (roomId: string) => {
    try {
      await fetch(`/api/pantry/rooms/${roomId}/cleaned`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stewardName: currentRole === 'ADMIN' ? 'Sameer Sir (Admin)' : 'Suresh Kumar (Pantry)' }),
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Reception physical checkout
  const handleCheckout = async (candidateId: string) => {
    try {
      await fetch('/api/visitors/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          receptionistName: 'Ananya Sen (Reception)',
        }),
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ==========================================
  // DEDICATED GENERAL WCR BLANK REGISTRATION ROUTE
  // https://<domain>/register
  // ==========================================
  if (isGeneralRegisterRoute) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#111111] p-4 sm:p-6 flex flex-col justify-center items-center font-sans antialiased selection:bg-[#D8BF85] selection:text-[#111111] relative overflow-hidden">
        <CinematicBackground />
        <DashboardWatermark />
        <div className="w-full max-w-2xl relative z-10">
          <GeneralNewCandidateRegister
            initialToken={dedicatedRegisterToken}
            onSuccess={() => {
              console.log('General New Candidate Self-Registration confirmed');
            }}
          />
        </div>
        <OfflineIndicator />
      </div>
    );
  }

  // ==========================================
  // DEDICATED PASSWORD RESET VERIFICATION ROUTE
  // https://<domain>/reset-password?token=<token>
  // ==========================================
  if (isResetPasswordRoute) {
    return (
      <ResetPasswordView
        token={resetPasswordToken}
        onBackToLogin={() => {
          window.history.pushState({}, '', '/');
          setRoutePath('/');
          setActiveModal('STAFF_LOGIN');
        }}
      />
    );
  }

  // ==========================================
  // DEDICATED SCHEDULED CANDIDATE SCAN ROUTE
  // https://<domain>/candidate/check-in/<token>
  // ==========================================
  if (isCandidateRoute) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#111111] p-4 sm:p-6 flex flex-col justify-center items-center font-sans antialiased selection:bg-[#D8BF85] selection:text-[#111111] relative overflow-hidden">
        <CinematicBackground />
        <DashboardWatermark />
        <div className="w-full max-w-2xl relative z-10">
          <CandidateCheckInForm
            initialToken={dedicatedToken}
            isStandalonePage={true}
            onSuccess={() => {
              console.log('Candidate check-in successfully submitted via QR phone route');
            }}
          />
        </div>
        <OfflineIndicator />
      </div>
    );
  }

  // ==========================================
  // DEDICATED REGISTRATION COMPLETE / RECEIPT CONFIRMATION ROUTE
  // https://<domain>/registration-complete OR /thank-you
  // ==========================================
  if (isCompleteRoute) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#111111] p-4 sm:p-6 flex flex-col justify-center items-center font-sans antialiased selection:bg-[#D8BF85] selection:text-[#111111] relative overflow-hidden">
        <CinematicBackground />
        <DashboardWatermark />
        <div className="w-full max-w-xl mx-auto glass-panel-elevated rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200 relative z-10 border border-[#D8BF85]/35">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-[11px] font-bold tracking-widest text-[#7E6532] uppercase bg-[#F0E5CC] border border-[#D8BF85] px-2.5 py-0.5 rounded-full inline-block">
                WHITE COLLAR REALTY
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] tracking-tight">
              ✓ Registration Completed
            </h1>
            <p className="text-sm text-[#3C4043] mt-2 leading-relaxed">
              Your arrival information has been recorded and received by White Collar Realty operations.
            </p>
          </div>

          <div className="p-5 bg-white/60 border border-[#D8BF85]/30 rounded-2xl text-left space-y-3">
            <div className="text-xs font-bold text-[#202124] uppercase tracking-wider">
              Next Steps
            </div>
            <p className="text-xs text-[#3C4043] leading-relaxed">
              Please take a seat in our <strong>Reception / Ground Floor Guest Lounge</strong>.
              Our coordinator has been notified and you will be escorted shortly.
            </p>
            <div className="pt-2 border-t border-[#D8BF85]/20 flex items-center justify-between text-[11px] text-[#70757A]">
              <span className="flex items-center gap-1 text-emerald-800 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Session Locked & Completed
              </span>
              <span className="font-mono text-[#70757A]">Encrypted</span>
            </div>
          </div>
        </div>
        <OfflineIndicator />
      </div>
    );
  }

  // ==========================================
  // DEDICATED IN-APP DOCUMENT VIEWER ROUTE
  // /app/candidates/:candidateId/resume/view
  // ==========================================
  if (docViewerMatch && docCandidateId && docViewerType) {
    if (routeCandidateLoading) {
      return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#202124] flex items-center justify-center font-sans">
          <CinematicBackground />
          <div className="p-8 text-center space-y-3 relative z-10">
            <div className="w-10 h-10 border-3 border-[#D8BF85] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#70757A] font-semibold tracking-wide">
              Loading Secure Document from WCR Repository...
            </p>
          </div>
        </div>
      );
    }

    if (!routeCandidate) {
      return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#202124] flex items-center justify-center font-sans p-4">
          <CinematicBackground />
          <div className="max-w-md w-full glass-panel-elevated border border-[#D8BF85]/35 rounded-3xl p-6 text-center space-y-4 relative z-10 shadow-2xl">
            <div className="w-12 h-12 bg-rose-500/15 text-rose-600 border border-rose-300 rounded-full flex items-center justify-center mx-auto">
              <X className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#202124]">Document or Candidate Not Found</h2>
            <p className="text-xs text-[#70757A]">
              The requested candidate document may have been archived or deleted under WCR retention policy.
            </p>
            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                setRoutePath('/');
              }}
              className="px-5 py-2.5 bg-[#F0E5CC] hover:bg-[#F0E5CC]/80 text-[#202124] text-xs font-bold rounded-xl border border-[#D8BF85] transition cursor-pointer shadow-xs"
            >
              &larr; Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <SecureDocumentViewerModal
        candidate={routeCandidate}
        currentRole={currentRole}
        documentType={docViewerType}
        onClose={() => {
          window.history.pushState({}, '', '/');
          setRoutePath('/');
        }}
      />
    );
  }

  // ==========================================
  // UNCONNECTED / UNAUTHENTICATED DASHBOARD ROUTE GUARD
  // ==========================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#111111] flex items-center justify-center p-4 font-sans relative overflow-hidden selection:bg-[#D8BF85] selection:text-[#111111]">
        {showPostLoginAnimation && (
          <PostLoginLogoAnimation
            userName={animatingUser?.name}
            userRole={animatingUser?.role || currentRole}
            onComplete={() => {
              setShowPostLoginAnimation(false);
              setAnimatingUser(null);
            }}
          />
        )}
        <CinematicBackground />
        <DashboardWatermark />
        <div className="glass-panel-elevated rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 relative z-10">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#D8BF85]/25">
            <div className="w-8 h-8 rounded-xl bg-[#D8BF85]/20 text-[#9E8243] border border-[#D8BF85]/35 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111111] tracking-tight">Staff Authentication</h3>
              <p className="text-[11px] text-[#111111]/70">White Collar Realty Command Console</p>
            </div>
          </div>
          <p className="text-xs text-[#111111]/85">
            Authenticate with verified White Collar Realty credentials to access operations decks.
          </p>

          {loginError && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs">
              {loginError}
            </div>
          )}

          <form onSubmit={handleStaffLogin} className="space-y-3 text-xs">
            <div>
              <label className="block text-[#111111] font-semibold mb-1">Staff Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="e.g. reception@whitecollarrealty.com"
                className="w-full px-3 py-2 bg-white/70 border border-[#D8BF85]/35 rounded-xl text-[#111111] placeholder:text-[#111111]/50 text-xs focus:outline-none focus:border-[#D8BF85] focus:ring-1 focus:ring-[#D8BF85]/40 transition"
                required
              />
            </div>
            <div>
              <label className="block text-[#111111] font-semibold mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2 bg-white/70 border border-[#D8BF85]/35 rounded-xl text-[#111111] placeholder:text-[#111111]/50 text-xs focus:outline-none focus:border-[#D8BF85] focus:ring-1 focus:ring-[#D8BF85]/40 transition"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-[#D8BF85] to-[#c7ab6e] hover:from-[#c7ab6e] hover:to-[#b89856] text-[#111111] font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              Sign In to Staff Console
            </button>
          </form>
          <div className="pt-2 text-center">
            <button
              onClick={() => {
                window.history.pushState({}, '', '/register');
                setRoutePath('/register');
              }}
              className="text-xs text-[#111111]/75 hover:text-[#9E8243] underline cursor-pointer"
            >
              &larr; Candidate Self-Registration (/register)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeCandidatesList = filterStage
    ? candidates.filter((c) => computeArrivalStage(c).currentStage === filterStage)
    : candidates;

  const activeVisitorsList = filterStage
    ? visitors.filter((v) => computeVisitorArrivalStage(v) === filterStage)
    : visitors;

  // ==========================================
  // STAFF & OPERATIONS CONSOLE (HR, ADMIN, CEO, INTERVIEWER, RECEPTION, PANTRY)
  // ==========================================
  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-[#FAF9F6] text-[#121316] flex font-sans selection:bg-[#F5EB78] selection:text-[#121316] relative overflow-hidden">
      {/* Post-Login Fullscreen Logo Animation Overlay */}
      {showPostLoginAnimation && (
        <PostLoginLogoAnimation
          userName={animatingUser?.name || currentUser?.name}
          userRole={animatingUser?.role || currentRole}
          onComplete={() => {
            setShowPostLoginAnimation(false);
            setAnimatingUser(null);
          }}
        />
      )}
      <CinematicBackground hasSidebar={true} />
      {/* Desktop Glass Sidebar Navigation */}
      <SidebarNav
        currentRole={currentRole}
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        onSelectRole={handleSelectRole}
        currentUser={currentUser}
        unreadCount={unreadCount}
        unreadChatCount={unreadChatCount}
        isRealtimeConnected={isRealtimeConnected}
        connectionStatus={connectionStatus}
        onReconnectRealtime={reconnectRealtime}
        onOpenNotifications={() => setNotificationDrawerOpen(true)}
        onOpenQRPasses={() => setActiveModal('QR_PASS')}
        onOpenWalkIn={() => setActiveModal('WALK_IN')}
        onOpenBlankRegister={() => setActiveModal('GENERAL_REGISTER')}
        onLogout={handleStaffLogout}
      />

      {/* Mobile Slide-Out Drawer */}
      <MobileNavigation
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        currentRole={currentRole}
        onSelectRole={handleSelectRole}
        currentUser={currentUser}
        unreadCount={unreadCount}
        onOpenNotifications={() => setNotificationDrawerOpen(true)}
        onOpenQRPasses={() => setActiveModal('QR_PASS')}
        onOpenCheckIn={() => {
          setCheckInToken('WCR-APPT-901');
          setActiveModal('CHECK_IN');
        }}
        onLogout={handleStaffLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col h-[100dvh] overflow-y-auto lg:ml-64 relative">
        {/* White Collar Realty Large Background Watermark */}
        <DashboardWatermark />

        {/* Top Operations Header */}
        <TopHeader
          pageTitle={
            activeSection === 'settings'
              ? `${t('nav_settings')} • Application Preferences`
              : activeSection === 'more'
              ? 'WCR Operations • More: Secondary Sections'
              : `WCR Operations: ${currentRole.replace('_', ' ')} Console`
          }
          currentRole={currentRole}
          currentUser={currentUser}
          onLogout={handleStaffLogout}
          unreadCount={unreadCount}
          unreadChatCount={unreadChatCount}
          isRealtimeConnected={isRealtimeConnected}
          connectionStatus={connectionStatus}
          onReconnectRealtime={reconnectRealtime}
          openPanels={[
            ...(activeSection === 'more'
              ? [
                  {
                    id: 'more-panel',
                    label: 'More Sections',
                    onClose: () => setActiveSection('dashboard'),
                  },
                ]
              : []),
            ...(notificationDrawerOpen
              ? [{ id: 'alerts', label: 'Alert Feed', onClose: () => setNotificationDrawerOpen(false) }]
              : []),
            ...(isChatOpen
              ? [
                  {
                    id: 'chat',
                    label: 'Office Chat',
                    onClose: () => {
                      setIsChatOpen(false);
                      setChatPrefillCandidateId('');
                      setChatPrefillRoomId('');
                      setChatPrefillMessage('');
                    },
                  },
                ]
              : []),
            ...(activeModal
              ? [
                  {
                    id: 'modal',
                    label:
                      activeModal === 'CHECK_IN'
                        ? 'Check-In Portal'
                        : activeModal === 'QR_PASS'
                        ? 'QR Pass Station'
                        : activeModal === 'WALK_IN'
                        ? 'Walk-In Entry'
                        : activeModal === 'DOSSIER'
                        ? 'Candidate Dossier'
                        : activeModal === 'ASSIGN_ROOM'
                        ? 'Room Assignment'
                        : activeModal === 'END_INTERVIEW'
                        ? 'Interview Decision'
                        : activeModal === 'GENERAL_REGISTER'
                        ? 'Self-Registration'
                        : activeModal === 'CREATE_PANTRY_TASK'
                        ? 'Hospitality Dispatch'
                        : activeModal === 'PANTRY_MONITOR'
                        ? 'Pantry Live Monitor'
                        : 'Active Panel',
                    onClose: () => {
                      setActiveModal(null);
                      setSelectedCandidateId('');
                      setSelectedInterview(null);
                    },
                  },
                ]
              : []),
          ]}
          onOpenNotifications={() => setNotificationDrawerOpen(true)}
          onOpenChat={() => {
            setIsChatOpen(true);
            setUnreadChatCount(0);
          }}
          onOpenQRPasses={() => setActiveModal('QR_PASS')}
          onOpenCheckIn={() => {
            setCheckInToken('WCR-APPT-901');
            setActiveModal('CHECK_IN');
          }}
          onOpenWalkIn={() => setActiveModal('WALK_IN')}
          onOpenCreatePantryTask={() => setActiveModal('CREATE_PANTRY_TASK')}
          onOpenPantryMonitor={() => setActiveModal('PANTRY_MONITOR')}
          onToggleMobileMenu={() => setIsMobileNavOpen(true)}
          onOpenMore={() => {
            if (activeSection === 'more') {
              setActiveSection('dashboard');
            } else {
              handleOpenMore('all');
            }
          }}
          isMoreActive={activeSection === 'more'}
        />

        {/* Main Dashboard Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 py-4 sm:p-6 lg:p-8 pb-24 sm:pb-28 lg:pb-8 space-y-6 relative min-w-0 overflow-x-hidden">
          {activeSection === 'settings' ? (
            <ApplicationSettingsView onBackToDashboard={() => setActiveSection('dashboard')} />
          ) : activeSection === 'more' ? (
            <SecondaryOperationsMoreView
              candidates={candidates}
              visitors={visitors}
              onCheckout={handleCheckout}
              onBackToDashboard={() => setActiveSection('dashboard')}
              onRefresh={fetchAllData}
              onRecordDeleted={handleRecordDeleted}
              initialTab={moreInitialTab}
            />
          ) : activeSection === 'hr-nisha' || activeSection === 'hr-shriyanshi' ? (
            <HRSubProfileView
              activeProfileKey={activeSection === 'hr-nisha' ? 'nisha' : 'shriyanshi'}
              onSelectProfile={(p) => setActiveSection(p === 'nisha' ? 'hr-nisha' : 'hr-shriyanshi')}
              onBackToHRDashboard={() => setActiveSection('candidates')}
              onOpenDossier={(candId) => {
                setSelectedCandidateId(candId);
                setActiveModal('DOSSIER');
              }}
              onAssignRoom={(candId, intvId) => {
                setSelectedCandidateId(candId);
                setSelectedInterview(intvId ? interviews.find((i) => i.id === intvId) || null : null);
                setActiveModal('ASSIGN_ROOM');
              }}
              currentUserRole={currentRole}
              currentUserId={currentUserId}
              onRecordDeleted={handleRecordDeleted}
            />
          ) : (
            <>
              {/* Operations Command Header, Intake Journey Flow, and Admin Strips for Authorized Staff Only */}
              {currentRole !== 'PANTRY' && (
                <>
                  {/* Operations Command Header with Live KPIs & Clock */}
                  <OperationsCommandHeader
                    candidates={candidates}
                    interviews={interviews}
                    rooms={rooms}
                    pantryTasks={pantryTasks}
                    visitors={visitors}
                    userName={currentUser?.name || 'Officer'}
                    userRole={currentRole}
                    onSelectKpi={(kpiId) => {
                      if (kpiId === 'lobby') setDashboardDetailsModalTarget('kpi_lobby');
                      else if (kpiId === 'interviews') setDashboardDetailsModalTarget('kpi_interviews');
                      else if (kpiId === 'rooms') setDashboardDetailsModalTarget('kpi_rooms');
                      else if (kpiId === 'pantry') setDashboardDetailsModalTarget('kpi_pantry');
                    }}
                  />

                  {/* Visitor Arrival Journey Flow Filter Banner */}
                  <VisitorJourneyOverview
                    candidates={candidates}
                    visitors={visitors}
                    selectedStage={filterStage}
                    onSelectStage={(stage) => setFilterStage(stage)}
                    onClearAllFilters={() => setFilterStage(null)}
                    onOpenDossier={(cId) => {
                      setSelectedCandidateId(cId);
                      setActiveModal('DOSSIER');
                    }}
                    onCheckout={handleCheckout}
                  />

                  {/* Realtime Arrival Alert Banner (Host Voice vs Other Users Visual) */}
                  {realtimeToast && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs border ${
                        realtimeToast.isVoiceTarget
                          ? 'bg-gradient-to-r from-amber-500/25 via-amber-600/20 to-purple-600/25 border-amber-400 ring-1 ring-amber-400/40'
                          : 'bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 border-cyan-500/35'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-md shrink-0 ${
                            realtimeToast.isVoiceTarget
                              ? 'bg-amber-400 text-slate-950 animate-bounce'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {realtimeToast.isVoiceTarget ? (
                            <Volume2 className="w-5 h-5 text-slate-950" />
                          ) : (
                            <Sparkles className="w-5 h-5 text-cyan-300" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-amber-300 uppercase tracking-wide">
                              {realtimeToast.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({realtimeToast.timestamp})
                            </span>
                            {realtimeToast.isVoiceTarget ? (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-amber-400 text-slate-950 uppercase tracking-tight">
                                Spoken Alert Played for You
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-white/10 text-slate-300 border border-white/10">
                                Visual Notification Only
                              </span>
                            )}
                          </div>
                          <p className="text-slate-200 font-medium mt-0.5">{realtimeToast.message}</p>
                          {realtimeToast.personToMeet && (
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                              <span>Whom to Meet: <strong className="text-white">{realtimeToast.personToMeet}</strong></span>
                              <span>&bull;</span>
                              <span>Status: <strong className="text-emerald-400">{realtimeToast.status || 'Arrived'}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {realtimeToast.isVoiceTarget && (
                          <button
                            type="button"
                            onClick={() => {
                              unlockSpeechSynthesis();
                              playTestVoiceAlert(realtimeToast.personToMeet || currentUser?.name || 'Host', settings.voiceAlertLanguage === 'en' ? 'en' : 'hi');
                            }}
                            className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl transition shadow flex items-center gap-1 cursor-pointer text-xs shrink-0"
                            title="Unlock / Play audio announcement directly"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Play Voice</span>
                          </button>
                        )}
                        {realtimeToast.candidateId && (
                          <button
                            onClick={() => {
                              setSelectedCandidateId(realtimeToast.candidateId!);
                              setActiveModal('DOSSIER');
                              setRealtimeToast(null);
                            }}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition shadow cursor-pointer text-xs"
                          >
                            View Profile &rarr;
                          </button>
                        )}
                        <button
                          onClick={() => setRealtimeToast(null)}
                          className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Interactive Testing Quick Launcher Strip */}
                  <div className="p-4 card-dark rounded-3xl border border-[#E5D2A0]/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                        <strong className="text-[#111111] font-bold text-sm tracking-tight">
                          {t('quick_architecture_title')}
                        </strong>
                      </div>
                      <p className="text-[#111111]/80 text-xs">
                        <strong className="text-emerald-700">1. General Reception QR</strong> (100% blank form, isolated session) &bull;{' '}
                        <strong className="text-[#9E8243]">2. Scheduled QR</strong> (Appointment pass) &bull;{' '}
                        <strong className="text-sky-700">3. Reception Live Photo</strong> (WebRTC desk verification).
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Direct Blank Registration Test Button */}
                      <button
                        onClick={() => setActiveModal('GENERAL_REGISTER')}
                        className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
                        title="Test General WCR Blank Self-Registration"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{t('quick_test_blank')}</span>
                      </button>

                      {/* Scheduled Check-In */}
                      <button
                        onClick={() => {
                          setCheckInToken('WCR-APPT-901');
                          setActiveModal('CHECK_IN');
                        }}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-amber-500/40 text-amber-300 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                        <span>{t('quick_scheduled_checkin')}</span>
                      </button>

                      {/* Dual QR Station Standee */}
                      <button
                        onClick={() => setActiveModal('QR_PASS')}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-200 font-semibold text-xs rounded-xl border border-white/8 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5 text-amber-400" />
                        <span>{t('quick_qr_standees')}</span>
                      </button>

                      {/* Staff Login Modal */}
                      <button
                        onClick={() => setActiveModal('STAFF_LOGIN')}
                        className="px-3 py-2 bg-white/4 hover:bg-white/8 border border-white/8 text-slate-400 hover:text-white font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Key className="w-3.5 h-3.5 text-purple-400" />
                        <span>{t('quick_staff_login')}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

          {/* Dynamic Role Dashboard View with Smooth Cinematic Transition */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRole}
              variants={pageMotion}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
            {currentRole === 'SENIOR_HR' && (
              <SeniorHRDashboard
                candidates={activeCandidatesList}
                interviews={interviews}
                rooms={rooms}
                currentInterviewerId={currentUserId}
                onStartInterview={handleStartInterview}
                onOpenEndInterviewModal={(intv) => {
                  setSelectedInterview(intv);
                  setActiveModal('END_INTERVIEW');
                }}
                onOpenDossier={(candId) => {
                  setSelectedCandidateId(candId);
                  setActiveModal('DOSSIER');
                }}
                onAssignRoom={(candId, intvId) => {
                  setSelectedCandidateId(candId);
                  setSelectedInterview(intvId ? interviews.find((i) => i.id === intvId) || null : null);
                  setActiveModal('ASSIGN_ROOM');
                }}
                onRefresh={fetchAllData}
              />
            )}

            {currentRole === 'HR' && (
              <HRDashboard
                candidates={activeCandidatesList}
                interviews={interviews}
                rooms={rooms}
                filterStage={filterStage}
                onClearFilterStage={() => setFilterStage(null)}
                actionTasks={actionTasks}
                onOpenDossier={(candId) => {
                  setSelectedCandidateId(candId);
                  setActiveModal('DOSSIER');
                }}
                onAssignRoom={(candId, intvId) => {
                  setSelectedCandidateId(candId);
                  setSelectedInterview(intvId ? interviews.find((i) => i.id === intvId) || null : null);
                  setActiveModal('ASSIGN_ROOM');
                }}
                onOpenChat={() => {
                  setIsChatOpen(true);
                  setUnreadChatCount(0);
                }}
                onOpenChatWithContext={openChatWithContext}
                onRefresh={fetchAllData}
              />
            )}

            {currentRole === 'ADMIN' && (
              <AdminDashboard
                candidates={activeCandidatesList}
                interviews={interviews}
                rooms={rooms}
                pantryTasks={pantryTasks}
                actionTasks={actionTasks}
                onOpenDossier={(candId) => {
                  setSelectedCandidateId(candId);
                  setActiveModal('DOSSIER');
                }}
                onAssignRoom={(candId, intvId) => {
                  setSelectedCandidateId(candId);
                  setSelectedInterview(intvId ? interviews.find((i) => i.id === intvId) || null : null);
                  setActiveModal('ASSIGN_ROOM');
                }}
                onOpenChatWithContext={openChatWithContext}
                onMarkRoomCleaned={handleMarkRoomCleaned}
                onAcknowledgeActionTask={handleAcknowledgeActionTask}
                onCompleteActionTask={handleCompleteActionTask}
                onRefresh={fetchAllData}
              />
            )}

            {(currentRole === 'CEO' || currentRole === 'CO_FOUNDER') && (
              <CEODashboard
                candidates={activeCandidatesList}
                interviews={interviews}
                rooms={rooms}
                onOpenDossier={(candId) => {
                  setSelectedCandidateId(candId);
                  setActiveModal('DOSSIER');
                }}
              />
            )}

            {currentRole === 'INTERVIEWER' && (
              <InterviewerDashboard
                candidates={activeCandidatesList}
                interviews={interviews}
                rooms={rooms}
                currentInterviewerId={currentUserId}
                onStartInterview={handleStartInterview}
                onOpenEndInterviewModal={(intv) => {
                  setSelectedInterview(intv);
                  setActiveModal('END_INTERVIEW');
                }}
                onOpenDossier={(candId) => {
                  setSelectedCandidateId(candId);
                  setActiveModal('DOSSIER');
                }}
              />
            )}

            {currentRole === 'RECEPTION' && (
              <ReceptionDashboard
                candidates={activeCandidatesList}
                rooms={rooms}
                visitors={activeVisitorsList}
                filterStage={filterStage}
                onClearFilterStage={() => setFilterStage(null)}
                actionTasks={actionTasks}
                onAcknowledgeTask={handleAcknowledgeActionTask}
                onCompleteTask={handleCompleteActionTask}
                onCheckout={handleCheckout}
                onOpenCheckIn={() => {
                  setCheckInToken('WCR-APPT-901');
                  setActiveModal('CHECK_IN');
                }}
                onOpenWalkIn={() => setActiveModal('WALK_IN')}
                onOpenQR={() => setActiveModal('QR_PASS')}
                onOpenChat={() => {
                  setIsChatOpen(true);
                  setUnreadChatCount(0);
                }}
                onOpenChatWithContext={openChatWithContext}
                onRefresh={fetchAllData}
                onOpenMore={handleOpenMore}
              />
            )}

            {currentRole === 'PANTRY' && (
              <PantryDashboard
                tasks={pantryTasks}
                rooms={rooms}
                candidates={activeCandidatesList}
                actionTasks={actionTasks}
                onAcknowledgeTask={handleAcknowledgeActionTask}
                onCompleteTask={handleCompletePantryTask}
                onCompleteActionTask={handleCompleteActionTask}
                onMarkRoomCleaned={handleMarkRoomCleaned}
                onOpenChat={() => {
                  setIsChatOpen(true);
                  setUnreadChatCount(0);
                }}
                onRefresh={fetchAllData}
              />
            )}
          </motion.div>
        </AnimatePresence>
            </>
          )}
        </main>
      </div>

      {/* Floating Offline Indicator */}
      <OfflineIndicator />

      {/* Real-time In-App Internal Office Chat Toast Notification */}
      {chatToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full glass-panel-elevated border border-[#E5D2A0] rounded-2xl shadow-xl p-4 animate-in slide-in-from-bottom-5 duration-300 text-[#111111]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E5D2A0]/30 text-[#9E8243] border border-[#E5D2A0] flex items-center justify-center font-black shrink-0 mt-0.5">
                <MessageSquare className="w-5 h-5 text-[#9E8243]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-[#111111] truncate">{chatToast.senderName}</h4>
                  <span className="px-1.5 py-0.2 rounded-sm bg-[#FAF6ED] text-[9px] font-bold text-[#111111] border border-[#E5D2A0]">
                    {chatToast.senderRole}
                  </span>
                  <span className="text-[10px] text-[#70757A]">{chatToast.timestamp}</span>
                </div>
                <p className="text-xs text-[#111111]/85 mt-1 line-clamp-2 leading-relaxed">
                  {chatToast.content}
                </p>
                {(chatToast.candidateName || chatToast.roomName) && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {chatToast.candidateName && (
                      <span className="px-2 py-0.5 bg-[#FAF6ED] border border-[#E5D2A0]/60 rounded-md text-[10px] font-semibold text-[#111111]">
                        Candidate: {chatToast.candidateName}
                      </span>
                    )}
                    {chatToast.roomName && (
                      <span className="px-2 py-0.5 bg-[#FAF6ED] border border-[#E5D2A0]/60 rounded-md text-[10px] font-semibold text-[#111111]">
                        Room: {chatToast.roomName}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setChatToast(null)}
              className="text-[#70757A] hover:text-[#111111] p-1 rounded-lg hover:bg-[#FAF6ED] transition cursor-pointer shrink-0"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-[#E5D2A0]/30">
            <button
              onClick={() => {
                setChatToast(null);
                openChatWithContext({
                  candidateId: chatToast.candidateId,
                  roomId: chatToast.roomId,
                  channelId: chatToast.channelId,
                  recipientId: chatToast.recipientId,
                });
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1 cursor-pointer"
            >
              <span>Open Chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Slide-over Notification Feed Drawer */}
      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        notifications={notifications}
        role={currentRole}
        onActionClick={handleNotificationAction}
        onMarkRead={handleMarkNotificationRead}
        onRefresh={fetchAllData}
        onRecordDeleted={handleRecordDeleted}
      />

      {/* Real-time Internal Office Communication Modal */}
      <InternalChatModal
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setChatPrefillCandidateId('');
          setChatPrefillRoomId('');
          setChatPrefillMessage('');
        }}
        currentUser={currentUser}
        currentRole={currentRole}
        candidates={candidates}
        rooms={rooms}
        defaultRecipientId={chatRecipientId}
        defaultChannelId={chatChannelId}
        initialCandidateId={chatPrefillCandidateId}
        initialRoomId={chatPrefillRoomId}
        initialMessage={chatPrefillMessage}
        onOpenCandidateDossier={(candId) => {
          setSelectedCandidateId(candId);
          setActiveModal('DOSSIER');
        }}
        onOpenRoomContext={(roomId, roomName) => {
          const candInRoom = candidates.find(
            (c) => c.assignedRoomId === roomId || c.assignedRoomName === roomName
          );
          if (candInRoom) {
            setSelectedCandidateId(candInRoom.id);
            setActiveModal('DOSSIER');
          } else {
            setActiveModal('ASSIGN_ROOM');
          }
        }}
        onNewMessageSent={() => {
          if (currentUser?.id) {
            authenticatedFetch(`/api/chat/unread?userId=${currentUser.id}`)
              .then((r) => safeJson(r, { success: false, total: 0 }))
              .then((d) => {
                if (d.success && typeof d.total === 'number') {
                  setUnreadChatCount(d.total);
                }
              })
              .catch(() => {});
          }
        }}
      />

      {/* MODALS */}
      {/* 1. GENERAL WCR BLANK CANDIDATE SELF-REGISTRATION MODAL */}
      {activeModal === 'GENERAL_REGISTER' && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs p-4 flex items-center justify-center">
          <GeneralNewCandidateRegister
            onSuccess={() => {
              fetchAllData();
            }}
            onCancel={() => setActiveModal(null)}
          />
        </div>
      )}

      {/* 2. SCHEDULED CANDIDATE CHECK-IN PORTAL MODAL */}
      {activeModal === 'CHECK_IN' && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs p-4 flex items-center justify-center">
          <CandidateCheckInForm
            initialToken={checkInToken}
            onSuccess={() => {
              fetchAllData();
            }}
            onCancel={() => setActiveModal(null)}
          />
        </div>
      )}

      {/* 3. DUAL QR PASS STATION MODAL */}
      {activeModal === 'QR_PASS' && (
        <QRPassModal
          onClose={() => setActiveModal(null)}
          onLaunchCheckIn={(token) => {
            setCheckInToken(token);
            setActiveModal('CHECK_IN');
          }}
          onLaunchGeneralRegister={() => {
            setActiveModal('GENERAL_REGISTER');
          }}
        />
      )}

      {/* 4. WALK-IN VISITOR MODAL */}
      {activeModal === 'WALK_IN' && (
        <WalkInModal
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            setActiveModal(null);
            fetchAllData();
          }}
        />
      )}

      {/* 5. CANDIDATE DOSSIER MODAL */}
      {activeModal === 'DOSSIER' && selectedCandidateId && (
        <CandidateDossierModal
          candidateId={selectedCandidateId}
          initialCandidate={candidates.find((c) => c.id === selectedCandidateId)}
          currentRole={currentRole}
          onClose={() => {
            setSelectedCandidateId('');
            setActiveModal(null);
            setFilterStage(null);
          }}
          onCandidateUpdated={fetchAllData}
          onCandidateDeleted={() => {
            setSelectedCandidateId('');
            setActiveModal(null);
            fetchAllData();
          }}
          onAssignRoom={(candId, intvId) => {
            setSelectedCandidateId(candId);
            setSelectedInterview(intvId ? interviews.find((i) => i.id === intvId) || null : null);
            setActiveModal('ASSIGN_ROOM');
          }}
        />
      )}

      {/* 6. HR ASSIGN ROOM MODAL */}
      {activeModal === 'ASSIGN_ROOM' && selectedCandidateId && (
        <AssignRoomModal
          candidateId={selectedCandidateId}
          candidateName={
            candidates.find((c) => c.id === selectedCandidateId)?.fullName || 'Candidate'
          }
          interviewId={selectedInterview?.id}
          onClose={() => {
            setActiveModal(null);
            setSelectedInterview(null);
          }}
          onSuccess={() => {
            setActiveModal(null);
            setSelectedInterview(null);
            fetchAllData();
          }}
        />
      )}

      {/* 7. INTERVIEWER END INTERVIEW DECISION MODAL */}
      {activeModal === 'END_INTERVIEW' && selectedInterview && (
        <EndInterviewModal
          interviewId={selectedInterview.id}
          candidateName={selectedInterview.candidateName}
          interviewerName={selectedInterview.interviewerName}
          currentRound={selectedInterview.roundName}
          onClose={() => {
            setActiveModal(null);
            setSelectedInterview(null);
          }}
          onSuccess={() => {
            setActiveModal(null);
            setSelectedInterview(null);
            fetchAllData();
          }}
        />
      )}

      {/* 8. STAFF LOGIN MODAL (EMAIL + PASSWORD) */}
      {activeModal === 'STAFF_LOGIN' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="glass-panel-elevated border border-[#E5D2A0] rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-[#111111]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5D2A0]/40">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#9E8243]" />
                <h3 className="text-base font-bold text-[#111111]">Staff Login</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-[#111111] hover:text-[#9E8243] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loginError && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs">
                {loginError}
              </div>
            )}

            {loginSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{loginSuccess}</span>
              </div>
            )}

            <form onSubmit={handleStaffLogin} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#111111] font-semibold mb-1">Staff Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. reception@whitecollarrealty.com"
                  className="w-full px-3 py-2 bg-white border border-[#E5D2A0] rounded-xl text-[#111111] text-xs"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[#111111] font-semibold">Password</label>
                  <button
                    type="button"
                    onClick={() => setActiveModal('FORGOT_PASSWORD')}
                    className="text-[#9E8243] hover:text-[#7E6532] text-[11px] font-semibold underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5D2A0] rounded-xl text-[#111111] text-xs"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-white via-[#FAF6ED] to-[#E5D2A0] hover:to-[#D8BF85] text-[#111111] font-bold rounded-xl border border-[#E5D2A0] shadow-sm transition cursor-pointer"
                >
                  Authenticate Staff Session
                </button>
              </div>

              <div className="pt-2 border-t border-[#E5D2A0]/40 text-[10px] space-y-1.5">
                <p className="font-semibold text-[#111111]/80">Quick Select Staff Role (Password: <span className="font-mono text-[#9E8243] font-bold">wcr123</span>):</p>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('lalit@whitecollarrealty.com');
                      setLoginPassword('wcr123');
                    }}
                    className="p-1.5 bg-white hover:bg-[#FAF6ED] border border-[#E5D2A0]/60 rounded-lg text-left text-[#111111] transition cursor-pointer shadow-xs"
                  >
                    <span className="font-bold text-emerald-700 block">CEO Suite</span>
                    <span className="text-[9px] text-[#70757A] font-mono truncate block">lalit@...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('nisha@whitecollarrealty.com');
                      setLoginPassword('wcr123');
                    }}
                    className="p-1.5 bg-white hover:bg-[#FAF6ED] border border-[#E5D2A0]/60 rounded-lg text-left text-[#111111] transition cursor-pointer shadow-xs"
                  >
                    <span className="font-bold text-[#9E8243] block">HR Lead</span>
                    <span className="text-[9px] text-[#70757A] font-mono truncate block">nisha@...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('kimmi@whitecollarrealty.com');
                      setLoginPassword('wcr123');
                    }}
                    className="p-1.5 bg-white hover:bg-[#FAF6ED] border border-[#E5D2A0]/60 rounded-lg text-left text-[#111111] transition cursor-pointer shadow-xs"
                  >
                    <span className="font-bold text-[#7E6532] block">Kimmi Mam (Sr HR)</span>
                    <span className="text-[9px] text-[#70757A] font-mono truncate block">kimmi@...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('reception@whitecollarrealty.com');
                      setLoginPassword('wcr123');
                    }}
                    className="p-1.5 bg-white hover:bg-[#FAF6ED] border border-[#E5D2A0]/60 rounded-lg text-left text-[#111111] transition cursor-pointer shadow-xs"
                  >
                    <span className="font-bold text-sky-700 block">Reception Desk</span>
                    <span className="text-[9px] text-[#70757A] font-mono truncate block">reception@...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('pantry@whitecollarrealty.com');
                      setLoginPassword('wcr123');
                    }}
                    className="p-1.5 bg-white hover:bg-[#FAF6ED] border border-[#E5D2A0]/60 rounded-lg text-left text-[#111111] transition cursor-pointer shadow-xs"
                  >
                    <span className="font-bold text-[#9E8243] block">Pantry Steward</span>
                    <span className="text-[9px] text-[#70757A] font-mono truncate block">pantry@...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('sameer@whitecollarrealty.com');
                      setLoginPassword('wcr123');
                    }}
                    className="p-1.5 bg-white hover:bg-[#FAF6ED] border border-[#E5D2A0]/60 rounded-lg text-left text-[#111111] transition cursor-pointer shadow-xs"
                  >
                    <span className="font-bold text-purple-700 block">Admin Ops</span>
                    <span className="text-[9px] text-[#70757A] font-mono truncate block">sameer@...</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. FORGOT PASSWORD MODAL */}
      {activeModal === 'FORGOT_PASSWORD' && (
        <ForgotPasswordModal
          onClose={() => setActiveModal(null)}
          onNavigateToReset={(token) => {
            setActiveModal(null);
            window.history.pushState({}, '', `/reset-password?token=${encodeURIComponent(token)}`);
            setRoutePath('/reset-password');
          }}
        />
      )}

      {/* 10. CREATE PANTRY & HOSPITALITY TASK MODAL */}
      {activeModal === 'CREATE_PANTRY_TASK' && (
        <CreatePantryTaskModal
          rooms={rooms}
          candidates={candidates}
          currentUserName={currentUser?.name || (currentRole === 'ADMIN' ? 'Sameer Sir' : currentRole === 'CEO' ? 'Lalit Sir' : 'Nisha')}
          currentUserRole={currentRole}
          currentUserId={currentUserId}
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            setActiveModal(null);
            fetchAllData();
          }}
        />
      )}

      {/* 11. PANTRY REALTIME PROGRESS MONITOR MODAL */}
      {activeModal === 'PANTRY_MONITOR' && (
        <PantryRealtimeMonitorModal
          tasks={pantryTasks}
          currentUserId={currentUserId}
          currentUserRole={currentRole}
          currentUserName={currentUser?.name || (currentRole === 'ADMIN' ? 'Sameer Sir' : currentRole === 'CEO' ? 'Lalit Sir' : 'Nisha')}
          onClose={() => setActiveModal(null)}
          onOpenCreateTask={() => setActiveModal('CREATE_PANTRY_TASK')}
          onRefresh={fetchAllData}
        />
      )}

      {/* 10. EXPANDABLE DASHBOARD CARD DETAILS MODAL */}
      <DashboardCardDetailsModal
        isOpen={dashboardDetailsModalTarget !== null}
        onClose={() => setDashboardDetailsModalTarget(null)}
        target={dashboardDetailsModalTarget}
        candidates={candidates}
        interviews={interviews}
        rooms={rooms}
        pantryTasks={pantryTasks}
        visitors={visitors}
        actionTasks={actionTasks}
        currentRole={currentRole}
        onOpenDossier={(candId) => {
          setSelectedCandidateId(candId);
          setActiveModal('DOSSIER');
        }}
        onAssignRoom={(candId, intvId) => {
          setSelectedCandidateId(candId);
          setSelectedInterview(intvId ? interviews.find((i) => i.id === intvId) || null : null);
          setActiveModal('ASSIGN_ROOM');
        }}
        onStartInterview={handleStartInterview}
        onOpenEndInterviewModal={(intv) => {
          setSelectedInterview(intv);
          setActiveModal('END_INTERVIEW');
        }}
        onOpenDeskPhoto={(cand) => {
          setSelectedCandidateId(cand.id);
        }}
        onCompletePantryTask={handleCompletePantryTask}
        onMarkRoomCleaned={handleMarkRoomCleaned}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
