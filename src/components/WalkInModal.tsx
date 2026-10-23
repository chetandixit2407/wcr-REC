import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2, RefreshCw } from 'lucide-react';
import type { VisitorType } from '../types/index.ts';
import { STAFF_HOST_OPTIONS, validatePersonName, validateIndianMobile } from '../utils/registrationConfig.ts';

interface WalkInModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const WalkInModal: React.FC<WalkInModalProps> = ({ onClose, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [visitorType, setVisitorType] = useState<VisitorType>('CLIENT');
  const [selectedHostId, setSelectedHostId] = useState('usr-sales-vikram');
  const [purpose, setPurpose] = useState('Commercial Property Investment Discussion');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameValidation = validatePersonName(fullName);
    if (!nameValidation.isValid) {
      setError(nameValidation.error || 'Please enter a valid visitor name.');
      return;
    }

    const phoneValidation = validateIndianMobile(phone);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || 'Please enter a valid 10-digit mobile number.');
      return;
    }

    const hostObj = STAFF_HOST_OPTIONS.find((h) => h.id === selectedHostId) || STAFF_HOST_OPTIONS[0];

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/walkin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          company: company.trim(),
          visitorType,
          hostName: hostObj.name,
          hostDepartment: hostObj.department,
          hostId: hostObj.id,
          purpose: purpose.trim() || 'Visitor Consultation',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to register visitor');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121316]/40 backdrop-blur-md p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-[#E5DFD4] rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl text-[#121316] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-6 border-b border-[#E5DFD4] flex items-center justify-between bg-[#FAF7F0] shrink-0">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F727A] block truncate font-mono">
              Front Desk Quick Intake
            </span>
            <h2 className="text-base sm:text-lg font-bold text-[#121316] mt-0.5 truncate">Register Walk-in Visitor / Client</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#6F727A] hover:text-[#121316] hover:bg-[#ECE6DC] border border-[#E5DFD4] transition shrink-0 cursor-pointer shadow-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#121316] mb-1">
                Visitor Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#E5DFD4] rounded-xl text-[#121316] text-xs focus:outline-hidden focus:border-[#F5EB78] shadow-xs"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-[#121316] mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#E5DFD4] rounded-xl text-[#121316] text-xs focus:outline-hidden focus:border-[#F5EB78] shadow-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#121316] mb-1">Company / Organization</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Apex Investments"
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#E5DFD4] rounded-xl text-[#121316] text-xs focus:outline-hidden focus:border-[#F5EB78] shadow-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#121316] mb-1">Visitor Category</label>
              <select
                value={visitorType}
                onChange={(e) => setVisitorType(e.target.value as VisitorType)}
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#E5DFD4] rounded-xl text-[#121316] text-xs focus:outline-hidden focus:border-[#F5EB78] shadow-xs"
              >
                <option value="CLIENT">Client / High-Net-Worth Investor</option>
                <option value="VENDOR">Vendor / Partner</option>
                <option value="WALK_IN">General Walk-in Candidate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#121316] mb-1">
                Meeting Host (WCR Staff) <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedHostId}
                onChange={(e) => setSelectedHostId(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#E5DFD4] rounded-xl text-[#121316] text-xs focus:outline-hidden focus:border-[#F5EB78] shadow-xs"
              >
                {STAFF_HOST_OPTIONS.map((host) => (
                  <option key={host.id} value={host.id}>
                    {host.name} ({host.department})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#121316] mb-1">Purpose of Visit</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Contract Signing"
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#E5DFD4] rounded-xl text-[#121316] text-xs focus:outline-hidden focus:border-[#F5EB78] shadow-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5DFD4] flex flex-wrap justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#FAF7F0] hover:bg-[#ECE6DC] text-[#121316] rounded-xl border border-[#E5DFD4] font-semibold cursor-pointer shadow-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 sm:px-5 py-2.5 bg-[#F5EB78] hover:bg-[#ebd545] text-[#121316] font-extrabold rounded-xl border border-[#E5DFD4] shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  Check In Visitor
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
