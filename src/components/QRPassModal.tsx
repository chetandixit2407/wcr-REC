import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { smoothEase } from '../utils/motion.ts';
import {
  X,
  QrCode,
  Copy,
  Check,
  Plus,
  ExternalLink,
  Sparkles,
  Smartphone,
  Printer,
  ShieldCheck,
  Calendar,
  User,
  Users,
  Building,
  UserPlus,
  CheckCircle2,
  Clock,
  DoorOpen,
  Briefcase,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import type { CheckInSession } from '../types/index.ts';
import {
  getCandidateRegistrationUrl,
  getCandidateCheckInUrl,
} from '../utils/publicOrigin.ts';

interface QRPassModalProps {
  onClose: () => void;
  onLaunchCheckIn: (token: string) => void;
  onLaunchGeneralRegister?: () => void;
}

export const QRPassModal: React.FC<QRPassModalProps> = ({
  onClose,
  onLaunchCheckIn,
  onLaunchGeneralRegister,
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'SCHEDULED'>('GENERAL');
  const [sessions, setSessions] = useState<CheckInSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [selectedSession, setSelectedSession] = useState<CheckInSession | null>(null);
  const [generalQrDataUrl, setGeneralQrDataUrl] = useState<string>('');
  const [scheduledQrDataUrl, setScheduledQrDataUrl] = useState<string>('');
  const [isStandeeMode, setIsStandeeMode] = useState<boolean>(false);

  // Scheduled pass generation form
  const [showNewPassForm, setShowNewPassForm] = useState<boolean>(false);
  const [newCandidateName, setNewCandidateName] = useState<string>('Amit Trivedi');
  const [newPosition, setNewPosition] = useState<string>('Senior Investment Advisor');
  const [newDepartment, setNewDepartment] = useState<string>('Sales & Business Development');
  const [newTime, setNewTime] = useState<string>('03:00 PM');
  const [generating, setGenerating] = useState<boolean>(false);

  useEffect(() => {
    fetchSessions();
    generateGeneralQR();
  }, []);

  const generateGeneralQR = () => {
    const generalUrl = getCandidateRegistrationUrl();
    QRCode.toDataURL(
      generalUrl,
      {
        width: 340,
        margin: 2,
        color: { dark: '#07090c', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      },
      (err, url) => {
        if (!err && url) setGeneralQrDataUrl(url);
      }
    );
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const qrRes = await fetch('/api/qr/WCR-APPT-901');
      const s1 = await qrRes.json();
      const qrRes2 = await fetch('/api/qr/WCR-APPT-902');
      const s2 = await qrRes2.json();

      const list: CheckInSession[] = [];
      if (s1.session) list.push(s1.session);
      if (s2.session) list.push(s2.session);

      setSessions(list);
      if (list.length > 0) setSelectedSession(list[0]);
    } catch (err) {
      console.error('Failed to load QR sessions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedSession) return;
    const scanUrl = getCandidateCheckInUrl(selectedSession.token);

    QRCode.toDataURL(
      scanUrl,
      {
        width: 320,
        margin: 2,
        color: { dark: '#07090c', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      },
      (err, url) => {
        if (!err && url) setScheduledQrDataUrl(url);
      }
    );
  }, [selectedSession]);

  const handleCreateScheduledPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: newCandidateName,
          position: newPosition,
          department: newDepartment,
          appointmentTime: newTime,
          interviewerName: 'Nisha Verma',
          roundName: 'Round 1 - Technical Assessment',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => [data.session, ...prev]);
        setSelectedSession(data.session);
        setShowNewPassForm(false);
      }
    } catch (err) {
      console.error('Failed to generate pass', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121316]/40 backdrop-blur-md p-2.5 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 6 }}
        transition={{ duration: 0.3, ease: smoothEase }}
        className="rounded-2xl sm:rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-[#E5DFD4] bg-white text-[#121316] max-h-[92vh] flex flex-col"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-[#E5DFD4] flex items-center justify-between bg-[#FAF7F0] shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5DFD4] flex items-center justify-center text-[#121316] shadow-xs shrink-0">
              <QrCode className="w-5 h-5 text-[#121316]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[#121316] tracking-tight truncate">
                WCR QR Station & Reception Standees
              </h2>
              <p className="text-[11px] text-[#6F727A] truncate">
                Front Desk Blank Self-Registration Standee &bull; Scheduled Candidate Passes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#6F727A] hover:text-[#121316] hover:bg-white border border-[#E5DFD4] transition cursor-pointer shrink-0 shadow-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Tab Selector */}
        <div className="p-2.5 bg-[#FAF7F0] border-b border-[#E5DFD4] flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('GENERAL')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'GENERAL'
                ? 'bg-[#F5EB78] text-[#121316] shadow-xs border border-[#121316]/10'
                : 'text-[#6F727A] hover:text-[#121316] hover:bg-white'
            }`}
          >
            <UserPlus className="w-4 h-4 shrink-0 text-[#121316]" />
            <span>Blank Self-Registration Standee</span>
          </button>

          <button
            onClick={() => setActiveTab('SCHEDULED')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'SCHEDULED'
                ? 'bg-[#F5EB78] text-[#121316] shadow-xs border border-[#121316]/10'
                : 'text-[#6F727A] hover:text-[#121316] hover:bg-white'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0 text-[#121316]" />
            <span>Scheduled Passes</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-white">
          {/* TAB 1: BLANK CANDIDATE SELF-REGISTRATION STANDEE */}
          {activeTab === 'GENERAL' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6F727A] block font-mono">
                      Reception Standee
                    </span>
                    <h3 className="text-xl font-bold text-[#121316]">
                      Blank Self-Registration Standee
                    </h3>
                  </div>
                  <p className="text-xs text-[#6F727A] leading-relaxed">
                    Display this QR on reception tablet standees. Arriving walk-in candidates scan with their mobile camera to open an isolated blank self-registration form.
                  </p>
                  <div className="p-3.5 bg-[#FAF7F0] border border-[#E5DFD4] rounded-xl space-y-1.5 text-xs text-[#121316]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <strong>Device-Independent:</strong> Works on all iOS & Android cameras.
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#121316]" />
                      <strong>Concurrent Safe:</strong> 10+ candidates can scan simultaneously.
                    </div>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => {
                        if (onLaunchGeneralRegister) onLaunchGeneralRegister();
                      }}
                      className="px-4 py-2 bg-[#F5EB78] hover:bg-[#ebd545] text-[#121316] font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Blank Form Directly</span>
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-2xl shadow-xl border-2 border-[#121316] text-center space-y-2 max-w-xs mx-auto">
                  {generalQrDataUrl ? (
                    <img src={generalQrDataUrl} alt="WCR QR" className="w-48 h-48 mx-auto object-contain" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-[#6F727A] text-xs font-mono">
                      Generating QR...
                    </div>
                  )}
                  <p className="text-[10px] text-[#121316] font-mono font-bold">
                    Scan with Mobile Camera to Register
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCHEDULED PASSES */}
          {activeTab === 'SCHEDULED' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5DFD4]">
                <div>
                  <h3 className="text-sm font-bold text-[#121316]">Scheduled Candidate Passes</h3>
                  <p className="text-[11px] text-[#6F727A]">Pre-generated passes for scheduled interview panel</p>
                </div>
                <button
                  onClick={() => setShowNewPassForm(!showNewPassForm)}
                  className="px-3.5 py-1.5 bg-[#F5EB78] hover:bg-[#ebd545] text-[#121316] font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Scheduled Pass</span>
                </button>
              </div>

              {showNewPassForm && (
                <form onSubmit={handleCreateScheduledPass} className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#E5DFD4] space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#121316] font-semibold mb-1">Candidate Name</label>
                      <input
                        type="text"
                        value={newCandidateName}
                        onChange={(e) => setNewCandidateName(e.target.value)}
                        className="w-full p-2 bg-white border border-[#E5DFD4] rounded-xl text-[#121316] text-xs focus:border-[#121316]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#121316] font-semibold mb-1">Position</label>
                      <input
                        type="text"
                        value={newPosition}
                        onChange={(e) => setNewPosition(e.target.value)}
                        className="w-full p-2 bg-white border border-[#E5DFD4] rounded-xl text-[#121316] text-xs focus:border-[#121316]"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowNewPassForm(false)}
                      className="px-3 py-1.5 bg-white hover:bg-[#FAF7F0] text-[#121316] rounded-xl border border-[#E5DFD4]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={generating}
                      className="px-4 py-1.5 bg-[#F5EB78] hover:bg-[#ebd545] text-[#121316] font-bold rounded-xl shadow-xs"
                    >
                      {generating ? 'Generating...' : 'Issue Pass'}
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSession(s)}
                    className={`p-4 rounded-2xl border text-xs space-y-2 cursor-pointer transition ${
                      selectedSession?.id === s.id
                        ? 'bg-[#FAF7F0] border-2 border-[#121316] text-[#121316] shadow-sm'
                        : 'bg-[#FAF7F0] border-[#E5DFD4] text-[#121316] hover:border-[#121316]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-[#121316] text-sm">{s.candidateName}</strong>
                      <span className="font-mono text-[#121316] font-bold bg-[#F5EB78] px-2 py-0.5 rounded-md text-[10px]">{s.token}</span>
                    </div>
                    <p className="text-[11px] text-[#6F727A]">{s.position} &bull; {s.appointmentTime}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-[#E5DFD4] text-[10px] text-[#6F727A]">
                      <span>Interviewer: <strong className="text-[#121316]">{s.interviewerName}</strong></span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLaunchCheckIn(s.token);
                        }}
                        className="text-[#121316] hover:underline font-bold"
                      >
                        Launch Check-In &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

