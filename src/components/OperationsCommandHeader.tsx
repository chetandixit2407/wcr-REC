import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { smoothEase, staggerContainer, staggerItem } from '../utils/motion.ts';
import {
  Users,
  UserCheck,
  DoorOpen,
  Coffee,
  Calendar,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { Candidate, Interview, Room, PantryTask, Visitor } from '../types/index.ts';
import { useSettings } from '../context/SettingsContext.tsx';

interface OperationsCommandHeaderProps {
  candidates: Candidate[];
  interviews?: Interview[];
  rooms: Room[];
  pantryTasks?: PantryTask[];
  visitors?: Visitor[];
  userName?: string;
  userRole?: string;
  onSelectKpi?: (kpiId: string) => void;
}

// Smooth counting number component interpolating from previous value
const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const fromVal = prevValueRef.current;
    const toVal = value;
    prevValueRef.current = value;

    if (fromVal === toVal) {
      setDisplayValue(toVal);
      return;
    }

    const duration = 280;
    const stepTime = 20;
    const steps = Math.max(1, Math.ceil(duration / stepTime));
    const delta = (toVal - fromVal) / steps;
    let currentStep = 0;
    let currentVal = fromVal;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(toVal);
        clearInterval(timer);
      } else {
        currentVal += delta;
        setDisplayValue(Math.round(currentVal));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span className="tabular-nums font-mono">{displayValue}</span>;
};

export const OperationsCommandHeader: React.FC<OperationsCommandHeaderProps> = ({
  candidates,
  interviews = [],
  rooms,
  pantryTasks = [],
  visitors = [],
  userName = 'Officer',
  userRole = 'Operations',
  onSelectKpi,
}) => {
  const { t, formatTime } = useSettings();
  const [greeting, setGreeting] = useState<'Good Morning' | 'Good Afternoon' | 'Good Evening'>('Good Morning');
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      if (hours < 12) setGreeting('Good Morning');
      else if (hours < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');

      setTimeString(formatTime(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [formatTime]);

  // Compute metrics from actual data
  const waitingCandidates = candidates.filter(
    (c) => c.status === 'ARRIVED' || c.status === 'WAITING' || c.status === 'With Kimmi Mam – Senior HR Interview'
  ).length;

  const inInterviewCandidates = candidates.filter((c) => c.status === 'IN_INTERVIEW').length;

  const operationalRooms = rooms.filter(
    (r) =>
      r.id !== 'room-lalit-cabin' &&
      r.id !== 'room-kimmi-cabin' &&
      r.name !== 'Lalit Sir Cabin' &&
      r.name !== 'Elegance Suite' &&
      !r.isReservedNextRound
  );
  const availableRoomsCount = operationalRooms.filter((r) => r.status === 'AVAILABLE').length;

  const pendingPantryCount = pantryTasks.filter(
    (t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS'
  ).length;

  const kpis = [
    {
      id: 'lobby',
      label: 'Waiting in Lobby',
      value: waitingCandidates,
      sublabel: 'Awaiting escort & intake',
      icon: Users,
      isFeatured: true, // Signature Crextio Pale Yellow Bento card
    },
    {
      id: 'interviews',
      label: 'Interviews Today',
      value: interviews.length > 0 ? interviews.length : inInterviewCandidates,
      sublabel: 'Active candidate rounds',
      icon: UserCheck,
      isFeatured: false,
    },
    {
      id: 'rooms',
      label: 'Available Rooms',
      value: availableRoomsCount,
      sublabel: `Out of ${operationalRooms.length} operational`,
      icon: DoorOpen,
      isFeatured: false,
    },
    {
      id: 'pantry',
      label: 'Hospitality Tasks',
      value: pendingPantryCount,
      sublabel: 'Beverages & room prep',
      icon: Coffee,
      isFeatured: false,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Editorial Heading Lockup */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: smoothEase }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-1"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#121316]" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#6F727A] font-mono">
              Live Operations Deck
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#121316] tracking-tight">
            {greeting === 'Good Morning' ? t('greet_morning') : greeting === 'Good Afternoon' ? t('greet_afternoon') : t('greet_evening')}, <span className="text-[#121316]">{userName.split(' ')[0]}</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#6F727A] font-medium mt-0.5">
            White Collar Realty &mdash; Operations & HR Command
          </p>
        </div>

        {/* Live Clock Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-white text-[#121316] px-3.5 py-1.5 rounded-full border border-[#E5DFD4] shadow-xs flex items-center gap-2.5">
            <Clock className="w-3.5 h-3.5 text-[#121316]" />
            <span className="text-xs font-mono font-bold text-[#121316] tabular-nums">
              {timeString || '--:--:--'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Crextio Bento Grid KPI Row */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4"
      >
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <motion.div
              key={kpi.id}
              variants={staggerItem}
              role="button"
              tabIndex={0}
              onClick={() => onSelectKpi && onSelectKpi(kpi.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (onSelectKpi) onSelectKpi(kpi.id);
                }
              }}
              className={`relative group rounded-2xl p-4 sm:p-5 shadow-xs overflow-hidden cursor-pointer select-none transition-all duration-200 min-w-0 ${
                kpi.isFeatured
                  ? 'bg-[#F5EB78] border border-[#E8DC5F] text-[#121316] hover:bg-[#EFE463] shadow-[0_4px_20px_-2px_rgba(245,235,120,0.35)]'
                  : 'bg-white border border-[#E5DFD4] text-[#121316] hover:bg-[#FAF8F5] hover:border-[#D5CEBF]'
              }`}
              aria-label={`View ${kpi.label} details: ${kpi.value}`}
            >
              <div className="relative z-10 flex items-center justify-between text-xs">
                <span className={`font-bold tracking-tight text-[#121316]`}>
                  {kpi.label}
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${
                    kpi.isFeatured
                      ? 'bg-[#121316] text-[#F5EB78]'
                      : 'bg-[#F8F6F0] text-[#121316] border border-[#EAE5DB]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="relative z-10 mt-3 sm:mt-4 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#121316] tabular-nums">
                  <AnimatedNumber value={kpi.value} />
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    kpi.isFeatured ? 'bg-[#121316]' : 'bg-emerald-500'
                  }`}
                />
              </div>

              <div className="relative z-10 flex items-center justify-between text-[11px] mt-1.5">
                <p className="truncate text-[#6F727A] font-medium">
                  {kpi.sublabel}
                </p>
                <span className="text-[10px] font-bold text-[#121316] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-0.5 shrink-0 ml-1">
                  View &rarr;
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
