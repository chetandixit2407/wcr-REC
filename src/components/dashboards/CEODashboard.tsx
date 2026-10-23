import React from 'react';
import { motion } from 'motion/react';
import {
  Award,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  FileText,
  ArrowRight,
} from 'lucide-react';
import type { Candidate, Interview, Room } from '../../types/index.ts';
import { formatCandidateExperience, formatCandidateLocation } from '../../utils/candidateHelpers.ts';
import type { DashboardModalTarget } from '../DashboardCardDetailsModal.tsx';
import { CandidateAvatar } from '../CandidateAvatar.tsx';



interface CEODashboardProps {
  candidates: Candidate[];
  interviews: Interview[];
  rooms: Room[];
  onOpenDossier: (candidateId: string) => void;
  onOpenDetailsTarget?: (target: DashboardModalTarget) => void;
}

export const CEODashboard: React.FC<CEODashboardProps> = ({
  candidates,
  interviews,
  rooms,
  onOpenDossier,
  onOpenDetailsTarget,
}) => {
  const activeCandidates = candidates.filter((c) => c.status !== 'CHECKED_OUT' && c.status !== 'SCHEDULED');
  const offeredCount = candidates.filter((c) => c.status === 'OFFERED' || c.status === 'COMPLETED').length;
  const inSessionCount = candidates.filter((c) => c.status === 'IN_INTERVIEW').length;

  return (
    <div className="space-y-6">
      {/* Executive Banner */}
      <div className="p-6 glass-panel bg-white/65 text-[#111111] rounded-3xl border border-white/80 shadow-[0_12px_36px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#9E8243]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#9E8243] font-mono">
              White Collar Realty • Executive Suite
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#111111] tracking-tight">
            Strategic Office Operations Overview
          </h1>
          <p className="text-xs text-[#5F6368]">
            Filtered executive briefing • High-level talent pipeline & facility performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white/60 card-inner inner-box rounded-2xl border border-[#E5D2A0]/40 text-center shadow-xs">
            <span className="text-[10px] uppercase font-bold text-[#5F6368] block font-mono">Offer Rate</span>
            <span className="text-lg font-black text-emerald-600 tabular-nums">
              {candidates.length > 0 ? `${Math.round((offeredCount / Math.max(1, candidates.length)) * 100)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Strategic Metrics — Translucent Frosted Glass Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="p-5 sm:p-6 glass-panel bg-white/60 text-[#111111] rounded-2xl border border-white/80 shadow-xs min-h-[140px] flex flex-col justify-between">
          <span className="text-xs sm:text-sm text-[#5F6368] block font-semibold">Active Office Presence</span>
          <p className="text-2xl sm:text-3xl font-black text-[#111111] mt-1 tabular-nums">{activeCandidates.length}</p>
          <span className="text-xs text-[#9E8243] font-semibold font-mono">Candidates on premises</span>
        </div>

        <div className="p-5 sm:p-6 glass-panel bg-white/60 text-[#111111] rounded-2xl border border-white/80 shadow-xs min-h-[140px] flex flex-col justify-between">
          <span className="text-xs sm:text-sm text-[#5F6368] block font-semibold">Interviews Live</span>
          <p className="text-2xl sm:text-3xl font-black text-[#111111] mt-1 tabular-nums">{inSessionCount}</p>
          <span className="text-xs text-[#5F6368] font-mono">Active evaluation rounds</span>
        </div>

        <div className="p-5 sm:p-6 glass-panel bg-white/60 text-[#111111] rounded-2xl border border-white/80 shadow-xs min-h-[140px] flex flex-col justify-between">
          <span className="text-xs sm:text-sm text-[#5F6368] block font-semibold">Leadership Offers / Hires</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 tabular-nums">{offeredCount}</p>
          <span className="text-xs text-emerald-600 font-semibold font-mono">Today's recommendations</span>
        </div>

        <div className="p-5 sm:p-6 glass-panel bg-white/60 text-[#111111] rounded-2xl border border-white/80 shadow-xs min-h-[140px] flex flex-col justify-between">
          <span className="text-xs sm:text-sm text-[#5F6368] block font-semibold">Executive Boardrooms</span>
          <p className="text-2xl sm:text-3xl font-black text-[#111111] mt-1 tabular-nums">
            {rooms.filter((r) => r.type === 'EXECUTIVE_BOARDROOM').length}
          </p>
          <span className="text-xs text-[#5F6368] font-mono">Executive meeting suites</span>
        </div>
      </div>

      {/* Candidate Pipeline Briefing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#111318] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Executive Candidate Briefs
          </h2>
          <span className="text-xs text-[#252A32] font-medium">
            Confidentiality Filter Active • Operational noise suppressed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidates.map((cand) => {
            const intv = interviews.find((i) => i.id === cand.currentInterviewId);

            return (
              <div
                key={cand.id}
                className="glass-panel bg-white/60 text-[#111111] border border-white/80 p-5 rounded-2xl space-y-3 shadow-xs hover:bg-white/70 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CandidateAvatar
                      candidate={cand}
                      name={cand.fullName}
                      sizeClassName="w-12 h-12"
                      roundedClassName="rounded-2xl"
                      borderClassName="border-2 border-[#121316]"
                      fallbackBgClassName="bg-[#FAF8F5]"
                      fallbackTextClassName="text-[#121316]"
                      icon={<Award className="w-6 h-6" />}
                    />

                    <div>
                      <h3 className="text-base font-bold text-[#111111]">{cand.fullName}</h3>
                      <p className="text-xs font-semibold text-[#9E8243]">{cand.position}</p>
                      <p className="text-[11px] text-[#5F6368]">{cand.department}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-[#D8BF85]/20 text-[#9E8243] border border-[#D8BF85]/40">
                    {cand.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-white/50 border border-[#E5D2A0]/30 text-[#2D3033] card-inner">
                  <div>
                    <span className="block text-[10px] uppercase font-mono text-[#5F6368]">Experience</span>
                    <strong className="text-[#111111] font-bold">{formatCandidateExperience(cand.totalExperience)}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-mono text-[#5F6368]">Location</span>
                    <strong className="text-[#111111] font-bold truncate block">{formatCandidateLocation(cand.currentLocation)}</strong>
                  </div>
                  {intv && (
                    <>
                      <div>
                        <span className="block text-[10px] uppercase font-mono text-[#5F6368]">Current Round</span>
                        <strong className="text-[#111111] font-bold">{intv.roundName}</strong>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-mono text-[#5F6368]">Interviewer</span>
                        <strong className="text-[#111111] font-bold">{intv.interviewerName}</strong>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-[#5F6368] truncate max-w-[200px]">
                    {cand.currentCompany ? `Ex: ${cand.currentCompany}` : 'Qualified Profile'}
                  </span>
                  <button
                    onClick={() => onOpenDossier(cand.id)}
                    className="px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-xs bg-gradient-to-r from-[#D8BF85] to-[#BFA15F] hover:from-[#E5D2A0] hover:to-[#CDB06E] text-[#111111] shrink-0"
                  >
                    Executive Dossier
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
