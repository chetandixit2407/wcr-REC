import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { smoothEase } from '../utils/motion.ts';
import {
  X,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  User,
  DoorOpen,
  Coffee,
  Edit3,
  Trash2,
} from 'lucide-react';
import type { Notification, UserRole } from '../types/index.ts';
import { EditRecordModal } from './modals/EditRecordModal.tsx';
import { DeleteConfirmModal, DeleteRecordType } from './modals/DeleteConfirmModal.tsx';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  role: UserRole;
  onActionClick: (actionKey: string, payload?: any) => void;
  onMarkRead: (id: string) => void;
  onRefresh?: () => void;
  onRecordDeleted?: (id: string, type: DeleteRecordType) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  role,
  onActionClick,
  onMarkRead,
  onRefresh,
  onRecordDeleted,
}) => {
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    recordType: DeleteRecordType;
    record: any;
  }>({
    isOpen: false,
    recordType: 'NOTIFICATION',
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
    recordType: 'NOTIFICATION',
    recordId: '',
    recordName: '',
  });
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.26, ease: smoothEase }}
            onClick={onClose}
            className="fixed inset-0 bg-[#121316]/40 backdrop-blur-md"
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 pointer-events-none">
            <motion.div
              initial={{ x: '100%', opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ duration: 0.36, ease: smoothEase }}
              className="w-screen max-w-md bg-[#FAF7F0] border-l border-[#E5DFD4] shadow-2xl flex flex-col text-[#121316] pointer-events-auto"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#E5DFD4] flex items-center justify-between bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#F5EB78] border border-[#E5DFD4] flex items-center justify-center text-[#121316] shadow-xs">
                    <Bell className="w-4 h-4 text-[#121316]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#121316] tracking-tight">Role-Based Alert Feed</h3>
                    <p className="text-[11px] text-[#6F727A] font-mono">
                      Filtered for: <strong className="text-[#121316]">{role}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-[#6F727A] hover:text-[#121316] hover:bg-[#FAF7F0] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* List of Notifications */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <Bell className="w-8 h-8 text-[#D8BF85] mx-auto" />
                    <p className="text-xs text-[#202124]/70 font-medium">No alerts for this role right now.</p>
                    <p className="text-[11px] text-[#202124]/50 max-w-xs mx-auto">
                      When automated office events occur, role-filtered alerts appear here in real-time.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isHigh = notif.priority === 'HIGH' || notif.priority === 'CRITICAL';
                    const candidateId = notif.entityId || notif.payload?.candidateId;
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('button')) return;
                          if (candidateId) {
                            onActionClick('VIEW_CANDIDATE', { candidateId });
                            onMarkRead(notif.id);
                            onClose();
                          }
                        }}
                        className={`p-3.5 rounded-2xl border transition text-xs space-y-2 relative ${
                          candidateId ? 'cursor-pointer hover:border-[#D5CEBF]' : ''
                        } ${
                          notif.read
                            ? 'bg-white/60 border-[#E5DFD4] text-[#6F727A]'
                            : isHigh
                            ? 'bg-rose-50 border-rose-300 shadow-sm ring-1 ring-rose-200 text-rose-950'
                            : 'bg-white border-[#E5DFD4] text-[#121316] shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                notif.read
                                  ? 'bg-[#121316]/30'
                                  : isHigh
                                  ? 'bg-rose-500 animate-ping'
                                  : 'bg-[#F5EB78]'
                              }`}
                            />
                            <h4 className="font-bold text-[#121316] text-xs">{notif.title}</h4>
                          </div>
                          <span className="text-[10px] text-[#6F727A] font-mono">
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#6F727A] leading-relaxed">{notif.message}</p>

                        {/* Role Filtered Payload Info */}
                        {notif.payload && (
                          <div className="p-2 rounded-xl bg-[#FAF7F0] border border-[#E5DFD4] text-[10px] text-[#6F727A] space-y-1">
                            {notif.payload.candidateName && (
                              <div className="flex justify-between">
                                <span>Candidate:</span>
                                <strong className="text-[#121316] font-semibold">{notif.payload.candidateName}</strong>
                              </div>
                            )}
                            {notif.payload.room && (
                              <div className="flex justify-between">
                                <span>Room:</span>
                                <strong className="text-[#121316] font-semibold">{notif.payload.room}</strong>
                              </div>
                            )}
                            {notif.payload.required && (
                              <div className="flex justify-between">
                                <span>Required:</span>
                                <strong className="text-emerald-700 font-semibold">{notif.payload.required}</strong>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap items-center justify-between pt-1 border-t border-[#E5DFD4] gap-2">
                          <div className="flex flex-wrap gap-1.5">
                            {notif.actionButtons?.map((btn, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  onActionClick(btn.actionKey, btn.payload);
                                  onMarkRead(notif.id);
                                  onClose();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#F5EB78] hover:bg-[#ebd545] text-[#121316] font-bold text-[10px] shadow-xs border border-[#E5DFD4] transition cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                <span>{btn.label}</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-1.5 ml-auto">
                            <button
                              type="button"
                              onClick={() =>
                                setEditModal({
                                  isOpen: true,
                                  recordType: 'NOTIFICATION',
                                  record: notif,
                                })
                              }
                              className="p-1 rounded bg-[#FAF7F0] hover:bg-white text-[#6F727A] hover:text-[#121316] border border-[#E5DFD4] transition cursor-pointer"
                              title="Edit Notification"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteModal({
                                  isOpen: true,
                                  recordType: 'NOTIFICATION',
                                  recordId: notif.id,
                                  recordName: notif.title,
                                })
                              }
                              className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                              title="Delete Notification"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            {!notif.read && (
                              <button
                                onClick={() => onMarkRead(notif.id)}
                                className="text-[10px] text-[#6F727A] hover:text-[#121316] transition cursor-pointer ml-1"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#E5DFD4] bg-white text-center">
                <span className="text-[10px] text-[#6F727A] flex items-center justify-center gap-1 font-mono">
                  <Sparkles className="w-3 h-3 text-[#121316]" />
                  Real-time SSE event alerts • Persistent
                </span>
              </div>
            </motion.div>
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
      )}
    </AnimatePresence>
  );
};
