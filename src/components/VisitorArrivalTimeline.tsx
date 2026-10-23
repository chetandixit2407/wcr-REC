import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { smoothEase, staggerContainer, staggerItem } from '../utils/motion.ts';
import {
  Calendar,
  CheckCircle2,
  Clock,
  DoorOpen,
  LogOut,
  ChevronRight,
  User,
  Users,
  Phone,
  Mail,
  MapPin,
  Eye,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { Candidate, Visitor } from '../types/index.ts';

export type ArrivalStage =
  | 'EXPECTED'
  | 'ARRIVED'
  | 'IN_OFFICE'
  | 'EXITED';

interface VisitorArrivalTimelineProps {
  candidate: Candidate;
  compact?: boolean;
}

export function computeArrivalStage(candidate: Candidate): {
  currentStage: ArrivalStage;
  stageIndex: number;
} {
  const status = candidate.status || '';

  if (status === 'CHECKED_OUT') {
    return { currentStage: 'EXITED', stageIndex: 3 };
  }
  if (
    status === 'IN_INTERVIEW' ||
    status === 'ROOM_ASSIGNED' ||
    status === 'COMPLETED' ||
    status === 'OFFERED' ||
    status === 'REJECTED' ||
    status.includes('Kimmi Mam') ||
    status.includes('Interview')
  ) {
    return { currentStage: 'IN_OFFICE', stageIndex: 2 };
  }
  if (
    status === 'ARRIVED' ||
    status === 'WAITING' ||
    candidate.checkedInAt ||
    candidate.receptionPhotoUrl ||
    candidate.photoUrl ||
    candidate.livePhoto ||
    candidate.arrivalPhoto ||
    candidate.qrVerificationStatus === 'VERIFIED'
  ) {
    return { currentStage: 'ARRIVED', stageIndex: 1 };
  }

  return { currentStage: 'EXPECTED', stageIndex: 0 };
}

export function computeVisitorArrivalStage(visitor: Visitor): ArrivalStage {
  const status = visitor.status || '';
  if (status === 'CHECKED_OUT') {
    return 'EXITED';
  }
  if (
    status === 'MEETING' ||
    (status as string) === 'IN_MEETING' ||
    (visitor.roomAssigned &&
      visitor.roomAssigned !== 'Pending Allocation' &&
      visitor.roomAssigned !== 'Pending Room Allocation')
  ) {
    return 'IN_OFFICE';
  }
  if (status === 'CHECKED_IN' || visitor.checkInTime) {
    return 'ARRIVED';
  }
  return 'EXPECTED';
}

export const VisitorArrivalTimeline: React.FC<VisitorArrivalTimelineProps> = ({
  candidate,
  compact = false,
}) => {
  const { currentStage, stageIndex } = computeArrivalStage(candidate);

  const stages: {
    id: ArrivalStage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'EXPECTED', label: 'Expected', icon: Calendar },
    { id: 'ARRIVED', label: 'Arrived', icon: Clock },
    { id: 'IN_OFFICE', label: 'In Office', icon: DoorOpen },
    { id: 'EXITED', label: 'Checked Out', icon: LogOut },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 py-1">
        {stages.map((stg, i) => {
          const isPassed = i < stageIndex;
          const isCurrent = i === stageIndex;

          return (
            <div key={stg.id} className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? 'bg-[#9E8243] ring-2 ring-[#D8BF85]/50 scale-125'
                    : isPassed
                    ? 'bg-emerald-600'
                    : 'bg-black/15'
                }`}
                title={`${stg.label} ${isCurrent ? '(Current)' : isPassed ? '(Completed)' : ''}`}
              />
              {i < stages.length - 1 && (
                <div
                  className={`w-2 h-[1px] ${
                    isPassed ? 'bg-emerald-600/60' : 'bg-black/10'
                  }`}
                />
              )}
            </div>
          );
        })}
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#9E8243] font-semibold ml-1.5">
          {stages[stageIndex]?.label || currentStage}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full glass-panel bg-white/60 backdrop-blur-md rounded-2xl p-3.5 border border-white/60 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[500px] gap-2.5">
        {stages.map((stg, i) => {
          const Icon = stg.icon;
          const isPassed = i < stageIndex;
          const isCurrent = i === stageIndex;

          return (
            <React.Fragment key={stg.id}>
              <div className="flex flex-col items-center gap-1.5 flex-1 min-w-[75px]">
                {/* Node circle */}
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCurrent
                      ? 'bg-[#F5EB78] text-[#121316] font-bold ring-4 ring-[#F5EB78]/40 shadow-xs'
                      : isPassed
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-[#F8F6F0] text-[#6F727A] border border-[#EAE5DB]'
                  }`}
                >
                  {isPassed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </motion.div>

                {/* Stage Label */}
                <span
                  className={`text-xs font-semibold tracking-tight text-center whitespace-nowrap ${
                    isCurrent
                      ? 'text-[#121316] font-bold'
                      : isPassed
                      ? 'text-[#121316]'
                      : 'text-[#6F727A]'
                  }`}
                >
                  {stg.label}
                </span>
              </div>

              {/* Connecting hairline */}
              {i < stages.length - 1 && (
                <div className="flex-1 max-w-[40px] h-[1px] relative self-center -mt-4">
                  <div className="absolute inset-0 bg-[#E5DFD4]" />
                  {isPassed && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 bg-emerald-500"
                    />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export interface UnifiedRecordItem {
  id: string;
  recordType: 'CANDIDATE' | 'VISITOR';
  fullName: string;
  phone?: string;
  email?: string;
  positionOrPurpose: string;
  departmentOrCompany: string;
  hostOrRecruiter: string;
  checkInTime?: string;
  status: string;
  currentStage: ArrivalStage;
  room?: string;
  rawCandidate?: Candidate;
  rawVisitor?: Visitor;
}

export const VisitorJourneyOverview: React.FC<{
  candidates: Candidate[];
  visitors?: Visitor[];
  selectedStage?: ArrivalStage | null;
  onSelectStage?: (stage: ArrivalStage | null) => void;
  onOpenStageDetails?: (stage: ArrivalStage) => void;
  onOpenDossier?: (candidateId: string) => void;
  onCheckout?: (candidateId: string) => void;
  onClearAllFilters?: () => void;
}> = ({
  candidates,
  visitors = [],
  selectedStage,
  onSelectStage,
  onOpenStageDetails,
  onOpenDossier,
  onCheckout,
  onClearAllFilters,
}) => {
  const handleTileClick = (stageId: ArrivalStage) => {
    if (onSelectStage) {
      // Toggle off if clicking the already-selected stage, or switch to the new stage
      const nextStage = selectedStage === stageId ? null : stageId;
      onSelectStage(nextStage);
    }
  };

  const handleManualClear = () => {
    if (onSelectStage) {
      onSelectStage(null);
    }
    if (onClearAllFilters) {
      onClearAllFilters();
    }
  };

  const stages: {
    id: ArrivalStage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    description: string;
  }[] = [
    {
      id: 'EXPECTED',
      label: 'Expected',
      icon: Calendar,
      accent: 'text-slate-300',
      description: 'Scheduled appointments & expected arrivals',
    },
    {
      id: 'ARRIVED',
      label: 'Arrived',
      icon: Clock,
      accent: 'text-amber-400',
      description: 'Checked-in & waiting in reception lounge',
    },
    {
      id: 'IN_OFFICE',
      label: 'In Office',
      icon: DoorOpen,
      accent: 'text-emerald-400',
      description: 'Assigned to rooms or in active evaluation',
    },
    {
      id: 'EXITED',
      label: 'Checked Out',
      icon: LogOut,
      accent: 'text-slate-400',
      description: 'Concluded visits & departed premises',
    },
  ];

  // Map candidates to unified records
  const unifiedCandidateRecords: UnifiedRecordItem[] = candidates.map((c) => {
    const { currentStage } = computeArrivalStage(c);
    return {
      id: c.id,
      recordType: 'CANDIDATE',
      fullName: c.fullName,
      phone: c.phone,
      email: c.email,
      positionOrPurpose: c.position || c.purpose || 'Job Applicant',
      departmentOrCompany: c.department || c.currentCompany || 'Sales & Operations',
      hostOrRecruiter: c.assignedInterviewerName || c.personToMeet || 'HR Panel',
      checkInTime: c.checkedInAt || c.arrivalTime,
      status: c.status,
      currentStage,
      room: c.assignedRoomName,
      rawCandidate: c,
    };
  });

  // Map visitors to unified records
  const unifiedVisitorRecords: UnifiedRecordItem[] = visitors.map((v) => {
    const currentStage = computeVisitorArrivalStage(v);
    return {
      id: v.id,
      recordType: 'VISITOR',
      fullName: v.fullName,
      phone: v.phone,
      email: v.email,
      positionOrPurpose: v.purpose || (v.visitorType ? `Visitor (${v.visitorType})` : 'Business Visit'),
      departmentOrCompany: v.company || v.hostDepartment || 'Official Guest',
      hostOrRecruiter: v.hostName || 'Reception Assistance',
      checkInTime: v.checkInTime,
      status: v.status,
      currentStage,
      room: v.roomAssigned,
      rawVisitor: v,
    };
  });

  // All unified records
  const allUnifiedRecords = [...unifiedCandidateRecords, ...unifiedVisitorRecords];

  // Group counts strictly by stage from the exact records
  const countsByStage: Record<ArrivalStage, number> = {
    EXPECTED: 0,
    ARRIVED: 0,
    IN_OFFICE: 0,
    EXITED: 0,
  };

  allUnifiedRecords.forEach((r) => {
    countsByStage[r.currentStage] = (countsByStage[r.currentStage] || 0) + 1;
  });

  // Records filtered by the selected stage
  const matchingRecords = selectedStage
    ? allUnifiedRecords.filter((r) => r.currentStage === selectedStage)
    : [];

  const selectedStageMeta = stages.find((s) => s.id === selectedStage) || stages[0];

  return (
    <div className="intake-flow-container rounded-2xl p-5 sm:p-6 border border-[#E5DFD4] space-y-5 shadow-xs relative bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#EAE5DB]">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#121316]" />
          <h3 className="text-sm sm:text-base font-extrabold text-[#121316] uppercase tracking-wider font-mono">
            Visitor & Candidate Intake Flow
          </h3>
          <span className="text-xs text-[#6F727A] hidden md:inline">
            (Click any stage card to view records & filter queue)
          </span>
        </div>
        {selectedStage ? (
          <div className="flex items-center gap-2.5">
            <span className="text-xs sm:text-sm text-[#121316] font-mono font-semibold">
              Stage: <strong>{selectedStageMeta?.label}</strong> ({matchingRecords.length} records)
            </span>
            <button
              type="button"
              onClick={handleManualClear}
              className="px-3 py-1.5 bg-[#121316] hover:bg-[#25272D] text-white border border-[#121316] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset / Clear Filter</span>
            </button>
          </div>
        ) : (
          <span className="text-xs sm:text-[13px] text-[#6F727A] font-mono">
            Showing all ({allUnifiedRecords.length}) records
          </span>
        )}
      </div>

      {/* 4 Stage Cards Evenly Distributed Across Available Width with Staggered Dribbble Entrance */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full"
      >
        {stages.map((stg) => {
          const Icon = stg.icon;
          const count = countsByStage[stg.id] || 0;
          const isSelected = selectedStage === stg.id;

          return (
            <motion.button
              key={stg.id}
              variants={staggerItem}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${stg.label} stage, ${count} records${isSelected ? ' (Currently active filter)' : ''}`}
              onClick={() => handleTileClick(stg.id)}
              className={`intake-stage-card p-5 sm:p-6 rounded-2xl border text-left cursor-pointer relative overflow-hidden group select-none min-h-[148px] flex flex-col justify-between focus-visible:outline-2 focus-visible:outline-[#121316] focus-visible:outline-offset-2 transition-all duration-200 ${
                isSelected
                  ? 'is-selected bg-[#FDFBC9] border-[#EADB5F] text-[#121316] shadow-sm ring-2 ring-[#EADB5F]'
                  : 'bg-white border-[#E5DFD4] text-[#121316] shadow-xs hover:bg-[#FAF8F5] hover:border-[#D5CEBF]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3 pointer-events-none">
                  <div className="flex items-center gap-2">
                    <div
                      className={`intake-icon-badge w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-xs ${
                        isSelected
                          ? 'bg-[#121316] text-[#F5EB78]'
                          : 'bg-[#F8F6F0] border border-[#EAE5DB] text-[#121316]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#121316] text-[#F5EB78] uppercase tracking-wide inline-flex items-center gap-1 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F5EB78] animate-pulse" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                  <span className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-[#121316] intake-stage-count relative z-10 pr-1">
                    {count}
                  </span>
                </div>
                <p className="text-base sm:text-lg font-bold tracking-tight text-[#121316] intake-stage-label pointer-events-none">
                  {stg.label}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mt-1 pointer-events-none">
                  {stg.description}
                </p>
              </div>

              <div
                className={`flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200/60 text-xs font-semibold transition-opacity pointer-events-none ${
                  isSelected ? 'text-amber-700 opacity-100 font-bold' : 'text-slate-500 opacity-0 group-hover:opacity-100'
                }`}
              >
                <span>{isSelected ? 'Selected • Click to Clear' : 'View Records'}</span>
                <span className="text-sm">&rarr;</span>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Interactive Filtered Records Details Panel When A Card Is Clicked */}
      <AnimatePresence>
        {selectedStage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-5 sm:p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-amber-500/35 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center text-sm font-bold">
                    <selectedStageMeta.icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <span>{selectedStageMeta?.label} Records ({matchingRecords.length})</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 border border-amber-300">
                        Stage Filter Active
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Showing relevant visitors and candidates for {selectedStageMeta?.label}.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleManualClear}
                  className="px-3.5 py-1.5 bg-white/80 hover:bg-white text-slate-700 text-xs sm:text-[13px] font-semibold rounded-xl border border-slate-200 transition flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Clear Filter & Restore All</span>
                </button>
              </div>

              {/* Records Listing or Clean Empty State */}
              {matchingRecords.length === 0 ? (
                <div className="py-10 px-4 text-center space-y-3 bg-white/50 rounded-2xl border border-slate-200/60">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <h5 className="text-sm sm:text-base font-bold text-slate-900">
                    No records found for {selectedStageMeta?.label}
                  </h5>
                  <p className="text-xs sm:text-[13px] text-slate-500 max-w-md mx-auto leading-relaxed">
                    There are currently no candidates or visitors in this stage. Click another card or restore the full view.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleManualClear}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition cursor-pointer"
                    >
                      Restore All Records
                    </button>
                  </div>
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {matchingRecords.map((item) => {
                    const isCandidate = item.recordType === 'CANDIDATE';
                    return (
                      <motion.div
                        key={`${item.recordType}-${item.id}`}
                        variants={staggerItem}
                        className="p-4 sm:p-5 rounded-2xl card-dark bg-white/60 border border-slate-200/80 hover:border-amber-400/50 transition shadow-xs space-y-3 text-xs sm:text-sm text-slate-800"
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                                {item.fullName}
                              </h5>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                  isCandidate
                                    ? 'bg-amber-500/15 text-amber-700 border border-amber-300'
                                    : 'bg-purple-500/15 text-purple-700 border border-purple-300'
                                }`}
                              >
                                {isCandidate ? 'Candidate' : 'Visitor'}
                              </span>
                            </div>
                            <p className="text-xs sm:text-[13px] text-amber-700 font-semibold truncate mt-1">
                              {item.positionOrPurpose}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {item.departmentOrCompany}
                            </p>
                          </div>

                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 shrink-0 border border-slate-200">
                            {item.status}
                          </span>
                        </div>

                        {/* Metadata Details */}
                        <div className="p-3 rounded-xl bg-white/50 border border-slate-200/70 space-y-1.5 text-xs text-slate-700">
                          <div className="flex justify-between items-center gap-1.5">
                            <span className="text-slate-500">Host / Recruiter:</span>
                            <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                              {item.hostOrRecruiter}
                            </span>
                          </div>
                          {item.phone && (
                            <div className="flex justify-between items-center gap-1.5">
                              <span className="text-slate-500">Contact:</span>
                              <span className="font-mono text-amber-700 font-medium">{item.phone}</span>
                            </div>
                          )}
                          {item.checkInTime && (
                            <div className="flex justify-between items-center gap-1.5">
                              <span className="text-slate-500">Arrival / Check-in:</span>
                              <span className="font-mono text-slate-600">
                                {new Date(item.checkInTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          )}
                          {item.room && (
                            <div className="flex justify-between items-center gap-1.5">
                              <span className="text-slate-500">Room:</span>
                              <span className="text-emerald-700 font-bold">{item.room}</span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-200/60 text-xs gap-2">
                          <span className="text-slate-500 font-mono text-[11px] truncate max-w-[120px]">
                            ID: {item.id.slice(0, 12)}...
                          </span>
                          <div className="flex items-center gap-2">
                            {isCandidate && onOpenDossier && (
                              <button
                                type="button"
                                onClick={() => onOpenDossier(item.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Dossier</span>
                              </button>
                            )}
                            {item.status !== 'CHECKED_OUT' && onCheckout && (
                              <button
                                type="button"
                                onClick={() => onCheckout(item.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-semibold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Check-Out</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

