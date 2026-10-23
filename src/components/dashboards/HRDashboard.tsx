import React, { useState } from 'react';
import { motion } from 'motion/react';
import { smoothEase, staggerContainer, staggerItem } from '../../utils/motion.ts';
import {
  Users,
  DoorOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  MapPin,
  Sparkles,
  ArrowRight,
  Award,
  MessageSquare,
  ShieldCheck,
  Calendar,
  Edit3,
  Trash2,
  User,
  RotateCcw,
} from 'lucide-react';
import type { Candidate, Interview, Room, ActionTask } from '../../types/index.ts';
import { authenticatedFetch } from '../../utils/apiClient.ts';
import { formatPhotoTimestamp } from '../../utils/dateFormatter.ts';
import { formatExperienceBadge, formatCandidateLocation } from '../../utils/candidateHelpers.ts';
import { HRSubProfileView, HRProfileKey } from '../HRSubProfileView.tsx';
import { EditRecordModal } from '../modals/EditRecordModal.tsx';
import { DeleteConfirmModal, DeleteRecordType } from '../modals/DeleteConfirmModal.tsx';
import type { ArrivalStage } from '../VisitorArrivalTimeline.tsx';
import { CandidateAvatar } from '../CandidateAvatar.tsx';


interface HRDashboardProps {
  candidates: Candidate[];
  interviews: Interview[];
  rooms: Room[];
  filterStage?: ArrivalStage | null;
  onClearFilterStage?: () => void;
  actionTasks?: ActionTask[];
  initialSubProfile?: 'all' | 'nisha' | 'shriyanshi';
  onOpenDossier: (candidateId: string) => void;
  onAssignRoom: (candidateId: string, interviewId?: string) => void;
  onOpenChat?: () => void;
  onOpenChatWithContext?: (options: {
    candidateId?: string;
    roomId?: string;
    channelId?: string;
    recipientId?: string;
    initialMessage?: string;
  }) => void;
  onRefresh: () => void;
  onRecordDeleted?: (id: string, type: DeleteRecordType) => void;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({
  candidates,
  interviews,
  rooms,
  filterStage,
  onClearFilterStage,
  actionTasks = [],
  initialSubProfile = 'all',
  onOpenDossier,
  onAssignRoom,
  onOpenChat,
  onOpenChatWithContext,
  onRefresh,
  onRecordDeleted,
}) => {
  const [subProfileMode, setSubProfileMode] = useState<'all' | 'nisha' | 'shriyanshi'>(initialSubProfile);
  const [assigningKimmiId, setAssigningKimmiId] = useState<string | null>(null);

  // Modal states for Edit and Delete
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    recordType: DeleteRecordType;
    record: any;
  }>({
    isOpen: false,
    recordType: 'CANDIDATE',
    record: null,
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    recordType: DeleteRecordType;
    recordId: string;
    recordName: string;
    metadata?: Record<string, any>;
  }>({
    isOpen: false,
    recordType: 'CANDIDATE',
    recordId: '',
    recordName: '',
  });

  // If viewing a dedicated HR sub-profile, render HRSubProfileView directly
  if (subProfileMode === 'nisha' || subProfileMode === 'shriyanshi') {
    return (
      <HRSubProfileView
        activeProfileKey={subProfileMode as HRProfileKey}
        onSelectProfile={(p) => setSubProfileMode(p)}
        onBackToHRDashboard={() => setSubProfileMode('all')}
        onOpenDossier={onOpenDossier}
        onAssignRoom={onAssignRoom}
      />
    );
  }

  // Active action tasks relevant to HR
  const activeHRTasks = actionTasks.filter(
    (t) => t.status === 'PENDING' || t.status === 'ACKNOWLEDGED' || t.status === 'IN_PROGRESS'
  );

  const handleAssignToKimmi = async (candId: string) => {
    setAssigningKimmiId(candId);
    try {
      const res = await authenticatedFetch(`/api/candidates/${candId}/assign-kimmi`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to assign candidate to Kimmi Mam', err);
    } finally {
      setAssigningKimmiId(null);
    }
  };

  const waitingCandidates = filterStage
    ? candidates
    : candidates.filter(
        (c) =>
          c.status === 'ARRIVED' ||
          c.status === 'WAITING' ||
          c.status === 'With Kimmi Mam – Senior HR Interview'
      );
  const inInterviewCandidates = candidates.filter((c) => c.status === 'IN_INTERVIEW');

  // Operational rooms strictly exclude reserved Next Round rooms
  const operationalRooms = rooms.filter(
    (r) =>
      r.id !== 'room-lalit-cabin' &&
      r.id !== 'room-kimmi-cabin' &&
      r.name !== 'Lalit Sir Cabin' &&
      r.name !== 'Elegance Suite' &&
      !r.isReservedNextRound
  );

  return (
    <div className="space-y-6">
      {/* Filter Stage Active Indicator Banner */}
      {filterStage && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-300">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-bold text-white">Stage Filter Applied:</span>
            <span className="font-mono uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              {filterStage}
            </span>
            <span className="text-[#AEB7C4]">
              ({waitingCandidates.length} matching candidate records)
            </span>
          </div>
          <button
            type="button"
            onClick={() => onClearFilterStage?.()}
            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-end sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset / Clear Filter</span>
          </button>
        </div>
      )}

      {/* HR Module Profile Selector Header */}
      <div className="p-4 rounded-2xl glass-panel bg-white/65 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[#111111]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#D8BF85]/20 border border-[#D8BF85]/40 text-[#9E8243] flex items-center justify-center font-bold shadow-xs">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111111]">HR Operations & Officer Profiles</h3>
            <p className="text-[11px] text-[#5F6368]">Switch between full intake pipeline and dedicated HR officer workspaces.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/5 p-1.5 rounded-xl border border-black/5">
          <button
            type="button"
            onClick={() => setSubProfileMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              subProfileMode === 'all'
                ? 'bg-gradient-to-r from-[#D8BF85] to-[#BFA15F] text-[#111111] shadow-xs'
                : 'text-[#5F6368] hover:text-[#111111]'
            }`}
          >
            All Intake Queue
          </button>
          <button
            type="button"
            onClick={() => setSubProfileMode('nisha')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer text-[#5F6368] hover:text-[#111111]"
          >
            <Award className="w-3.5 h-3.5 text-[#9E8243]" />
            <span>Nisha (Sr. HR)</span>
          </button>
          <button
            type="button"
            onClick={() => setSubProfileMode('shriyanshi')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer text-[#5F6368] hover:text-[#111111]"
          >
            <User className="w-3.5 h-3.5 text-[#9E8243]" />
            <span>Shriyanshi (Intake)</span>
          </button>
        </div>
      </div>

      {/* Live Dispatched Action Alerts & Escort Status */}
      {activeHRTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 glass-panel bg-white/65 rounded-2xl space-y-2.5 border border-[#E5D2A0]/40 shadow-xs text-[#111111]"
        >
          <div className="flex items-center justify-between pb-1 border-b border-black/5">
            <h3 className="text-xs font-bold text-[#9E8243] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#9E8243]" />
              <span>Dispatched Action Alerts & Live Status ({activeHRTasks.length})</span>
            </h3>
            <span className="text-[10px] text-[#5F6368]">Synchronized live with Reception & Pantry</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {activeHRTasks.map((task) => {
              const isPending = task.status === 'PENDING';

              return (
                <div
                  key={task.id}
                  className="p-3 card-inner inner-box bg-white/50 rounded-xl flex items-center justify-between gap-3 text-xs border border-[#E5D2A0]/30 text-[#111111]"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-[#111111] truncate block">{task.title}</span>
                    <div className="text-[10px] text-[#5F6368] flex items-center gap-2 mt-0.5">
                      <span>Target: <strong className="text-[#111111]">{task.targetRole}</strong></span>
                      <span>&bull;</span>
                      <span className="font-mono text-[#5F6368]">{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div>
                    {isPending ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D8BF85]/20 text-[#9E8243] border border-[#D8BF85]/40 whitespace-nowrap animate-pulse font-mono">
                        Awaiting Ack
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap font-mono">
                        Acknowledged
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Candidate Priority Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-black/10">
            <div>
              <h2 className="text-base font-bold text-[#111318] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#9E8243] animate-ping" />
                Live Candidate Intake & Room Allocation Queue
              </h2>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Authorized candidate management & live room assignment control.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-[#D8BF85]/20 rounded-xl text-xs text-[#9E8243] font-semibold font-mono border border-[#D8BF85]/40 shadow-xs">
              {waitingCandidates.length} Pending
            </span>
          </div>

          {waitingCandidates.length === 0 ? (
            <div className="p-12 text-center glass-panel bg-white/60 rounded-3xl space-y-2 border border-white/80 shadow-xs text-[#111111]">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-[#111111]">No candidates waiting right now</h3>
              <p className="text-xs text-[#5F6368] max-w-sm mx-auto leading-relaxed">
                When a candidate completes QR check-in and submits their profile, they appear here instantly in real time.
              </p>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-3"
            >
              {waitingCandidates.map((cand) => {
                const intv = interviews.find((i) => i.id === cand.currentInterviewId);
                const isKimmi = cand.status === 'With Kimmi Mam – Senior HR Interview';

                return (
                  <motion.div
                    key={cand.id}
                    variants={staggerItem}
                    className="p-5 sm:p-6 rounded-2xl shadow-xs dashboard-card candidate-card glass-panel bg-white/60 text-[#111111] border border-white/80 hover:bg-white/70 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
                      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                        <div className="flex flex-col items-center shrink-0">
                          <CandidateAvatar
                            candidate={cand}
                            name={cand.fullName}
                            sizeClassName="w-14 h-14"
                            roundedClassName="rounded-2xl"
                            borderClassName="border-2 border-[#121316]"
                            fallbackBgClassName="bg-[#FAF8F5]"
                            fallbackTextClassName="text-[#121316]"
                          />
                          {(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt || cand.livePhotoCapturedAt) && (

                            <span
                              className="text-[9px] text-[#9E8243] font-mono tracking-tight mt-1 text-center truncate max-w-[95px]"
                              title={`Captured: ${formatPhotoTimestamp(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt || cand.livePhotoCapturedAt)}`}
                            >
                              {formatPhotoTimestamp(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt || cand.livePhotoCapturedAt).split(',')[0]}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="candidate-name text-base sm:text-lg font-bold text-[#111111] tracking-tight truncate">
                              {cand.fullName}
                            </h3>
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${
                                cand.status === 'ARRIVED'
                                  ? 'bg-[#D8BF85]/20 text-[#9E8243] border-[#D8BF85]/40'
                                  : cand.status === 'With Kimmi Mam – Senior HR Interview'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-[#D8BF85]/20 text-[#9E8243] border-[#D8BF85]/40'
                              }`}
                            >
                              {cand.status}
                            </span>
                          </div>
                          <p className="candidate-role text-xs sm:text-sm font-semibold text-[#9E8243] mt-0.5 truncate">
                            {cand.position}
                          </p>
                          <div className="candidate-meta flex items-center gap-3.5 text-xs mt-1.5 text-[#5F6368] flex-wrap">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#9E8243] shrink-0" />
                              <span className="font-medium text-[#111111] truncate max-w-[160px]">{formatCandidateLocation(cand.currentLocation) || 'Waiting Lounge'}</span>
                            </span>
                            {cand.checkedInAt && (
                              <span className="flex items-center gap-1.5 font-mono shrink-0">
                                <Clock className="w-3.5 h-3.5 text-[#80868B]" />
                                <span>Arrived: {new Date(cand.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action: Assign Room & Dossier + Edit / Delete */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditModal({
                                isOpen: true,
                                recordType: 'CANDIDATE',
                                record: cand,
                              });
                            }}
                            className="p-2 bg-white/80 hover:bg-white text-[#5F6368] hover:text-[#111111] border border-black/10 shadow-xs rounded-xl transition cursor-pointer"
                            title="Edit Candidate Information"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteModal({
                                isOpen: true,
                                recordType: 'CANDIDATE',
                                recordId: cand.id,
                                recordName: cand.fullName,
                                metadata: { status: cand.status },
                              });
                            }}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition cursor-pointer shadow-xs"
                            title="Delete / Archive Candidate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onAssignRoom(cand.id, intv?.id)}
                            className="btn-assign-room px-3.5 sm:px-4 py-2 bg-gradient-to-r from-[#D8BF85] to-[#BFA15F] hover:from-[#E5D2A0] hover:to-[#CDB06E] text-[#111111] font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                          >
                            <DoorOpen className="w-4 h-4 text-[#111111]" />
                            <span>Assign Room</span>
                          </button>
                        </div>
                        <button
                          onClick={() => onOpenDossier(cand.id)}
                          className="candidate-dossier-link text-xs font-semibold underline text-[#9E8243] hover:text-[#7D6633] transition cursor-pointer shrink-0"
                        >
                          View Full Dossier &rarr;
                        </button>
                      </div>
                    </div>

                    {/* Quick HR Kimmi Mam Escalation */}
                    <div className="card-divider pt-3 mt-3.5 border-t border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                      <div className="candidate-detail flex items-center gap-2 text-xs text-[#5F6368] flex-wrap">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Experience: <strong className="text-[#111111] font-bold">{formatExperienceBadge(cand.totalExperience)}</strong></span>
                        <span className="font-bold">&bull;</span>
                        <span>Notice: <strong className="text-[#111111] font-bold">{cand.noticePeriod || 'Immediate'}</strong></span>
                      </div>

                      {!isKimmi && (
                        <button
                          onClick={() => handleAssignToKimmi(cand.id)}
                          disabled={assigningKimmiId === cand.id}
                          className="btn-route-kimmi px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 bg-white/80 hover:bg-white text-[#111111] border border-black/10 shadow-xs self-start sm:self-auto"
                        >
                          <Award className="w-3.5 h-3.5 text-[#9E8243]" />
                          <span>{assigningKimmiId === cand.id ? 'Routing...' : 'Route to Kimmi Mam'}</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* In-Interview Candidates Pipeline Section */}
          {inInterviewCandidates.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-sm font-bold text-[#111318] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>In-Session Candidates ({inInterviewCandidates.length})</span>
              </h3>
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-2"
              >
                {inInterviewCandidates.map((cand) => {
                  return (
                    <motion.div
                      key={cand.id}
                      variants={staggerItem}
                      className="p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs dashboard-card candidate-card glass-panel bg-white/65 border border-blue-200 text-[#111111] cursor-pointer"
                    >
                      <div className="min-w-0">
                        <strong className="candidate-name block text-sm text-[#111111] font-bold truncate">{cand.fullName}</strong>
                        <span className="candidate-role text-[11px] text-[#5F6368]">
                          {cand.position} &bull; Room: <span className="text-[#9E8243] font-bold">{cand.assignedRoomName || formatCandidateLocation(cand.currentLocation)}</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditModal({
                              isOpen: true,
                              recordType: 'CANDIDATE',
                              record: cand,
                            });
                          }}
                          className="p-1.5 bg-white/80 hover:bg-white text-[#5F6368] hover:text-[#111111] border border-black/10 rounded-xl shadow-xs transition cursor-pointer"
                          title="Edit Candidate Information"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModal({
                              isOpen: true,
                              recordType: 'CANDIDATE',
                              recordId: cand.id,
                              recordName: cand.fullName,
                              metadata: { status: cand.status },
                            });
                          }}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition cursor-pointer shadow-xs"
                          title="Delete / Archive Candidate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onAssignRoom(cand.id, cand.currentInterviewId)}
                          className="px-3 py-1.5 font-bold text-xs rounded-xl border border-black/10 transition cursor-pointer bg-white/80 hover:bg-white text-[#111111] shadow-xs"
                        >
                          Change Room
                        </button>
                        <button
                          onClick={() => onOpenDossier(cand.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-black/10 transition cursor-pointer bg-white/80 hover:bg-white text-blue-700 shadow-xs"
                        >
                          Details
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          )}
        </div>

        {/* Right Col: Live Rooms Status Grid */}
        <div className="space-y-4">
          <div className="pb-1 border-b border-black/10">
            <h2 className="text-base font-bold text-[#111318] flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-[#9E8243]" />
              Office Rooms & Cabins
            </h2>
            <p className="text-xs text-[#5F6368] mt-0.5">Real-time room occupancy and readiness.</p>
          </div>

          <div className="space-y-2.5">
            {operationalRooms.map((room) => {
              const isAvail = room.status === 'AVAILABLE';
              const isAssigned = room.status === 'ASSIGNED';
              const isOccupied = room.status === 'OCCUPIED';
              const isCleaning = room.status === 'CLEANING' || room.status === 'NEEDS_CLEANING';

              return (
                <div
                  key={room.id}
                  className="p-3.5 rounded-2xl space-y-1 text-xs shadow-xs glass-panel bg-white/60 border border-white/80 text-[#111111]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111111]">{room.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        isAvail
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isAssigned
                          ? 'bg-[#D8BF85]/20 text-[#9E8243] border border-[#D8BF85]/40'
                          : isCleaning
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          : isOccupied
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isCleaning ? 'Cleaning' : room.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#5F6368]">
                    <span className="capitalize">{room.type?.replace('_', ' ').toLowerCase() || 'Meeting Cabin'}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditModal({
                            isOpen: true,
                            recordType: 'ROOM',
                            record: room,
                          });
                        }}
                        className="p-1 rounded bg-white/80 hover:bg-white text-[#5F6368] hover:text-[#111111] border border-black/10 text-[10px] transition cursor-pointer shadow-xs"
                        title="Edit Room Details"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModal({
                            isOpen: true,
                            recordType: 'ROOM',
                            recordId: room.id,
                            recordName: room.name,
                            metadata: { status: room.status },
                          });
                        }}
                        className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[10px] transition cursor-pointer shadow-xs"
                        title="Delete Room"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {!isAvail && room.currentCandidateName && (
                    <div className="text-[10px] font-semibold truncate text-[#9E8243] pt-0.5">
                      Occupant: {room.currentCandidateName}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {onOpenChat && (
            <button
              type="button"
              onClick={onOpenChat}
              className="w-full p-3.5 glass-panel bg-white/65 hover:bg-white/80 rounded-2xl flex items-center justify-between text-xs text-[#111111] font-semibold transition shadow-xs group cursor-pointer border border-white/80"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#D8BF85]/20 border border-[#D8BF85]/40 flex items-center justify-center text-[#9E8243] group-hover:scale-105 transition shadow-xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#111111]">Internal Office Chat</div>
                  <div className="text-[10px] text-[#5F6368] font-normal">Direct line to Interviewers & Pantry</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9E8243] group-hover:translate-x-1 transition" />
            </button>
          )}

          {/* HR Information Authority Card */}
          <div className="p-4 glass-panel bg-white/60 rounded-2xl space-y-1.5 text-xs border border-white/80 shadow-xs text-[#111111]">
            <div className="flex items-center gap-1.5 text-[#9E8243] font-bold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>HR Information Authority</span>
            </div>
            <p className="text-[11px] text-[#5F6368] leading-relaxed">
              HR commands the complete candidate pipeline including contact details, live photo, resume, compensation remarks, and stage timeline.
            </p>
          </div>
        </div>
      </div>

      {/* Edit Record Modal */}
      <EditRecordModal
        isOpen={editModal.isOpen}
        recordType={editModal.recordType}
        record={editModal.record}
        onClose={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        recordType={deleteModal.recordType}
        recordId={deleteModal.recordId}
        recordName={deleteModal.recordName}
        metadata={deleteModal.metadata}
        onClose={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={(deletedId, recordType) => {
          if (deletedId && recordType && onRecordDeleted) {
            onRecordDeleted(deletedId, recordType);
          }
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};
