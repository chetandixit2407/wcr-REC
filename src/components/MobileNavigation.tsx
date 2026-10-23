import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { smoothEase } from '../utils/motion.ts';
import {
  LayoutDashboard,
  Building2,
  Users2,
  CalendarClock,
  UserCheck,
  DoorOpen,
  Coffee,
  Bell,
  Settings,
  X,
  LogOut,
  QrCode,
  Smartphone,
  Shield,
  Award,
  Layers,
  MoreHorizontal,
} from 'lucide-react';
import type { UserRole, User as UserType } from '../types/index.ts';
import type { NavSection } from './SidebarNav.tsx';
import { useSettings } from '../context/SettingsContext.tsx';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  currentUser?: UserType | null;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenQRPasses: () => void;
  onOpenCheckIn: () => void;
  onLogout?: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onClose,
  activeSection,
  onSelectSection,
  currentRole,
  onSelectRole,
  currentUser,
  unreadCount,
  onOpenNotifications,
  onOpenQRPasses,
  onOpenCheckIn,
  onLogout,
}) => {
  const { t } = useSettings();
  const isPantry = currentRole === 'PANTRY';

  const navItems: {
    id: NavSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = isPantry
    ? [{ id: 'dashboard', label: 'Pantry Tasks', icon: Coffee }]
    : [
        { id: 'dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
        { id: 'reception', label: t('nav_reception'), icon: Building2 },
        { id: 'candidates', label: t('nav_candidates'), icon: UserCheck },
        { id: 'interviews', label: t('nav_interviews'), icon: CalendarClock },
        { id: 'more', label: 'Secondary Sections', icon: Layers },
        { id: 'visitors', label: t('nav_visitors'), icon: Users2 },
        { id: 'rooms', label: t('nav_rooms'), icon: DoorOpen },
        { id: 'hospitality', label: t('nav_hospitality'), icon: Coffee },
        { id: 'notifications', label: t('nav_notifications'), icon: Bell, badge: unreadCount },
        { id: 'settings', label: t('nav_settings'), icon: Settings },
      ];

  const allRoles: { role: UserRole; label: string; icon: any; color: string }[] = [
    { role: 'HR', label: 'HR Lead', icon: Users2, color: 'text-[#121316]' },
    { role: 'SENIOR_HR', label: 'Senior HR', icon: Award, color: 'text-[#121316]' },
    { role: 'ADMIN', label: 'Admin Ops', icon: Shield, color: 'text-[#121316]' },
    { role: 'CEO', label: 'CEO Suite', icon: Award, color: 'text-[#121316]' },
    { role: 'INTERVIEWER', label: 'Interviewer', icon: UserCheck, color: 'text-[#121316]' },
    { role: 'RECEPTION', label: 'Front Desk', icon: Building2, color: 'text-[#121316]' },
    { role: 'PANTRY', label: 'Pantry Steward', icon: Coffee, color: 'text-[#121316]' },
  ];

  return (
    <>
      {/* Mobile Crextio Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#FAF7F0] border-t border-[#E5DFD4] px-2 py-1.5 flex items-center justify-around select-none text-[#121316] shadow-sm">
        <button
          onClick={() => onSelectSection('dashboard')}
          className={`flex flex-col items-center py-1 px-3 rounded-2xl transition cursor-pointer ${
            activeSection === 'dashboard'
              ? 'bg-[#F5EB78] text-[#121316] font-bold shadow-xs'
              : 'text-[#6F727A] hover:text-[#121316]'
          }`}
        >
          {isPantry ? <Coffee className="w-4 h-4 text-[#121316]" /> : <LayoutDashboard className="w-4 h-4" />}
          <span className="text-[10px] font-semibold mt-0.5">{isPantry ? 'Pantry Tasks' : 'Dashboard'}</span>
        </button>

        {!isPantry && (
          <>
            <button
              onClick={() => onSelectSection('reception')}
              className={`flex flex-col items-center py-1 px-3 rounded-2xl transition cursor-pointer ${
                activeSection === 'reception'
                  ? 'bg-[#F5EB78] text-[#121316] font-bold shadow-xs'
                  : 'text-[#6F727A] hover:text-[#121316]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="text-[10px] font-semibold mt-0.5">Reception</span>
            </button>

            <button
              onClick={onOpenQRPasses}
              className="flex flex-col items-center py-1 px-3 rounded-2xl text-[#121316] font-bold cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-[#121316] text-[#F5EB78] flex items-center justify-center -mt-2.5 shadow-xs">
                <QrCode className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold mt-0.5">QR Pass</span>
            </button>

            <button
              onClick={() => onSelectSection('candidates')}
              className={`flex flex-col items-center py-1 px-3 rounded-2xl transition cursor-pointer ${
                activeSection === 'candidates'
                  ? 'bg-[#F5EB78] text-[#121316] font-bold shadow-xs'
                  : 'text-[#6F727A] hover:text-[#121316]'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span className="text-[10px] font-semibold mt-0.5">Candidates</span>
            </button>

            <button
              onClick={() => onSelectSection('more')}
              className={`flex flex-col items-center py-1 px-3 rounded-2xl transition cursor-pointer ${
                activeSection === 'more'
                  ? 'bg-[#F5EB78] text-[#121316] font-bold shadow-xs'
                  : 'text-[#6F727A] hover:text-[#121316]'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
              <span className="text-[10px] font-semibold mt-0.5">More</span>
            </button>
          </>
        )}
      </nav>

      {/* Mobile Drawer (When Open) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: smoothEase }}
              onClick={onClose}
              className="absolute inset-0 bg-[#121316]/40 backdrop-blur-md"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.28, ease: smoothEase }}
              className="relative w-72 max-w-[85vw] h-full bg-[#FAF7F0] text-[#121316] p-4 flex flex-col border-r border-[#E5DFD4] z-10 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#EAE5DB]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#121316] text-[#F5EB78] flex items-center justify-center font-black text-xs shadow-xs">
                    WCR
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#121316]">White Collar Realty</h3>
                    <p className="text-[10px] text-[#6F727A] font-mono">Operations Console</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-[#121316] hover:bg-[#EFEAE0] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="flex-1 py-3.5 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectSection(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                        isActive
                          ? 'bg-[#F5EB78] text-[#121316] font-bold shadow-xs'
                          : 'text-[#6F727A] hover:text-[#121316] hover:bg-[#EFEAE0]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#121316]' : 'text-[#6F727A]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#121316] text-white text-[10px] font-bold">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* HR Sub-Profiles Section */}
                {!isPantry && (
                  <div className="pt-3 border-t border-[#EAE5DB] space-y-1">
                    <div className="text-[10px] font-bold text-[#6F727A] px-3 py-1 uppercase tracking-wider font-mono">
                      HR Workspaces
                    </div>
                    <button
                      onClick={() => {
                        onSelectSection('hr-nisha');
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                        activeSection === 'hr-nisha'
                          ? 'bg-[#F5EB78] text-[#121316] font-bold'
                          : 'text-[#6F727A] hover:text-[#121316] hover:bg-[#EFEAE0]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-lg bg-[#121316] text-[#F5EB78] font-bold text-[10px] flex items-center justify-center">
                          N
                        </div>
                        <span className="font-semibold">Nisha (Senior HR)</span>
                      </div>
                      <span className="text-[10px] text-[#6F727A] font-mono">Queue</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectSection('hr-shriyanshi');
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                        activeSection === 'hr-shriyanshi'
                          ? 'bg-[#F5EB78] text-[#121316] font-bold'
                          : 'text-[#6F727A] hover:text-[#121316] hover:bg-[#EFEAE0]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-lg bg-[#121316] text-[#F5EB78] font-bold text-[10px] flex items-center justify-center">
                          S
                        </div>
                        <span className="font-semibold">Shriyanshi (Intake HR)</span>
                      </div>
                      <span className="text-[10px] text-[#6F727A] font-mono">Queue</span>
                    </button>
                  </div>
                )}

                <div className="pt-3 border-t border-[#EAE5DB]">
                  <div className="text-[10px] font-bold text-[#6F727A] px-3 py-1 uppercase tracking-wider">
                    Role Views
                  </div>
                  {allRoles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        onSelectRole(r.role);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                        currentRole === r.role
                          ? 'bg-[#F5EB78] text-[#121316] font-bold'
                          : 'text-[#6F727A] hover:text-[#121316] hover:bg-[#EFEAE0]'
                      }`}
                    >
                      <r.icon className="w-4 h-4 text-[#121316]" />
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* User Logout */}
              {currentUser && (
                <div className="pt-3 border-t border-[#EAE5DB] flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-[#121316] truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-[#6F727A] font-mono truncate">{currentUser.role}</p>
                  </div>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="p-1.5 rounded-lg text-[#6F727A] hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
