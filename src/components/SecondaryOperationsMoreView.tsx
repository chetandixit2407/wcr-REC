import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Users2,
  Coffee,
  CalendarClock,
  LogOut,
  Camera,
  CheckCircle2,
  MapPin,
  Eye,
  Building2,
  Layers,
  Sparkles,
  ChevronRight,
  Edit3,
  Trash2,
} from 'lucide-react';
import type { Candidate, Visitor } from '../types/index.ts';
import { VisitorArrivalTimeline } from './VisitorArrivalTimeline.tsx';
import { CandidateDossierModal } from './CandidateDossierModal.tsx';
import { ReceptionPhotoModal } from './ReceptionPhotoModal.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { formatPhotoTimestamp } from '../utils/dateFormatter.ts';
import { EditRecordModal } from './modals/EditRecordModal.tsx';
import { DeleteConfirmModal, DeleteRecordType } from './modals/DeleteConfirmModal.tsx';
import { CandidateAvatar } from './CandidateAvatar.tsx';


interface SecondaryOperationsMoreViewProps {
  candidates: Candidate[];
  visitors: Visitor[];
  onCheckout: (candidateId: string) => void;
  onBackToDashboard: () => void;
  onRefresh?: () => void;
  onRecordDeleted?: (id: string, type: DeleteRecordType) => void;
  initialTab?: 'all' | 'lounge' | 'meetings' | 'checkout';
}

export const SecondaryOperationsMoreView: React.FC<SecondaryOperationsMoreViewProps> = ({
  candidates,
  visitors,
  onCheckout,
  onBackToDashboard,
  onRefresh,
  onRecordDeleted,
  initialTab = 'all',
}) => {
  const { t } = useSettings();
  const [activeTab, setActiveTab] = useState<'all' | 'lounge' | 'meetings' | 'checkout'>(initialTab);
  const [selectedProfileCandidateId, setSelectedProfileCandidateId] = useState<string | null>(null);
  const [selectedPhotoCandidate, setSelectedPhotoCandidate] = useState<Candidate | null>(null);

  // Edit / Delete Modal State
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    recordType: DeleteRecordType;
    record: any;
  }>({
    isOpen: false,
    recordType: 'VISITOR',
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
    recordType: 'VISITOR',
    recordId: '',
    recordName: '',
  });

  // Filter lists
  const waitingCandidates = candidates.filter(
    (c) => c.status === 'ARRIVED' || c.status === 'WAITING'
  );

  const meetingCandidates = candidates.filter(
    (c) => c.status === 'IN_INTERVIEW' || c.status === 'ROOM_ASSIGNED'
  );

  const readyForCheckout = candidates.filter(
    (c) => c.status === 'COMPLETED' || c.status === 'OFFERED' || c.status === 'REJECTED'
  );

  const totalSecondaryCount = waitingCandidates.length + meetingCandidates.length + readyForCheckout.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Header with Back Action */}
      <div className="p-5 glass-panel-elevated bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2.5 rounded-2xl bg-white/80 hover:bg-white border border-black/10 text-[#2D3033] transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-xs"
            title="Return to primary dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-[#9E8243]" />
            <span>Back to Dashboard</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9E8243] animate-pulse" />
              <h1 className="text-lg font-black tracking-tight text-[#111111] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#9E8243]" />
                <span>More Operations &bull; Secondary Sections</span>
              </h1>
            </div>
            <p className="text-xs text-[#5F6368] mt-0.5">
              Access Lounge Waiting Area, In-Active Meetings, and Physical Check-Out terminal
            </p>
          </div>
        </div>

        {/* Total Summary Capsule */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-white/80 border border-black/10 text-xs text-[#2D3033] flex items-center gap-2 shadow-xs">
            <span className="text-[#5F6368]">Total Tracked:</span>
            <span className="font-mono font-bold text-[#9E8243]">{totalSecondaryCount}</span>
          </div>
        </div>
      </div>

      {/* Section Switcher Tabs - Allows opening each section individually */}
      <div className="flex items-center gap-2 border-b border-black/10 pb-2 overflow-x-auto">
        {/* Tab 1: All Secondary Sections */}
        <button
          onClick={() => setActiveTab('all')}
          className={`wcr-filter-tab px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shrink-0 border flex items-center gap-2 ${
            activeTab === 'all'
              ? 'is-active bg-[#D8BF85] text-[#111111] border-[#D8BF85] font-black shadow-xs'
              : 'bg-white/60 text-[#5F6368] border-black/10 hover:bg-white/80 hover:text-[#111111]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Secondary Sections</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/5 font-mono">
            {totalSecondaryCount}
          </span>
        </button>

        {/* Tab 2: Lounge Waiting Area */}
        <button
          onClick={() => setActiveTab('lounge')}
          className={`wcr-filter-tab px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shrink-0 border flex items-center gap-2 ${
            activeTab === 'lounge'
              ? 'is-active bg-[#D8BF85] text-[#111111] border-[#D8BF85] font-black shadow-xs'
              : 'bg-white/60 text-[#5F6368] border-black/10 hover:bg-white/80 hover:text-[#111111]'
          }`}
        >
          <Coffee className="w-3.5 h-3.5 text-[#9E8243]" />
          <span>Lounge Waiting Area</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/5 font-mono">
            {waitingCandidates.length}
          </span>
        </button>

        {/* Tab 3: In Active Meetings */}
        <button
          onClick={() => setActiveTab('meetings')}
          className={`wcr-filter-tab px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shrink-0 border flex items-center gap-2 ${
            activeTab === 'meetings'
              ? 'is-active bg-[#D8BF85] text-[#111111] border-[#D8BF85] font-black shadow-xs'
              : 'bg-white/60 text-[#5F6368] border-black/10 hover:bg-white/80 hover:text-[#111111]'
          }`}
        >
          <CalendarClock className="w-3.5 h-3.5 text-blue-600" />
          <span>In Active Meetings</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/5 font-mono">
            {meetingCandidates.length + visitors.length}
          </span>
        </button>

        {/* Tab 4: Physical Check-Out */}
        <button
          onClick={() => setActiveTab('checkout')}
          className={`wcr-filter-tab px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shrink-0 border flex items-center gap-2 ${
            activeTab === 'checkout'
              ? 'is-active bg-[#D8BF85] text-[#111111] border-[#D8BF85] font-black shadow-xs'
              : 'bg-white/60 text-[#5F6368] border-black/10 hover:bg-white/80 hover:text-[#111111]'
          }`}
        >
          <LogOut className="w-3.5 h-3.5 text-emerald-600" />
          <span>Physical Check-Out</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/5 font-mono">
            {readyForCheckout.length}
          </span>
        </button>
      </div>

      {/* Grid or Individual View */}
      <div
        className={`grid gap-6 ${
          activeTab === 'all' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'
        }`}
      >
        {/* SECTION 1: Lounge Waiting Area */}
        {(activeTab === 'all' || activeTab === 'lounge') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-black/10">
              <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9E8243]" />
                <span>Lounge Waiting Area ({waitingCandidates.length})</span>
              </h3>
              {activeTab === 'all' && (
                <button
                  onClick={() => setActiveTab('lounge')}
                  className="text-[11px] text-[#9E8243] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Focus</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {waitingCandidates.length === 0 ? (
                <div className="p-8 text-center glass-panel bg-white/60 backdrop-blur-xl rounded-2xl text-xs text-[#5F6368] border border-white/60 shadow-xs">
                  Lounge is currently clear.
                </div>
              ) : (
                waitingCandidates.map((cand) => (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedProfileCandidateId(cand.id)}
                    className="p-4 rounded-2xl space-y-3 text-xs shadow-sm cursor-pointer glass-panel bg-white/65 backdrop-blur-xl candidate-card text-[#111111] border border-white/60 hover:bg-white/75 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center shrink-0">
                          <CandidateAvatar
                            candidate={cand}
                            name={cand.fullName}
                            sizeClassName="w-12 h-12"
                            roundedClassName="rounded-xl"
                            borderClassName="border-2 border-[#121316]"
                            fallbackBgClassName="bg-[#FAF8F5]"
                            fallbackTextClassName="text-[#121316]"
                          />

                          {(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt || cand.livePhotoCapturedAt) && (
                            <span
                              className="text-[9px] text-[#9E8243] font-mono font-medium tracking-tight mt-1 text-center truncate max-w-[85px]"
                              title={`Captured: ${formatPhotoTimestamp(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt || cand.livePhotoCapturedAt)}`}
                            >
                              {formatPhotoTimestamp(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt || cand.livePhotoCapturedAt).split(',')[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="candidate-name font-bold text-sm flex items-center gap-1 text-[#111111]">
                            {cand.fullName}
                            <Eye className="w-3.5 h-3.5 text-[#5F6368]" />
                          </h4>
                          <p className="candidate-role text-[11px] font-semibold text-[#5F6368]">{cand.position}</p>
                          <p className="candidate-meta text-[10px] mt-0.5 text-[#8C9199]">
                            Arrived: {cand.checkedInAt ? new Date(cand.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                          </p>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 font-mono bg-amber-500/15 text-amber-800 border border-amber-500/30">
                        Waiting
                      </span>
                    </div>

                    {/* Visitor Lifecycle Stage Tracker */}
                    <div className="card-divider pt-2 border-t border-black/10">
                      <VisitorArrivalTimeline candidate={cand} compact={true} />
                    </div>

                    {/* Desk Photo Verification status & Action */}
                    <div className="card-divider pt-2 border-t flex items-center justify-between gap-2 border-black/10">
                      {cand.receptionPhotoUrl || cand.arrivalPhoto ? (
                        <div className="flex flex-col">
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Desk Photo Verified
                          </span>
                          {(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt) && (
                            <span className="text-[9px] text-[#9E8243] font-mono">
                              Captured: {formatPhotoTimestamp(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] italic text-[#9E8243] font-medium">
                          Desk Photo Required
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhotoCandidate(cand);
                        }}
                        className="px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition cursor-pointer bg-[#D8BF85]/20 hover:bg-[#D8BF85]/35 border-[#D8BF85]/40 text-[#866827] shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{cand.receptionPhotoUrl || cand.arrivalPhoto ? 'Retake Photo' : 'Capture Desk Photo'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: In Active Meetings */}
        {(activeTab === 'all' || activeTab === 'meetings') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-black/10">
              <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>In Active Meetings ({meetingCandidates.length + visitors.length})</span>
              </h3>
              {activeTab === 'all' && (
                <button
                  onClick={() => setActiveTab('meetings')}
                  className="text-[11px] text-blue-600 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Focus</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {meetingCandidates.length === 0 && visitors.length === 0 ? (
                <div className="p-8 text-center glass-panel bg-white/60 backdrop-blur-xl rounded-2xl text-xs text-[#5F6368] border border-white/60 shadow-xs">
                  No active meetings in progress right now.
                </div>
              ) : (
                <>
                  {meetingCandidates.map((cand) => (
                    <div
                      key={cand.id}
                      onClick={() => setSelectedProfileCandidateId(cand.id)}
                      className="p-4 rounded-2xl space-y-2.5 text-xs cursor-pointer shadow-sm glass-panel bg-white/65 backdrop-blur-xl candidate-card border border-blue-500/30 text-[#111111] hover:bg-white/75 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="candidate-name font-bold flex items-center gap-1 text-sm text-[#111111]">
                          {cand.fullName}
                          <Eye className="w-3.5 h-3.5 text-[#5F6368]" />
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold font-mono text-blue-800 bg-blue-500/15 border border-blue-500/30">
                          {cand.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#5F6368]">
                        <span className="candidate-role">{cand.position}</span>
                        <span className="font-semibold flex items-center gap-1 text-[#9E8243]">
                          <MapPin className="w-3.5 h-3.5 text-[#9E8243]" />
                          {cand.assignedRoomName || cand.currentLocation || 'Cabin'}
                        </span>
                      </div>

                      <div className="card-divider pt-2 border-t border-black/10">
                        <VisitorArrivalTimeline candidate={cand} compact={true} />
                      </div>
                    </div>
                  ))}

                  {visitors.map((vis) => (
                    <div
                      key={vis.id}
                      className="p-3.5 rounded-2xl space-y-2 text-xs glass-panel bg-white/65 backdrop-blur-xl text-[#111111] border border-white/60 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#111111]">{vis.fullName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold font-mono text-purple-800 bg-purple-500/15 border border-purple-500/30">
                          {vis.visitorType}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#5F6368]">
                        <span>Host: <strong className="text-[#111111]">{vis.hostName}</strong></span>
                        <span className="text-[#8C9199]">{vis.company || 'Official Visit'}</span>
                      </div>

                      {/* Clearly visible Edit and Delete buttons for Visitors in Secondary View */}
                      <div className="pt-2 border-t border-black/10 flex items-center justify-between text-[11px]">
                        <span className="text-[#8C9199] font-mono text-[10px]">{vis.phone || 'Phone: N/A'}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setEditModal({
                                isOpen: true,
                                recordType: 'VISITOR',
                                record: vis,
                              })
                            }
                            className="p-1.5 rounded-lg bg-white/80 hover:bg-[#D8BF85]/20 text-[#5F6368] hover:text-[#9E8243] border border-black/10 text-xs transition cursor-pointer shadow-xs"
                            title="Edit Visitor Information"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#9E8243]" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                recordType: 'VISITOR',
                                recordId: vis.id,
                                recordName: vis.fullName,
                              })
                            }
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 text-xs transition cursor-pointer shadow-xs"
                            title="Delete Visitor"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* SECTION 3: Physical Check-Out */}
        {(activeTab === 'all' || activeTab === 'checkout') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-black/10">
              <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Physical Check-Out ({readyForCheckout.length})</span>
              </h3>
              {activeTab === 'all' && (
                <button
                  onClick={() => setActiveTab('checkout')}
                  className="text-[11px] text-emerald-700 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Focus</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {readyForCheckout.length === 0 ? (
                <div className="p-8 text-center glass-panel bg-white/60 backdrop-blur-xl rounded-2xl text-xs text-[#5F6368] border border-white/60 shadow-xs">
                  No visitors currently awaiting checkout.
                </div>
              ) : (
                readyForCheckout.map((cand) => (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedProfileCandidateId(cand.id)}
                    className="p-4 rounded-2xl space-y-3 text-xs shadow-sm cursor-pointer glass-panel bg-white/65 backdrop-blur-xl candidate-card text-[#111111] border border-emerald-500/30 hover:bg-white/75 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="candidate-name font-bold flex items-center gap-1 text-sm text-[#111111]">
                          {cand.fullName}
                          <Eye className="w-3.5 h-3.5 text-[#5F6368]" />
                        </h4>
                        <p className="candidate-role text-[11px] font-semibold text-[#5F6368]">{cand.position}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-800 border border-emerald-500/30">
                        Completed
                      </span>
                    </div>

                    <div className="card-divider pt-1">
                      <VisitorArrivalTimeline candidate={cand} compact={true} />
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCheckout(cand.id);
                      }}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Complete Physical Checkout</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Candidate Profile Modal */}
      {selectedProfileCandidateId && (
        <CandidateDossierModal
          candidateId={selectedProfileCandidateId}
          initialCandidate={candidates.find((c) => c.id === selectedProfileCandidateId)}
          currentRole="RECEPTION"
          onClose={() => setSelectedProfileCandidateId(null)}
          onPhotoCaptured={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Live Photo Modal */}
      {selectedPhotoCandidate && (
        <ReceptionPhotoModal
          candidate={selectedPhotoCandidate}
          receptionistId="usr-rec-1"
          receptionistName="Ananya Sen (Reception)"
          onClose={() => setSelectedPhotoCandidate(null)}
          onSuccess={() => {
            setSelectedPhotoCandidate(null);
            if (onRefresh) onRefresh();
          }}
        />
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
        onSuccess={() => {
          if (onRecordDeleted) {
            onRecordDeleted(deleteModal.recordId, deleteModal.recordType);
          }
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};
