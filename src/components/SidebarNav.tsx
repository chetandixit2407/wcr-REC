import React, { useState, useEffect, useRef } from 'react';
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
  Shield,
  Award,
  ChevronDown,
  LogOut,
  QrCode,
  UserPlus,
  Sparkles,
  Layers,
  MoreHorizontal,
  User,
} from 'lucide-react';
import type { UserRole, User as UserType } from '../types/index.ts';
import { useSettings } from '../context/SettingsContext.tsx';

export type NavSection =
  | 'dashboard'
  | 'reception'
  | 'visitors'
  | 'interviews'
  | 'candidates'
  | 'rooms'
  | 'hospitality'
  | 'notifications'
  | 'settings'
  | 'more'
  | 'hr-nisha'
  | 'hr-shriyanshi';

interface SidebarNavProps {
  currentRole: UserRole;
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onSelectRole: (role: UserRole) => void;
  currentUser?: UserType | null;
  unreadCount: number;
  unreadChatCount?: number;
  isRealtimeConnected: boolean;
  connectionStatus?: 'connected' | 'reconnecting' | 'disconnected' | 'connecting';
  onReconnectRealtime?: () => void;
  onOpenNotifications: () => void;
  onOpenQRPasses: () => void;
  onOpenWalkIn?: () => void;
  onOpenBlankRegister: () => void;
  onLogout?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentRole,
  activeSection,
  onSelectSection,
  onSelectRole,
  currentUser,
  unreadCount,
  unreadChatCount = 0,
  isRealtimeConnected,
  connectionStatus,
  onReconnectRealtime,
  onOpenNotifications,
  onOpenQRPasses,
  onOpenWalkIn,
  onOpenBlankRegister,
  onLogout,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const { t } = useSettings();

  const effectiveStatus = connectionStatus || (isRealtimeConnected ? 'connected' : 'reconnecting');

  // Close More menu on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMoreMenuOpen(false);
        setRoleDropdownOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMoreMenuOpen]);

  const isPantry = currentRole === 'PANTRY';

  // Primary navigation items
  const primaryNavItems: {
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
      ];

  // Secondary items housed under "More"
  const secondaryNavItems: {
    id: NavSection;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = isPantry
    ? []
    : [
        {
          id: 'more',
          label: 'Secondary Sections',
          description: 'Lounge, Active Meetings & Check-Out',
          icon: Layers,
        },
        {
          id: 'visitors',
          label: t('nav_visitors'),
          description: 'Client & vendor logs',
          icon: Users2,
        },
        {
          id: 'rooms',
          label: t('nav_rooms'),
          description: 'Facility & room monitor',
          icon: DoorOpen,
        },
        {
          id: 'hospitality',
          label: t('nav_hospitality'),
          description: 'Pantry beverage steward',
          icon: Coffee,
        },
        {
          id: 'notifications',
          label: t('nav_notifications'),
          description: 'System & intake alerts',
          icon: Bell,
          badge: unreadCount,
        },
      ];

  const isSecondaryActive = secondaryNavItems.some((item) => item.id === activeSection);
  const activeSecondaryItem = secondaryNavItems.find((item) => item.id === activeSection);

  const allRoles: { role: UserRole; label: string; icon: any; color: string }[] = [
    { role: 'HR', label: 'HR Lead', icon: Users2, color: 'text-[#121316]' },
    { role: 'SENIOR_HR', label: 'Senior HR', icon: Award, color: 'text-[#121316]' },
    { role: 'ADMIN', label: 'Admin Ops', icon: Shield, color: 'text-[#121316]' },
    { role: 'CEO', label: 'CEO Suite', icon: Award, color: 'text-[#121316]' },
    { role: 'INTERVIEWER', label: 'Interviewer', icon: UserCheck, color: 'text-[#121316]' },
    { role: 'RECEPTION', label: 'Front Desk', icon: Building2, color: 'text-[#121316]' },
    { role: 'PANTRY', label: 'Pantry Steward', icon: Coffee, color: 'text-[#121316]' },
  ];

  const canSwitchViews =
    !currentUser ||
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'CEO' ||
    currentUser.role === 'CO_FOUNDER';

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-[100dvh] fixed top-0 left-0 z-30 bg-[#FAF7F0] border-r border-[#E5DFD4] select-none text-[#121316]">
      <div className="flex-1 flex flex-col p-4 bg-transparent relative overflow-hidden">
        {/* Brand Block (Crextio High-Contrast Minimalist Lockup) */}
        <div className="px-1 py-2.5 border-b border-[#EAE5DB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-[#121316] text-[#F5EB78] flex items-center justify-center font-extrabold text-xs shadow-xs tracking-wider border border-[#121316]">
                WCR
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#FAF7F0]" />
            </div>
            <div>
              <span className="font-bold text-[#121316] text-xs tracking-tight block">
                White Collar Realty
              </span>
              <span className="text-[10px] text-[#6F727A] font-medium tracking-wide block">
                {t('app_subbrand')}
              </span>
            </div>
          </div>

          {/* Real-time Status Indicator */}
          <button
            type="button"
            onClick={effectiveStatus === 'disconnected' ? onReconnectRealtime : undefined}
            disabled={effectiveStatus !== 'disconnected'}
            aria-label="Real-time Connection Status"
            className={`w-2.5 h-2.5 rounded-full transition ${
              effectiveStatus === 'connected'
                ? 'bg-emerald-500 cursor-default'
                : effectiveStatus === 'reconnecting' || effectiveStatus === 'connecting'
                ? 'bg-[#F5EB78] animate-ping cursor-wait'
                : 'bg-rose-500 cursor-pointer hover:scale-125 ring-2 ring-rose-400/40'
            }`}
            title={
              effectiveStatus === 'connected'
                ? t('app_live_synced')
                : effectiveStatus === 'reconnecting' || effectiveStatus === 'connecting'
                ? t('app_reconnecting')
                : `${t('app_disconnected')} (Click to retry)`
            }
          />
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto">
          {/* Primary Nav Items */}
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id)}
                className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-[#F5EB78] text-[#121316] font-bold shadow-xs'
                    : 'text-[#6F727A] hover:text-[#121316] hover:bg-[#EFEAE0]'
                }`}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#121316]' : 'text-[#6F727A] group-hover:text-[#121316]'
                    }`}
                  />
                  <span className="tracking-tight">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className="relative z-10 px-2 py-0.5 rounded-full bg-[#121316] text-white font-bold text-[10px] tabular-nums">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* More Menu Dropdown Anchor */}
          {!isPantry && secondaryNavItems.length > 0 && (
            <div className="relative pt-1" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                aria-expanded={isMoreMenuOpen}
                aria-haspopup="true"
                className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isSecondaryActive
                    ? 'bg-[#F5EB78] text-[#121316] font-bold shadow-xs'
                    : isMoreMenuOpen
                    ? 'bg-[#EFEAE0] text-[#121316]'
                    : 'text-[#6F727A] hover:text-[#121316] hover:bg-[#EFEAE0]'
                }`}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <MoreHorizontal
                    className={`w-4 h-4 transition-colors ${
                      isSecondaryActive ? 'text-[#121316]' : 'text-[#6F727A]'
                    }`}
                  />
                  <span className="tracking-tight">
                    {isSecondaryActive && activeSecondaryItem
                      ? `${t('btn_more')}: ${activeSecondaryItem.label}`
                      : t('btn_more')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 relative z-10">
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#121316] text-white font-bold text-[10px] tabular-nums">
                      {unreadCount}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#6F727A] transition-transform duration-200 ${
                      isMoreMenuOpen ? 'rotate-180 text-[#121316]' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Expandable More Dropdown Panel */}
              <AnimatePresence>
                {isMoreMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: smoothEase }}
                    role="menu"
                    className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E5DFD4] rounded-2xl shadow-xl p-1.5 z-50 space-y-1 text-[#121316]"
                  >
                    <div className="text-[10px] font-bold text-[#6F727A] px-2.5 py-1 uppercase tracking-wider">
                      Additional Sections
                    </div>

                    {secondaryNavItems.map((sec) => {
                      const SecIcon = sec.icon;
                      const isSecActive = activeSection === sec.id;
                      return (
                        <button
                          key={sec.id}
                          role="menuitem"
                          onClick={() => {
                            if (sec.id === 'notifications') {
                              onOpenNotifications();
                            } else {
                              onSelectSection(sec.id);
                            }
                            setIsMoreMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer text-left ${
                            isSecActive
                              ? 'bg-[#F5EB78] text-[#121316] font-bold'
                              : 'text-[#6F727A] hover:text-[#121316] hover:bg-[#FAF8F5]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <SecIcon
                              className={`w-4 h-4 ${
                                isSecActive ? 'text-[#121316]' : 'text-[#6F727A]'
                              }`}
                            />
                            <div>
                              <div className="leading-tight font-semibold">{sec.label}</div>
                              <div className="text-[10px] text-[#6F727A]">{sec.description}</div>
                            </div>
                          </div>

                          {sec.badge !== undefined && sec.badge > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-[#121316] text-white font-bold text-[10px]">
                              {sec.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* HR Sub-Profiles Section */}
          {!isPantry && (
            <div className="pt-3 border-t border-[#EAE5DB] my-2 space-y-1">
              <div className="px-3 py-1 flex items-center justify-between text-[10px] font-bold text-[#6F727A] tracking-wider uppercase font-mono">
                <span>HR Workspaces</span>
                <span className="text-[9px] text-[#6F727A] font-normal">Dedicated</span>
              </div>

              {/* Profile 1: Nisha */}
              <button
                onClick={() => onSelectSection('hr-nisha')}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs transition-all group cursor-pointer ${
                  activeSection === 'hr-nisha'
                    ? 'bg-[#F5EB78] text-[#121316] font-bold shadow-xs'
                    : 'text-[#6F727A] hover:text-[#121316] hover:bg-[#EFEAE0]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black ${
                      activeSection === 'hr-nisha'
                        ? 'bg-[#121316] text-[#F5EB78]'
                        : 'bg-[#EAE5DB] text-[#121316]'
                    }`}
                  >
                    N
                  </div>
                  <div className="text-left">
                    <div className="tracking-tight leading-tight font-semibold">Nisha</div>
                    <div className="text-[10px] text-[#6F727A]">Sr. HR Manager</div>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/70 text-[#121316] border border-[#E5DFD4] font-mono">
                  Queue
                </span>
              </button>

              {/* Profile 2: Shriyanshi */}
              <button
                onClick={() => onSelectSection('hr-shriyanshi')}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs transition-all group cursor-pointer ${
                  activeSection === 'hr-shriyanshi'
                    ? 'bg-[#F5EB78] text-[#121316] font-bold shadow-xs'
                    : 'text-[#6F727A] hover:text-[#121316] hover:bg-[#EFEAE0]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black ${
                      activeSection === 'hr-shriyanshi'
                        ? 'bg-[#121316] text-[#F5EB78]'
                        : 'bg-[#EAE5DB] text-[#121316]'
                    }`}
                  >
                    S
                  </div>
                  <div className="text-left">
                    <div className="tracking-tight leading-tight font-semibold">Shriyanshi</div>
                    <div className="text-[10px] text-[#6F727A]">HR Executive</div>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/70 text-[#121316] border border-[#E5DFD4] font-mono">
                  Queue
                </span>
              </button>
            </div>
          )}

          {/* Settings Section */}
          <div className="pt-1">
            <button
              onClick={() => onSelectSection('settings')}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs transition-all group cursor-pointer ${
                activeSection === 'settings'
                  ? 'bg-[#F5EB78] text-[#121316] font-bold shadow-xs'
                  : 'text-[#6F727A] hover:text-[#121316] hover:bg-[#EFEAE0]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings
                  className={`w-4 h-4 transition-colors ${
                    activeSection === 'settings'
                      ? 'text-[#121316]'
                      : 'text-[#6F727A] group-hover:text-[#121316]'
                  }`}
                />
                <span className="tracking-tight font-medium">{t('nav_settings')}</span>
              </div>
            </button>
          </div>
        </nav>

        {/* Quick Launch Terminals */}
        {!isPantry && (
          <div className="py-3 border-t border-[#EAE5DB] space-y-2">
            <button
              onClick={onOpenQRPasses}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E5DFD4] text-[#121316] text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <QrCode className="w-3.5 h-3.5 text-[#121316]" />
              <span className="truncate">{t('btn_qr_standee')}</span>
            </button>

            <button
              onClick={onOpenBlankRegister}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#F5EB78] hover:bg-[#EFE463] border border-[#E8DC5F] text-[#121316] text-xs font-bold transition cursor-pointer shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#121316]" />
              <span className="truncate">{t('btn_blank_register')}</span>
            </button>
          </div>
        )}

        {/* Role Switcher & User Profile */}
        <div className="pt-3 border-t border-[#EAE5DB] relative">
          {canSwitchViews && (
            <div className="mb-2 relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E5DFD4] text-[11px] font-semibold text-[#121316] transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <Shield className="w-3.5 h-3.5 text-[#121316] shrink-0" />
                  <span className="truncate">Role: {currentRole}</span>
                </div>
                <ChevronDown className="w-3 h-3 text-[#6F727A] shrink-0" />
              </button>

              <AnimatePresence>
                {roleDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: smoothEase }}
                    className="absolute bottom-full left-0 right-0 mb-1.5 bg-white rounded-2xl p-1.5 z-50 border border-[#E5DFD4] shadow-2xl max-h-56 overflow-y-auto text-[#121316]"
                  >
                    <div className="text-[10px] font-bold text-[#6F727A] px-2.5 py-1 uppercase tracking-wider">
                      {t('btn_switch_role')}
                    </div>
                    {allRoles.map((r) => (
                      <button
                        key={r.role}
                        onClick={() => {
                          onSelectRole(r.role);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition text-left cursor-pointer ${
                          currentRole === r.role
                            ? 'bg-[#F5EB78] text-[#121316] font-bold'
                            : 'text-[#6F727A] hover:text-[#121316] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <r.icon className="w-3.5 h-3.5 text-[#121316]" />
                        <span>{r.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* User Profile Block */}
          {currentUser && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E5DFD4] shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-lg bg-[#F5EB78] text-[#121316] font-bold text-xs flex items-center justify-center shrink-0 border border-[#E8DC5F] shadow-xs">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#121316] truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-[#383B42] font-mono truncate">{currentUser.role}</p>
                </div>
              </div>


              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-[#6F727A] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title={t('btn_sign_out')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
