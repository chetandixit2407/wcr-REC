import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { smoothEase } from '../utils/motion.ts';
import {
  X,
  Coffee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  User,
  Users,
  ShieldCheck,
  RefreshCw,
  Plus,
  Ban,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import type { PantryTask, PantryTaskStatus } from '../types/index.ts';

interface PantryRealtimeMonitorModalProps {
  tasks: PantryTask[];
  currentUserId: string;
  currentUserRole: string;
  currentUserName: string;
  onClose: () => void;
  onOpenCreateTask: () => void;
  onRefresh: () => void;
}

export const PantryRealtimeMonitorModal: React.FC<PantryRealtimeMonitorModalProps> = ({
  tasks,
  currentUserId,
  currentUserRole,
  currentUserName,
  onClose,
  onOpenCreateTask,
  onRefresh,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [cancelModalTask, setCancelModalTask] = useState<PantryTask | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTIVE') return t.status === 'PENDING' || t.status === 'ACCEPTED' || t.status === 'IN_PROGRESS';
    if (filterStatus === 'COMPLETED') return t.status === 'COMPLETED';
    if (filterStatus === 'ISSUE') return t.status === 'ISSUE_REPORTED';
    if (filterStatus === 'CANCELLED') return t.status === 'CANCELLED';
    return true;
  });

  const handleVerify = async (taskId: string) => {
    setActionLoadingId(taskId);
    try {
      const res = await fetch(`/api/pantry/tasks/${encodeURIComponent(taskId)}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ verifierName: currentUserName, verifierRole: currentUserRole }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to verify task', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalTask) return;
    setActionLoadingId(cancelModalTask.id);
    try {
      const res = await fetch(`/api/pantry/tasks/${encodeURIComponent(cancelModalTask.id)}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cancelledByName: currentUserName,
          reason: cancelReason.trim() || 'Cancelled by requester',
        }),
      });
      if (res.ok) {
        setCancelModalTask(null);
        setCancelReason('');
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to cancel task', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (task: PantryTask) => {
    switch (task.status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Pending
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1 font-mono">
            Accepted
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1 font-mono animate-pulse">
            In Progress
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            {task.isVerifiedCompleted ? 'Verified Complete' : 'Staff-Reported Complete'}
          </span>
        );
      case 'ISSUE_REPORTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1 font-mono">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Issue Reported
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/40 text-slate-400 border border-slate-600 font-mono">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const isAuthorisedToManage =
    currentUserRole === 'ADMIN' ||
    currentUserRole === 'CEO' ||
    currentUserRole === 'HR' ||
    currentUserRole === 'SENIOR_HR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121316]/40 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 6 }}
        transition={{ duration: 0.3, ease: smoothEase }}
        className="rounded-3xl max-w-4xl w-full shadow-2xl border border-[#E5DFD4] bg-white text-[#121316] max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#E5DFD4] flex items-center justify-between bg-[#FAF7F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5EB78] border border-[#E5DFD4] text-[#121316] flex items-center justify-center shadow-xs">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#121316] tracking-tight">
                  Pantry & Hospitality Real-Time Progress Monitor
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live SSE sync active" />
              </div>
              <p className="text-[11px] text-[#6F727A]">
                Authoritative multi-stage tracking &bull; Zero-refresh live stream &bull; Completion verification
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCreateTask}
              className="px-3 py-1.5 bg-[#F5EB78] hover:bg-[#ebd545] text-[#121316] font-extrabold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer border border-[#E5DFD4] shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-[#FAF7F0] hover:bg-[#ECE6DC] text-[#121316] border border-[#E5DFD4] transition cursor-pointer"
              title="Sync latest"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#FAF7F0] hover:bg-[#ECE6DC] text-[#6F727A] hover:text-[#121316] border border-[#E5DFD4] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-2.5 bg-[#FAF7F0] border-b border-[#E5DFD4] flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs">
            {['ALL', 'ACTIVE', 'COMPLETED', 'ISSUE', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-xl font-bold text-[11px] transition cursor-pointer ${
                  filterStatus === st
                    ? 'bg-[#F5EB78] text-[#121316] border border-[#E5DFD4] shadow-xs'
                    : 'text-[#6F727A] hover:text-[#121316] hover:bg-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-mono text-[#6F727A]">
            Total Tracked: {filteredTasks.length}
          </span>
        </div>

        {/* Task Cards List */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1 bg-white">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#FAF7F0] border border-[#E5DFD4] space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-[#121316]">No tasks matching filter</h3>
              <p className="text-xs text-[#6F727A]">Create a new Pantry or Hospitality task anytime.</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isExpanded = expandedTaskId === task.id;
              const isCreatorOrAdmin =
                isAuthorisedToManage ||
                task.createdById === currentUserId ||
                task.createdByName === currentUserName;

              return (
                <div
                  key={task.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F0] border border-[#E5DFD4] shadow-xs space-y-3 transition hover:border-[#D5CEBF]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#F5EB78] border border-[#E5DFD4] text-[#121316] flex items-center justify-center font-bold text-xs">
                        {task.category === 'PANTRY' ? 'P' : 'H'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#121316]">{task.roomName}</h4>
                          <span className="text-xs text-[#6F727A] font-mono">({task.location || task.roomName})</span>
                        </div>
                        <p className="text-[11px] text-[#6F727A]">
                          Guest/Candidate: <strong className="text-[#121316]">{task.candidateName || 'Not specified'}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(task)}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-[#E5DFD4] text-[#121316] font-mono">
                        Due: {task.dueTime || 'Normal'}
                      </span>
                    </div>
                  </div>

                  {/* Task Instructions */}
                  <p className="text-xs text-[#121316] leading-relaxed bg-white p-2.5 rounded-xl border border-[#E5DFD4]">
                    {task.instructions || task.description}
                  </p>

                  {/* Required Items */}
                  {task.requiredItems && task.requiredItems.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-bold font-mono text-[#6F727A] uppercase">Items:</span>
                      {task.requiredItems.map((it, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-white border border-[#E5DFD4] text-[11px] text-[#121316]"
                        >
                          {it}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Timeline Timestamps Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E5DFD4] text-[10px] font-mono text-[#6F727A]">
                    <div>
                      <span className="block text-[#6F727A]">Created:</span>
                      <strong className="text-[#121316]">
                        {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[#6F727A]">Assigned To:</span>
                      <strong className="text-[#121316] truncate block">
                        {task.assignedSteward || 'Pantry Team'}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[#6F727A]">Started:</span>
                      <strong className="text-[#121316]">
                        {task.startedAt
                          ? new Date(task.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Pending'}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[#6F727A]">Completed:</span>
                      <strong className="text-emerald-700">
                        {task.completedAt
                          ? `${new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${task.timeTakenFormatted || 'Done'})`
                          : 'In queue'}
                      </strong>
                    </div>
                  </div>

                  {/* Issue Reason Banner if reported */}
                  {task.status === 'ISSUE_REPORTED' && task.issueReason && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span><strong>Issue Reported:</strong> {task.issueReason}</span>
                    </div>
                  )}

                  {/* Footer Action Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#E5DFD4]">
                    <span className="text-[11px] text-[#6F727A] flex items-center gap-1">
                      <User className="w-3 h-3 text-[#6F727A]" />
                      Created by <strong className="text-[#121316]">{task.createdByName}</strong> ({task.createdByRole})
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Expand Audit Trail */}
                      <button
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className="px-2.5 py-1 text-[11px] text-[#6F727A] hover:text-[#121316] rounded-lg hover:bg-white transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>Audit Log</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {/* Verify Completion Button */}
                      {task.status === 'COMPLETED' && !task.isVerifiedCompleted && isCreatorOrAdmin && (
                        <button
                          onClick={() => handleVerify(task.id)}
                          disabled={actionLoadingId === task.id}
                          className="px-3 py-1 bg-[#F5EB78] hover:bg-[#ebd545] text-[#121316] font-bold text-xs rounded-xl border border-[#E5DFD4] transition flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify Completion</span>
                        </button>
                      )}

                      {/* Cancel Task Button */}
                      {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && isCreatorOrAdmin && (
                        <button
                          onClick={() => setCancelModalTask(task)}
                          className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition flex items-center gap-1 cursor-pointer border border-rose-200"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Audit Trail History */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-2 border-t border-[#E5DFD4] space-y-1.5 text-[11px] overflow-hidden"
                      >
                        <h5 className="font-bold text-xs text-[#121316] font-mono">Status Audit Trail</h5>
                        {task.auditTrail && task.auditTrail.length > 0 ? (
                          <div className="space-y-1 pl-2 border-l border-[#E5DFD4]">
                            {task.auditTrail.map((entry, aIdx) => (
                              <div key={aIdx} className="text-[#6F727A] flex items-start gap-2">
                                <span className="font-mono text-[10px] text-[#6F727A]">
                                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <div>
                                  <strong className="text-[#121316]">{entry.status}:</strong>{' '}
                                  <span className="text-[#121316]">{entry.note || 'Status updated'}</span>{' '}
                                  <span className="text-[#6F727A]">by {entry.actorName} ({entry.actorRole})</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[#6F727A] text-[10px]">No historical entries recorded.</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Cancellation Submodal */}
        {cancelModalTask && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#121316]/40 backdrop-blur-md">
            <div className="bg-white border border-[#E5DFD4] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-[#121316]">
              <h3 className="text-sm font-bold text-[#121316] flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-rose-600" />
                <span>Cancel Task: {cancelModalTask.roomName}</span>
              </h3>
              <p className="text-xs text-[#6F727A]">
                Are you sure you want to cancel this hospitality task?
              </p>
              <div>
                <label className="block text-[11px] text-[#6F727A] mb-1">Reason for Cancellation</label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Candidate rescheduled, meeting cancelled"
                  className="w-full p-2 bg-[#FAF7F0] border border-[#E5DFD4] rounded-xl text-[#121316] text-xs focus:border-[#F5EB78]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setCancelModalTask(null)}
                  className="px-3 py-1.5 bg-[#FAF7F0] hover:bg-[#ECE6DC] text-[#121316] border border-[#E5DFD4] rounded-xl text-xs font-semibold"
                >
                  Keep Task
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
