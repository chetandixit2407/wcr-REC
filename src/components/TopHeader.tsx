import React from 'react';
import {
  Bell,
  MessageSquare,
  QrCode,
  UserCheck,
  Building,
  Menu,
  Shield,
  Search,
  Wifi,
  Sparkles,
  Smartphone,
  X,
  MoreHorizontal,
  Coffee,
  Clock,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { UserRole } from '../types/index.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { unlockSpeechSynthesis } from '../utils/voiceAlertService.ts';

export interface OpenPanelItem {
  id: string;
  label: string;
  onClose: () => void;
}

interface TopHeaderProps {
  pageTitle?: string;
  currentRole: UserRole;
  unreadCount: number;
  unreadChatCount?: number;
  isRealtimeConnected: boolean;
  connectionStatus?: 'connected' | 'reconnecting' | 'disconnected' | 'connecting';
  onReconnectRealtime?: () => void;
  openPanels?: OpenPanelItem[];
  onOpenNotifications: () => void;
  onOpenChat: () => void;
  onOpenQRPasses: () => void;
  onOpenCheckIn: () => void;
  onOpenWalkIn?: () => void;
  onToggleMobileMenu?: () => void;
  onOpenMore?: () => void;
  isMoreActive?: boolean;
  onOpenCreatePantryTask?: () => void;
  onOpenPantryMonitor?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  pageTitle = 'Operations Command Center',
  currentRole,
  unreadCount,
  unreadChatCount = 0,
  isRealtimeConnected,
  connectionStatus,
  onReconnectRealtime,
  openPanels = [],
  onOpenNotifications,
  onOpenChat,
  onOpenQRPasses,
  onOpenCheckIn,
  onOpenWalkIn,
  onToggleMobileMenu,
  onOpenMore,
  isMoreActive = false,
  onOpenCreatePantryTask,
  onOpenPantryMonitor,
}) => {
  const { t, settings, updateSettings } = useSettings();

  const effectiveStatus = connectionStatus || (isRealtimeConnected ? 'connected' : 'reconnecting');

  return (
    <header className="sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 border-b border-[#E5DFD4] bg-[#FAF7F0]/90 backdrop-blur-md transition-all shadow-xs text-[#121316]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-6">
        {/* Left: Mobile trigger & Page Context */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2.5 rounded-xl bg-white border border-[#E5DFD4] text-[#121316] hover:bg-[#FAF8F5] transition cursor-pointer shadow-xs shrink-0"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="space-y-0.5 min-w-0">
            <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-[#121316] tracking-tight leading-snug truncate">
              {pageTitle}
            </h1>
            <p className="text-xs text-[#6F727A] hidden md:block truncate">
              White Collar Realty Operations &middot; Workspace: <strong className="text-[#121316] font-bold">{currentRole}</strong>
            </p>
          </div>
        </div>

        {/* Right: Quick Terminals & Communications */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Real-time Connection Capsule */}
          <button
            type="button"
            onClick={effectiveStatus === 'disconnected' ? onReconnectRealtime : undefined}
            disabled={effectiveStatus !== 'disconnected'}
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition select-none ${
              effectiveStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 cursor-default'
                : effectiveStatus === 'reconnecting' || effectiveStatus === 'connecting'
                ? 'bg-[#FDFBC9] text-[#121316] border-[#EADB5F] cursor-wait'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 cursor-pointer'
            }`}
            title={
              effectiveStatus === 'connected'
                ? 'Realtime stream connected and confirmed active'
                : effectiveStatus === 'reconnecting' || effectiveStatus === 'connecting'
                ? 'Attempting to establish realtime connection...'
                : 'Realtime stream disconnected. Click to reconnect.'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                effectiveStatus === 'connected'
                  ? 'bg-emerald-500'
                  : effectiveStatus === 'reconnecting' || effectiveStatus === 'connecting'
                  ? 'bg-[#EADB5F] animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <span>
              {effectiveStatus === 'connected'
                ? t('app_live_realtime')
                : effectiveStatus === 'reconnecting' || effectiveStatus === 'connecting'
                ? t('app_reconnecting')
                : `${t('app_disconnected')} ↻`}
            </span>
          </button>

          {/* Explicit Voice Alerts Control */}
          <button
            type="button"
            onClick={() => {
              const nextState = !settings.voiceAlerts;
              updateSettings({ voiceAlerts: nextState });
              if (nextState) {
                unlockSpeechSynthesis();
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer select-none ${
              settings.voiceAlerts
                ? 'bg-[#F5EB78] text-[#121316] border-[#E8DC5F] hover:bg-[#EFE463] shadow-xs'
                : 'bg-white text-[#383B42] border-[#E5DFD4] hover:bg-[#FAF8F5] hover:text-[#121316]'
            }`}
            title={
              settings.voiceAlerts
                ? 'Voice Alerts: ACTIVE. Spoken alerts will play exclusively on your device when a visitor or candidate arrives to meet you. Click to mute.'
                : 'Voice Alerts: MUTED. Click to enable spoken arrival alerts for your account.'
            }
          >
            {settings.voiceAlerts ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#121316]" />
                <span className="hidden sm:inline font-bold">Voice: On</span>
                <span className="sm:hidden font-bold">Voice</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-[#383B42]" />
                <span className="hidden sm:inline font-medium">Voice: Muted</span>
                <span className="sm:hidden font-medium">Muted</span>
              </>
            )}
          </button>


          {/* Quick Intake Button */}
          {currentRole !== 'PANTRY' && (
            <button
              onClick={onOpenCheckIn}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E5DFD4] text-[#121316] font-semibold text-xs sm:text-[13px] transition cursor-pointer shadow-xs"
              title="Candidate Self Check-In Form"
            >
              <Smartphone className="w-4 h-4 text-[#121316]" />
              <span>Check-In</span>
            </button>
          )}

          {/* QR Station */}
          {currentRole !== 'PANTRY' && (
            <button
              onClick={onOpenQRPasses}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E5DFD4] text-[#121316] font-medium text-xs sm:text-[13px] transition cursor-pointer shadow-xs"
              title="WCR QR Codes & Passes"
            >
              <QrCode className="w-4 h-4 text-[#121316]" />
              <span>QR Station</span>
            </button>
          )}

          {/* Create Pantry Task */}
          {onOpenCreatePantryTask && currentRole !== 'PANTRY' && (
            <button
              onClick={onOpenCreatePantryTask}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F5EB78] hover:bg-[#EFE463] border border-[#E8DC5F] text-[#121316] font-bold text-xs sm:text-[13px] transition cursor-pointer shadow-xs"
              title="Create Pantry or Hospitality Task"
            >
              <Coffee className="w-4 h-4 text-[#121316]" />
              <span>+ Pantry Task</span>
            </button>
          )}

          {/* Pantry Realtime Monitor */}
          {onOpenPantryMonitor && (currentRole === 'ADMIN' || currentRole === 'CEO' || currentRole === 'HR' || currentRole === 'SENIOR_HR') && (
            <button
              onClick={onOpenPantryMonitor}
              className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E5DFD4] text-[#121316] font-medium text-xs sm:text-[13px] transition cursor-pointer shadow-xs"
              title="Pantry Live Progress Monitor"
            >
              <Clock className="w-4 h-4 text-[#121316]" />
              <span>Pantry Monitor</span>
            </button>
          )}

          {/* More Navigation Button */}
          {onOpenMore && currentRole !== 'PANTRY' && (
            <button
              onClick={onOpenMore}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-[13px] font-semibold transition cursor-pointer shadow-xs ${
                isMoreActive
                  ? 'bg-[#121316] text-white border-[#121316] font-bold shadow-xs'
                  : 'bg-white hover:bg-[#FAF8F5] border-[#E5DFD4] text-[#121316]'
              }`}
              title="Secondary Dashboard Sections"
            >
              <MoreHorizontal className="w-4 h-4" />
              <span>More</span>
            </button>
          )}

          {/* Office Internal Chat */}
          <button
            onClick={onOpenChat}
            className="relative p-2 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E5DFD4] text-[#121316] transition cursor-pointer flex items-center gap-2 shadow-xs"
            title="Internal Office Chat"
          >
            <MessageSquare className="w-4.5 h-4.5 text-[#121316]" />
            <span className="hidden xl:inline text-xs sm:text-[13px] font-semibold">Chat</span>
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#121316] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
              </span>
            )}
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E5DFD4] text-[#121316] transition cursor-pointer shadow-xs"
            title="Alert Feed"
          >
            <Bell className="w-4.5 h-4.5 text-[#121316]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#F5EB78] text-[#121316] text-[10px] font-black flex items-center justify-center border border-[#121316] shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* PWA Install */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
