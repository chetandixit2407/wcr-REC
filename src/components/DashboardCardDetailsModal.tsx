import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { smoothEase } from '../utils/motion.ts';
import {
  X,
  Calendar,
  Clock,
  QrCode,
  Camera,
  BellRing,
  DoorOpen,
  LogOut,
  Users,
  UserCheck,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Eye,
  Search,
  Sparkles,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Play,
  RotateCcw,
} from 'lucide-react';
import type {
  Candidate,
  Interview,
  Room,
  PantryTask,
  Visitor,
  UserRole,
  ActionTask,
} from '../types/index.ts';
import { computeArrivalStage, type ArrivalStage } from './VisitorArrivalTimeline.tsx';
import { formatPhotoTimestamp } from '../utils/dateFormatter.ts';
import { formatCandidateExperience } from '../utils/candidateHelpers.ts';
import { CandidateAvatar } from './CandidateAvatar.tsx';


export type DashboardModalTarget =
  | 'stage_EXPECTED'
  | 'stage_ARRIVED'
  | 'stage_PHOTO_CAPTURED'
  | 'stage_HOST_NOTIFIED'
  | 'stage_IN_OFFICE'
  | 'stage_EXITED'
  | 'kpi_lobby'
  | 'kpi_interviews'
  | 'kpi_rooms'
  | 'kpi_pantry'
  | 'summary_in_session'
  | 'summary_checkout_ready'
  | 'summary_senior_reviews'
  | 'summary_action_tasks';

interface DashboardCardDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: DashboardModalTarget | null;
  candidates: Candidate[];
  interviews?: Interview[];
  rooms?: Room[];
  pantryTasks?: PantryTask[];
  visitors?: Visitor[];
  actionTasks?: ActionTask[];
  currentRole: UserRole;
  onOpenDossier: (candidateId: string) => void;
  onAssignRoom?: (candidateId: string, interviewId?: string) => void;
  onStartInterview?: (interviewId: string) => void;
  onOpenEndInterviewModal?: (interview: Interview) => void;
  onOpenDeskPhoto?: (candidate: Candidate) => void;
  onCompletePantryTask?: (taskId: string) => void;
  onMarkRoomCleaned?: (roomId: string) => void;
  onCheckout?: (candidateId: string) => void;
}

export const DashboardCardDetailsModal: React.FC<DashboardCardDetailsModalProps> = ({
  isOpen,
  onClose,
  target,
  candidates,
  interviews = [],
  rooms = [],
  pantryTasks = [],
  visitors = [],
  actionTasks = [],
  currentRole,
  onOpenDossier,
  onAssignRoom,
  onStartInterview,
  onOpenEndInterviewModal,
  onOpenDeskPhoto,
  onCompletePantryTask,
  onMarkRoomCleaned,
  onCheckout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset search when modal target changes
  useEffect(() => {
    setSearchQuery('');
  }, [target]);

  if (!isOpen || !target) return null;

  // Operational rooms filter
  const operationalRooms = rooms.filter(
    (r) =>
      r.id !== 'room-lalit-cabin' &&
      r.id !== 'room-kimmi-cabin' &&
      r.name !== 'Lalit Sir Cabin' &&
      r.name !== 'Elegance Suite' &&
      !r.isReservedNextRound
  );

  // Determine metadata, filter criteria and records based on target
  let title = '';
  let subtitle = '';
  let icon = Users;
  let accentColor = 'text-amber-400';
  let badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  let recordType: 'candidates' | 'interviews' | 'rooms' | 'pantry' | 'action_tasks' = 'candidates';
  let matchedCandidates: Candidate[] = [];
  let matchedInterviews: Interview[] = [];
  let matchedRooms: Room[] = [];
  let matchedPantryTasks: PantryTask[] = [];
  let matchedActionTasks: ActionTask[] = [];

  switch (target) {
    case 'stage_EXPECTED':
      title = 'Expected Visitors & Appointments';
      subtitle = 'Scheduled candidates & pre-invited official visitors pending physical check-in arrival';
      icon = Calendar;
      accentColor = 'text-slate-300';
      badgeColor = 'bg-slate-700/40 text-slate-200 border-slate-600';
      recordType = 'candidates';
      matchedCandidates = candidates.filter((c) => computeArrivalStage(c).currentStage === 'EXPECTED');
      break;

    case 'stage_ARRIVED':
      title = 'Arrived in Waiting Lounge';
      subtitle = 'Candidates & visitors who have completed initial door intake and are waiting in lobby';
      icon = Clock;
      accentColor = 'text-amber-400';
      badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      recordType = 'candidates';
      matchedCandidates = candidates.filter((c) => computeArrivalStage(c).currentStage === 'ARRIVED');
      break;

    case 'stage_PHOTO_CAPTURED':
      title = 'Desk Photo Verified Profiles';
      subtitle = 'Candidates with live WebRTC reception desk photo authenticated and locked';
      icon = Camera;
      accentColor = 'text-blue-400';
      badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      recordType = 'candidates';
      matchedCandidates = candidates.filter((c) => Boolean(c.receptionPhotoUrl || c.photoUrl || c.livePhoto || c.arrivalPhoto));
      break;

    case 'stage_HOST_NOTIFIED':
      title = 'Host & Interviewer Alerted';
      subtitle = 'Interview panel alerted with candidate dossier notification and destination cabin dispatch';
      icon = BellRing;
      accentColor = 'text-purple-400';
      badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      recordType = 'candidates';
      matchedCandidates = candidates.filter((c) => Boolean(c.assignedInterviewerName || c.status === 'WAITING'));
      break;

    case 'stage_IN_OFFICE':
      title = 'In-Office Active Meetings';
      subtitle = 'Candidates and guests currently inside designated interview cabins or executive boardrooms';
      icon = DoorOpen;
      accentColor = 'text-emerald-400';
      badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      recordType = 'candidates';
      matchedCandidates = candidates.filter((c) => computeArrivalStage(c).currentStage === 'IN_OFFICE');
      break;

    case 'stage_EXITED':
      title = 'Checked Out & Concluded';
      subtitle = 'Visitors & evaluated candidates who have completed formal physical checkout and exited premises';
      icon = LogOut;
      accentColor = 'text-slate-400';
      badgeColor = 'bg-slate-700/40 text-slate-300 border-slate-600';
      recordType = 'candidates';
      matchedCandidates = candidates.filter((c) => computeArrivalStage(c).currentStage === 'EXITED');
      break;

    case 'kpi_lobby':
      title = 'Lobby Waiting Priority Queue';
      subtitle = 'Real-time candidate intake awaiting escort or room allocation by HR';
      icon = Users;
      accentColor = 'text-amber-400';
      badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      recordType = 'candidates';
      matchedCandidates = candidates.filter(
        (c) => c.status === 'ARRIVED' || c.status === 'WAITING' || c.status === 'With Kimmi Mam – Senior HR Interview'
      );
      break;

    case 'kpi_interviews':
      title = 'Today’s Evaluation Pipeline';
      subtitle = 'Scheduled rounds, active cabin sessions, and concluded candidate reviews';
      icon = UserCheck;
      accentColor = 'text-blue-400';
      badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      recordType = 'interviews';
      matchedInterviews = interviews.length > 0 ? interviews : [];
      break;

    case 'kpi_rooms':
      title = 'Office Rooms & Cabins Readiness';
      subtitle = 'Real-time cabin occupancy, sanitization status, and availability tracking';
      icon = DoorOpen;
      accentColor = 'text-emerald-400';
      badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      recordType = 'rooms';
      matchedRooms = operationalRooms;
      break;

    case 'kpi_pantry':
      title = 'Pantry & Hospitality Service Tasks';
      subtitle = 'Live beverage deliveries, glassware setup, and cabin sanitization reset queue';
      icon = Coffee;
      accentColor = 'text-purple-400';
      badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      recordType = 'pantry';
      matchedPantryTasks = pantryTasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
      break;

    case 'summary_in_session':
      title = 'Candidates In Session';
      subtitle = 'Live evaluation meetings currently occupying office cabins';
      icon = DoorOpen;
      accentColor = 'text-blue-400';
      badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      recordType = 'candidates';
      matchedCandidates = candidates.filter((c) => c.status === 'IN_INTERVIEW' || c.status === 'ROOM_ASSIGNED');
      break;

    case 'summary_checkout_ready':
      title = 'Ready For Physical Checkout';
      subtitle = 'Candidates who finished evaluations and are cleared at front desk';
      icon = LogOut;
      accentColor = 'text-emerald-400';
      badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      recordType = 'candidates';
      matchedCandidates = candidates.filter(
        (c) => c.status === 'COMPLETED' || c.status === 'OFFERED' || c.status === 'REJECTED'
      );
      break;

    case 'summary_senior_reviews':
      title = 'Senior HR & Kimmi Mam Review Queue';
      subtitle = 'High-level executive interviews routed directly for Senior HR consultation';
      icon = Sparkles;
      accentColor = 'text-amber-400';
      badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      recordType = 'candidates';
      matchedCandidates = candidates.filter(
        (c) =>
          c.status === 'With Kimmi Mam – Senior HR Interview' ||
          (c as any).assignedInterviewerName?.includes('Kimmi')
      );
      break;

    case 'summary_action_tasks':
      title = 'Immediate Action Alerts & Tasks';
      subtitle = 'Real-time escort instructions & urgent service requests across operations';
      icon = AlertCircle;
      accentColor = 'text-amber-400';
      badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      recordType = 'action_tasks';
      matchedActionTasks = actionTasks.filter((t) => t.status !== 'DISMISSED');
      break;
  }

  // Filter items by search query if any
  const q = searchQuery.toLowerCase().trim();

  const filteredCandidates = matchedCandidates.filter(
    (c) =>
      !q ||
      c.fullName.toLowerCase().includes(q) ||
      (c.position && c.position.toLowerCase().includes(q)) ||
      (c.assignedRoomName && c.assignedRoomName.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
  );

  const filteredInterviews = matchedInterviews.filter(
    (i) =>
      !q ||
      i.candidateName.toLowerCase().includes(q) ||
      i.position.toLowerCase().includes(q) ||
      i.roundName.toLowerCase().includes(q) ||
      i.interviewerName.toLowerCase().includes(q) ||
      (i.roomName && i.roomName.toLowerCase().includes(q))
  );

  const filteredRooms = matchedRooms.filter(
    (r) =>
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      (r.currentCandidateName && r.currentCandidateName.toLowerCase().includes(q))
  );

  const filteredPantry = matchedPantryTasks.filter(
    (p) =>
      !q ||
      (p.roomName && p.roomName.toLowerCase().includes(q)) ||
      (p.candidateName && p.candidateName.toLowerCase().includes(q)) ||
      p.description.toLowerCase().includes(q)
  );

  const totalCount =
    recordType === 'candidates'
      ? matchedCandidates.length
      : recordType === 'interviews'
      ? matchedInterviews.length
      : recordType === 'rooms'
      ? matchedRooms.length
      : recordType === 'pantry'
      ? matchedPantryTasks.length
      : matchedActionTasks.length;

  const IconComponent = icon;

  const modalContent = (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto"
      >
        {/* Subtle Backdrop with click to close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#121316]/50 backdrop-blur-md"
        />

        {/* Modal Window Container — Crextio Crisp White Surface */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 6 }}
          transition={{ duration: 0.28, ease: smoothEase }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-white border border-[#E5DFD4] rounded-2xl sm:rounded-3xl shadow-2xl text-[#121316] overflow-hidden z-10 min-w-0"
        >
          {/* Header Bar */}
          <div className="p-3.5 sm:p-5 border-b border-[#E5DFD4] flex items-center justify-between gap-2.5 sm:gap-3 bg-[#FAF7F0] min-w-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white border border-[#E5DFD4] flex items-center justify-center shrink-0 shadow-xs">
                <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 ${accentColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base md:text-lg font-bold text-[#121316] tracking-tight truncate max-w-full">
                    {title}
                  </h2>
                  <span className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border font-mono shrink-0 ${badgeColor}`}>
                    {totalCount} {totalCount === 1 ? 'Record' : 'Records'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-[#6F727A] mt-0.5 truncate">{subtitle}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-[#6F727A] hover:text-[#121316] hover:bg-white border border-[#E5DFD4] transition cursor-pointer shrink-0 shadow-xs"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Strip */}
          <div className="px-3.5 sm:px-5 py-2.5 border-b border-[#E5DFD4] bg-[#FAF7F0] flex items-center justify-between gap-2.5 sm:gap-3 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6F727A] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, room, position, or status..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E5DFD4] rounded-xl text-xs text-[#121316] placeholder-[#6F727A] focus:outline-none focus:border-[#121316] min-w-0 shadow-xs"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-[#121316] hover:underline cursor-pointer shrink-0 font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Scrollable Records Container */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 bg-white min-w-0">
            {/* CANDIDATES RECORDS VIEW */}
            {recordType === 'candidates' && (
              <>
                {filteredCandidates.length === 0 ? (
                  <div className="py-14 text-center space-y-3 bg-[#FAF7F0] rounded-2xl border border-[#E5DFD4] p-6">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5DFD4] flex items-center justify-center text-[#121316] mx-auto shadow-xs">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[#121316]">No records in this status</h3>
                      <p className="text-xs text-[#6F727A] max-w-sm mx-auto leading-relaxed">
                        Currently, no candidates or guests match this stage filter. As live appointments check in, they will be listed here in real time.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredCandidates.map((cand) => {
                    return (
                      <div
                        key={cand.id}
                        className="p-3.5 sm:p-4 rounded-2xl border border-[#E5DFD4] bg-[#FAF7F0] text-[#121316] transition shadow-xs hover:border-[#121316]/30 min-w-0 max-w-full"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0">
                          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                            <div className="flex flex-col items-center shrink-0">
                              <CandidateAvatar
                                candidate={cand}
                                name={cand.fullName}
                                sizeClassName="w-11 h-11 sm:w-12 sm:h-12"
                                roundedClassName="rounded-xl"
                                borderClassName="border-2 border-[#121316]"
                                fallbackBgClassName="bg-[#F5EB78]"
                                fallbackTextClassName="text-[#121316]"
                              />

                              {(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt || cand.livePhotoCapturedAt) && (
                                <span
                                  className="text-[9px] text-[#6F727A] font-mono tracking-tight mt-1 text-center truncate max-w-[75px] sm:max-w-[85px]"
                                  title={`Captured: ${formatPhotoTimestamp(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt || cand.livePhotoCapturedAt)}`}
                                >
                                  {formatPhotoTimestamp(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt || cand.livePhotoCapturedAt).split(',')[0]}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-sm sm:text-base text-[#121316] truncate max-w-full">{cand.fullName}</h4>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#F5EB78] text-[#121316] border border-[#121316]/10 shrink-0">
                                  {cand.status}
                                </span>
                              </div>
                              <p className="text-xs text-[#121316] font-semibold truncate max-w-full">{cand.position}</p>
                              <div className="flex items-center gap-x-3 gap-y-1 text-[11px] text-[#6F727A] pt-0.5 flex-wrap">
                                {cand.checkedInAt && (
                                  <span className="flex items-center gap-1 font-mono shrink-0">
                                    <Clock className="w-3 h-3 text-[#6F727A] shrink-0" />
                                    <span>Arrived: {new Date(cand.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </span>
                                )}
                                <span className="flex items-center gap-1 min-w-0">
                                  <MapPin className="w-3 h-3 text-[#6F727A] shrink-0" />
                                  <span className="truncate max-w-[140px] sm:max-w-[200px]">{cand.assignedRoomName || cand.currentLocation || 'Waiting Lounge'}</span>
                                </span>
                                {cand.totalExperience && (
                                  <span className="shrink-0">Exp: <strong className="text-[#121316]">{formatCandidateExperience(cand.totalExperience)}</strong></span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons: Responsive arrangement */}
                          <div className="flex flex-wrap items-center justify-start md:justify-end gap-1.5 pt-2.5 md:pt-0 border-t md:border-t-0 border-[#E5DFD4] shrink-0">
                            {onAssignRoom && (cand.status === 'ARRIVED' || cand.status === 'WAITING') && (
                              <button
                                onClick={() => {
                                  onAssignRoom(cand.id, cand.currentInterviewId);
                                  onClose();
                                }}
                                className="px-3 py-1.5 bg-[#F5EB78] hover:bg-[#ebd545] text-[#121316] font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                <DoorOpen className="w-3.5 h-3.5" />
                                <span>Assign Room</span>
                              </button>
                            )}

                            {onOpenDeskPhoto && !cand.receptionPhotoUrl && currentRole === 'RECEPTION' && (
                              <button
                                onClick={() => {
                                  onOpenDeskPhoto(cand);
                                  onClose();
                                }}
                                className="px-3 py-1.5 bg-white hover:bg-[#FAF7F0] text-[#121316] border border-[#E5DFD4] font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <span>Capture Photo</span>
                              </button>
                            )}

                            {onCheckout && (cand.status === 'COMPLETED' || cand.status === 'OFFERED' || cand.status === 'REJECTED') && (
                              <button
                                onClick={() => {
                                  onCheckout(cand.id);
                                }}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Checkout</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                onOpenDossier(cand.id);
                                onClose();
                              }}
                              className="px-3 py-1.5 bg-white hover:bg-[#FAF7F0] text-[#121316] font-semibold text-xs rounded-xl border border-[#E5DFD4] transition cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#121316]" />
                              <span>View Dossier</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* INTERVIEWS RECORDS VIEW */}
            {recordType === 'interviews' && (
              <>
                {filteredInterviews.length === 0 ? (
                  <div className="py-14 text-center space-y-3 bg-[#FAF7F0] rounded-2xl border border-[#E5DFD4] p-6">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5DFD4] flex items-center justify-center text-[#121316] mx-auto shadow-xs">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[#121316]">No interview evaluations today</h3>
                      <p className="text-xs text-[#6F727A] max-w-sm mx-auto leading-relaxed">
                        When candidates are scheduled or advanced into evaluation rounds, they will populate here.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredInterviews.map((intv) => {
                    return (
                      <div
                        key={intv.id}
                        className="p-3.5 sm:p-4 rounded-2xl border border-[#E5DFD4] bg-[#FAF7F0] text-[#121316] transition shadow-xs hover:border-[#121316]/30 min-w-0 max-w-full"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0">
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm sm:text-base text-[#121316] truncate max-w-full">{intv.candidateName}</h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#F5EB78] text-[#121316] border border-[#121316]/10 shrink-0">
                                {intv.roundName}
                              </span>
                            </div>
                            <p className="text-xs text-[#121316] font-semibold truncate max-w-full">{intv.position}</p>
                            <div className="flex items-center gap-x-3 gap-y-1 text-[11px] text-[#6F727A] pt-0.5 flex-wrap">
                              <span>Interviewer: <strong className="text-[#121316]">{intv.interviewerName}</strong></span>
                              <span>Room: <strong className="text-[#121316]">{intv.roomName || 'Pending'}</strong></span>
                              <span className="font-mono">Status: {intv.status}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-start md:justify-end gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-[#E5DFD4] shrink-0">
                            {intv.candidateId && (
                              <button
                                onClick={() => {
                                  onOpenDossier(intv.candidateId);
                                  onClose();
                                }}
                                className="px-3 py-1.5 bg-white hover:bg-[#FAF7F0] text-[#121316] font-semibold text-xs rounded-xl border border-[#E5DFD4] transition cursor-pointer shrink-0 shadow-xs"
                              >
                                Dossier &rarr;
                              </button>
                            )}

                            {intv.status === 'INTERVIEW_STARTED' && onOpenEndInterviewModal && (
                              <button
                                onClick={() => {
                                  onOpenEndInterviewModal(intv);
                                  onClose();
                                }}
                                className="px-3 py-1.5 bg-[#F5EB78] hover:bg-[#ebd545] text-[#121316] font-bold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0"
                              >
                                Conclude
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* ROOMS RECORDS VIEW */}
            {recordType === 'rooms' && (
              <>
                {filteredRooms.length === 0 ? (
                  <div className="py-14 text-center space-y-3 bg-[#FAF7F0] rounded-2xl border border-[#E5DFD4] p-6">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5DFD4] flex items-center justify-center text-[#121316] mx-auto shadow-xs">
                      <DoorOpen className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[#121316]">No rooms available</h3>
                      <p className="text-xs text-[#6F727A] max-w-sm mx-auto leading-relaxed">
                        No meeting cabins matched your search query.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredRooms.map((room) => {
                      const isAvail = room.status === 'AVAILABLE';
                      const isCleaning = room.status === 'CLEANING' || room.status === 'NEEDS_CLEANING';

                      return (
                        <div
                          key={room.id}
                          className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E5DFD4] space-y-2 text-xs shadow-xs text-[#121316]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#121316] text-sm">{room.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                                isAvail
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                  : isCleaning
                                  ? 'bg-[#F5EB78] text-[#121316] border border-[#121316]/20'
                                  : 'bg-blue-50 text-blue-800 border border-blue-300'
                              }`}
                            >
                              {room.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#6F727A]">
                            <span className="capitalize">{room.type?.replace('_', ' ').toLowerCase()}</span>
                            {!isAvail && room.currentCandidateName && (
                              <span className="text-[#121316] font-semibold truncate max-w-[140px]">
                                Occupant: {room.currentCandidateName}
                              </span>
                            )}
                          </div>

                          {isCleaning && onMarkRoomCleaned && (
                            <button
                              onClick={() => onMarkRoomCleaned(room.id)}
                              className="w-full mt-2 py-1.5 bg-[#F5EB78] hover:bg-[#ebd545] text-[#121316] font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Sanitized & Ready</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* PANTRY TASKS RECORDS VIEW */}
            {recordType === 'pantry' && (
              <>
                {filteredPantry.length === 0 ? (
                  <div className="py-14 text-center space-y-3 bg-[#FAF7F0] rounded-2xl border border-[#E5DFD4] p-6">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5DFD4] flex items-center justify-center text-[#121316] mx-auto shadow-xs">
                      <Coffee className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[#121316]">No pending hospitality tasks</h3>
                      <p className="text-xs text-[#6F727A] max-w-sm mx-auto leading-relaxed">
                        All meeting rooms are prepped, glassware is sanitized, and refreshments are served.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredPantry.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5DFD4] space-y-2.5 text-xs shadow-xs text-[#121316]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#121316] text-sm">
                            {task.roomName || 'Meeting Cabin'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F5EB78] text-[#121316] font-mono border border-[#121316]/10">
                            {task.taskType}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#121316] font-mono font-bold">
                          {task.priority || 'NORMAL'} PRIORITY
                        </span>
                      </div>

                      <p className="text-xs text-[#6F727A]">{task.description}</p>

                      {task.requiredItems && task.requiredItems.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {task.requiredItems.map((item, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-white border border-[#E5DFD4] text-[10px] text-[#121316] shadow-2xs"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      )}

                      {onCompletePantryTask && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => onCompletePantryTask(task.id)}
                            className="px-4 py-1.5 bg-[#F5EB78] hover:bg-[#ebd545] text-[#121316] font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Completed</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </>
            )}

            {/* ACTION TASKS VIEW */}
            {recordType === 'action_tasks' && (
              <>
                {matchedActionTasks.length === 0 ? (
                  <div className="py-14 text-center space-y-3 bg-[#FAF7F0] rounded-2xl border border-[#E5DFD4] p-6">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5DFD4] flex items-center justify-center text-[#121316] mx-auto shadow-xs">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[#121316]">No pending operational tasks</h3>
                      <p className="text-xs text-[#6F727A] max-w-sm mx-auto leading-relaxed">
                        All reception escorts and immediate notifications are currently clear.
                      </p>
                    </div>
                  </div>
                ) : (
                  matchedActionTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5DFD4] space-y-2 text-xs text-[#121316] shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#121316] text-sm">{task.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#F5EB78] text-[#121316]">
                          {task.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#6F727A]">{task.instruction}</p>
                    </div>
                  ))
                )}
              </>
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-3.5 sm:p-4 border-t border-[#E5DFD4] bg-[#FAF7F0] flex items-center justify-between text-xs text-[#6F727A]">
            <span className="font-mono">
              Live Real-Time Sync &bull; Role: <strong className="text-[#121316]">{currentRole}</strong>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-white hover:bg-[#FAF7F0] border border-[#E5DFD4] text-[#121316] font-semibold rounded-xl transition cursor-pointer shadow-xs"
            >
              Close View
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
