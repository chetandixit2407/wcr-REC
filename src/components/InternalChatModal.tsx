import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { smoothEase } from '../utils/motion.ts';
import {
  X,
  Send,
  Hash,
  User as UserIcon,
  Users,
  Search,
  Sparkles,
  AlertCircle,
  Clock,
  Coffee,
  Building,
  Shield,
  Award,
  CheckCircle2,
  CheckCheck,
  Tag,
  DoorOpen,
  MessageSquare,
  ChevronDown,
  Bell,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import type { ChatMessage, ChatChannel, User, UserRole, Candidate, Room } from '../types/index.ts';
import { authenticatedFetch } from '../utils/apiClient.ts';

interface InternalChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  currentRole: UserRole;
  candidates?: Candidate[];
  rooms?: Room[];
  defaultRecipientId?: string;
  defaultChannelId?: string;
  initialCandidateId?: string;
  initialRoomId?: string;
  initialMessage?: string;
  onOpenCandidateDossier?: (candidateId: string) => void;
  onOpenRoomContext?: (roomId: string, roomName?: string) => void;
  onNewMessageSent?: () => void;
}

export const InternalChatModal: React.FC<InternalChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentRole,
  candidates = [],
  rooms = [],
  defaultRecipientId,
  defaultChannelId = 'general',
  initialCandidateId,
  initialRoomId,
  initialMessage,
  onOpenCandidateDossier,
  onOpenRoomContext,
  onNewMessageSent,
}) => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [activeChatType, setActiveChatType] = useState<'channel' | 'direct'>('channel');
  const [activeChannelId, setActiveChannelId] = useState<string>(defaultChannelId);
  const [activeRecipientId, setActiveRecipientId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [messageInput, setMessageInput] = useState<string>('');
  const [isPriority, setIsPriority] = useState<boolean>(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [unreadMap, setUnreadMap] = useState<{
    channels: Record<string, number>;
    direct: Record<string, number>;
  }>({
    channels: {},
    direct: {},
  });
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('chat');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize active conversation when opened with default target or initial values
  useEffect(() => {
    if (defaultRecipientId) {
      setActiveChatType('direct');
      setActiveRecipientId(defaultRecipientId);
      setMobileView('chat');
    } else if (defaultChannelId) {
      setActiveChatType('channel');
      setActiveChannelId(defaultChannelId);
      setMobileView('chat');
    }

    if (initialCandidateId) {
      setSelectedCandidateId(initialCandidateId);
      setMobileView('chat');
    }
    if (initialRoomId) {
      setSelectedRoomId(initialRoomId);
      setMobileView('chat');
    }
    if (initialMessage) {
      setMessageInput(initialMessage);
      setMobileView('chat');
    }
  }, [defaultRecipientId, defaultChannelId, initialCandidateId, initialRoomId, initialMessage, isOpen]);

  // Load channels and staff users
  useEffect(() => {
    if (!isOpen) return;

    fetchChannels();
    fetchStaffUsers();
    fetchUnreadCounts();
  }, [isOpen]);

  const fetchChannels = async () => {
    try {
      const res = await authenticatedFetch('/api/chat/channels');
      const data = await res.json();
      if (data.success && Array.isArray(data.channels)) {
        setChannels(data.channels);
      }
    } catch (err) {
      console.error('Failed to load chat channels', err);
    }
  };

  const fetchStaffUsers = async () => {
    try {
      const res = await authenticatedFetch('/api/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setStaffUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load staff users', err);
    }
  };

  const fetchUnreadCounts = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await authenticatedFetch(`/api/chat/unread?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.success) {
        setUnreadMap({
          channels: data.channels || {},
          direct: data.direct || {},
        });
      }
    } catch (err) {
      console.error('Failed to load unread counts', err);
    }
  };

  // Fetch messages for active channel or direct recipient
  useEffect(() => {
    if (!isOpen) return;
    fetchConversationMessages();
  }, [activeChatType, activeChannelId, activeRecipientId, isOpen]);

  const fetchConversationMessages = async () => {
    setLoadingMessages(true);
    try {
      let url = '/api/chat/messages?';
      if (activeChatType === 'channel' && activeChannelId) {
        url += `channelId=${encodeURIComponent(activeChannelId)}`;
      } else if (activeChatType === 'direct' && activeRecipientId && currentUser?.id) {
        url += `recipientId=${encodeURIComponent(activeRecipientId)}&userId=${encodeURIComponent(currentUser.id)}`;
      } else {
        setLoadingMessages(false);
        return;
      }

      const res = await authenticatedFetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
        scrollToBottom();
      }

      // Mark messages as read
      markAsRead();
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const markAsRead = async () => {
    if (!currentUser?.id) return;
    try {
      await authenticatedFetch('/api/chat/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          channelId: activeChatType === 'channel' ? activeChannelId : undefined,
          recipientId: activeChatType === 'direct' ? activeRecipientId : undefined,
        }),
      });

      // Update local unread counts
      setUnreadMap((prev) => {
        if (activeChatType === 'channel') {
          const updatedChannels = { ...prev.channels };
          delete updatedChannels[activeChannelId];
          return { ...prev, channels: updatedChannels };
        } else {
          const updatedDirect = { ...prev.direct };
          delete updatedDirect[activeRecipientId];
          return { ...prev, direct: updatedDirect };
        }
      });
    } catch (err) {
      console.warn('Failed marking read', err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Listen to window custom event or global SSE message broadcast
  useEffect(() => {
    const handleIncomingChatMessage = (e: any) => {
      const newMsg: ChatMessage = e.detail || e.payload;
      if (!newMsg || !newMsg.id) return;

      const isForActiveChannel =
        activeChatType === 'channel' && newMsg.channelId === activeChannelId;
      const isForActiveDirect =
        activeChatType === 'direct' &&
        ((newMsg.senderId === activeRecipientId && newMsg.recipientId === currentUser?.id) ||
          (newMsg.senderId === currentUser?.id && newMsg.recipientId === activeRecipientId));

      if (isForActiveChannel || isForActiveDirect) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          const next = [...prev, newMsg];
          return next.sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });
        scrollToBottom();
        markAsRead();
      } else {
        // Increment unread map
        if (newMsg.channelId) {
          setUnreadMap((prev) => ({
            ...prev,
            channels: {
              ...prev.channels,
              [newMsg.channelId!]: (prev.channels[newMsg.channelId!] || 0) + 1,
            },
          }));
        } else if (newMsg.recipientId === currentUser?.id) {
          setUnreadMap((prev) => ({
            ...prev,
            direct: {
              ...prev.direct,
              [newMsg.senderId]: (prev.direct[newMsg.senderId] || 0) + 1,
            },
          }));
        }
      }
    };

    window.addEventListener('wcr:chat-message', handleIncomingChatMessage as EventListener);
    return () => {
      window.removeEventListener('wcr:chat-message', handleIncomingChatMessage as EventListener);
    };
  }, [activeChatType, activeChannelId, activeRecipientId, currentUser?.id]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || sending) return;

    const candidate = candidates.find((c) => c.id === selectedCandidateId);
    const room = rooms.find((r) => r.id === selectedRoomId || r.roomId === selectedRoomId);
    const recipientUser = staffUsers.find((u) => u.id === activeRecipientId);

    const payload = {
      channelId: activeChatType === 'channel' ? activeChannelId : undefined,
      recipientId: activeChatType === 'direct' ? activeRecipientId : undefined,
      recipientName: recipientUser?.name,
      content: messageInput.trim(),
      candidateId: candidate?.id,
      candidateName: candidate?.fullName,
      roomId: room?.id,
      roomName: room?.name,
      isPriority,
      senderId: currentUser?.id,
      senderName: currentUser?.name,
      senderRole: currentUser?.role || currentRole,
    };

    setSending(true);
    try {
      const res = await authenticatedFetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Add to local message list if not already added by realtime
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        const next = [...prev, data.message];
        return next.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });

      setMessageInput('');
      setIsPriority(false);
      setSelectedCandidateId('');
      setSelectedRoomId('');
      scrollToBottom();

      if (onNewMessageSent) onNewMessageSent();
    } catch (err) {
      console.error('Send message failed', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const activeRecipient = staffUsers.find((u) => u.id === activeRecipientId);

  // Filter staff users based on search
  const filteredStaff = useMemo(() => {
    return staffUsers.filter((u) => {
      if (u.id === currentUser?.id) return false; // don't show self in DMs list
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q)
      );
    });
  }, [staffUsers, currentUser?.id, searchQuery]);

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;
    const q = searchQuery.toLowerCase();
    return channels.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }, [channels, searchQuery]);

  // Contextual template triggers
  const applyQuickTemplate = (templateType: 'bring' | 'send' | 'ready' | 'prepare' | 'clean' | 'water') => {
    const cand = candidates.find((c) => c.id === selectedCandidateId) || candidates[0];
    const room = rooms.find((r) => r.id === selectedRoomId) || rooms[0];
    const candName = cand?.fullName || 'Rahul Sharma';
    const roomName = room?.name || 'The Skyline';

    if (templateType === 'bring') {
      if (!selectedCandidateId && cand) setSelectedCandidateId(cand.id);
      if (!selectedRoomId && room) setSelectedRoomId(room.id);
      setMessageInput(`Bring ${candName} to ${roomName}.`);
    } else if (templateType === 'send') {
      if (!selectedCandidateId && cand) setSelectedCandidateId(cand.id);
      if (!selectedRoomId && room) setSelectedRoomId(room.id);
      setMessageInput(`Send ${candName} to ${roomName}.`);
    } else if (templateType === 'ready') {
      if (!selectedCandidateId && cand) setSelectedCandidateId(cand.id);
      setMessageInput(`Candidate ${candName} is ready in Reception.`);
    } else if (templateType === 'prepare') {
      if (!selectedRoomId && room) setSelectedRoomId(room.id);
      setMessageInput(`Prepare ${roomName} with mineral water and sanitized glassware.`);
    } else if (templateType === 'clean') {
      if (!selectedRoomId && room) setSelectedRoomId(room.id);
      setMessageInput(`Please clean and reset ${roomName} after the interview.`);
    } else if (templateType === 'water') {
      if (!selectedRoomId && room) setSelectedRoomId(room.id);
      setMessageInput(`Please serve water & refreshments in ${roomName}.`);
    }
  };

  // Quick message snippets
  const quickSnippets = [
    'Candidate has arrived in Lobby',
    'Please serve water & refreshments',
    'Room is cleaned & ready',
    'Stage cleared, advancing to Next Round',
    'Please escort candidate to cabin',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#121316]/40 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.28, ease: smoothEase }}
            className="bg-white border-0 sm:border sm:border-[#E5DFD4] rounded-none sm:rounded-3xl max-w-5xl w-full h-[100dvh] sm:h-[86vh] sm:max-h-[850px] shadow-2xl overflow-hidden flex flex-col relative z-10 text-[#121316]"
          >
            {/* Top Header Bar */}
            <div className="px-3.5 sm:px-5 py-3 border-b border-[#E5DFD4] bg-[#FAF7F0] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 truncate">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#F5EB78] text-[#121316] border border-[#E5DFD4] flex items-center justify-center font-black shadow-xs shrink-0">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-[#121316]" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h2 className="text-xs sm:text-base font-bold text-[#121316] tracking-tight truncate">
                      WCR Office Chat
                    </h2>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 font-mono shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Live
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#6F727A] truncate">
                    Logged in as: <strong className="text-[#121316]">{currentUser?.name || 'Staff'}</strong> ({currentUser?.role || currentRole})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile View Toggle Switch */}
                <div className="flex md:hidden items-center bg-[#ECE6DC] p-0.5 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setMobileView('list')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition ${
                      mobileView === 'list'
                        ? 'bg-white text-[#121316] font-bold shadow-xs'
                        : 'text-[#6F727A] hover:text-[#121316]'
                    }`}
                  >
                    Directory
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileView('chat')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition ${
                      mobileView === 'chat'
                        ? 'bg-white text-[#121316] font-bold shadow-xs'
                        : 'text-[#6F727A] hover:text-[#121316]'
                    }`}
                  >
                    Chat
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-[#6F727A] hover:text-[#121316] hover:bg-[#ECE6DC] transition cursor-pointer"
                  title="Close Internal Chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Split Layout */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
              {/* Left Sidebar: Channels & Staff List */}
              <div
                className={`${
                  mobileView === 'list' ? 'flex flex-1 h-full' : 'hidden md:flex'
                } w-full md:w-72 lg:w-80 bg-[#FAF7F0] border-r border-[#E5DFD4] flex-col shrink-0 min-h-0`}
              >
                {/* Search */}
                <div className="p-3 border-b border-[#E5DFD4] shrink-0">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#6F727A] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search channels or staff..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E5DFD4] rounded-xl text-xs text-[#121316] placeholder:text-[#6F727A] focus:outline-hidden focus:border-[#F5EB78]"
                    />
                  </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-4">
                  {/* Channels Section */}
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6F727A] flex items-center justify-between">
                      <span>Office Channels</span>
                      <span className="text-[10px] text-[#6F727A] font-mono">#{channels.length}</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {filteredChannels.map((c) => {
                        const isActive = activeChatType === 'channel' && activeChannelId === c.id;
                        const unread = unreadMap.channels[c.id] || 0;

                        return (
                          <button
                            key={c.id}
                            onClick={() => {
                              setActiveChatType('channel');
                              setActiveChannelId(c.id);
                              setMobileView('chat');
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-left text-xs transition flex items-center justify-between cursor-pointer ${
                              isActive
                                ? 'bg-[#F5EB78] border border-[#E5DFD4] text-[#121316] font-bold shadow-xs'
                                : 'text-[#121316] hover:bg-[#ECE6DC] hover:text-[#121316]'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Hash className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#121316]' : 'text-[#6F727A]'}`} />
                              <span className="truncate">{c.name}</span>
                            </div>
                            {unread > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-[#121316] text-[#F5EB78] text-[10px] font-black shrink-0">
                                {unread}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Direct Messages Section */}
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6F727A] flex items-center justify-between">
                      <span>Direct Messages</span>
                      <span className="text-[10px] text-[#6F727A] font-mono">{filteredStaff.length}</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {filteredStaff.map((u) => {
                        const isActive = activeChatType === 'direct' && activeRecipientId === u.id;
                        const unread = unreadMap.direct[u.id] || 0;

                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              setActiveChatType('direct');
                              setActiveRecipientId(u.id);
                              setMobileView('chat');
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-left text-xs transition flex items-center justify-between cursor-pointer ${
                              isActive
                                ? 'bg-[#F5EB78] border border-[#E5DFD4] text-[#121316] font-bold shadow-xs'
                                : 'text-[#121316] hover:bg-[#ECE6DC] hover:text-[#121316]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <div className="w-6 h-6 rounded-lg bg-white border border-[#E5DFD4] flex items-center justify-center text-[10px] font-bold text-[#121316] shrink-0">
                                {u.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="truncate">
                                <span className="block truncate font-medium text-[#121316]">{u.name}</span>
                                <span className="text-[10px] text-[#6F727A] block truncate">
                                  {u.role} • {u.department || 'Operations'}
                                </span>
                              </div>
                            </div>
                            {unread > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-[#121316] text-[#F5EB78] text-[10px] font-black shrink-0">
                                {unread}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Main Chat Pane */}
              <div
                className={`${
                  mobileView === 'chat' ? 'flex' : 'hidden md:flex'
                } flex-1 flex-col bg-white overflow-hidden min-h-0 relative`}
              >
                {/* Conversation Header */}
                <div className="px-3.5 sm:px-5 py-3 border-b border-[#E5DFD4] bg-[#FAF7F0] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5 sm:gap-3 truncate">
                    {/* Mobile Back Button */}
                    <button
                      type="button"
                      onClick={() => setMobileView('list')}
                      className="md:hidden p-1.5 -ml-1 rounded-xl text-[#121316] bg-white border border-[#E5DFD4] hover:bg-[#ECE6DC] transition cursor-pointer flex items-center gap-1 text-xs font-bold shrink-0"
                      title="Back to Channels and Staff"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="hidden xs:inline">Directory</span>
                    </button>

                    {activeChatType === 'channel' ? (
                      <>
                        <div className="w-8 h-8 rounded-xl bg-[#F5EB78] border border-[#E5DFD4] flex items-center justify-center text-[#121316] font-bold shrink-0">
                          <Hash className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <h3 className="text-xs sm:text-sm font-bold text-[#121316] truncate">
                            #{activeChannel?.name || activeChannelId}
                          </h3>
                          <p className="text-[10px] sm:text-[11px] text-[#6F727A] truncate">
                            {activeChannel?.description || 'Office coordination channel'}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-xl bg-[#F5EB78] border border-[#E5DFD4] flex items-center justify-center text-[#121316] font-bold text-xs shrink-0">
                          {activeRecipient?.name.substring(0, 2).toUpperCase() || 'DM'}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <h3 className="text-xs sm:text-sm font-bold text-[#121316] truncate">
                              {activeRecipient?.name || 'Staff Member'}
                            </h3>
                            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-[#FAF7F0] text-[#121316] border border-[#E5DFD4] shrink-0">
                              {activeRecipient?.role || 'Staff'}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-[#6F727A] truncate">
                            {activeRecipient?.designation || activeRecipient?.department || 'WCR Team Member'} {activeRecipient?.phone ? `• ${activeRecipient.phone}` : ''}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={fetchConversationMessages}
                    className="p-1.5 rounded-lg text-[#6F727A] hover:text-[#121316] hover:bg-[#ECE6DC] transition cursor-pointer shrink-0"
                    title="Refresh messages"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Messages Scroll Area with Subtle WCR Logo Branding */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 bg-[#FAF7F0]/40 relative min-h-0">
                  {/* Subtle centered WCR Watermark Emblem in Chat background */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.035] overflow-hidden select-none">
                    <img
                      src="/wcr-logo-watermark.svg"
                      alt=""
                      className="w-56 h-56 sm:w-72 sm:h-72 object-contain"
                    />
                  </div>

                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full text-xs text-[#6F727A]">
                      <RefreshCw className="w-4 h-4 animate-spin mr-2 text-[#121316]" />
                      Loading message stream...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[#6F727A] space-y-2 relative z-10">
                      <MessageSquare className="w-8 h-8 text-[#E5DFD4]" />
                      <p className="text-xs font-semibold text-[#121316]">No messages yet in this conversation.</p>
                      <p className="text-[11px] text-[#6F727A] max-w-xs">
                        Start communication with your colleagues. All staff receive updates in real time.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId === currentUser?.id;

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1 relative z-10`}
                        >
                          <div className="flex items-center gap-2 text-[10px] text-[#6F727A] px-1">
                            <span className="font-bold text-[#121316]">{isMine ? 'You' : msg.senderName}</span>
                            {!isMine && (
                              <span className="px-1.5 py-0.2 rounded-sm bg-[#FAF7F0] text-[9px] font-semibold text-[#121316] border border-[#E5DFD4]">
                                {msg.senderRole}
                              </span>
                            )}
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {msg.isPriority && (
                              <span className="px-1.5 py-0.2 rounded-sm bg-rose-100 text-rose-800 border border-rose-300 text-[9px] font-bold">
                                PRIORITY
                              </span>
                            )}
                          </div>

                          {/* Bubble */}
                          <div
                            className={`max-w-[86%] sm:max-w-md md:max-w-lg p-3 rounded-2xl text-xs sm:text-[13px] space-y-2 break-words [word-break:break-word] ${
                              isMine
                                ? 'bg-[#F5EB78] text-[#121316] font-medium rounded-tr-xs border border-[#E5DFD4] shadow-xs'
                                : msg.isPriority
                                ? 'bg-rose-50 border border-rose-300 text-rose-950 rounded-tl-xs shadow-xs'
                                : 'bg-white border border-[#E5DFD4] text-[#121316] rounded-tl-xs shadow-xs'
                            }`}
                          >
                            {/* Context Pills (Candidate / Room) */}
                            {(msg.candidateName || msg.roomName) && (
                              <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-[#121316]/10">
                                {msg.candidateName && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (msg.candidateId && onOpenCandidateDossier) {
                                        onOpenCandidateDossier(msg.candidateId);
                                      }
                                    }}
                                    className="px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1 font-bold transition cursor-pointer bg-[#FAF7F0] border border-[#E5DFD4] text-[#121316] hover:bg-[#ECE6DC]"
                                    title="Click to open candidate dossier"
                                  >
                                    <UserIcon className="w-3 h-3 text-[#121316]" />
                                    <span className="truncate max-w-[140px] sm:max-w-none">Candidate: <u>{msg.candidateName}</u></span>
                                  </button>
                                )}

                                {msg.roomName && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onOpenRoomContext) {
                                        onOpenRoomContext(msg.roomId || '', msg.roomName);
                                      }
                                    }}
                                    className="px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1 font-bold transition cursor-pointer bg-[#FAF7F0] border border-[#E5DFD4] text-[#121316] hover:bg-[#ECE6DC]"
                                    title="Click to view room context"
                                  >
                                    <DoorOpen className="w-3 h-3 text-[#121316]" />
                                    <span className="truncate max-w-[140px] sm:max-w-none">Room: <u>{msg.roomName}</u></span>
                                  </button>
                                )}
                              </div>
                            )}

                            <p className="whitespace-pre-wrap leading-relaxed break-words [word-break:break-word] text-xs sm:text-[13px]">{msg.content}</p>

                            {/* Action Task Synchronized Badge */}
                            {/\b(bring|send|escort|ready|prepare|clean|water|refreshments)\b/i.test(msg.content) && (
                              <div className="text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 bg-[#FAF7F0] text-[#121316] border border-[#E5DFD4]">
                                <Sparkles className="w-2.5 h-2.5 text-[#121316]" />
                                <span>⚡ Dashboard Action Alert created & synchronized</span>
                              </div>
                            )}

                            {/* Delivery / Read confirmation status */}
                            <div className="flex items-center justify-between text-[9px] text-[#6F727A] pt-1 border-t border-[#121316]/10">
                              <span>
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isMine && (
                                <span className="flex items-center gap-0.5">
                                  {msg.readBy && msg.readBy.length > 1 ? (
                                    <span className="flex items-center gap-0.5 text-[#121316] font-semibold" title="Read by colleagues">
                                      <CheckCheck className="w-3 h-3 text-emerald-600" /> Read
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-0.5 text-[#6F727A] font-medium" title="Delivered to office">
                                      <CheckCircle2 className="w-3 h-3" /> Delivered
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Context Templates Bar */}
                <div className="px-3 sm:px-4 py-2 border-t border-[#E5DFD4] bg-[#FAF7F0] flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none shrink-0 text-[11px]">
                  <span className="text-[#6F727A] text-[10px] font-bold shrink-0 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#121316]" />
                    <span className="hidden xs:inline">Quick Actions:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => applyQuickTemplate('bring')}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FAF7F0] text-[#121316] border border-[#E5DFD4] hover:border-[#D5CEBF] text-[10px] font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                    title="Send escort request to Reception Dashboard"
                  >
                    <span>🚶 “Bring [Candidate] to [Room]”</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickTemplate('send')}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FAF7F0] text-[#121316] border border-[#E5DFD4] hover:border-[#D5CEBF] text-[10px] font-medium whitespace-nowrap transition cursor-pointer shadow-2xs shrink-0"
                    title="Send candidate escort instruction"
                  >
                    <span>🚀 “Send [Candidate] to [Room]”</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickTemplate('ready')}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FAF7F0] text-[#121316] border border-[#E5DFD4] hover:border-[#D5CEBF] text-[10px] font-medium whitespace-nowrap transition cursor-pointer shadow-2xs shrink-0"
                    title="Candidate is ready alert"
                  >
                    <span>🛎️ “Candidate is ready”</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickTemplate('prepare')}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FAF7F0] text-[#121316] border border-[#E5DFD4] hover:border-[#D5CEBF] text-[10px] font-medium whitespace-nowrap transition cursor-pointer shadow-2xs shrink-0"
                    title="Pantry room prep alert"
                  >
                    <span>🚪 “Prepare [Room]”</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickTemplate('clean')}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FAF7F0] text-[#121316] border border-[#E5DFD4] hover:border-[#D5CEBF] text-[10px] font-medium whitespace-nowrap transition cursor-pointer shadow-2xs shrink-0"
                    title="Pantry clean & reset request"
                  >
                    <span>🧹 Clean Room</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickTemplate('water')}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FAF7F0] text-[#121316] border border-[#E5DFD4] hover:border-[#D5CEBF] text-[10px] font-medium whitespace-nowrap transition cursor-pointer shadow-2xs shrink-0"
                  >
                    <span>☕ Serve Water</span>
                  </button>
                </div>

                {/* Input & Form Area */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-2.5 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-[#E5DFD4] bg-[#FAF7F0] space-y-2 shrink-0"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    {/* Candidate & Room Tags Selector Row */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {/* Candidate Tag Option */}
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-[#121316] shrink-0" />
                        <select
                          value={selectedCandidateId}
                          onChange={(e) => setSelectedCandidateId(e.target.value)}
                          className="px-2 py-1 bg-white border border-[#E5DFD4] rounded-lg text-[10px] sm:text-[11px] text-[#121316] focus:outline-hidden focus:border-[#F5EB78] max-w-[120px] sm:max-w-[160px] truncate shadow-xs"
                        >
                          <option value="">Attach candidate</option>
                          {candidates.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.fullName} ({c.position})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Room Tag Option */}
                      <div className="flex items-center gap-1">
                        <DoorOpen className="w-3 h-3 text-[#121316] shrink-0" />
                        <select
                          value={selectedRoomId}
                          onChange={(e) => setSelectedRoomId(e.target.value)}
                          className="px-2 py-1 bg-white border border-[#E5DFD4] rounded-lg text-[10px] sm:text-[11px] text-[#121316] focus:outline-hidden focus:border-[#F5EB78] max-w-[120px] sm:max-w-[160px] truncate shadow-xs"
                        >
                          <option value="">Attach room</option>
                          {rooms.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Priority Toggle */}
                    <button
                      type="button"
                      onClick={() => setIsPriority(!isPriority)}
                      className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        isPriority
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'bg-white border border-[#E5DFD4] text-[#6F727A] hover:text-[#121316]'
                      }`}
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span>{isPriority ? 'Priority' : 'Normal'}</span>
                    </button>
                  </div>

                  {/* Text Input Row */}
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      rows={2}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Message ${
                        activeChatType === 'channel'
                          ? `#${activeChannel?.name || activeChannelId}`
                          : activeRecipient?.name || 'staff member'
                      }...`}
                      className="flex-1 px-3 py-2 bg-white border border-[#E5DFD4] rounded-2xl text-sm sm:text-xs text-[#121316] placeholder:text-[#6F727A] focus:outline-hidden focus:border-[#F5EB78] resize-none shadow-xs max-h-24 min-h-[42px] leading-snug"
                    />

                    <button
                      type="submit"
                      disabled={!messageInput.trim() || sending}
                      className="h-[42px] px-3.5 sm:px-4 rounded-2xl bg-[#F5EB78] hover:bg-[#ebd545] disabled:opacity-40 text-[#121316] font-bold transition shadow-sm border border-[#E5DFD4] cursor-pointer shrink-0 flex items-center justify-center"
                      title="Send message"
                    >
                      {sending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
);
};
