import React from 'react';
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
  ArrowRight,
} from 'lucide-react';
import type { Candidate, Interview, Room } from '../../types/index.ts';
import { formatCandidateExperience, formatCandidateLocation, getInterviewRoundKey } from '../../utils/candidateHelpers.ts';
import { CandidateAvatar } from '../CandidateAvatar.tsx';


interface InterviewerDashboardProps {
  candidates: Candidate[];
  interviews: Interview[];
  rooms: Room[];
  currentInterviewerId: string;
  onStartInterview: (interviewId: string) => void;
  onOpenEndInterviewModal: (interview: Interview) => void;
  onOpenDossier: (candidateId: string) => void;
}

export const InterviewerDashboard: React.FC<InterviewerDashboardProps> = ({
  candidates,
  interviews,
  rooms,
  currentInterviewerId,
  onStartInterview,
  onOpenEndInterviewModal,
  onOpenDossier,
}) => {
  // Filter for interviews assigned to this interviewer and deduplicate by canonical round key
  const seenInterviews = new Map<string, Interview>();
  interviews
    .filter(
      (i) =>
        !currentInterviewerId ||
        i.interviewerId === currentInterviewerId ||
        (i.interviewerName && i.interviewerName.includes('Nisha'))
    )
    .forEach((i) => {
      const key = getInterviewRoundKey(i.candidateId, i.roundName);
      if (!seenInterviews.has(key)) {
        seenInterviews.set(key, i);
      } else {
        const existing = seenInterviews.get(key)!;
        if (!existing.roomId && i.roomId) {
          seenInterviews.set(key, i);
        }
      }
    });
  const myInterviews = Array.from(seenInterviews.values());

  const waitingInterviews = myInterviews.filter(
    (i) => i.status === 'CANDIDATE_ARRIVED' || i.status === 'ROOM_ASSIGNED'
  );
  const activeInterviews = myInterviews.filter((i) => i.status === 'INTERVIEW_STARTED');
  const completedInterviews = myInterviews.filter((i) => i.status === 'INTERVIEW_COMPLETED');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 glass-panel bg-white/65 text-[#111111] rounded-3xl border border-white/80 shadow-[0_12px_36px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-[#111111] tracking-tight">
              Interviewer Command Station
            </h1>
          </div>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Active logged-in interviewer: <strong className="text-[#9E8243]">Nisha Verma (Senior Director)</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-[#D8BF85]/20 border border-[#D8BF85]/40 text-[#9E8243] text-xs font-semibold font-mono">
            {waitingInterviews.length} Candidates Waiting
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold font-mono">
            {activeInterviews.length} In Session
          </span>
        </div>
      </div>

      {/* High-Priority Waiting Queue */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#111318] flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#9E8243] animate-ping" />
          Candidates Arrived & Assigned To You
        </h2>

        {waitingInterviews.length === 0 ? (
          <div className="p-10 text-center glass-panel bg-white/60 rounded-3xl border border-white/80 space-y-2 shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-[#111111]">No candidates waiting for your review</h3>
            <p className="text-xs text-[#5F6368]">
              When HR schedules or advances a candidate to your round, and they arrive, you will receive an automated alert here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {waitingInterviews.map((intv) => {
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
                          hasRoom
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-[#D8BF85]/20 text-[#9E8243] border border-[#D8BF85]/40'
                        }`}
                      >
                        {hasRoom ? 'Room Ready' : 'Awaiting HR Room'}
                      </span>
                    </div>

                    {/* Room & Location Status */}
                    <div className="p-3.5 card-inner inner-box bg-white/50 border border-[#E5D2A0]/30 rounded-xl space-y-2 text-xs text-[#111111]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#5F6368]">Designated Room:</span>
                        <strong className={hasRoom ? 'text-[#9E8243] font-bold' : 'text-[#5F6368] italic'}>
                          {intv.roomName || 'Pending HR Assignment'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#5F6368]">Current Location:</span>
                        <span className="text-[#111111] font-medium truncate max-w-[160px]">
                          {formatCandidateLocation(cand?.currentLocation) || 'Waiting Lounge'}
                        </span>
                      </div>
                    </div>

                    {/* Candidate Profile Snippet */}
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
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/5">
                    <button
                      onClick={() => onStartInterview(intv.id)}
                      className="flex-1 min-w-[120px] py-2 px-3 bg-gradient-to-r from-[#D8BF85] to-[#BFA15F] hover:from-[#E5D2A0] hover:to-[#CDB06E] text-[#111111] text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Interview</span>
                    </button>
                    {cand && (
                      <button
                        onClick={() => onOpenDossier(cand.id)}
                        className="py-2 px-3 text-xs font-semibold rounded-xl border border-black/10 transition cursor-pointer bg-white/80 hover:bg-white text-[#111111] shadow-xs shrink-0"
                      >
                        View Resume
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Interviews In Session */}
      {activeInterviews.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-black/10">
          <h2 className="text-base font-bold text-[#111318] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            Interviews Currently In Progress ({activeInterviews.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeInterviews.map((intv) => (
              <div
                key={intv.id}
                className="p-5 glass-panel bg-white/65 rounded-2xl border border-blue-200 shadow-xs space-y-4 text-[#111111]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#111111]">{intv.candidateName}</h3>
                    <p className="text-xs text-[#9E8243] font-semibold">{intv.position}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 animate-spin" />
                    In Session: {intv.roomName || 'Meeting Room'}
                  </span>
                </div>

                <div className="p-3 card-inner inner-box bg-white/50 rounded-xl text-xs text-[#2D3033] border border-blue-100">
                  <p>Round: <strong className="text-[#111111]">{intv.roundName}</strong></p>
                  <p className="text-[11px] text-[#5F6368] mt-1">
                    Started: {intv.startedAt ? new Date(intv.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active now'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onOpenEndInterviewModal(intv)}
                    className="flex-1 min-w-[170px] py-2.5 px-4 bg-gradient-to-r from-[#D8BF85] to-[#BFA15F] hover:from-[#E5D2A0] hover:to-[#CDB06E] text-[#111111] font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Conclude & Decide Next Stage</span>
                  </button>
                  {intv.candidateId && (
                    <button
                      onClick={() => onOpenDossier(intv.candidateId)}
                      className="px-3.5 py-2.5 bg-white/80 text-[#111111] rounded-xl text-xs font-semibold hover:bg-white border border-black/10 shadow-xs transition cursor-pointer shrink-0"
                    >
                      Dossier
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Interviews Today */}
      {completedInterviews.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-black/10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#343A40]">
            Concluded Interviews Today ({completedInterviews.length})
          </h3>
          <div className="space-y-2">
            {completedInterviews.map((intv) => (
              <div
                key={intv.id}
                className="p-3 glass-panel bg-white/60 border border-white/80 rounded-xl flex items-center justify-between text-xs text-[#111111] shadow-xs"
              >
                <div>
                  <span className="font-bold text-[#111111]">{intv.candidateName}</span>
                  <span className="text-[#5F6368] ml-2">({intv.roundName})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Decision: {intv.outcome}
                  </span>
                  {intv.candidateId && (
                    <button
                      onClick={() => onOpenDossier(intv.candidateId)}
                      className="text-[#9E8243] hover:underline text-[11px] font-semibold"
                    >
                      View Record
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
