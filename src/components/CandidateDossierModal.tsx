import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { smoothEase } from '../utils/motion.ts';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  FileText,
  Calendar,
  Clock,
  Shield,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Download,
  Eye,
  Camera,
  ShieldCheck,
  Check,
  Building,
  AlertCircle,
  Lock,
  Edit3,
  Trash2,
  Save,
  RefreshCw,
  DoorOpen,
  GraduationCap,
  DollarSign,
  FileCheck,
} from 'lucide-react';
import { formatCandidateAddress, formatCandidateLocation, formatCandidateExperience } from '../utils/candidateHelpers.ts';
import type { Candidate, Interview, TimelineEvent, UserRole } from '../types/index.ts';
import { formatDateTime, formatPhotoTimestamp } from '../utils/dateFormatter.ts';
import { ResumeDocumentModal } from './ResumeDocumentModal.tsx';
import { ReceptionPhotoModal } from './ReceptionPhotoModal.tsx';
import { VisitorArrivalTimeline } from './VisitorArrivalTimeline.tsx';
import { authenticatedFetch } from '../utils/apiClient.ts';
import { CandidateAvatar } from './CandidateAvatar.tsx';


type DossierSection =
  | 'Identity'
  | 'Application'
  | 'Experience'
  | 'Interview'
  | 'Documents'
  | 'Status'
  | 'Notes';

interface CandidateDossierModalProps {
  candidateId: string;
  initialCandidate?: Candidate;
  currentRole: UserRole;
  onClose: () => void;
  onAssignRoom?: (candidateId: string, interviewId?: string) => void;
  onPhotoCaptured?: (updated: Candidate) => void;
  onCandidateUpdated?: () => void;
  onCandidateDeleted?: () => void;
}

export const CandidateDossierModal: React.FC<CandidateDossierModalProps> = ({
  candidateId,
  initialCandidate,
  currentRole,
  onClose,
  onAssignRoom,
  onPhotoCaptured,
  onCandidateUpdated,
  onCandidateDeleted,
}) => {
  // Strict privacy enforcement: Pantry role must never view candidate dossiers or personal profiles
  if (currentRole === 'PANTRY') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FAF9F6]/75 backdrop-blur-xl">
        <div className="glass-panel-elevated bg-white/80 border border-rose-300/70 p-6 rounded-3xl max-w-md w-full text-center space-y-4 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#111111] tracking-tight">Access Prohibited</h3>
          <p className="text-xs text-[#5F6368] leading-relaxed">
            Users with the Pantry role are strictly restricted to assigned hospitality tasks. Full candidate profiles, dossiers, and personal information are inaccessible.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-[#D8BF85] to-[#BFA15F] hover:from-[#E5D2A0] hover:to-[#CDB06E] text-[#111111] font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
          >
            Return to Pantry Tasks
          </button>
        </div>
      </div>
    );
  }

  const [loading, setLoading] = useState<boolean>(!initialCandidate);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(initialCandidate || null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [activeSection, setActiveSection] = useState<DossierSection>('Identity');

  // Sub-Modals
  const [showResumeModal, setShowResumeModal] = useState<boolean>(false);
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);

  // Edit & Delete state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteReason, setDeleteReason] = useState<string>('Administrative Archive');
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const [editForm, setEditForm] = useState({
    fullName: initialCandidate?.fullName || '',
    phone: initialCandidate?.phone || '',
    email: initialCandidate?.email || '',
    address: initialCandidate?.address || '',
    city: initialCandidate?.city || '',
    state: initialCandidate?.state || '',
    pincode: initialCandidate?.pincode || '',
    position: initialCandidate?.position || '',
    department: initialCandidate?.department || '',
    totalExperience: initialCandidate?.totalExperience || '',
    relevantExperience: initialCandidate?.relevantExperience || '',
    currentCompany: initialCandidate?.currentCompany || '',
    qualification: initialCandidate?.qualification || '',
    noticePeriod: initialCandidate?.noticePeriod || '',
    expectedSalary: initialCandidate?.expectedSalary || '',
    skills: initialCandidate?.skills || '',
    purpose: initialCandidate?.purpose || 'Interview / Job Application',
    departmentToMeet: initialCandidate?.departmentToMeet || 'HR & Recruitment',
    personToMeet: initialCandidate?.personToMeet || '',
    hrPrivateNotes: initialCandidate?.hrPrivateNotes || '',
  });

  useEffect(() => {
    if (initialCandidate) {
      setCandidate(initialCandidate);
      setLoading(false);
      setFetchError(null);
      setEditForm({
        fullName: initialCandidate.fullName || '',
        phone: initialCandidate.phone || '',
        email: initialCandidate.email || '',
        address: initialCandidate.address || '',
        city: initialCandidate.city || '',
        state: initialCandidate.state || '',
        pincode: initialCandidate.pincode || '',
        position: initialCandidate.position || '',
        department: initialCandidate.department || '',
        totalExperience: initialCandidate.totalExperience || '',
        relevantExperience: initialCandidate.relevantExperience || '',
        currentCompany: initialCandidate.currentCompany || '',
        qualification: initialCandidate.qualification || '',
        noticePeriod: initialCandidate.noticePeriod || '',
        expectedSalary: initialCandidate.expectedSalary || '',
        skills: initialCandidate.skills || '',
        purpose: initialCandidate.purpose || 'Scheduled In-Person Interview',
        departmentToMeet: initialCandidate.departmentToMeet || 'HR & Recruitment',
        personToMeet: initialCandidate.personToMeet || '',
        hrPrivateNotes: initialCandidate.hrPrivateNotes || '',
      });
    }
  }, [initialCandidate]);

  useEffect(() => {
    fetchCandidate(2);
  }, [candidateId, currentRole]);

  useEffect(() => {
    const handleRemoteDeleted = (e: any) => {
      const detail = e.detail;
      if (detail?.id === candidateId && detail?.type === 'CANDIDATE') {
        onClose();
      }
    };
    window.addEventListener('wcr:record-deleted', handleRemoteDeleted);
    return () => window.removeEventListener('wcr:record-deleted', handleRemoteDeleted);
  }, [candidateId, onClose]);

  const fetchCandidate = async (retries = 2) => {
    if (!candidateId || !candidateId.trim()) {
      setLoading(false);
      if (!candidate && !initialCandidate) {
        setFetchError('No candidate record selected.');
      }
      return;
    }

    if (!candidate && !initialCandidate) {
      setLoading(true);
    }
    setFetchError(null);

    let attempts = 0;
    while (attempts <= retries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const res = await authenticatedFetch(
          `/api/candidates/${encodeURIComponent(candidateId.trim())}?role=${encodeURIComponent(currentRole)}`,
          {
            signal: controller.signal,
            headers: { 'x-user-role': currentRole },
          }
        );
        clearTimeout(timeoutId);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (res.status === 404 || errData.isDeleted) {
            onClose();
            return;
          }
          throw new Error(errData.error || `Server error: ${res.status}`);
        }
        const data = await res.json();
        if (data.success && data.candidate) {
          setCandidate(data.candidate);
          setInterviews(data.interviews || []);
          setTimeline(data.timeline || []);
          setEditForm({
            fullName: data.candidate.fullName || '',
            phone: data.candidate.phone || '',
            email: data.candidate.email || '',
            address: data.candidate.address || '',
            city: data.candidate.city || '',
            state: data.candidate.state || '',
            pincode: data.candidate.pincode || '',
            position: data.candidate.position || '',
            department: data.candidate.department || '',
            totalExperience: data.candidate.totalExperience || '',
            relevantExperience: data.candidate.relevantExperience || '',
            currentCompany: data.candidate.currentCompany || '',
            qualification: data.candidate.qualification || '',
            noticePeriod: data.candidate.noticePeriod || '',
            expectedSalary: data.candidate.expectedSalary || '',
            skills: data.candidate.skills || '',
            purpose: data.candidate.purpose || 'Interview / Job Application',
            departmentToMeet: data.candidate.departmentToMeet || 'HR & Recruitment',
            personToMeet: data.candidate.personToMeet || '',
            hrPrivateNotes: data.candidate.hrPrivateNotes || '',
          });
          setFetchError(null);
          setLoading(false);
          return;
        } else {
          throw new Error(data.error || 'Failed to retrieve candidate profile.');
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        attempts++;
        if (attempts <= retries) {
          await new Promise((r) => setTimeout(r, attempts * 400));
        } else {
          if (!candidate && !initialCandidate) {
            setFetchError(err?.message || 'Failed to load candidate details.');
          }
          setLoading(false);
        }
      }
    }
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    setActionError(null);
    try {
      const res = await authenticatedFetch(`/api/candidates/${candidateId}?role=${currentRole}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setCandidate(data.candidate);
        setIsEditing(false);
        if (onCandidateUpdated) onCandidateUpdated();
      } else {
        setActionError(data.error || 'Failed to update candidate profile.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error during update.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteCandidate = async (options?: { forceResolve?: boolean }) => {
    setDeleting(true);
    setActionError(null);
    const forceResolve = options?.forceResolve || false;
    try {
      const res = await authenticatedFetch(`/api/candidates/${candidateId}?role=${currentRole}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole },
        body: JSON.stringify({
          reason: deleteReason,
          forceResolveActiveSession: forceResolve,
        }),
      });
      const data = await res.json();
      if (res.status === 409 || data.code === 'ACTIVE_INTERVIEW_DEPENDENCY') {
        setActionError(data.error || 'Active interview session in progress. Click "Resolve Session & Delete" to proceed.');
        setDeleting(false);
        return;
      }
      if (data.success) {
        setShowDeleteConfirm(false);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('wcr:record-deleted', { detail: { id: candidateId, type: 'CANDIDATE' } })
          );
        }
        if (onCandidateDeleted) onCandidateDeleted();
        onClose();
      } else {
        setActionError(data.error || 'Failed to delete record.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error during deletion.');
    } finally {
      setDeleting(false);
    }
  };

  const sections: { id: DossierSection; label: string; icon: any }[] = [
    { id: 'Identity', label: 'Identity', icon: User },
    { id: 'Application', label: 'Application', icon: Briefcase },
    { id: 'Experience', label: 'Experience', icon: Layers },
    { id: 'Interview', label: 'Interview', icon: Calendar },
    { id: 'Documents', label: 'Documents', icon: FileCheck },
    { id: 'Status', label: 'Status', icon: Clock },
    { id: 'Notes', label: 'Notes', icon: FileText },
  ];

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#121316]/50 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 6 }}
        transition={{ duration: 0.32, ease: smoothEase }}
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E5DFD4] text-[#121316] overflow-hidden"
      >
        {/* Top Header Bar */}
        <div className="p-3.5 sm:p-5 border-b border-[#E5DFD4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F0] shrink-0">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
            {/* Live photo or fallback avatar */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative group">
                <CandidateAvatar
                  candidate={candidate}
                  name={candidate?.fullName}
                  sizeClassName="w-12 h-12 sm:w-16 sm:h-16"
                  roundedClassName="rounded-2xl"
                  borderClassName="border-2 border-[#121316]"
                  fallbackBgClassName="bg-[#F5EB78]"
                  fallbackTextClassName="text-[#121316]"
                />

                {(candidate?.receptionPhotoUrl || candidate?.arrivalPhoto) && (
                  <span
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white shadow-xs"
                    title="Authoritative Desk Photo Verified"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              {/* Capture Timestamp directly below the photo */}
              {(candidate?.receptionPhotoCapturedAt || candidate?.arrivalPhotoCapturedAt || candidate?.livePhotoCapturedAt) && (
                <span
                  className="text-[9px] sm:text-[10px] text-[#6F727A] font-mono tracking-tight mt-1 truncate max-w-[95px] sm:max-w-[130px] text-center"
                  title={`Captured: ${formatPhotoTimestamp(candidate.receptionPhotoCapturedAt || candidate.arrivalPhotoCapturedAt || candidate.livePhotoCapturedAt)}`}
                >
                  {formatPhotoTimestamp(candidate.receptionPhotoCapturedAt || candidate.arrivalPhotoCapturedAt || candidate.livePhotoCapturedAt)}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-[#121316] truncate max-w-full">
                  {candidate?.fullName || 'Candidate Profile'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#FAF7F0] border border-[#E5DFD4] text-[10px] font-bold text-[#121316] font-mono shrink-0">
                  {candidate?.token || candidate?.id}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold shrink-0">
                  {candidate?.status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-[#6F727A] truncate mt-0.5">
                <strong className="text-[#121316] font-semibold">{candidate?.position}</strong> &bull; {candidate?.department || 'Operations'}
              </p>
              <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-[#6F727A] mt-1 flex-wrap">
                <span>Arrival: <strong className="text-[#121316] font-mono">{candidate?.arrivalTime || (candidate?.checkedInAt ? new Date(candidate.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today')}</strong></span>
                <span>Location: <strong className="text-[#121316]">{formatCandidateLocation(candidate?.assignedRoomName || candidate?.currentLocation)}</strong></span>
              </div>
            </div>
          </div>

          {/* Action buttons (Edit, Delete, Close) */}
          <div className="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-center">
            {(currentRole === 'ADMIN' || currentRole === 'HR' || currentRole === 'SENIOR_HR') && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  isEditing
                    ? 'bg-[#F5EB78] text-[#121316] border-[#121316]'
                    : 'bg-white hover:bg-[#FAF7F0] text-[#121316] border-[#E5DFD4] shadow-xs'
                }`}
                title={isEditing ? 'Cancel Edit' : 'Edit Candidate'}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isEditing ? 'Cancel' : 'Edit'}</span>
              </button>
            )}

            {(currentRole === 'ADMIN' ||
              currentRole === 'HR' ||
              currentRole === 'SENIOR_HR' ||
              currentRole === 'RECEPTION' ||
              currentRole === 'CEO' ||
              currentRole === 'CO_FOUNDER') && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-xl bg-white hover:bg-rose-50 text-[#6F727A] hover:text-rose-600 border border-[#E5DFD4] transition cursor-pointer shadow-xs"
                title="Archive / Delete candidate"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#6F727A] hover:text-[#121316] hover:bg-[#FAF7F0] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 7 Section Navigation Tabs */}
        <div className="px-4 py-2 border-b border-[#E5DFD4] bg-[#FAF7F0] flex gap-1.5 overflow-x-auto shrink-0">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'text-[#121316] bg-[#F5EB78] shadow-xs font-bold border border-[#121316]/10'
                    : 'text-[#6F727A] hover:text-[#121316] hover:bg-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#121316]' : 'text-[#6F727A]'}`} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body / Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-white">
          {/* Action notice / errors */}
          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Delete Confirmation Box */}
          {showDeleteConfirm && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-rose-900">
                    Confirm Candidate Deletion ({candidate?.fullName})
                  </h4>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    This will permanently delete candidate records and safely release any allocated facility rooms, check-in sessions, and interview schedules.
                  </p>
                  {candidate?.status === 'IN_INTERVIEW' && (
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-300 text-[11px] text-amber-900 mt-2">
                      <strong>Active Interview Dependency:</strong> Candidate is currently inside an evaluation session. Selecting "Resolve Session & Delete" will safely conclude the session and free the room.
                    </div>
                  )}
                  {candidate?.status === 'ROOM_ASSIGNED' && (
                    <div className="p-2 bg-sky-50 rounded-xl border border-sky-200 text-[11px] text-sky-800 mt-2">
                      Candidate has an allocated room ({candidate?.assignedRoomName || 'Room'}). Room will be automatically set to AVAILABLE.
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#121316] text-xs font-medium rounded-xl border border-[#E5DFD4]"
                >
                  Cancel
                </button>
                {candidate?.status === 'IN_INTERVIEW' ? (
                  <button
                    onClick={() => handleDeleteCandidate({ forceResolve: true })}
                    disabled={deleting}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    {deleting ? 'Resolving...' : 'Resolve Session & Delete'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleDeleteCandidate()}
                    disabled={deleting}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    {deleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SECTION 1: IDENTITY */}
          {activeSection === 'Identity' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 sm:p-5 bg-[#FAF7F0] rounded-2xl space-y-3 border border-[#E5DFD4]">
                  <span className="text-xs font-bold text-[#121316] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <User className="w-3.5 h-3.5 text-[#121316]" />
                    Personal Information
                  </span>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-[#E5DFD4]">
                      <span className="text-[#6F727A] text-[10px] uppercase font-mono block">Full Name</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.fullName}
                          onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E5DFD4] rounded-xl text-[#121316] text-xs mt-1 focus:border-[#121316]"
                        />
                      ) : (
                        <strong className="text-[#121316] text-sm block mt-0.5">{candidate?.fullName}</strong>
                      )}
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#E5DFD4]">
                      <span className="text-[#6F727A] text-[10px] uppercase font-mono block">Phone Number</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E5DFD4] rounded-xl text-[#121316] text-xs mt-1 focus:border-[#121316]"
                        />
                      ) : (
                        <span className="text-[#121316] font-mono font-medium block mt-0.5">{candidate?.phone}</span>
                      )}
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#E5DFD4]">
                      <span className="text-[#6F727A] text-[10px] uppercase font-mono block">Email Address</span>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E5DFD4] rounded-xl text-[#121316] text-xs mt-1 focus:border-[#121316]"
                        />
                      ) : (
                        <span className="text-[#121316] block mt-0.5">{candidate?.email || 'Not provided'}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5 bg-[#FAF7F0] rounded-2xl space-y-3 border border-[#E5DFD4]">
                  <span className="text-xs font-bold text-[#121316] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-[#121316]" />
                    Location & Residence
                  </span>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-[#E5DFD4]">
                      <span className="text-[#6F727A] text-[10px] uppercase font-mono block">Current Address</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.address}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          placeholder="Address Not Provided"
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E5DFD4] rounded-xl text-[#121316] text-xs mt-1 focus:border-[#121316]"
                        />
                      ) : (
                        <span className="text-[#121316] block mt-0.5">{formatCandidateAddress(candidate?.address)}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-white rounded-xl border border-[#E5DFD4]">
                        <span className="text-[#6F727A] text-[10px] uppercase font-mono block">City</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.city}
                            onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                            placeholder="Location Not Provided"
                            className="w-full px-2.5 py-1.5 bg-white border border-[#E5DFD4] rounded-xl text-[#121316] text-xs mt-1 focus:border-[#121316]"
                          />
                        ) : (
                          <span className="text-[#121316] font-medium block mt-0.5">{formatCandidateLocation(candidate?.city)}</span>
                        )}
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-[#E5DFD4]">
                        <span className="text-[#6F727A] text-[10px] uppercase font-mono block">State</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.state}
                            onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                            placeholder="Location Not Provided"
                            className="w-full px-2.5 py-1.5 bg-white border border-[#E5DFD4] rounded-xl text-[#121316] text-xs mt-1 focus:border-[#121316]"
                          />
                        ) : (
                          <span className="text-[#121316] font-medium block mt-0.5">{formatCandidateLocation(candidate?.state)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desk Photo Verification Block */}
              <div className="p-4 sm:p-5 bg-[#FAF7F0] rounded-2xl border border-[#E5DFD4] space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <CandidateAvatar
                        candidate={candidate}
                        name={candidate?.fullName}
                        sizeClassName="w-20 h-20 sm:w-24 sm:h-24"
                        roundedClassName="rounded-2xl"
                        borderClassName="border-2 border-[#121316]"
                        fallbackBgClassName="bg-[#F5EB78]/40"
                        fallbackTextClassName="text-[#121316]"
                        icon={
                          <div className="flex flex-col items-center justify-center gap-1">
                            <Camera className="w-7 h-7 text-[#121316]" />
                            <span className="text-[10px] font-bold">No Photo</span>
                          </div>
                        }
                      />
                      {(candidate?.receptionPhotoUrl || candidate?.arrivalPhoto) && (
                        <span className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-white p-1 rounded-full ring-2 ring-white shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>


                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-[#121316]">Desk Live Photo Verification</h4>
                        {candidate?.receptionPhotoUrl || candidate?.arrivalPhoto ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified Record
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-[#F5EB78] text-[#121316] border border-[#121316]/10 text-[10px] font-bold">
                            Pending Verification
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#121316] font-mono">
                        {candidate?.receptionPhotoCapturedAt || candidate?.arrivalPhotoCapturedAt || candidate?.livePhotoCapturedAt
                          ? `Captured: ${formatPhotoTimestamp(candidate.receptionPhotoCapturedAt || candidate.arrivalPhotoCapturedAt || candidate.livePhotoCapturedAt)}`
                          : 'No desk verification photo captured yet'}
                      </p>

                      <p className="text-[11px] text-[#6F727A]">
                        Verified By:{' '}
                        <strong className="text-[#121316]">
                          {candidate?.arrivalPhotoCapturedByName || candidate?.livePhotoCapturedBy || 'Front Desk Operations Staff'}
                        </strong>
                      </p>

                      <p className="text-[11px] text-[#6F727A]">
                        Database Storage:{' '}
                        <span className="text-emerald-700 font-semibold font-mono">
                          {candidate?.photoUploadStatus === 'SUCCESS' || candidate?.receptionPhotoUrl ? 'PERSISTED (wcr_database)' : 'PENDING'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPhotoModal(true)}
                    className="px-4 py-2.5 bg-[#F5EB78] hover:bg-[#ebd545] text-[#121316] font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2 shadow-xs shrink-0"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{candidate?.receptionPhotoUrl || candidate?.arrivalPhoto ? 'Retake Desk Photo' : 'Capture Desk Photo'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: APPLICATION */}
          {activeSection === 'Application' && (
            <div className="p-4 sm:p-5 bg-[#FAF7F0] rounded-2xl space-y-4 border border-[#E5DFD4]">
              <span className="text-xs font-bold text-[#121316] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Briefcase className="w-3.5 h-3.5 text-[#121316]" />
                Job Application & Terms
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-[#E5DFD4]">
                  <span className="text-[#6F727A] text-[10px] uppercase font-mono block">Target Role</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.position}
                      onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-[#E5DFD4] rounded-lg text-[#121316] text-xs mt-1"
                    />
                  ) : (
                    <strong className="text-[#121316] text-xs block mt-0.5">{candidate?.position}</strong>
                  )}
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E5DFD4]">
                  <span className="text-[#6F727A] text-[10px] uppercase font-mono block">Department</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.department}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-[#E5DFD4] rounded-lg text-[#121316] text-xs mt-1"
                    />
                  ) : (
                    <span className="text-[#121316] font-medium block mt-0.5">{candidate?.department || 'Operations'}</span>
                  )}
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E5DFD4]">
                  <span className="text-[#6F727A] text-[10px] uppercase font-mono block">Expected CTC / Salary</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.expectedSalary}
                      onChange={(e) => setEditForm({ ...editForm, expectedSalary: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-[#E5DFD4] rounded-lg text-[#121316] text-xs mt-1"
                    />
                  ) : (
                    <span className="text-[#121316] font-mono font-bold block mt-0.5">{candidate?.expectedSalary || 'Negotiable'}</span>
                  )}
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E5DFD4]">
                  <span className="text-[#6F727A] text-[10px] uppercase font-mono block">Notice Period</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.noticePeriod}
                      onChange={(e) => setEditForm({ ...editForm, noticePeriod: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-[#E5DFD4] rounded-lg text-[#121316] text-xs mt-1"
                    />
                  ) : (
                    <span className="text-[#121316] font-medium block mt-0.5">{candidate?.noticePeriod || 'Immediate'}</span>
                  )}
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E5DFD4]">
                  <span className="text-[#6F727A] text-[10px] uppercase font-mono block">Highest Qualification</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.qualification}
                      onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-[#E5DFD4] rounded-lg text-[#121316] text-xs mt-1"
                    />
                  ) : (
                    <span className="text-[#121316] font-medium block mt-0.5">{candidate?.qualification || 'Graduate'}</span>
                  )}
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E5DFD4]">
                  <span className="text-[#6F727A] text-[10px] uppercase font-mono block">Host / Person to Meet</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.personToMeet}
                      onChange={(e) => setEditForm({ ...editForm, personToMeet: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-[#E5DFD4] rounded-lg text-[#121316] text-xs mt-1"
                    />
                  ) : (
                    <span className="text-[#121316] font-medium block mt-0.5">{candidate?.personToMeet || 'HR Coordinator'}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: EXPERIENCE */}
          {activeSection === 'Experience' && (
            <div className="p-4 sm:p-5 bg-[#FAF7F0] rounded-2xl space-y-4 border border-[#E5DFD4]">
              <span className="text-xs font-bold text-[#121316] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Layers className="w-3.5 h-3.5 text-[#121316]" />
                Work History & Skillset
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-[#E5DFD4]">
                  <span className="text-[#6F727A] text-[10px] uppercase font-mono block">Current / Last Company</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.currentCompany || ''}
                      onChange={(e) => setEditForm({ ...editForm, currentCompany: e.target.value })}
                      placeholder="e.g. DLF / Godrej"
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5DFD4] rounded-xl text-[#121316] text-xs mt-1"
                    />
                  ) : (
                    <strong className="text-[#121316] text-xs block mt-0.5">{candidate?.currentCompany || 'Not disclosed'}</strong>
                  )}
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E5DFD4]">
                  <span className="text-[#6F727A] text-[10px] uppercase font-mono block">Years of Experience</span>
                  {isEditing ? (
                    <select
                      value={editForm.totalExperience || ''}
                      onChange={(e) => setEditForm({ ...editForm, totalExperience: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5DFD4] rounded-xl text-[#121316] text-xs mt-1"
                    >
                      <option value="">-- Select experience level --</option>
                      <option value="Fresher">Fresher (0 years of experience)</option>
                      <option value="Less than 1 year">Less than 1 year</option>
                      <option value="1-2 Years">1-2 Years</option>
                      <option value="3-5 Years">3-5 Years</option>
                      <option value="5-8 Years">5-8 Years</option>
                      <option value="8+ Years">8+ Years (Senior / Leadership)</option>
                      {editForm.totalExperience && !['Fresher', 'Less than 1 year', '1-2 Years', '3-5 Years', '5-8 Years', '8+ Years'].includes(editForm.totalExperience) && (
                        <option value={editForm.totalExperience}>{editForm.totalExperience}</option>
                      )}
                    </select>
                  ) : (
                    <span className="text-[#121316] font-mono font-bold block mt-0.5">{formatCandidateExperience(candidate?.totalExperience)}</span>
                  )}
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E5DFD4]">
                  <span className="text-[#6F727A] text-[10px] uppercase font-mono block">Relevant Experience</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.relevantExperience || ''}
                      onChange={(e) => setEditForm({ ...editForm, relevantExperience: e.target.value })}
                      placeholder="e.g. 2 Years in Sales"
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5DFD4] rounded-xl text-[#121316] text-xs mt-1"
                    />
                  ) : (
                    <span className="text-[#121316] font-mono font-bold block mt-0.5">{formatCandidateExperience(candidate?.relevantExperience)}</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[#6F727A] text-[10px] uppercase font-mono block mb-1">Key Professional Skills</span>
                <div className="p-3 bg-white rounded-xl border border-[#E5DFD4] text-xs text-[#121316]">
                  {candidate?.skills || 'Real Estate Sales, Negotiation, CRM Operations, Client Relations'}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: INTERVIEW */}
          {activeSection === 'Interview' && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 bg-[#FAF7F0] rounded-2xl space-y-3 border border-[#E5DFD4]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#121316] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-[#121316]" />
                    Interview Allocation & Cabin
                  </span>
                  {onAssignRoom && (
                    <button
                      onClick={() => onAssignRoom(candidateId)}
                      className="px-3.5 py-2 bg-[#F5EB78] hover:bg-[#ebd545] text-[#121316] font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <DoorOpen className="w-3.5 h-3.5" />
                      <span>Allocate / Change Room</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-3 bg-white rounded-xl border border-[#E5DFD4]">
                    <span className="text-[#6F727A] text-[10px] uppercase font-mono block">Assigned Cabin / Room</span>
                    <strong className="text-emerald-700 text-xs block mt-0.5">
                      {candidate?.assignedRoomName || 'Not Assigned (Lobby)'}
                    </strong>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#E5DFD4]">
                    <span className="text-[#6F727A] text-[10px] uppercase font-mono block">Assigned Interviewer</span>
                    <strong className="text-[#121316] text-xs block mt-0.5">
                      {candidate?.assignedInterviewerName || 'Pending Allocation'}
                    </strong>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#E5DFD4]">
                    <span className="text-[#6F727A] text-[10px] uppercase font-mono block">Current Stage</span>
                    <span className="text-[#121316] font-semibold block mt-0.5">{candidate?.status}</span>
                  </div>
                </div>
              </div>

              {/* Rounds List */}
              {interviews.length > 0 && (
                <div className="p-4 sm:p-5 bg-[#FAF7F0] rounded-2xl space-y-3 border border-[#E5DFD4]">
                  <span className="text-xs font-bold text-[#121316] uppercase tracking-wider">
                    Scheduled Interview Rounds ({interviews.length})
                  </span>
                  <div className="space-y-2">
                    {interviews.map((intv) => (
                      <div
                        key={intv.id}
                        className="p-3 bg-white rounded-xl border border-[#E5DFD4] flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-[#121316] block">{intv.roundName}</strong>
                          <span className="text-[11px] text-[#6F727A]">
                            Interviewer: {intv.interviewerName} &bull; Room: {intv.roomName || 'TBD'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-[#F5EB78] text-[#121316] font-mono text-[10px] font-bold">
                          {intv.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 5: DOCUMENTS */}
          {activeSection === 'Documents' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Resume Card */}
                <div className="p-5 bg-[#FAF7F0] rounded-2xl border border-[#E5DFD4] space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 border border-blue-200 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-[#121316]">Curriculum Vitae / Resume</h4>
                    <p className="text-[11px] text-[#6F727A]">
                      {candidate?.resumeUrl || candidate?.resumeFileName
                        ? `File: ${candidate.resumeFileName || 'Resume.pdf'}`
                        : 'No resume file uploaded yet'}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowResumeModal(true)}
                    className="w-full py-2.5 px-3 bg-white hover:bg-[#FAF7F0] text-[#121316] font-semibold text-xs rounded-xl border border-[#E5DFD4] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#121316]" />
                    <span>View Resume in Secure Viewer</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: STATUS & LIFECYCLE */}
          {activeSection === 'Status' && (
            <div className="space-y-4">
              {/* Animated Progress Timeline */}
              {candidate && <VisitorArrivalTimeline candidate={candidate} />}

              {/* Event Timeline History */}
              <div className="p-4 sm:p-5 bg-[#FAF7F0] rounded-2xl space-y-3 border border-[#E5DFD4]">
                <span className="text-xs font-bold text-[#121316] uppercase tracking-wider block font-mono">
                  Authoritative Audit Log & Event Trail ({timeline.length})
                </span>

                {timeline.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {timeline.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-2.5 bg-white rounded-xl border border-[#E5DFD4] text-xs flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <strong className="text-[#121316] block">{evt.action}</strong>
                          <p className="text-[11px] text-[#6F727A]">{evt.details}</p>
                        </div>
                        <span className="text-[10px] text-[#6F727A] font-mono shrink-0 ml-2">
                          {formatDateTime(evt.timestamp).full}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#6F727A]">No events logged yet.</p>
                )}
              </div>
            </div>
          )}

          {/* SECTION 7: NOTES */}
          {activeSection === 'Notes' && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 bg-[#FAF7F0] rounded-2xl space-y-3 border border-[#E5DFD4]">
                <span className="text-xs font-bold text-[#121316] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Lock className="w-3.5 h-3.5 text-[#121316]" />
                  Private HR & Interviewer Notes
                </span>
                <p className="text-[11px] text-[#6F727A]">
                  Visible only to HR, Senior HR, Admin, and CEO suites. Not exposed to candidates.
                </p>

                {isEditing ? (
                  <textarea
                    rows={4}
                    value={editForm.hrPrivateNotes}
                    onChange={(e) => setEditForm({ ...editForm, hrPrivateNotes: e.target.value })}
                    className="w-full p-3 bg-white border border-[#E5DFD4] rounded-xl text-[#121316] text-xs focus:border-[#121316]"
                    placeholder="Enter confidential interview notes, salary feedback, or observations..."
                  />
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-[#E5DFD4] text-xs text-[#121316] whitespace-pre-wrap min-h-[80px]">
                    {candidate?.hrPrivateNotes || 'No private HR notes recorded yet.'}
                  </div>
                )}
              </div>

              {/* Validation Engine Results if available */}
              {candidate?.validationResult && (
                <div className="p-4 sm:p-5 bg-[#FAF7F0] rounded-2xl space-y-2 border border-[#E5DFD4] text-xs">
                  <span className="text-xs font-bold text-[#121316] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Automated Validation Engine Checks
                  </span>
                  <div className="p-3 bg-white rounded-xl border border-[#E5DFD4] font-mono text-[11px] text-[#121316]">
                    Confidence: {candidate.validationResult.confidenceScore || 100}% &bull; Passed
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Save Edit Toolbar (when in editing mode) */}
          {isEditing && (
            <div className="p-3 bg-[#FAF7F0] rounded-2xl flex items-center justify-between gap-3 border border-[#E5DFD4]">
              <span className="text-xs font-bold text-[#121316]">Unsaved changes in profile</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#121316] text-xs font-medium rounded-xl border border-[#E5DFD4]"
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="px-4 py-1.5 bg-[#F5EB78] hover:bg-[#ebd545] text-[#121316] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#E5DFD4] bg-[#FAF7F0] flex items-center justify-between text-xs shrink-0">
          <span className="text-[#6F727A] text-[11px]">
            WCR Protected Record &bull; Encrypted
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-[#FAF7F0] text-[#121316] text-xs font-semibold rounded-xl border border-[#E5DFD4] transition cursor-pointer shadow-xs"
          >
            Close Dossier
          </button>
        </div>
      </motion.div>

      {/* Sub-Modals for in-app document viewing */}
      {showResumeModal && candidate && (
        <ResumeDocumentModal
          candidate={candidate}
          currentRole={currentRole}
          onClose={() => setShowResumeModal(false)}
        />
      )}

      {showPhotoModal && candidate && (
        <ReceptionPhotoModal
          candidate={candidate}
          receptionistId="usr-rec-1"
          receptionistName="Receptionist"
          onClose={() => setShowPhotoModal(false)}
          onSuccess={(updated) => {
            setCandidate(updated);
            setShowPhotoModal(false);
            if (onPhotoCaptured) onPhotoCaptured(updated);
          }}
        />
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
