import React, { useState } from 'react';
import { ArrowLeft, Bell, CheckCheck, Trash2 } from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  unread?: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Interview Reminder',
    subtitle: 'Your mock interview starts in 30 minutes.',
    time: 'Just now',
    unread: true
  },
  {
    id: '2',
    title: 'Resume Scanned',
    subtitle: 'Your resume ATS score is ready to view.',
    time: '5m ago',
    unread: true
  },
  {
    id: '3',
    title: 'New Role Match',
    subtitle: 'A Staff Engineer role matches your profile.',
    time: '1h ago',
    unread: true
  },
  {
    id: '4',
    title: 'Profile View',
    subtitle: 'A recruiter from Google viewed your profile.',
    time: '3h ago'
  },
  {
    id: '5',
    title: 'System Update',
    subtitle: 'New AI models are now available for coding tests.',
    time: 'Yesterday'
  },
  {
    id: '6',
    title: 'Achievement Unlocked',
    subtitle: "You've completed 5 technical interviews!",
    time: 'Yesterday'
  },
  {
    id: '7',
    title: 'Feedback Ready',
    subtitle: 'Interview feedback for Meta round is available.',
    time: '2 days ago'
  },
  {
    id: '8',
    title: 'Daily Streak',
    subtitle: "Don't forget your daily AI practice session.",
    time: '3 days ago'
  },
  {
    id: '9',
    title: 'Subscription',
    subtitle: 'Your premium features have been activated.',
    time: '4 days ago'
  },
  {
    id: '10',
    title: 'Welcome',
    subtitle: 'Welcome to SmartHire AI! Start your journey.',
    time: '1 week ago'
  }
];

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  if (!isOpen) return null;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#141C2E] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header matching Image 4 */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between bg-[#111827]">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft size={22} />
            </button>
            <h2 className="text-xl font-bold text-white tracking-tight">Notifications</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              title="Mark all as read"
              className="p-2 text-xs font-semibold text-cyan-400 hover:bg-cyan-950/40 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <CheckCheck size={16} />
              <span className="hidden sm:inline">Mark read</span>
            </button>
            <button
              onClick={clearAll}
              title="Clear all notifications"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Notifications List matching exact styles in Image 4 */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 scrollbar-thin scrollbar-thumb-slate-800">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30 text-cyan-400" />
              <p className="text-sm font-medium">No notifications left</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-4 flex items-start gap-4 hover:bg-slate-800/40 transition-colors rounded-2xl ${
                  item.unread ? 'bg-cyan-950/10' : ''
                }`}
              >
                <div className="mt-1 p-2.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex-shrink-0">
                  <Bell size={18} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      {item.title}
                      {item.unread && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                      )}
                    </h4>
                    <span className="text-[11px] font-medium text-slate-400 flex-shrink-0">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#111827] text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all"
          >
            Close Notifications
          </button>
        </div>
      </div>
    </div>
  );
}
