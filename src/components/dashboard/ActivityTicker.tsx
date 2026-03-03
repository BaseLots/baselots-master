'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Building2, Clock } from 'lucide-react';

interface Activity {
  id: string;
  userName: string;
  action: 'invested' | 'purchased' | 'joined';
  amount?: number;
  propertyName?: string;
  shares?: number;
  timeAgo: string;
}

// Mock activity data with anonymized names (normie-friendly, no wallet addresses)
const mockActivities: Activity[] = [
  { id: '1', userName: 'Sarah J.', action: 'invested', amount: 500, timeAgo: '2 min ago' },
  { id: '2', userName: 'Michael R.', action: 'purchased', propertyName: 'Sunset Heights Villa', shares: 10, timeAgo: '5 min ago' },
  { id: '3', userName: 'Jennifer L.', action: 'joined', timeAgo: '8 min ago' },
  { id: '4', userName: 'David K.', action: 'invested', amount: 250, timeAgo: '12 min ago' },
  { id: '5', userName: 'Emily T.', action: 'purchased', propertyName: 'Austin Urban Lofts', shares: 5, timeAgo: '15 min ago' },
  { id: '6', userName: 'Robert M.', action: 'invested', amount: 1000, timeAgo: '18 min ago' },
  { id: '7', userName: 'Lisa P.', action: 'joined', timeAgo: '22 min ago' },
  { id: '8', userName: 'James H.', action: 'purchased', propertyName: 'Phoenix Desert Oasis', shares: 20, timeAgo: '25 min ago' },
  { id: '9', userName: 'Amanda C.', action: 'invested', amount: 750, timeAgo: '28 min ago' },
  { id: '10', userName: 'Christopher W.', action: 'invested', amount: 300, timeAgo: '32 min ago' },
  { id: '11', userName: 'Rachel G.', action: 'purchased', propertyName: 'Miami Beachfront Condo', shares: 8, timeAgo: '35 min ago' },
  { id: '12', userName: 'Daniel B.', action: 'joined', timeAgo: '40 min ago' },
];

const ActivityTicker: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Rotate through activities every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % mockActivities.length);
        setIsVisible(true);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const currentActivity = mockActivities[currentIndex];

  const getActivityIcon = (action: Activity['action']) => {
    switch (action) {
      case 'invested':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'purchased':
        return <Building2 className="w-4 h-4 text-[#00bcd4]" />;
      case 'joined':
        return <Users className="w-4 h-4 text-[#FF5722]" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.action) {
      case 'invested':
        return (
          <>
            <span className="font-semibold text-white">{activity.userName}</span>
            <span className="text-white/70"> invested </span>
            <span className="font-semibold text-emerald-400">${activity.amount?.toLocaleString()}</span>
          </>
        );
      case 'purchased':
        return (
          <>
            <span className="font-semibold text-white">{activity.userName}</span>
            <span className="text-white/70"> purchased </span>
            <span className="font-semibold text-[#00bcd4]">{activity.shares} shares</span>
            <span className="text-white/70"> in {activity.propertyName}</span>
          </>
        );
      case 'joined':
        return (
          <>
            <span className="font-semibold text-white">{activity.userName}</span>
            <span className="text-white/70"> just joined the waitlist</span>
          </>
        );
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-black via-black/95 to-black border-y border-white/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-center gap-4">
          {/* Live indicator */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-75" />
            </div>
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Live</span>
          </div>

          {/* Activity display */}
          <div 
            className={`flex items-center gap-3 transition-all duration-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 shrink-0">
              {getActivityIcon(currentActivity.action)}
            </div>
            <div className="text-sm">
              {getActivityText(currentActivity)}
            </div>
            <div className="flex items-center gap-1 text-xs text-white/40 shrink-0">
              <Clock className="w-3 h-3" />
              {currentActivity.timeAgo}
            </div>
          </div>

          {/* Scrolling preview of next activities (desktop only) */}
          <div className="hidden lg:flex items-center gap-2 ml-6 pl-6 border-l border-white/10">
            <span className="text-xs text-white/30">Recent:</span>
            <div className="flex gap-3">
              {mockActivities
                .slice(currentIndex + 1, currentIndex + 4)
                .map((activity, idx) => (
                  <div 
                    key={activity.id}
                    className="flex items-center gap-1.5 text-xs text-white/40"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    <span className="truncate max-w-[100px]">{activity.userName}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityTicker;