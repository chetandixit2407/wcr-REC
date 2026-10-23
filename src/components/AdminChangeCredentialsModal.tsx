import React, { useState } from 'react';
import {
  KeyRound,
  User,
  Mail,
  Shield,
  Briefcase,
  Building,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Link,
  Copy,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import type { UserRole } from '../types/index.ts';

interface AdminChangeCredentialsModalProps {
  targetUser: {
    id: string;
    userId?: string;
    name: string;
    email: string;
    username?: string;
    role: UserRole;
    designation?: string;
    department: string;
    isActive: boolean;
    phone?: string;
  };
  adminUserId?: string;
  adminName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminChangeCredentialsModal: React.FC<AdminChangeCredentialsModalProps> = ({
  targetUser,
  adminUserId = 'usr-admin-sameer',
  adminName = 'Sameer Sir (Admin)',
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: targetUser.name || '',
    username: targetUser.username || targetUser.email.split('@')[0],
    email: targetUser.email || '',
    newPassword: '',
    role: targetUser.role || 'HR',
    department: targetUser.department || '',
    designation: targetUser.designation || '',
    phone: targetUser.phone || '',
    isActive: targetUser.isActive !== false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [generatingLink, setGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const rolesList: { role: UserRole; label: string; desc: string }[] = [
    { role: 'CEO', label: 'CEO (Lalit Sir)', desc: 'Executive / Full Operational Access' },
    { role: 'CO_FOUNDER', label: 'CO-Founder (Kimmi Mam)', desc: 'Executive / Full Operational Access' },
    { role: 'ADMIN', label: 'Admin (Sameer Sir)', desc: 'Full System & User Control' },
    { role: 'HR', label: 'HR Executive', desc: 'Recruitment & Interviews' },
    { role: 'INTERVIEWER', label: 'Interviewer', desc: 'Panel & Candidate Feedback' },
    { role: 'RECEPTION', label: 'Reception & Escort', desc: 'Front Desk Check-in & Photos' },
    { role: 'PANTRY', label: 'Pantry Steward', desc: 'Hospitality & Room Prep Tasks' },
  ];

  const handleGenerateResetLink = async () => {
    setGeneratingLink(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: targetUser.email }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.request?.resetLink) {
        // Also automatically approve it since Admin generated it!
        await fetch(`/api/admin/password-resets/${data.request.id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminUserId,
            adminName,
            role: 'ADMIN',
          }),
        });

        const fullUrl = `${window.location.origin}${data.request.resetLink}`;
        setGeneratedLink(fullUrl);
      } else {
        setError(data.error || 'Could not generate reset link.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error.');
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/change-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId,
          adminName,
          adminRole: 'ADMIN',
          newName: formData.name,
          newUsername: formData.username,
          newEmail: formData.email,
          newPassword: formData.newPassword ? formData.newPassword : undefined,
          newRole: formData.role,
          newDepartment: formData.department,
          newDesignation: formData.designation,
          newPhone: formData.phone,
          isActive: formData.isActive,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(data.message || 'Credentials updated successfully.');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        setError(data.error || 'Failed to update user credentials.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121316]/40 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-[#E5DFD4] rounded-3xl max-w-xl w-full p-6 sm:p-8 text-[#121316] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-[#FAF7F0] hover:bg-[#ECE6DC] text-[#6F727A] hover:text-[#121316] border border-[#E5DFD4] transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#E5DFD4] shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-[#F5EB78] border border-[#E5DFD4] flex items-center justify-center text-[#121316] shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#121316] tracking-tight flex items-center gap-2">
              <span>Change ID & Password (Full Access)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F5EB78] text-[#121316] border border-[#E5DFD4]">
                Admin Control
              </span>
            </h2>
            <p className="text-xs text-[#6F727A]">
              Direct Administrative Override for <strong className="text-[#121316]">{targetUser.name}</strong>
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 py-4 space-y-4 pr-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Quick Action: Instant Reset Link */}
          <div className="p-3.5 bg-[#FAF7F0] border border-[#E5DFD4] rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#121316] flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-[#121316]" />
                <span>Instant Reset Link Generator</span>
              </span>
              <button
                type="button"
                onClick={handleGenerateResetLink}
                disabled={generatingLink}
                className="px-3 py-1 bg-[#F5EB78] hover:bg-[#ebd545] border border-[#E5DFD4] text-[#121316] font-bold text-[11px] rounded-xl transition cursor-pointer flex items-center gap-1 shadow-xs"
              >
                {generatingLink ? 'Generating...' : 'Generate Direct Link'}
              </button>
            </div>
            {generatedLink && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] text-emerald-700 font-medium">Link generated & pre-approved by Admin:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    className="flex-1 px-3 py-1.5 bg-white border border-[#E5DFD4] rounded-xl font-mono text-[11px] text-[#121316] select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-white hover:bg-[#ECE6DC] text-[#121316] text-xs rounded-xl border border-[#E5DFD4] transition flex items-center gap-1 shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <form id="admin-credentials-form" onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Full Name & Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#121316] mb-1">
                  Staff Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#E5DFD4] rounded-xl text-[#121316] focus:outline-hidden focus:border-[#F5EB78] transition shadow-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#121316] mb-1">
                  Staff Username / ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#E5DFD4] rounded-xl text-[#121316] font-mono focus:outline-hidden focus:border-[#F5EB78] transition shadow-xs"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#121316] mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#E5DFD4] rounded-xl text-[#121316] focus:outline-hidden focus:border-[#F5EB78] transition shadow-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#121316] mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98100 00000"
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#E5DFD4] rounded-xl text-[#121316] focus:outline-hidden focus:border-[#F5EB78] transition shadow-xs"
                />
              </div>
            </div>

            {/* DIRECT PASSWORD OVERRIDE */}
            <div className="p-3.5 bg-[#F5EB78]/20 border border-[#F5EB78]/40 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-[#121316]">
                  Set New Password Directly (Admin Override)
                </label>
                <span className="text-[10px] text-[#6F727A]">Leave blank to keep current</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6F727A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Enter new password (e.g. wcr123 or strong pass)"
                  className="w-full pl-9 pr-10 py-2 bg-white border border-[#E5DFD4] rounded-xl text-[#121316] placeholder-[#6F727A] focus:outline-hidden focus:border-[#F5EB78] transition shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F727A] hover:text-[#121316]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#121316] mb-1">
                  Assigned User Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#E5DFD4] rounded-xl text-[#121316] focus:outline-hidden focus:border-[#F5EB78] transition shadow-xs"
                >
                  {rolesList.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#121316] mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. HR, Sales, Administration"
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#E5DFD4] rounded-xl text-[#121316] focus:outline-hidden focus:border-[#F5EB78] transition shadow-xs"
                />
              </div>
            </div>

            {/* Designation & Account Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block font-semibold text-[#121316] mb-1">
                  Designation / Title
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g. Senior HR Manager"
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#E5DFD4] rounded-xl text-[#121316] focus:outline-hidden focus:border-[#F5EB78] transition shadow-xs"
                />
              </div>

              <div className="pt-4 sm:pt-0">
                <label className="block font-semibold text-[#121316] mb-1">
                  Account Status
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`w-full py-2 px-3 rounded-xl border flex items-center justify-between transition shadow-xs ${
                    formData.isActive
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  <span className="font-bold">
                    {formData.isActive ? 'Active (Enabled)' : 'Deactivated (Locked)'}
                  </span>
                  {formData.isActive ? (
                    <ToggleRight className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-rose-600" />
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-[#E5DFD4] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#FAF7F0] hover:bg-[#ECE6DC] text-[#121316] font-semibold text-xs rounded-xl border border-[#E5DFD4] transition shadow-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="admin-credentials-form"
            disabled={loading}
            className="px-5 py-2 bg-[#F5EB78] hover:bg-[#ebd545] text-[#121316] font-extrabold text-xs rounded-xl shadow-sm border border-[#E5DFD4] transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-[#121316] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Shield className="w-3.5 h-3.5" />
                <span>Save Credentials & Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
