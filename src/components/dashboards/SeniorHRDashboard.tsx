import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  UserCheck,
  Play,
  CheckCircle2,
  Clock,
  DoorOpen,
  FileText,
  MapPin,
  Sparkles,
  Award,
  XCircle,
  Eye,
  Shield,
  ArrowRight,
  Edit3,
  Trash2,
} from 'lucide-react';
import type { Candidate, Interview, Room } from '../../types/index.ts';
import { EditRecordModal } from '../modals/EditRecordModal.tsx';
import { DeleteConfirmModal, DeleteRecordType } from '../modals/DeleteConfirmModal.tsx';
import { formatCandidateExperience, formatCandidateLocation, getInterviewRoundKey } from '../../utils/candidateHelpers.ts';
import { CandidateAvatar } from '../CandidateAvatar.tsx';



interface SeniorHRDashboardProps {
  candidates: Candidate[];
  interviews: Interview[];
  rooms: Room[];
  currentInterviewerId: string;
  onStartInterview: (interviewId: string) => void;
  onOpenEndInterviewModal: (interview: Interview) => void;
  onOpenDossier: (candidateId: string) => void;
  onAssignRoom?: (candidateId: string, interviewId: string) => void;
  onRefresh: () => void;
  onRecordDeleted?: (id: string, type: DeleteRecordType) => void;
}

export const SeniorHRDashboard: React.FC<SeniorHRDashboardProps> = ({
  candidates,
  interviews,
  rooms,
  currentInterviewerId,
  onStartInterview,
  onOpenEndInterviewModal,
  onOpenDossier,
  onAssignRoom,
  onRefresh,
  onRecordDeleted,
}) => {
  const [filterTab, setFilterTab] = useState<'pending' | 'active' | 'completed'>('pending');

  // Modal states for Edit and Delete
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    recordType: DeleteRecordType;
    record: any;
  }>({
    isOpen: false,
    recordType: 'INTERVIEW',
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
    recordType: 'INTERVIEW',
    recordId: '',
    recordName: '',
  });

  // Filter interviews assigned to Kimmi Mam ('usr-cofounder-kimmi') or mentioning Kimmi
  const myInterviews = interviews.filter(
    (i) =>
      i.interviewerId === currentInterviewerId ||
      i.interviewerId === 'usr-cofounder-kimmi' ||
      i.interviewerName.includes('Kimmi') ||
      i.roundName.includes('Senior')
  );

  // Also include candidates directly marked 'With Kimmi Mam – Senior HR Interview'
  const candidatesAssignedToMe = candidates.filter(
    (c) =>
      c.status === 'With Kimmi Mam – Senior HR Interview' ||
      (c as any).assignedInterviewerId === 'usr-cofounder-kimmi' ||
      (c as any).assignedInterviewerName?.includes('Kimmi')
  );

  const seenMap = new Map<string, Interview>();
  myInterviews.forEach((i) => {
    const key = getInterviewRoundKey(i.candidateId, i.roundName);
    if (!seenMap.has(key)) {
      seenMap.set(key, i);
    } else {
      const existing = seenMap.get(key)!;
      if (!existing.roomId && i.roomId) {
        seenMap.set(key, i);
      }
    }
  });

  candidatesAssignedToMe.forEach((cand) => {
    const key = getInterviewRoundKey(cand.id, 'Senior HR Interview');
    if (!seenMap.has(key)) {
      seenMap.set(key, {
        id: cand.currentInterviewId || `intv-kimmi-${cand.id}`,
        candidateId: cand.id,
        candidateName: cand.fullName,
        position: cand.position,
        roundName: 'Senior HR Interview',
        interviewerId: 'usr-cofounder-kimmi',
        interviewerName: 'Kimmi Mam – Senior HR Interview',
        scheduledTime: 'Immediate / Today',
        status: cand.status === 'IN_INTERVIEW' ? 'INTERVIEW_STARTED' : 'CANDIDATE_ARRIVED',
        createdAt: cand.arrivalTime || cand.createdAt || new Date().toISOString(),
        updatedAt: cand.updatedAt || new Date().toISOString(),
      });
    }
  });

  const combinedInterviews = Array.from(seenMap.values());

  const pendingInterviews = combinedInterviews.filter(
    (i) => i.status === 'CANDIDATE_ARRIVED' || i.status === 'ROOM_ASSIGNED' || i.status === 'SCHEDULED'
  );
  const activeInterviews = combinedInterviews.filter((i) => i.status === 'INTERVIEW_STARTED');
  const completedInterviews = combinedInterviews.filter((i) => i.status === 'INTERVIEW_COMPLETED');

  const displayedInterviews =
    filterTab === 'pending' ? pendingInterviews : filterTab === 'active' ? activeInterviews : completedInterviews;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 glass-panel bg-white/65 rounded-3xl border border-white/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_12px_36px_rgba(0,0,0,0.04)] text-[#111111]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#D8BF85]/20 text-[#9E8243] border border-[#D8BF85]/40 flex items-center justify-center font-black text-lg shadow-xs font-mono">
            KM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#111111] tracking-tight">
                Kimmi Mam – Senior HR Interviewer Command Station
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D8BF85]/20 text-[#9E8243] border border-[#D8BF85]/40 font-mono">
                Senior Level
              </span>
            </div>
            <p className="text-xs text-[#5F6368] mt-0.5">
              Authorized Role: <strong className="text-[#111111]">Senior HR Interviewer</strong> • Executive Leadership
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-[#D8BF85]/20 border border-[#D8BF85]/40 text-[#9E8243] text-xs font-semibold font-mono">
            {pendingInterviews.length} Pending Senior Reviews
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold font-mono">
            {activeInterviews.length} In Active Session
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterTab('pending')}
          className={`wcr-filter-tab px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 border ${
            filterTab === 'pending'
              ? 'is-active bg-gradient-to-r from-[#D8BF85] to-[#BFA15F] text-[#111111] shadow-xs ring-2 ring-[#D8BF85]/40 border-[#D8BF85] font-black'
              : 'bg-white/60 text-[#5F6368] border-black/10 hover:bg-white/80 hover:text-[#111111] hover:border-black/20'
          }`}
        >
          <span>Pending Senior Interviews</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/5 text-[10px] font-mono">
            {pendingInterviews.length}
          </span>
        </button>

        <button
          onClick={() => setFilterTab('active')}
          className={`wcr-filter-tab px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 border ${
            filterTab === 'active'
              ? 'is-active bg-gradient-to-r from-[#D8BF85] to-[#BFA15F] text-[#111111] shadow-xs ring-2 ring-[#D8BF85]/40 border-[#D8BF85] font-black'
              : 'bg-white/60 text-[#5F6368] border-black/10 hover:bg-white/80 hover:text-[#111111] hover:border-black/20'
          }`}
        >
          <span>In Active Session</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/5 text-[10px] font-mono">
            {activeInterviews.length}
          </span>
        </button>

        <button
          onClick={() => setFilterTab('completed')}
          className={`wcr-filter-tab px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 border ${
            filterTab === 'completed'
              ? 'is-active bg-gradient-to-r from-[#D8BF85] to-[#BFA15F] text-[#111111] shadow-xs ring-2 ring-[#D8BF85]/40 border-[#D8BF85] font-black'
              : 'bg-white/60 text-[#5F6368] border-black/10 hover:bg-white/80 hover:text-[#111111] hover:border-black/20'
          }`}
        >
          <span>Completed Evaluations</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/5 text-[10px] font-mono">
            {completedInterviews.length}
          </span>
        </button>
      </div>

      {/* Interviews List */}
      {displayedInterviews.length === 0 ? (
        <div className="p-12 text-center glass-panel bg-white/60 rounded-3xl border border-white/80 space-y-3 shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold text-[#111111]">No senior interviews in this view</h3>
          <p className="text-xs text-[#5F6368] max-w-md mx-auto">
            Candidates assigned for Senior HR Review with Kimmi Mam will appear here automatically in real time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedInterviews.map((intv) => {
            const cand = candidates.find((c) => c.id === intv.candidateId);
            const hasRoom = intv.roomId || intv.status === 'ROOM_ASSIGNED';

            return (
              <div
                key={intv.id}
                className="p-5 sm:p-6 rounded-2xl shadow-xs space-y-4 glass-panel bg-white/60 border border-white/80 text-[#111111] flex flex-col justify-between hover:bg-white/70 transition-all duration-200"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <CandidateAvatar
                        candidate={cand}
                        name={intv.candidateName}
                        sizeClassName="w-14 h-14"
                        roundedClassName="rounded-2xl"
                        borderClassName="border-2 border-[#121316]"
                        fallbackBgClassName="bg-[#FAF8F5]"
                        fallbackTextClassName="text-[#121316]"
                        icon={<UserCheck className="w-7 h-7" />}
                      />

                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-[#111111]">{intv.candidateName}</h3>
                        <p className="text-xs sm:text-sm font-semibold text-[#9E8243]">{intv.position}</p>
                        <p className="text-xs mt-0.5 text-[#5F6368]">{intv.roundName}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                        intv.status === 'INTERVIEW_STARTED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : intv.status === 'INTERVIEW_COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : hasRoom
                          ? 'bg-[#D8BF85]/20 text-[#9E8243] border border-[#D8BF85]/40'
                          : 'bg-black/5 text-[#5F6368] border border-black/10'
                      }`}
                    >
                      {intv.status === 'INTERVIEW_STARTED'
                        ? 'In Session'
                        : intv.status === 'INTERVIEW_COMPLETED'
                        ? `Completed (${intv.outcome || 'PASS'})`
                        : hasRoom
                        ? 'Room Assigned'
                        : 'Pending Room'}
                    </span>
                  </div>

                  {/* Details Box */}
                  <div className="p-3.5 card-inner inner-box bg-white/50 rounded-xl space-y-2 text-xs border border-[#E5D2A0]/30 text-[#111111]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#5F6368]">Interview Level:</span>
                      <strong className="text-[#9E8243] font-bold font-mono">Senior Level (Kimmi Mam)</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#5F6368]">Designated Room:</span>
                      <strong className={hasRoom ? 'text-[#9E8243] font-bold' : 'text-[#5F6368] italic'}>
                        {intv.roomName || 'Pending Room Assignment'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#5F6368]">Current Location:</span>
                      <span className="text-[#111111] font-medium truncate max-w-[160px]">
                        {formatCandidateLocation(cand?.currentLocation) || 'Waiting Lounge'}
                      </span>
                    </div>
                    {intv.interviewerFeedback && (
                      <div className="pt-2 border-t border-black/5 text-xs">
                        <span className="text-[#5F6368] block mb-0.5">Remarks / Feedback:</span>
                        <p className="italic text-[#2D3033]">{intv.interviewerFeedback}</p>
                      </div>
                    )}
                  </div>

                  {/* Candidate Summary Snippet */}
                  {cand && (
                    <div className="grid grid-cols-2 gap-2 text-xs text-[#5F6368]">
                      <div>
                        <span>Experience: </span>
                        <strong className="text-[#111111] font-bold">{formatCandidateExperience(cand.totalExperience)}</strong>
                      </div>
                      <div>
                        <span>Notice Period: </span>
                        <strong className="text-[#111111] font-bold">{cand.noticePeriod || 'Immediate'}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-black/5">
                  <button
                    type="button"
                    onClick={() => onOpenDossier(intv.candidateId)}
                    className="flex-1 min-w-[120px] py-2 px-3 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 bg-white/80 hover:bg-white text-[#111111] border border-black/10 shadow-xs"
                    title="View candidate dossier & verified resume"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#9E8243]" />
                    <span>View Dossier & Resume</span>
                  </button>

                  {/* Clearly visible Edit and Delete Interview Schedule buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setEditModal({
                          isOpen: true,
                          recordType: 'INTERVIEW',
                          record: intv,
                        })
                      }
                      className="p-2 rounded-xl bg-white/80 hover:bg-white text-[#5F6368] hover:text-[#111111] border border-black/10 shadow-xs transition cursor-pointer"
                      title="Edit Interview Schedule"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteModal({
                          isOpen: true,
                          recordType: 'INTERVIEW',
                          recordId: intv.id,
                          recordName: `${intv.candidateName || 'Interview'} (${intv.roundName})`,
                          metadata: { status: intv.status },
                        })
                      }
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer shadow-xs"
                      title="Delete Interview Schedule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {intv.status === 'CANDIDATE_ARRIVED' || intv.status === 'ROOM_ASSIGNED' ? (
                    <button
                      type="button"
                      onClick={() => onStartInterview(intv.id)}
                      className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#D8BF85] to-[#BFA15F] hover:from-[#E5D2A0] hover:to-[#CDB06E] text-[#111111] font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-1 shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Interview</span>
                    </button>
                  ) : intv.status === 'INTERVIEW_STARTED' ? (
                    <button
                      type="button"
                      onClick={() => onOpenEndInterviewModal(intv)}
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Conclude & Pass/Fail</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#5F6368] font-medium px-2">
                      Completed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
