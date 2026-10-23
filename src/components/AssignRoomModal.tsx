import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  DoorOpen,
  CheckCircle2,
  Users,
  Zap,
  Sparkles,
  RefreshCw,
  Bell,
  Coffee,
  UserCheck,
} from 'lucide-react';
import type { Room } from '../types/index.ts';

interface AssignRoomModalProps {
  candidateId: string;
  candidateName?: string;
  interviewId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignRoomModal: React.FC<AssignRoomModalProps> = ({
  candidateId,
  candidateName = 'Candidate',
  interviewId,
  onClose,
  onSuccess,
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [roomCategory, setRoomCategory] = useState<'operational' | 'next_round'>('operational');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms);
        // Pre-select first available operational room
        const firstAvail = data.rooms.find(
          (r: Room) =>
            r.status === 'AVAILABLE' &&
            r.id !== 'room-lalit-cabin' &&
            r.id !== 'room-kimmi-cabin' &&
            r.name !== 'Lalit Sir Cabin' &&
            r.name !== 'Elegance Suite' &&
            !r.isReservedNextRound
        ) || data.rooms.find((r: Room) => r.status === 'AVAILABLE');
        if (firstAvail) setSelectedRoomId(firstAvail.id);
      }
    } catch (err) {
      console.error('Failed to load rooms', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedRoomId) {
      setError('Please select an available room.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/rooms/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hrUserId: 'usr-hr-1',
          hrName: 'Sneha Patel (HR Lead)',
          candidateId,
          interviewId,
          roomId: selectedRoomId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to assign room');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Room assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#121316]/50 backdrop-blur-md p-2.5 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white border border-[#E5DFD4] rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl text-[#121316] overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5DFD4] flex items-center justify-between bg-[#FAF7F0] shrink-0">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F727A] block truncate font-mono">
              HR Human Decision Required
            </span>
            <h2 className="text-base sm:text-lg font-bold text-[#121316] mt-0.5 truncate">Assign Interview Room</h2>
            <p className="text-xs text-[#6F727A] mt-0.5 truncate">
              Candidate: <strong className="text-[#121316]">{candidateName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#6F727A] hover:text-[#121316] hover:bg-white border border-[#E5DFD4] transition shrink-0 cursor-pointer shadow-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-semibold text-[#121316]">
                Select Room for Candidate Allocation:
              </label>
              <div className="flex items-center gap-1 bg-[#FAF7F0] p-1 rounded-xl border border-[#E5DFD4] shrink-0 shadow-xs">
                <button
                  type="button"
                  onClick={() => setRoomCategory('operational')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    roomCategory === 'operational'
                      ? 'bg-[#F5EB78] text-[#121316] shadow-xs'
                      : 'text-[#6F727A] hover:text-[#121316]'
                  }`}
                >
                  Operational Rooms
                </button>
                <button
                  type="button"
                  onClick={() => setRoomCategory('next_round')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                    roomCategory === 'next_round'
                      ? 'bg-[#F5EB78] text-[#121316] shadow-xs'
                      : 'text-[#6F727A] hover:text-[#121316]'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-[#121316]" />
                  <span>Next Round Cabins</span>
                </button>
              </div>
            </div>

            {roomCategory === 'next_round' && (
              <div className="p-2.5 bg-[#FAF7F0] border border-[#E5DFD4] rounded-xl text-[11px] text-[#6F727A] flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-[#121316]" />
                <span>
                  <strong className="text-[#121316]">Reserved for Senior & Next Round Interviews:</strong> Lalit Sir Cabin and Elegance Suite.
                </span>
              </div>
            )}

            {loadingRooms ? (
              <div className="p-8 text-center text-xs text-[#6F727A]">Loading room availability...</div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {rooms
                  .filter((room) => {
                    const isReserved =
                      room.id === 'room-lalit-cabin' ||
                      room.id === 'room-kimmi-cabin' ||
                      room.roomId === 'room-lalit-cabin' ||
                      room.roomId === 'room-kimmi-cabin' ||
                      room.name === 'Lalit Sir Cabin' ||
                      room.name === 'Elegance Suite' ||
                      room.isReservedNextRound;
                    return roomCategory === 'next_round' ? isReserved : !isReserved;
                  })
                  .map((room) => {
                  const isAvail = room.status === 'AVAILABLE';
                  const isSelected = selectedRoomId === room.id;

                  return (
                    <div
                      key={room.id}
                      onClick={() => isAvail && setSelectedRoomId(room.id)}
                      className={`p-3 sm:p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        !isAvail
                          ? 'opacity-50 bg-[#FAF7F0]/40 border-[#E5DFD4] cursor-not-allowed text-[#6F727A]'
                          : isSelected
                          ? 'bg-[#FAF7F0] border-2 border-[#121316] shadow-sm cursor-pointer'
                          : 'bg-white border-[#E5DFD4] hover:bg-[#FAF7F0] hover:border-[#121316]/30 cursor-pointer shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-[#F5EB78] text-[#121316] border-[#121316]/20'
                              : 'bg-[#FAF7F0] text-[#6F727A] border-[#E5DFD4]'
                          }`}
                        >
                          <DoorOpen className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-[#121316] truncate">{room.name}</h4>
                            {(room.id === 'room-lalit-cabin' || room.id === 'room-kimmi-cabin' || room.name === 'Elegance Suite' || room.name === 'Lalit Sir Cabin') && (
                              <span className="px-1.5 py-0.5 bg-[#F5EB78] text-[#121316] rounded-md text-[9px] font-bold shrink-0">
                                Next Round
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-[#6F727A] mt-0.5 flex-wrap">
                            <span>Type: {room.type?.replace('_', ' ') || 'Meeting Room'}</span>
                            {room.preferredFor && (
                              <span className="truncate max-w-[140px] sm:max-w-[200px]">({room.preferredFor})</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isSelected ? (
                          <span className="w-6 h-6 rounded-full bg-[#121316] text-[#F5EB78] flex items-center justify-center font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : isAvail ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            Available
                          </span>
                        ) : room.status === 'CLEANING' || room.status === 'NEEDS_CLEANING' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                            Under Cleaning
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-300">
                            {room.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-[#E5DFD4] bg-[#FAF7F0] flex flex-wrap items-center justify-end gap-2.5 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#FAF7F0] text-[#121316] text-xs font-semibold border border-[#E5DFD4] transition cursor-pointer shadow-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={submitting || !selectedRoomId}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#F5EB78] hover:bg-[#ebd545] text-[#121316] text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirm Room Assignment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
