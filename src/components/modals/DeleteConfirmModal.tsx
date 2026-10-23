import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  AlertCircle,
  DoorOpen,
  Calendar,
  Clock,
  CheckSquare,
} from 'lucide-react';
import { authenticatedFetch } from '../../utils/apiClient.ts';

export type DeleteRecordType =
  | 'VISITOR'
  | 'CANDIDATE'
  | 'INTERVIEW'
  | 'ROOM'
  | 'ACTION_TASK'
  | 'NOTIFICATION'
  | 'USER';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  recordType: DeleteRecordType;
  recordId: string;
  recordName: string;
  metadata?: Record<string, any>;
  onClose: () => void;
  onSuccess: (deletedId?: string, recordType?: DeleteRecordType) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  recordType,
  recordId,
  recordName,
  metadata = {},
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDependency, setActiveDependency] = useState<any | null>(null);

  if (!isOpen) return null;

  // Active status diagnostics
  const isCandidateInInterview =
    recordType === 'CANDIDATE' &&
    (metadata.status === 'IN_INTERVIEW' || Boolean(activeDependency));
  const isCandidateRoomAssigned =
    recordType === 'CANDIDATE' && metadata.status === 'ROOM_ASSIGNED' && !isCandidateInInterview;

  // Dependency evaluation for rooms and user accounts
  let dependencyBlockMessage: string | null = null;
  if (recordType === 'ROOM') {
    if (metadata.status === 'OCCUPIED' || metadata.status === 'ASSIGNED') {
      dependencyBlockMessage = `This room ("${recordName}") is currently marked as ${metadata.status}. A candidate or interview session is actively using it. Please relocate or complete the session before deleting.`;
    }
  } else if (recordType === 'USER') {
    if (metadata.role === 'CEO' || recordId === 'usr-ceo-lalit') {
      dependencyBlockMessage = 'Executive Leadership (CEO) account cannot be deleted from the operations console.';
    }
  } else if (recordType === 'INTERVIEW') {
    if (metadata.status === 'IN_PROGRESS') {
      dependencyBlockMessage = `This interview session is currently actively in progress. Please submit feedback or conclude the session first.`;
    }
  }

  const handleDelete = async (options?: { forceResolve?: boolean }) => {
    if (dependencyBlockMessage) return;

    const forceResolve = options?.forceResolve || false;
    setLoading(true);
    setError(null);

    let endpoint = '';
    switch (recordType) {
      case 'VISITOR':
        endpoint = `/api/visitors/${recordId}`;
        break;
      case 'CANDIDATE':
        endpoint = `/api/candidates/${recordId}`;
        break;
      case 'INTERVIEW':
        endpoint = `/api/interviews/${recordId}`;
        break;
      case 'ROOM':
        endpoint = `/api/rooms/${recordId}`;
        break;
      case 'ACTION_TASK':
        endpoint = `/api/action-tasks/${recordId}`;
        break;
      case 'NOTIFICATION':
        endpoint = `/api/notifications/${recordId}`;
        break;
      case 'USER':
        endpoint = `/api/users/${recordId}`;
        break;
      default:
        setError('Unsupported record type.');
        setLoading(false);
        return;
    }

    try {
      const res = await authenticatedFetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: forceResolve ? 'Concluded active session & deleted candidate' : 'Administrative Deletion',
          forceResolveActiveSession: forceResolve,
        }),
      });

      const data = await res.json().catch(() => ({}));

      // If active interview dependency is detected by server, show diagnostic details & direct resolution action
      if (res.status === 409 || data.code === 'ACTIVE_INTERVIEW_DEPENDENCY') {
        setActiveDependency(data.activeDependency || { status: 'IN_INTERVIEW' });
        setError(data.error || 'Cannot delete candidate while an interview is actively in progress.');
        setLoading(false);
        return;
      }

      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Failed to delete record. Please check dependencies.');
      }

      window.dispatchEvent(
        new CustomEvent('wcr:record-deleted', {
          detail: { id: recordId, type: recordType },
        })
      );
      onSuccess(recordId, recordType);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while deleting.');
      setLoading(false);
    }
  };

  const getReadableTypeName = () => {
    switch (recordType) {
      case 'VISITOR':
        return 'Visitor Log';
      case 'CANDIDATE':
        return 'Candidate Profile';
      case 'INTERVIEW':
        return 'Interview Record';
      case 'ROOM':
        return 'Facility Room';
      case 'ACTION_TASK':
        return 'Hospitality / Action Task';
      case 'NOTIFICATION':
        return 'Alert Notification';
      case 'USER':
        return 'Staff Profile';
      default:
        return 'Record';
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-[#FFFFFF] border border-[#E5DFD4] rounded-3xl p-6 shadow-2xl text-[#121316] space-y-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-2 border-b border-[#EAE5DB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#121316] tracking-tight">
                Confirm Deletion
              </h3>
              <p className="text-xs text-rose-600 font-mono font-semibold">
                Permanent {getReadableTypeName()} Action
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl text-[#6F727A] hover:text-[#121316] hover:bg-[#FAF8F5] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Body */}
        <div className="p-3.5 bg-[#FAF8F5] border border-[#EAE5DB] rounded-2xl text-xs space-y-2">
          <p className="text-[#121316]">
            Are you sure you want to delete <strong className="text-[#121316] font-bold">"{recordName}"</strong>?
          </p>
          <p className="text-[#6F727A] text-[11px] leading-relaxed">
            This action will safely remove the candidate record and all linked schedules, interview assignments, and room allocations.
          </p>
        </div>

        {/* Informative notice for allocated rooms (non-blocking) */}
        {isCandidateRoomAssigned && !isCandidateInInterview && (
          <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-900 flex items-start gap-2.5">
            <DoorOpen className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-sky-950 block">Room Allocation Auto-Cleanup</span>
              <p className="text-[11px] text-sky-800 leading-relaxed">
                This candidate currently has an allocated room. Deleting will automatically release the room back to <strong>AVAILABLE</strong> and cancel pending interview schedules.
              </p>
            </div>
          </div>
        )}

        {/* Diagnostic Active Interview Dependency Notice with Direct Resolution */}
        {isCandidateInInterview && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-extrabold text-amber-950 block">Active Interview Dependency Detected</span>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Candidate <strong>"{recordName}"</strong> is currently in an active interview session
                  {activeDependency?.roundName ? ` (${activeDependency.roundName})` : ''}
                  {activeDependency?.roomName ? ` inside ${activeDependency.roomName}` : ''}
                  {activeDependency?.interviewerName ? ` with ${activeDependency.interviewerName}` : ''}.
                </p>
              </div>
            </div>
            <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200 text-[11px] text-amber-900">
              <strong>Required Action:</strong> You can resolve and conclude this active session to release the room and proceed with deletion.
            </div>
          </div>
        )}

        {/* Dependency Block Message for strictly immutable records (e.g. CEO account, occupied rooms) */}
        {dependencyBlockMessage && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-950 block">Action Blocked: Dependency Constraint</span>
              <p className="text-[11px] text-amber-900 leading-relaxed">{dependencyBlockMessage}</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl text-rose-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EAE5DB]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-white hover:bg-[#FAF8F5] text-[#121316] rounded-xl text-xs font-semibold border border-[#E5DFD4] transition cursor-pointer shadow-xs"
          >
            Cancel
          </button>

          {isCandidateInInterview ? (
            <button
              type="button"
              onClick={() => handleDelete({ forceResolve: true })}
              disabled={loading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md disabled:opacity-40 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Resolving & Deleting...</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Resolve Session & Delete</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleDelete()}
              disabled={loading || Boolean(dependencyBlockMessage)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isCandidateRoomAssigned ? 'Release Room & Delete' : 'Confirm Delete'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
