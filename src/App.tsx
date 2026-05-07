/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, PlayCircle, ArrowLeftRight, Trophy, Clock, Activity, ChevronLeft, ChevronRight, X, Sun, Moon, Filter, ArrowUpDown, MapPin, Bell, BellRing, MessageSquare, AlertTriangle, Goal, RefreshCw, Maximize, Minimize, Search, Eye, TrendingUp, Youtube, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import { matchesData, highlightsData, transfersData, Match, Team, Highlight, leagueLogos, teamLogos, MatchEvent, fetchMatchDetails, Transfer, MatchStats } from './data';
import { getLeagueLogo, getTeamLogo } from './leagueAssets';
import toast, { Toaster } from 'react-hot-toast';
import { db, auth, loginWithGoogle } from './lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { AdBanner } from './components/AdBanner';
import { showInterstitial, initializeAdMob } from './services/admob';

type Tab = 'matches' | 'highlights' | 'transfers' | 'standings';

interface Notification {
  id: string;
  title: string;
  body: string;
  matchId: string;
  type: 'start' | 'goal' | 'finish';
  timestamp: string;
  read: boolean;
  userId: string;
}

function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Listen for global and user-specific notifications
    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', ['global', user?.uid].filter(Boolean) as string[]),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(newNotifs);
      setUnreadCount(newNotifs.filter(n => !n.read).length);

      // Show toast for brand new notifications (if timestamp is very recent)
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const notifTime = new Date(data.timestamp).getTime();
          const now = new Date().getTime();
          if (now - notifTime < 10000) { // If added in the last 10 seconds
            toast(data.title + '\n' + data.body, {
              icon: data.type === 'goal' ? '⚽' : data.type === 'start' ? '🏟️' : '🏁',
              duration: 5000,
              position: 'top-right',
              style: {
                background: '#10b981',
                color: '#fff',
                fontWeight: 'bold'
              }
            });
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user]);

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      await updateDoc(doc(db, 'notifications', n.id), { read: true });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAllAsRead();
        }}
        className="relative p-2 rounded-xl transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800 group"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-6 h-6 text-emerald-500 animate-bounce" />
        ) : (
          <Bell className="w-6 h-6 text-slate-400 group-hover:text-emerald-500" />
        )}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[10px] font-black text-white items-center justify-center">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute left-0 mt-2 w-80 max-h-[450px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  الإشعارات الذكية
                </h3>
                {!user && (
                  <button 
                    onClick={() => { loginWithGoogle(); setIsOpen(false); }}
                    className="text-[10px] font-bold text-emerald-500 hover:underline"
                  >
                    تسجيل الدخول للمزامنة
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-2">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 opacity-40">
                    <Bell className="w-12 h-12 mb-2" />
                    <p className="text-sm font-medium">لا توجد إشعارات حالياً</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${!notif.read ? 'bg-emerald-500/5' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          notif.type === 'goal' ? 'bg-emerald-500/10 text-emerald-500' :
                          notif.type === 'start' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-slate-500/10 text-slate-500'
                        }`}>
                          {notif.type === 'goal' ? <Goal className="w-4 h-4" /> :
                           notif.type === 'start' ? <Activity className="w-4 h-4" /> :
                           <Clock className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-500">{notif.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{notif.body}</p>
                          <p className="text-[9px] text-slate-400 mt-1 font-bold">{new Date(notif.timestamp).toLocaleTimeString('ar-SA')}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">يتم تحديث الإشعارات مباشرة من الخادم</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function StandingsView() {
  const [standings, setStandings] = useState<any[]>([]);
  const [groupedStandings, setGroupedStandings] = useState<Record<string, any[]> | null>(null);
  const [isGrouped, setIsGrouped] = useState(false);
  const [leagueLogoUrl, setLeagueLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLeagueFilter, setActiveLeagueFilter] = useState('الدوري الإنجليزي الممتاز');
  const leagues = ['كأس العالم', 'دوري أبطال أوروبا', 'الدوري الإنجليزي الممتاز', 'الدوري الإسباني', 'الدوري الفرنسي', 'الدوري الإيطالي', 'الدوري الألماني', 'الدوري الهولندي', 'الدوري البرتغالي', 'الدوري البلجيكي'];

  const fetchStandings = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);
    
    try {
      const endpoint = `/api/standings?league=${encodeURIComponent(activeLeagueFilter)}`;
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        console.log("Standings data:", data);
        
        if (data.isGrouped) {
          setIsGrouped(true);
          setGroupedStandings(data.groupedStandings || {});
          setStandings([]);
        } else {
          setIsGrouped(false);
          setGroupedStandings(null);
          setStandings(Array.isArray(data.standings) ? data.standings : []);
        }
        
        // Use API logo if available, otherwise fallback to our local logos
        setLeagueLogoUrl(data.leagueLogo || getLeagueLogo(activeLeagueFilter) || leagueLogos[activeLeagueFilter] || null);
      } else {
        setError(`خطأ في جلب البيانات: ${response.status}`);
      }
    } catch (error: any) {
      if (error?.message !== 'Failed to fetch' && error !== 'TypeError: Failed to fetch' && !String(error).includes('Failed to fetch')) {
        console.error("Failed to fetch standings", error);
      }
      setError("فشل الاتصال بالخادم");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStandings();
    
    const interval = setInterval(() => {
      fetchStandings(true);
    }, 60000);
    
    return () => clearInterval(interval);
  }, [activeLeagueFilter]);

  const getStat = (stats: any[], name: string) => {
    return stats.find((s: any) => s.name === name)?.value ?? 0;
  };

  const renderTable = (data: any[], title?: string) => (
    <div key={title || 'main'} className="space-y-3">
      {title && (
        <div className="flex items-center gap-2 px-2">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
        </div>
      )}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-right min-w-[600px]">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-4 py-4 font-bold text-center w-12">#</th>
              <th className="px-4 py-4 font-bold text-right">الفريق</th>
              <th className="px-4 py-4 font-bold text-center">لعب</th>
              <th className="px-4 py-4 font-bold text-center">فوز</th>
              <th className="px-4 py-4 font-bold text-center">تعادل</th>
              <th className="px-4 py-4 font-bold text-center">خسارة</th>
              <th className="px-4 py-4 font-bold text-center">+/-</th>
              <th className="px-4 py-4 font-bold text-center">نقاط</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.map((team: any, index: number) => (
              <tr key={team.team.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-4 font-bold text-slate-400 text-center">{index + 1}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <TeamLogo 
                      team={{
                        id: team.team.id,
                        name: team.team.displayName,
                        logo: team.team.logos?.[0]?.href,
                        color: 'bg-slate-100',
                        textColor: 'text-slate-400'
                      }} 
                      className="w-8 h-8"
                    />
                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{team.team.displayName || team.team.name || 'غير معروف'}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center font-medium text-slate-600 dark:text-slate-400">
                  {getStat(team.stats, 'gamesPlayed')}
                </td>
                <td className="px-4 py-4 text-center font-medium text-slate-600 dark:text-slate-400">
                  {getStat(team.stats, 'wins')}
                </td>
                <td className="px-4 py-4 text-center font-medium text-slate-600 dark:text-slate-400">
                  {getStat(team.stats, 'ties')}
                </td>
                <td className="px-4 py-4 text-center font-medium text-slate-600 dark:text-slate-400">
                  {getStat(team.stats, 'losses')}
                </td>
                <td className="px-4 py-4 text-center font-medium text-slate-600 dark:text-slate-400">
                  {getStat(team.stats, 'pointDifferential')}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg">
                    {getStat(team.stats, 'points')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {leagues.map(league => (
          <button
            key={league}
            onClick={() => setActiveLeagueFilter(league)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
              activeLeagueFilter === league 
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/30' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-500/50'
            }`}
          >
            <LeagueLogo league={league} className="w-4 h-4" />
            {league}
          </button>
        ))}
      </div>

      {/* League Header */}
      <div className="flex items-center gap-4 px-2">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center p-2">
          <LeagueLogo league={activeLeagueFilter} logoUrl={leagueLogoUrl} className="w-full h-full" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{activeLeagueFilter}</h2>
            {isRefreshing && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-[10px] font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>جاري التحديث...</span>
              </div>
            )}
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isGrouped ? 'مجموعات البطولة' : 'جدول الترتيب المباشر'}</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
          <p>جاري جلب جدول الترتيب مباشرة من المصادر الرسمية...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 px-4 bg-red-50 dark:bg-red-900/20 rounded-3xl border border-red-200 dark:border-red-800 shadow-sm">
          <p className="text-red-600 dark:text-red-400 font-bold">{error}</p>
        </div>
      ) : (isGrouped ? Object.keys(groupedStandings || {}).length === 0 : standings.length === 0) ? (
        <div className="text-center py-20 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">لا يوجد بيانات</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            لا توجد بيانات ترتيب متاحة حالياً لهذا الدوري.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {isGrouped && groupedStandings ? (
            Object.entries(groupedStandings).sort(([a], [b]) => a.localeCompare(b)).map(([groupName, groupData]) => (
              renderTable(groupData as any[], groupName)
            ))
          ) : (
            renderTable(standings)
          )}
          
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>المصدر: ESPN & TSDB</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>تحديث تلقائي</span>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationSettingsModal({
  onClose,
  subscribedTeams,
  setSubscribedTeams,
  subscribedLeagues,
  setSubscribedLeagues
}: {
  onClose: () => void;
  subscribedTeams: string[];
  setSubscribedTeams: (teams: string[]) => void;
  subscribedLeagues: string[];
  setSubscribedLeagues: (leagues: string[]) => void;
}) {
  const popularTeams = ['ريال مدريد', 'برشلونة', 'مانشستر سيتي', 'أرسنال', 'ليفربول', 'بايرن ميونخ', 'باريس سان جيرمان', 'يوفنتوس', 'ميلان', 'إنتر ميلان', 'الهلال', 'النصر', 'الاتحاد'];
  const popularLeagues = ['دوري أبطال أوروبا', 'الدوري الإنجليزي الممتاز', 'الدوري الإسباني', 'الدوري الإيطالي', 'الدوري الألماني', 'الدوري الفرنسي', 'الدوري السعودي'];

  const toggleTeam = (team: string) => {
    if (subscribedTeams.includes(team)) {
      setSubscribedTeams(subscribedTeams.filter(t => t !== team));
    } else {
      setSubscribedTeams([...subscribedTeams, team]);
      requestNotificationPermission();
    }
  };

  const toggleLeague = (league: string) => {
    if (subscribedLeagues.includes(league)) {
      setSubscribedLeagues(subscribedLeagues.filter(l => l !== league));
    } else {
      setSubscribedLeagues([...subscribedLeagues, league]);
      requestNotificationPermission();
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]"
        dir="rtl"
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">إعدادات الإشعارات</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto scrollbar-hide flex-1 space-y-6">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
            <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">
              اشترك في فرقك أو دورياتك المفضلة لتلقي تنبيهات قبل بداية المباراة، وعند تسجيل الأهداف، وعند نهاية المباراة.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              الدوريات المفضلة
            </h4>
            <div className="flex flex-wrap gap-2">
              {popularLeagues.map(league => (
                <button
                  key={league}
                  onClick={() => toggleLeague(league)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                    subscribedLeagues.includes(league)
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50'
                  }`}
                >
                  {league}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Goal className="w-4 h-4 text-emerald-500" />
              الفرق المفضلة
            </h4>
            <div className="flex flex-wrap gap-2">
              {popularTeams.map(team => (
                <button
                  key={team}
                  onClick={() => toggleTeam(team)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                    subscribedTeams.includes(team)
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50'
                  }`}
                >
                  {team}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function useMatchNotifications(subscribedTeams: string[], subscribedLeagues: string[]) {
  const prevMatchesRef = useRef<Match[]>([]);
  const notifiedPreMatchesRef = useRef<string[]>([]);

  const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    } else {
      toast.success(`${title}: ${body}`);
    }
  };

  useEffect(() => {
    if (subscribedTeams.length === 0 && subscribedLeagues.length === 0) return;

    const checkMatches = async () => {
      try {
        const d = new Date();
        const dateStr = d.toISOString().split('T')[0].replace(/-/g, '');
        const response = await fetch(`/api/matches?date=${dateStr}`);
        
        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            if (data && Array.isArray(data)) {
              if (prevMatchesRef.current.length > 0) {
                data.forEach((newMatch: Match) => {
                  const isSubscribedTeam = subscribedTeams.includes(newMatch.homeTeam.name) || subscribedTeams.includes(newMatch.awayTeam.name);
                  const isSubscribedLeague = subscribedLeagues.includes(newMatch.league);

                  if (isSubscribedTeam || isSubscribedLeague) {
                    const oldMatch = prevMatchesRef.current.find(m => m.id === newMatch.id);
                    
                    if (oldMatch) {
                      // Check status change to live
                      if (oldMatch.status === 'upcoming' && newMatch.status === 'live') {
                        showNotification('بدأت المباراة!', `${newMatch.homeTeam.name} ضد ${newMatch.awayTeam.name}`);
                      }
                      // Check score change
                      if (
                        (newMatch.homeScore !== undefined && oldMatch.homeScore !== undefined && newMatch.homeScore > oldMatch.homeScore) ||
                        (newMatch.awayScore !== undefined && oldMatch.awayScore !== undefined && newMatch.awayScore > oldMatch.awayScore)
                      ) {
                        showNotification('هدف!', `${newMatch.homeTeam.name} ${newMatch.homeScore} - ${newMatch.awayScore} ${newMatch.awayTeam.name}`);
                      }
                      // Check match finished
                      if (oldMatch.status === 'live' && newMatch.status === 'finished') {
                        showNotification('نهاية المباراة', `${newMatch.homeTeam.name} ${newMatch.homeScore} - ${newMatch.awayScore} ${newMatch.awayTeam.name}`);
                      }
                    } else {
                      // Pre-match alert (check if match starts in <= 15 minutes)
                      if (newMatch.status === 'upcoming' && newMatch.time && newMatch.date) {
                        // Ensure time is in HH:MM:SS format for safe parsing
                        const timeStr = newMatch.time.split(':').length === 2 ? `${newMatch.time}:00` : newMatch.time;
                        const matchDateTime = new Date(`${newMatch.date}T${timeStr}`);
                        const now = new Date();
                        const diffMs = matchDateTime.getTime() - now.getTime();
                        const diffMins = Math.floor(diffMs / 60000);
                        
                        if (diffMins > 0 && diffMins <= 15 && !notifiedPreMatchesRef.current.includes(newMatch.id)) {
                          showNotification('مباراة قادمة', `مباراة ${newMatch.homeTeam.name} ضد ${newMatch.awayTeam.name} ستبدأ قريباً`);
                          notifiedPreMatchesRef.current.push(newMatch.id);
                        }
                      }
                    }
                  }
                });
              }
              prevMatchesRef.current = data;
            }
          }
        }
      } catch (error: any) {
        if (error?.message === 'Failed to fetch' || error === 'TypeError: Failed to fetch' || String(error).includes('Failed to fetch')) {
          // Ignore network errors during polling (e.g. server restart)
          return;
        }
        console.error("Error checking match notifications:", error);
      }
    };

    // Initial check
    checkMatches();
    
    // Poll every 30 seconds
    const interval = setInterval(checkMatches, 30000);
    return () => clearInterval(interval);
  }, [subscribedTeams, subscribedLeagues]);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('matches');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [subscribedTeams, setSubscribedTeams] = useState<string[]>(() => {
    const saved = localStorage.getItem('subscribedTeams');
    return saved ? JSON.parse(saved) : [];
  });
  const [subscribedLeagues, setSubscribedLeagues] = useState<string[]>(() => {
    const saved = localStorage.getItem('subscribedLeagues');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('subscribedTeams', JSON.stringify(subscribedTeams));
  }, [subscribedTeams]);

  useEffect(() => {
    localStorage.setItem('subscribedLeagues', JSON.stringify(subscribedLeagues));
  }, [subscribedLeagues]);

  useMatchNotifications(subscribedTeams, subscribedLeagues);

  useEffect(() => {
    initializeAdMob();
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 pb-20 md:pb-0 transition-colors duration-300">
      <Toaster position="top-center" reverseOrder={false} />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 flex items-center justify-center group">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-lg rotate-12 transition-transform group-hover:rotate-45"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg -rotate-6 transition-transform group-hover:rotate-0 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <span className="text-white font-black text-xl italic drop-shadow-md">X</span>
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">KOORA<span className="text-emerald-500 italic">X</span></h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Install PWA Button */}
            {showInstallBtn && (
              <button
                onClick={handleInstallClick}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                تثبيت التطبيق
              </button>
            )}

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/50 p-1 rounded-xl">
              <TabButton tab="matches" activeTab={activeTab} onClick={setActiveTab} icon={<Calendar className="w-4 h-4" />} label="المباريات" />
              <TabButton tab="highlights" activeTab={activeTab} onClick={setActiveTab} icon={<PlayCircle className="w-4 h-4" />} label="الملخصات" />
              <TabButton tab="transfers" activeTab={activeTab} onClick={setActiveTab} icon={<ArrowLeftRight className="w-4 h-4" />} label="الانتقالات" />
              <TabButton tab="standings" activeTab={activeTab} onClick={setActiveTab} icon={<Trophy className="w-4 h-4" />} label="الترتيب" />
            </nav>

            {/* Smart Notification Center */}
            <NotificationCenter />

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              aria-label="تبديل الوضع الداكن"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <AdBanner />
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'matches' && <MatchesView setActiveTab={setActiveTab} />}
            {activeTab === 'highlights' && <HighlightsView />}
            {activeTab === 'transfers' && <TransfersView />}
            {activeTab === 'standings' && <StandingsView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Notification Settings Modal */}
      <AnimatePresence>
        {showNotificationSettings && (
          <NotificationSettingsModal
            onClose={() => setShowNotificationSettings(false)}
            subscribedTeams={subscribedTeams}
            setSubscribedTeams={setSubscribedTeams}
            subscribedLeagues={subscribedLeagues}
            setSubscribedLeagues={setSubscribedLeagues}
          />
        )}
      </AnimatePresence>

      {/* Mobile Install Prompt */}
      {showInstallBtn && (
        <div className="md:hidden fixed bottom-20 left-4 right-4 z-50">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-emerald-600 text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold">تثبيت KOORA X</p>
                <p className="text-[10px] opacity-80 text-white/90">احصل على تجربة أفضل وأسرع</p>
              </div>
            </div>
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-white text-emerald-700 rounded-xl text-xs font-bold shadow-sm"
            >
              تثبيت
            </button>
          </motion.div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-50 transition-colors duration-300">
        <div className="flex items-center justify-around p-2">
          <MobileTabButton tab="matches" activeTab={activeTab} onClick={setActiveTab} icon={<Calendar className="w-6 h-6" />} label="المباريات" />
          <MobileTabButton tab="highlights" activeTab={activeTab} onClick={setActiveTab} icon={<PlayCircle className="w-6 h-6" />} label="الملخصات" />
          <MobileTabButton tab="transfers" activeTab={activeTab} onClick={setActiveTab} icon={<ArrowLeftRight className="w-6 h-6" />} label="الانتقالات" />
          <MobileTabButton tab="standings" activeTab={activeTab} onClick={setActiveTab} icon={<Trophy className="w-6 h-6" />} label="الترتيب" />
        </div>
      </nav>
    </div>
  );
}

// --- Components ---

function TabButton({ tab, activeTab, onClick, icon, label }: { tab: Tab, activeTab: Tab, onClick: (t: Tab) => void, icon: React.ReactNode, label: string }) {
  const isActive = activeTab === tab;
  return (
    <button
      onClick={() => onClick(tab)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
        isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm dark:shadow-none"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {icon}
        {label}
      </span>
    </button>
  );
}

function MobileTabButton({ tab, activeTab, onClick, icon, label }: { tab: Tab, activeTab: Tab, onClick: (t: Tab) => void, icon: React.ReactNode, label: string }) {
  const isActive = activeTab === tab;
  return (
    <button
      onClick={() => onClick(tab)}
      className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${
        isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function TeamLogo({ team, className = "w-14 h-14" }: { team: Team, className?: string }) {
  const [error, setError] = React.useState(false);
  const internalLogo = getTeamLogo(team.name) || teamLogos[team.name];
  const logoUrl = team.logo || internalLogo;

  if (logoUrl && !error) {
    return (
      <img 
        src={logoUrl} 
        alt={team.name} 
        className={`${className} object-contain drop-shadow-sm`} 
        referrerPolicy="no-referrer" 
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className={`${className} rounded-full flex items-center justify-center font-bold shadow-inner ${team.color} ${team.textColor || ''}`}>
      {team.name.substring(0, 1)}
    </div>
  );
}

function PlayerImage({ src, name, className = "w-20 h-20" }: { src?: string; name: string; className?: string }) {
  const [error, setError] = React.useState(false);
  
  // Use Dicebear for a nice consistent avatar if no src or on error
  const placeholderUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=059669,10b981,34d399&fontFamily=Arial&fontWeight=700`;
  
  if (!src || error) {
    return (
      <div className={`${className} rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-xl relative z-10 overflow-hidden`}>
        <img 
          src={placeholderUrl} 
          alt={name} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div className={`${className} rounded-full relative z-10 overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl`}>
      <img 
        src={src} 
        alt={name} 
        className="w-full h-full object-cover" 
        referrerPolicy="no-referrer" 
        loading="lazy"
        onError={() => setError(true)}
      />
    </div>
  );
}

function LeagueLogo({ league, logoUrl: apiLogoUrl, className = "w-4 h-4" }: { league: string, logoUrl?: string | null, className?: string }) {
  const [error, setError] = React.useState(false);
  
  // Try to find the logo URL through various means
  const getLogo = () => {
    if (apiLogoUrl) return apiLogoUrl;
    
    const cleanLeague = league.trim();
    
    // 1. Direct match in local dictionary
    if (leagueLogos[cleanLeague]) return leagueLogos[cleanLeague];
    
    // 2. Asset helper
    const assetLogo = getLeagueLogo(cleanLeague);
    if (assetLogo) return assetLogo;
    
    // 3. Partial match (e.g. "الدوري الإنجليزي الممتاز" -> "الدوري الإنجليزي")
    const foundKey = Object.keys(leagueLogos).find(k => 
      cleanLeague.includes(k) || k.includes(cleanLeague)
    );
    if (foundKey) return leagueLogos[foundKey];
    
    return null;
  };

  const logoUrl = getLogo();

  if (!logoUrl || error) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg`}>
        <Trophy className="w-1/2 h-1/2 text-yellow-500 opacity-40" />
      </div>
    );
  }

  return (
    <img 
      src={logoUrl} 
      alt={league} 
      className={`${className} object-contain transition-all duration-300 group-hover:scale-110`} 
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
    />
  );
}

function MatchesView({ 
  setActiveTab
}: { 
  setActiveTab: (tab: Tab) => void;
}) {
  const [filterLeague, setFilterLeague] = useState<string>('الكل');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [matches, setMatches] = useState<Match[]>(matchesData);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [followedMatches, setFollowedMatches] = useState<string[]>([]);
  const [dateOffset, setDateOffset] = useState<number>(0); // -1: Yesterday, 0: Today, 1: Tomorrow
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const followedMatchesRef = useRef<string[]>([]);
  const prevMatchesRef = useRef<Match[]>([]);
  const notifiedPreMatchesRef = useRef<string[]>([]);

  const getFormattedDate = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0].replace(/-/g, '');
  };

  const getDayLabel = (offset: number) => {
    if (offset === -1) return 'الأمس';
    if (offset === 0) return 'اليوم';
    if (offset === 1) return 'غداً';
    
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[d.getDay()];
  };

  const getDaySubLabel = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    } else {
      toast.success(`${title}: ${body}`);
    }
  };

  const toggleFollowMatch = (e: React.MouseEvent, matchId: string) => {
    e.stopPropagation();
    const isFollowed = followedMatches.includes(matchId);
    
    if (isFollowed) {
      toast.success('تم إلغاء متابعة المباراة');
      const newFollowed = followedMatches.filter(id => id !== matchId);
      setFollowedMatches(newFollowed);
      followedMatchesRef.current = newFollowed;
    } else {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      toast.success('تمت متابعة المباراة، ستتلقى إشعارات بالأهداف وبداية المباراة');
      const newFollowed = [...followedMatches, matchId];
      setFollowedMatches(newFollowed);
      followedMatchesRef.current = newFollowed;
    }
  };

  const loadMatches = async (retries = 3, dateStr?: string) => {
    try {
      const healthResponse = await fetch('/api/health');
      if (!healthResponse.ok) {
        throw new Error('Server is unreachable');
      }
      
      let endpoint = '';
      const targetDate = dateStr || getFormattedDate(dateOffset as number);
      endpoint = `/api/matches?date=${targetDate}`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Expected JSON but received:', text.substring(0, 100));
        throw new Error('Server returned non-JSON response');
      }

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          // Check for notifications
          if (prevMatchesRef.current.length > 0) {
            data.forEach((newMatch: Match) => {
              const oldMatch = prevMatchesRef.current.find(m => m.id === newMatch.id);
              
              if (oldMatch) {
                // Check status change to live
                if (oldMatch.status === 'upcoming' && newMatch.status === 'live') {
                  showNotification('بدأت المباراة!', `${newMatch.homeTeam.name} ضد ${newMatch.awayTeam.name}`);
                }
                // Check score change
                if (
                  (newMatch.homeScore !== undefined && oldMatch.homeScore !== undefined && newMatch.homeScore > oldMatch.homeScore) ||
                  (newMatch.awayScore !== undefined && oldMatch.awayScore !== undefined && newMatch.awayScore > oldMatch.awayScore)
                ) {
                  showNotification('هدف!', `${newMatch.homeTeam.name} ${newMatch.homeScore} - ${newMatch.awayScore} ${newMatch.awayTeam.name}`);
                }
                // Check match finished
                if (oldMatch.status === 'live' && newMatch.status === 'finished') {
                  showNotification('نهاية المباراة', `${newMatch.homeTeam.name} ${newMatch.homeScore} - ${newMatch.awayScore} ${newMatch.awayTeam.name}`);
                }
              } else {
                // Pre-match alert (check if match starts in <= 15 minutes)
                if (newMatch.status === 'upcoming' && newMatch.time && newMatch.date) {
                  const matchDateTime = new Date(`${newMatch.date}T${newMatch.time}`);
                  const now = new Date();
                  const diffMs = matchDateTime.getTime() - now.getTime();
                  const diffMins = Math.floor(diffMs / 60000);
                  
                  if (diffMins > 0 && diffMins <= 15 && !notifiedPreMatchesRef.current.includes(newMatch.id)) {
                    showNotification('مباراة قادمة', `مباراة ${newMatch.homeTeam.name} ضد ${newMatch.awayTeam.name} ستبدأ قريباً`);
                    notifiedPreMatchesRef.current.push(newMatch.id);
                  }
                }
              }
            });
          }
          prevMatchesRef.current = data;
          setMatches(data);
          return;
        }
      }
      throw new Error(`Fetch failed with status: ${response.status}`);
    } catch (error: any) {
      const isNetworkError = error?.message === 'Failed to fetch' || error === 'TypeError: Failed to fetch' || String(error).includes('Failed to fetch') || error?.message === 'Server is unreachable';
      
      if (!isNetworkError) {
        console.error("Error fetching matches:", error);
      }
      
      if (retries > 0) {
        if (!isNetworkError) console.log(`Retrying match fetch... (${retries} attempts left)`);
        setTimeout(() => loadMatches(retries - 1, dateStr), 2000);
      } else {
        if (!isNetworkError) {
          console.warn("Failed to fetch real matches after retries, using fallback data");
        }
      }
    } finally {
      setIsLoadingMatches(false);
    }
  };

  useEffect(() => {
    const handleFirstInteraction = () => {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  useEffect(() => {
    setIsLoadingMatches(true);
    
    // Only poll for today's matches
    let interval: any;
    if (dateOffset === 0) {
      loadMatches(3, getFormattedDate(0));
      interval = setInterval(() => loadMatches(3, getFormattedDate(0)), 30000);
    } else if (dateOffset === 'upcoming') {
      loadMatches(3);
    } else {
      loadMatches(3, getFormattedDate(dateOffset as number));
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dateOffset]);

  useEffect(() => {
    if (selectedMatch && selectedMatch.status !== 'upcoming') {
      setIsLoadingEvents(true);
      if (selectedMatch.events && selectedMatch.events.length > 0) {
        setMatchEvents(selectedMatch.events);
        setIsLoadingEvents(false);
      } else {
        fetchMatchDetails(selectedMatch.id).then(({ stats, events }) => {
          if (stats) {
            setSelectedMatch(prev => prev && prev.id === selectedMatch.id ? { ...prev, stats } : prev);
          }
          setMatchEvents(events);
          setIsLoadingEvents(false);
        });
      }
    } else {
      setMatchEvents([]);
    }
  }, [selectedMatch]);

  const majorLeagues = ['كأس العالم', 'دوري أبطال أوروبا', 'الدوري الإنجليزي الممتاز', 'الدوري الإسباني', 'الدوري الفرنسي', 'الدوري الإيطالي', 'الدوري الألماني', 'الدوري الهولندي', 'الدوري البرتغالي', 'الدوري البلجيكي'];
  const leagues: string[] = ['الكل', ...majorLeagues];

  const filteredMatches = matches.filter(m => filterLeague === 'الكل' || m.league === filterLeague);

  // Group matches by league
  const groupedMatches = filteredMatches.reduce((acc, match) => {
    if (!acc[match.league]) acc[match.league] = [];
    acc[match.league].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  // Sort matches within each group by time
  Object.keys(groupedMatches).forEach(league => {
    groupedMatches[league].sort((a, b) => {
      const parseTime = (timeStr: string) => {
        if (!timeStr || !timeStr.includes(':')) return 9999; // Push non-time strings to the end
        const parts = timeStr.split(':').map(Number);
        if (isNaN(parts[0]) || isNaN(parts[1])) return 9999;
        return parts[0] * 60 + parts[1];
      };
      
      const minsA = parseTime(a.time);
      const minsB = parseTime(b.time);
      return minsA - minsB;
    });
  });

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide px-2">
        {[-3, -2, -1, 0, 1, 2, 3].map((offset) => (
          <button
            key={offset}
            onClick={() => setDateOffset(offset)}
            className={`flex flex-col items-center min-w-[80px] py-3 rounded-2xl text-sm font-bold transition-all duration-300 border ${
              dateOffset === offset 
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/30 scale-105 z-10' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-500/50'
            }`}
          >
            <span className="text-[10px] opacity-80 mb-1">{getDayLabel(offset)}</span>
            <span className="text-base">{getDaySubLabel(offset)}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide px-2">
        {leagues.map(league => {
          const leagueMatch = matches.find(m => m.league === league);
          return (
            <button
              key={league}
              onClick={() => setFilterLeague(league)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors border ${
                filterLeague === league 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/50'
              }`}
            >
              {league !== 'الكل' && (
                <LeagueLogo league={league} logoUrl={leagueMatch?.leagueLogo} className="w-4 h-4" />
              )}
              {league}
            </button>
          );
        })}
      </div>

      {isLoadingMatches ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
          <p>جاري جلب المباريات مباشرة من المصادر الرسمية...</p>
        </div>
      ) : Object.entries(groupedMatches).length === 0 ? (
        <div className="text-center py-20 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">لا توجد مباريات حالياً</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            لا توجد مباريات لهذه البطولة في هذا التاريخ.
          </p>
        </div>
      ) : (
        Object.entries(groupedMatches)
          .sort(([leagueA], [leagueB]) => {
            const indexA = majorLeagues.indexOf(leagueA);
            const indexB = majorLeagues.indexOf(leagueB);
            if (indexA === -1 && indexB === -1) return leagueA.localeCompare(leagueB);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          })
          .map(([league, leagueMatches]) => (
          <div key={league} className="space-y-4">
            <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mx-2">
              <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center p-1.5 shadow-inner">
                <LeagueLogo league={league} className="w-full h-full" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1">{league}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">المباريات والنتائج المباشرة</p>
              </div>
            </div>
            
            <div className="grid gap-3">
              {(leagueMatches as Match[]).map(match => (
                <div 
                  key={match.id} 
                  onClick={() => {
                    showInterstitial();
                    setSelectedMatch(match);
                  }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none cursor-pointer relative"
                >
                  <button 
                    onClick={(e) => toggleFollowMatch(e, match.id)}
                    className="absolute top-2 left-2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors z-10"
                    title={followedMatches.includes(match.id) ? "إلغاء المتابعة" : "متابعة المباراة"}
                  >
                    {followedMatches.includes(match.id) ? <BellRing className="w-4 h-4 text-emerald-500" /> : <Bell className="w-4 h-4" />}
                  </button>
                  <div className="flex items-center justify-between">
                    {/* Home Team */}
                    <div className="flex items-center justify-end gap-2 sm:gap-3 w-1/3">
                      <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-200 text-left line-clamp-2 sm:line-clamp-1">{match.homeTeam.name}</span>
                      <TeamLogo team={match.homeTeam} />
                    </div>

                    {/* Score / Time */}
                    <div className="flex flex-col items-center justify-center w-1/3 gap-1">
                      {match.status === 'upcoming' && (
                        <>
                          <span className="text-xl font-bold text-slate-700 dark:text-slate-300">{match.time}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> لم تبدأ
                          </span>
                        </>
                      )}
                      {match.status === 'live' && (
                        <>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{match.time}</span>
                          <div className="flex items-center gap-3 text-2xl font-black text-slate-900 dark:text-white">
                            <span>{match.homeScore}</span>
                            <span className="text-slate-400 dark:text-slate-600">-</span>
                            <span>{match.awayScore}</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 animate-pulse flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {match.minute}
                          </span>
                        </>
                      )}
                      {match.status === 'finished' && (
                        <>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{match.time}</span>
                          <div className="flex items-center gap-3 text-2xl font-black text-slate-900 dark:text-white">
                            <span>{match.homeScore}</span>
                            <span className="text-slate-400 dark:text-slate-600">-</span>
                            <span>{match.awayScore}</span>
                          </div>
                          <span className="text-xs text-slate-500">انتهت</span>
                        </>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center justify-start gap-2 sm:gap-3 w-1/3">
                      <TeamLogo team={match.awayTeam} />
                      <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-200 text-right line-clamp-2 sm:line-clamp-1">{match.awayTeam.name}</span>
                    </div>
                  </div>

                  {/* Goal Scorers */}
                  {match.events && match.events.filter(e => e.type === 'goal').length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="w-1/2 pr-2">
                        {match.events.filter(e => e.type === 'goal' && e.teamId === match.homeTeam.id).map(e => (
                          <div key={e.id} className="flex items-center justify-end gap-1 mb-1">
                            <span className="truncate">{e.playerName}</span>
                            <span className="text-slate-400 font-mono">{e.minute}</span>
                            <Goal className="w-3 h-3 text-emerald-500 shrink-0" />
                          </div>
                        ))}
                      </div>
                      <div className="w-1/2 pl-2">
                        {match.events.filter(e => e.type === 'goal' && e.teamId === match.awayTeam.id).map(e => (
                          <div key={e.id} className="flex items-center justify-start gap-1 mb-1">
                            <Goal className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="text-slate-400 font-mono">{e.minute}</span>
                            <span className="truncate">{e.playerName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Match Details Modal */}
      <AnimatePresence>
        {selectedMatch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedMatch(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedMatch(null)}
                className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white z-10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Stadium Map Image */}
              <div className="relative h-48 w-full bg-slate-200 dark:bg-slate-800">
                <img 
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800" 
                  alt="خريطة الملعب" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-xl font-bold">{selectedMatch.stadiumName || 'ملعب المباراة'}</h3>
                  </div>
                  <p className="text-sm text-slate-300 pr-7">{selectedMatch.location || 'غير محدد'}</p>
                </div>
              </div>

              {/* Match Info */}
              <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col items-center gap-2 w-1/3">
                    <TeamLogo team={selectedMatch.homeTeam} />
                    <span className="text-sm font-bold text-center text-slate-900 dark:text-white">{selectedMatch.homeTeam.name}</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center w-1/3">
                    {leagueLogos[selectedMatch.league] ? (
                      <img src={leagueLogos[selectedMatch.league]} alt={selectedMatch.league} className="w-5 h-5 object-contain mb-1 opacity-80" referrerPolicy="no-referrer" />
                    ) : (
                      <Trophy className="w-4 h-4 text-yellow-500 mb-1 opacity-80" />
                    )}
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 text-center leading-tight">{selectedMatch.league}</span>
                    <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold text-slate-900 dark:text-white">
                      {selectedMatch.time}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 w-1/3">
                    <TeamLogo team={selectedMatch.awayTeam} />
                    <span className="text-sm font-bold text-center text-slate-900 dark:text-white">{selectedMatch.awayTeam.name}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-sm text-slate-500 dark:text-slate-400">حالة المباراة</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {selectedMatch.status === 'upcoming' ? 'لم تبدأ' : selectedMatch.status === 'live' ? 'جارية الآن' : 'انتهت'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-sm text-slate-500 dark:text-slate-400">الملعب</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedMatch.stadiumName || 'غير محدد'}</span>
                  </div>
                  {selectedMatch.status === 'finished' && (
                    selectedMatch.videoUrl ? (
                      <a
                        href={selectedMatch.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors"
                      >
                        <PlayCircle className="w-4 h-4" />
                        عرض ملخص المباراة
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedMatch(null);
                          setActiveTab('highlights');
                          (window as any).highlightFilter = `${selectedMatch.homeTeam.name} ${selectedMatch.awayTeam.name}`;
                          (window as any).highlightLeague = selectedMatch.league;
                        }}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors"
                      >
                        <PlayCircle className="w-4 h-4" />
                        عرض ملخص المباراة
                      </button>
                    )
                  )}

                  {/* Detailed Statistics Section */}
                  {selectedMatch.stats && (
                    <div className="mt-4 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <BarChart2 className="w-5 h-5 text-emerald-500" />
                          <span className="font-bold text-slate-900 dark:text-white">إحصائيات المباراة</span>
                        </div>
                        {isStatsExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </button>

                      <AnimatePresence>
                        {isStatsExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden bg-white dark:bg-slate-900"
                          >
                            <div className="p-4 space-y-5">
                              <StatBar label="الاستحواذ" homeValue={selectedMatch.stats.possession[0]} awayValue={selectedMatch.stats.possession[1]} suffix="%" />
                              <StatBar label="إجمالي التسديدات" homeValue={selectedMatch.stats.shots[0]} awayValue={selectedMatch.stats.shots[1]} />
                              <StatBar label="التسديدات على المرمى" homeValue={selectedMatch.stats.shotsOnTarget[0]} awayValue={selectedMatch.stats.shotsOnTarget[1]} />
                              <StatBar label="الأخطاء" homeValue={selectedMatch.stats.fouls[0]} awayValue={selectedMatch.stats.fouls[1]} />
                              <StatBar label="الركنيات" homeValue={selectedMatch.stats.corners[0]} awayValue={selectedMatch.stats.corners[1]} />
                              <StatBar label="التسلل" homeValue={selectedMatch.stats.offsides[0]} awayValue={selectedMatch.stats.offsides[1]} />
                              <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">البطاقات الصفراء</span>
                                  <div className="flex items-center gap-4">
                                    <span className="text-lg font-black text-slate-900 dark:text-white">{selectedMatch.stats.yellowCards[0]}</span>
                                    <div className="w-3 h-4 bg-yellow-400 rounded-sm"></div>
                                    <span className="text-lg font-black text-slate-900 dark:text-white">{selectedMatch.stats.yellowCards[1]}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">البطاقات الحمراء</span>
                                  <div className="flex items-center gap-4">
                                    <span className="text-lg font-black text-slate-900 dark:text-white">{selectedMatch.stats.redCards[0]}</span>
                                    <div className="w-3 h-4 bg-red-500 rounded-sm"></div>
                                    <span className="text-lg font-black text-slate-900 dark:text-white">{selectedMatch.stats.redCards[1]}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Match Events / Live Commentary */}
                {selectedMatch.status !== 'upcoming' && (
                  <div className="mt-8">
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-500" />
                      أحداث المباراة
                    </h4>
                    
                    {isLoadingEvents ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : matchEvents.length > 0 ? (
                      <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-1/2 before:-translate-x-1/2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                        {(() => {
                          const grouped = matchEvents.reduce((acc, event) => {
                            const min = event.minute;
                            if (!acc[min]) acc[min] = [];
                            acc[min].push(event);
                            return acc;
                          }, {} as Record<string, MatchEvent[]>);

                          const sortedMins = Object.keys(grouped).sort((a, b) => {
                            const getNum = (s: string) => parseInt(s.replace(/[^0-9]/g, '')) || 0;
                            return getNum(b) - getNum(a);
                          });

                          return sortedMins.map(minute => (
                            <div key={minute} className="relative">
                              {/* Minute Marker */}
                              <div className="flex justify-center mb-4">
                                <div className="z-20 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[10px] font-black text-slate-500 dark:text-slate-400 shadow-sm">
                                  {minute}
                                </div>
                              </div>

                              <div className="space-y-3">
                                {grouped[minute].map(event => {
                                  const isHome = event.teamId === selectedMatch.homeTeam.id;
                                  const isAway = event.teamId === selectedMatch.awayTeam.id;
                                  const isNeutral = !isHome && !isAway;

                                  return (
                                    <div 
                                      key={event.id} 
                                      className={`flex items-center gap-4 ${isHome ? 'flex-row' : isAway ? 'flex-row-reverse' : 'flex-row justify-center'}`}
                                    >
                                      {/* Event Content */}
                                      <div className={`flex-1 max-w-[42%] ${isHome ? 'text-left' : isAway ? 'text-right' : 'text-center'}`}>
                                        <div className={`p-3 rounded-2xl border transition-all duration-300 ${
                                          event.type === 'goal' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                          event.type === 'red_card' ? 'bg-red-500/10 border-red-500/20' :
                                          event.type === 'yellow_card' ? 'bg-yellow-400/10 border-yellow-400/20' :
                                          'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                                        }`}>
                                          {event.playerName && (
                                            <div className="font-black text-xs text-slate-900 dark:text-white mb-1">
                                              {event.playerName}
                                            </div>
                                          )}
                                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                            {event.description}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Icon in the middle */}
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-4 border-white dark:border-slate-900 shadow-sm ${
                                        event.type === 'goal' ? 'bg-emerald-500 text-white' :
                                        event.type === 'yellow_card' ? 'bg-yellow-400 text-white' :
                                        event.type === 'red_card' ? 'bg-red-500 text-white' :
                                        event.type === 'substitution' ? 'bg-blue-500 text-white' :
                                        'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                                      }`}>
                                        {event.type === 'goal' && <Goal className="w-4 h-4" />}
                                        {event.type === 'yellow_card' && <div className="w-3 h-4 bg-white rounded-sm"></div>}
                                        {event.type === 'red_card' && <div className="w-3 h-4 bg-white rounded-sm"></div>}
                                        {event.type === 'substitution' && <RefreshCw className="w-4 h-4" />}
                                        {event.type === 'commentary' && <MessageSquare className="w-4 h-4" />}
                                      </div>

                                      {/* Spacer for the other side */}
                                      <div className="flex-1 max-w-[42%]"></div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
                        لا توجد أحداث متاحة حالياً
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatBar({ label, homeValue, awayValue, suffix = '' }: { label: string, homeValue: number, awayValue: number, suffix?: string }) {
  const total = homeValue + awayValue || 1;
  const homePercent = (homeValue / total) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
        <span>{homeValue}{suffix}</span>
        <span className="text-slate-900 dark:text-white">{label}</span>
        <span>{awayValue}{suffix}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden">
        <div 
          className="h-full bg-emerald-500 transition-all duration-500" 
          style={{ width: `${homePercent}%` }}
        />
        <div 
          className="h-full bg-slate-300 dark:bg-slate-600 transition-all duration-500" 
          style={{ width: `${100 - homePercent}%` }}
        />
      </div>
    </div>
  );
}

function HighlightsView() {
  const [expandedHighlightId, setExpandedHighlightId] = useState<string | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [highlights, setHighlights] = useState<Highlight[]>(highlightsData);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState((window as any).highlightFilter || '');
  const [activeLeagueFilter, setActiveLeagueFilter] = useState((window as any).highlightLeague || 'الكل');
  const [sortBy, setSortBy] = useState<'date' | 'views'>('date');
  const [timeRangeFilter, setTimeRangeFilter] = useState<'24h' | '3d' | '7d' | 'all'>('all');

  useEffect(() => {
    // Clear global filter after applying
    (window as any).highlightFilter = undefined;
    (window as any).highlightLeague = undefined;
  }, []);

  const leagues = ['الكل', 'الدوري الإنجليزي', 'الدوري الإسباني', 'الدوري الإيطالي', 'الدوري الألماني', 'الدوري الفرنسي', 'دوري أبطال أوروبا', 'الدوري الهولندي', 'الدوري البرتغالي', 'الدوري البلجيكي'];

  useEffect(() => {
    const fetchHighlights = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/highlights?league=${encodeURIComponent(activeLeagueFilter)}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setHighlights(data);
          }
        }
      } catch (error: any) {
        if (error?.message !== 'Failed to fetch' && error !== 'TypeError: Failed to fetch' && !String(error).includes('Failed to fetch')) {
          console.error("Failed to fetch real highlights, using fallback data", error);
        }
        setHighlights(highlightsData);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHighlights();
    
    // Poll for new highlights every 5 minutes
    const interval = setInterval(fetchHighlights, 300000);
    return () => clearInterval(interval);
  }, [activeLeagueFilter]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
        <p>جاري جلب أحدث الملخصات مباشرة من المصادر الرسمية...</p>
      </div>
    );
  }

  const filteredHighlights = highlights
    .filter(h => {
      const matchesSearch = h.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLeague = activeLeagueFilter === 'الكل' || h.league === activeLeagueFilter;
      const timeRangeMap: Record<string, number> = { '24h': 1440, '3d': 4320, '7d': 10080, 'all': Number.MAX_SAFE_INTEGER };
      const matchesTimeRange = (h.timeAgoMinutes || 0) <= timeRangeMap[timeRangeFilter];
      return matchesSearch && matchesLeague && matchesTimeRange;
    })
    .sort((a, b) => {
      if (sortBy === 'views') {
        return (b.viewCount || 0) - (a.viewCount || 0);
      }
      if (sortBy === 'date') {
        return (a.timeAgoMinutes || 999999) - (b.timeAgoMinutes || 999999);
      }
      return 0;
    });


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-6 px-2">
        
        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="ابحث عن ملخص مباراة، فريق، أو دوري..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pr-10 pl-4 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm dark:shadow-none"
              dir="rtl"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-sm dark:shadow-none w-full sm:w-auto">
            <button
              onClick={() => setSortBy('date')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                sortBy === 'date' 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              الأحدث
            </button>
            <button
              onClick={() => setSortBy('views')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                sortBy === 'views' 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              الأكثر مشاهدة
            </button>
          </div>
        </div>
      </div>

      {/* League Quick Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide px-2">
        {leagues.map((league) => (
          <button
            key={league}
            onClick={() => setActiveLeagueFilter(league)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 border ${
              activeLeagueFilter === league 
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20 scale-105 z-10' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-500/50'
            }`}
          >
            {league !== 'الكل' && (
              <LeagueLogo league={league} className="w-4 h-4" />
            )}
            {league}
          </button>
        ))}
      </div>

      {/* Selected League Header */}
      {activeLeagueFilter !== 'الكل' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mx-2 mb-6">
          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center p-1.5 shadow-inner">
            <LeagueLogo league={activeLeagueFilter} className="w-full h-full" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1">{activeLeagueFilter}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">أحدث ملخصات وأهداف البطولة</p>
          </div>
        </div>
      )}

      {/* Time Range Filters */}
      <div className="flex items-center gap-2 px-2 pb-4">
        {(['24h', '3d', '7d', 'all'] as const).map(range => (
          <button
            key={range}
            onClick={() => setTimeRangeFilter(range)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              timeRangeFilter === range
                ? 'bg-emerald-500 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {range === '24h' ? 'آخر 24 ساعة' : range === '3d' ? 'آخر 3 أيام' : range === '7d' ? 'آخر 7 أيام' : 'الكل'}
          </button>
        ))}
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
          <p>جاري تحميل الملخصات من يوتيوب...</p>
        </div>
      ) : filteredHighlights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <Search className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-lg font-medium">لا توجد نتائج بحث مطابقة</p>
          <button 
            onClick={() => setSearchTerm('')}
            className="mt-4 text-emerald-500 hover:underline text-sm font-medium"
          >
            مسح البحث
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHighlights.map(highlight => {
            const isExpanded = highlight.id === expandedHighlightId;
            return (
              <div 
                key={highlight.id} 
                onClick={() => setExpandedHighlightId(isExpanded ? null : highlight.id)}
                className={`group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-300 shadow-sm hover:shadow-xl dark:shadow-none hover:-translate-y-1 ${isExpanded ? 'md:col-span-2 lg:col-span-3' : ''}`}
              >
                <div className={`relative ${isExpanded ? 'aspect-video' : 'aspect-video'} overflow-hidden`}>
                  {isExpanded ? (
                    <iframe
                      src={`${highlight.videoUrl}?autoplay=1&rel=0&modestbranding=1`}
                      title={highlight.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <>
                      <img 
                        src={highlight.thumbnail} 
                        alt={highlight.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg scale-75 group-hover:scale-100 transition-transform duration-300">
                          <PlayCircle className="w-8 h-8 fill-current" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md border border-white/10">
                        {highlight.duration}
                      </div>
                      {(highlight.date.includes('ساعة') || highlight.date.includes('دقيقة') || highlight.date.includes('ثانية') || highlight.date.includes('الآن')) && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg animate-pulse">
                          جديد
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-lg border border-emerald-500/20">
                      <LeagueLogo league={highlight.league} className="w-3 h-3" />
                      {highlight.league}
                    </div>
                    {highlight.channel && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black rounded-lg border border-red-500/20">
                        <Youtube className="w-3 h-3" />
                        {highlight.channel}
                      </div>
                    )}
                    {(highlight.date.includes('ساعة') || highlight.date.includes('دقيقة') || highlight.date.includes('دقائق') || highlight.date.includes('ثانية')) && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-[10px] font-black rounded-lg shadow-sm animate-pulse">
                        <Activity className="w-2.5 h-2.5" />
                        بث حديث
                      </div>
                    )}
                  </div>
                  
                  <h3 className={`font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-relaxed ${isExpanded ? 'text-xl' : 'line-clamp-2 min-h-[40px]'}`} dir="rtl">
                    {highlight.title}
                  </h3>

                  {highlight.scorers && highlight.scorers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4" dir="rtl">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-bold ml-1">
                        <Goal className="w-3 h-3 text-emerald-500" />
                        <span>الهدافون:</span>
                      </div>
                      {highlight.scorers.map((scorer, idx) => (
                        <span key={idx} className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">
                          {scorer}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800/50">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{highlight.date}</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800/50">
                      <Eye className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{highlight.views}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TransfersView() {
  const [followedPlayers, setFollowedPlayers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const followedPlayersRef = useRef<string[]>([]);
  const prevTransfersRef = useRef<Transfer[]>([]);

  const fetchTransfers = async (isPolling = false) => {
    if (!isPolling) setIsRefreshing(true);
    try {
      const response = await fetch('/api/transfers');
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          const newTransfers = data && Array.isArray(data) && data.length > 0 ? data : transfersData;
          
          if (isPolling && prevTransfersRef.current.length > 0) {
            // Check for new transfers of followed players
            const existingIds = new Set(prevTransfersRef.current.map(t => t.id));
            const newlyAdded = newTransfers.filter((t: Transfer) => !existingIds.has(t.id));
            
            newlyAdded.forEach((t: Transfer) => {
              if (followedPlayersRef.current.includes(t.playerName)) {
                toast.success(`انتقال جديد: ${t.playerName} إلى ${t.toTeam.name}!`, {
                  icon: '⚽',
                  duration: 5000,
                });
              }
            });
          }
          
          prevTransfersRef.current = newTransfers;
          setTransfers(newTransfers);
        } else {
          console.warn("[Transfers] Received non-JSON response");
          if (!isPolling) {
            prevTransfersRef.current = transfersData;
            setTransfers(transfersData);
          }
        }
      } else if (!isPolling) {
        prevTransfersRef.current = transfersData;
        setTransfers(transfersData);
      }
    } catch (error) {
      console.error("Error fetching transfers:", error);
      if (!isPolling) {
        prevTransfersRef.current = transfersData;
        setTransfers(transfersData);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    followedPlayersRef.current = followedPlayers;
  }, [followedPlayers]);

  useEffect(() => {
    // Fetch real transfers data
    fetchTransfers();

    // Poll for new transfers every 30 seconds
    const pollInterval = setInterval(() => {
      fetchTransfers(true);
    }, 30000);

    const updateTimer = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      
      // Define windows (approximate dates for major European leagues)
      const winterStart = new Date(currentYear, 0, 1); // Jan 1
      const winterEnd = new Date(currentYear, 0, 31, 23, 59, 59); // Jan 31
      const summerStart = new Date(currentYear, 6, 1); // July 1
      const summerEnd = new Date(currentYear, 7, 31, 23, 59, 59); // Aug 31
      
      let targetDate: Date;

      if (now < winterStart) {
        targetDate = winterStart;
      } else if (now <= winterEnd) {
        targetDate = winterEnd;
      } else if (now < summerStart) {
        targetDate = summerStart;
      } else if (now <= summerEnd) {
        targetDate = summerEnd;
      } else {
        // After summer window, next is next year's winter
        targetDate = new Date(currentYear + 1, 0, 1);
      }

      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(pollInterval);
    };
  }, []);

  // Derived state for UI
  const { isMarketOpen, windowName, statusText } = (() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const winterStart = new Date(currentYear, 0, 1);
    const winterEnd = new Date(currentYear, 0, 31, 23, 59, 59);
    const summerStart = new Date(currentYear, 6, 1);
    const summerEnd = new Date(currentYear, 7, 31, 23, 59, 59);

    if (now >= winterStart && now <= winterEnd) {
      return { isMarketOpen: true, windowName: 'النافذة الشتوية', statusText: 'يغلق سوق الانتقالات خلال' };
    }
    if (now >= summerStart && now <= summerEnd) {
      return { isMarketOpen: true, windowName: 'النافذة الصيفية', statusText: 'يغلق سوق الانتقالات خلال' };
    }
    
    // If closed, determine which one is next
    if (now < winterStart || now > summerEnd) {
      return { isMarketOpen: false, windowName: 'النافذة الشتوية', statusText: 'يفتح سوق الانتقالات خلال' };
    }
    return { isMarketOpen: false, windowName: 'النافذة الصيفية', statusText: 'يفتح سوق الانتقالات خلال' };
  })();

  const toggleFollow = (playerName: string) => {
    const isFollowed = followedPlayers.includes(playerName);
    if (isFollowed) {
      toast.success(`تم إلغاء متابعة ${playerName}`);
      setFollowedPlayers(followedPlayers.filter(p => p !== playerName));
    } else {
      toast.success(`تمت متابعة ${playerName}`);
      setFollowedPlayers([...followedPlayers, playerName]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">سوق الانتقالات</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTransfers()}
            disabled={isRefreshing}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-emerald-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <span className={`text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1.5 ${
            isMarketOpen 
              ? 'text-emerald-600 dark:text-emerald-500 bg-emerald-100 dark:bg-emerald-500/10' 
              : 'text-rose-600 dark:text-rose-500 bg-rose-100 dark:bg-rose-500/10'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${isMarketOpen ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            {isMarketOpen ? 'مفتوح الآن' : 'مغلق الآن'}
          </span>
        </div>
      </div>

      {/* Transfer Window Countdown Banner */}
      <div className={`rounded-2xl p-5 text-white flex flex-col md:flex-row items-center justify-between shadow-lg gap-4 bg-gradient-to-r ${
        isMarketOpen ? 'from-emerald-500 to-teal-600' : 'from-slate-700 to-slate-900'
      }`}>
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{windowName}</h3>
            <p className="text-emerald-100 text-sm opacity-90">{statusText}</p>
          </div>
        </div>
        
        <div className="flex gap-2 sm:gap-3 text-center" dir="ltr">
          <div className="bg-black/20 rounded-xl p-2 min-w-[60px] sm:min-w-[70px] backdrop-blur-sm border border-white/10">
            <div className="text-2xl font-black">{timeLeft.days}</div>
            <div className="text-[10px] sm:text-xs font-medium opacity-80">يوم</div>
          </div>
          <div className="bg-black/20 rounded-xl p-2 min-w-[60px] sm:min-w-[70px] backdrop-blur-sm border border-white/10">
            <div className="text-2xl font-black">{timeLeft.hours.toString().padStart(2, '0')}</div>
            <div className="text-[10px] sm:text-xs font-medium opacity-80">ساعة</div>
          </div>
          <div className="bg-black/20 rounded-xl p-2 min-w-[60px] sm:min-w-[70px] backdrop-blur-sm border border-white/10">
            <div className="text-2xl font-black">{timeLeft.minutes.toString().padStart(2, '0')}</div>
            <div className="text-[10px] sm:text-xs font-medium opacity-80">دقيقة</div>
          </div>
          <div className="bg-black/20 rounded-xl p-2 min-w-[60px] sm:min-w-[70px] backdrop-blur-sm border border-white/10">
            <div className="text-2xl font-black text-emerald-300">{timeLeft.seconds.toString().padStart(2, '0')}</div>
            <div className="text-[10px] sm:text-xs font-medium opacity-80">ثانية</div>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">جاري جلب أحدث الانتقالات مباشرة من المصادر الرسمية...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {transfers.map(transfer => {
            const isFollowed = followedPlayers.includes(transfer.playerName);
            
            return (
            <div key={transfer.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all shadow-sm hover:shadow-md dark:shadow-none group">
              
              {/* Player Info */}
              <div className="flex items-center gap-5 w-full md:w-[35%]">
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-500 to-indigo-500 rounded-full opacity-20 group-hover:opacity-40 blur transition-opacity"></div>
                  <PlayerImage src={transfer.playerImage} name={transfer.playerName} />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white dark:border-slate-800 z-20 shadow-lg">
                    <Trophy className="w-3 h-3" />
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{transfer.playerName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{transfer.position}</span>
                  </div>
                </div>
              </div>

            {/* Transfer Path */}
            <div className="flex items-center justify-center gap-4 w-full md:w-[40%] py-6 md:py-0 border-y md:border-y-0 md:border-x border-slate-100 dark:border-slate-800/50 md:px-6">
              <div className="flex flex-col items-center flex-1 min-w-0">
                <TeamLogo team={transfer.fromTeam} />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-2 text-center truncate w-full">{transfer.fromTeam.name}</span>
              </div>
              
              <div className="flex flex-col items-center px-2 shrink-0">
                <div className={`rounded-full p-1.5 mb-1 border ${
                  transfer.type === 'loan' 
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-500' 
                    : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-500'
                }`}>
                  {transfer.type === 'loan' ? (
                    <RefreshCw className="w-4 h-4" />
                  ) : (
                    <ChevronLeft className="w-4 h-4" />
                  )}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  transfer.type === 'loan'
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {transfer.type === 'loan' ? 'إعارة' : 'انتقال دائم'}
                </span>
              </div>

              <div className="flex flex-col items-center flex-1 min-w-0">
                <TeamLogo team={transfer.toTeam} />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-2 text-center truncate w-full">{transfer.toTeam.name}</span>
              </div>
            </div>

            {/* Details & Follow */}
            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-[25%] gap-4 md:gap-3">
              <div className="flex flex-col items-start md:items-end">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-1">{transfer.date}</span>
                <span className="font-black text-xl text-emerald-600 dark:text-emerald-400 drop-shadow-sm">{transfer.fee}</span>
              </div>
              <button
                onClick={() => toggleFollow(transfer.playerName)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all transform active:scale-95 ${
                  isFollowed 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400'
                }`}
              >
                {isFollowed ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                {isFollowed ? 'متابع' : 'متابعة'}
              </button>
            </div>

          </div>
        )})}
        </div>
      )}
    </div>
  );
}
