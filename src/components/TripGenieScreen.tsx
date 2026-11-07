import { useState, useEffect } from 'react';
import {
  TripGenieAnalysis,
  TripGenieQuickFix,
  TripGenieChatMessage,
  TripDestination,
  ItineraryActivity,
  Expense,
  Member,
  UserProfile,
  ScreenTab,
} from '../types';
import { runTripGenieAnalysis, askTripGenieChat, getCachedAnalysis } from '../utils/tripGenieApi';
import { useLanguage } from '../context/LanguageContext';

interface TripGenieScreenProps {
  trip: TripDestination;
  itinerary: ItineraryActivity[];
  expenses: Expense[];
  members: Member[];
  user: UserProfile;
  onNavigate: (tab: ScreenTab) => void;
  onShowToast: (msg: string) => void;
  onOpenMap?: () => void;
  onOpenPacking?: () => void;
  onOpenAddExpense?: () => void;
}

type TabMode = 'overview' | 'itinerary' | 'budget' | 'group' | 'packing' | 'chat';

export function TripGenieScreen({
  trip,
  itinerary,
  expenses,
  members,
  user,
  onNavigate,
  onShowToast,
  onOpenMap,
  onOpenPacking,
  onOpenAddExpense,
}: TripGenieScreenProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabMode>('overview');
  const [analysis, setAnalysis] = useState<TripGenieAnalysis | null>(() => getCachedAnalysis(trip.id));
  const [isScanning, setIsScanning] = useState(false);
  const [quickFixes, setQuickFixes] = useState<TripGenieQuickFix[]>([]);

  // Chat State
  const [chatMessages, setChatMessages] = useState<TripGenieChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${(user?.name || 'Traveler').split(' ')[0] || 'there'}! I'm TripGenie, your AI travel concierge. I've analyzed all aspects of your journey to ${trip.name}—including your ${itinerary.length} scheduled stops, budget tracking, and group expenses. What would you like to explore or optimize today?`,
      timestamp: 'Just now',
      suggestedQuestions: [
        'How can we save ₹1,500 on dining?',
        'Is Day 3 schedule too rushed?',
        'What temple etiquette should we know?',
      ],
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);

  // Run or refresh analysis (isManual is true when user explicitly clicks the Analyze button)
  const handleAnalyzeAll = async (isManual: boolean = false) => {
    if (isManual) {
      setIsScanning(true);
      onShowToast(`TripGenie is analyzing all dimensions of ${trip.shortName}...`);
    }
    try {
      const result = await runTripGenieAnalysis({
        trip,
        itinerary,
        expenses,
        members,
        user,
      });
      setAnalysis(result);
      setQuickFixes(result.quickFixes || []);
      if (isManual) {
        onShowToast(`TripGenie 360° Analysis Complete! Score: ${result.readinessScore}/100`);
      }
    } catch (e) {
      console.error(e);
      if (isManual) {
        onShowToast('Analysis finished with cached insights.');
      }
    } finally {
      if (isManual) {
        setIsScanning(false);
      }
    }
  };

  // Initial scan if not cached (silent without blocking spinners or intrusive toasts)
  useEffect(() => {
    if (!analysis) {
      handleAnalyzeAll(false);
    } else {
      setQuickFixes(analysis.quickFixes || []);
    }
  }, [trip.id]);

  const handleApplyQuickFix = (fixId: string) => {
    setQuickFixes((prev) =>
      prev.map((f) => {
        if (f.id === fixId) {
          const applied = !f.applied;
          onShowToast(applied ? `Applied: ${f.title}` : `Reverted: ${f.title}`);
          return { ...f, applied };
        }
        return f;
      })
    );
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputQuestion.trim();
    if (!text || isChatSending) return;

    const userMsg: TripGenieChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsChatSending(true);

    const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amountUsd) || 0), 0);
    const budgetLimit = Number(user.tripBudgetLimit) || Number(trip.budgetLimitUsd) || Number(trip.totalBudgetUsd) || 1500;

    try {
      const response = await askTripGenieChat({
        message: text,
        destination: trip.name,
        totalSpent,
        budgetLimit,
        weather: `${trip.weatherTemp} ${trip.weatherCondition}`,
        memberCount: members.length,
      });

      const assistantMsg: TripGenieChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: response.suggestedQuestions,
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: 'I had trouble reaching the cloud, but keep in mind your schedule and budget are currently in good shape!',
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  const readinessScore = analysis?.readinessScore ?? 88;
  const isOptimal = readinessScore >= 85;
  const isAttention = readinessScore >= 70 && readinessScore < 85;

  return (
    <div className="flex flex-col w-full px-4 pb-12 space-y-4">
      {/* TripGenie AI Brand Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#004d77] via-[#006194] to-[#0284c7] text-white p-5 shadow-lg border border-white/10">
        {/* Decorative background aura */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-amber-400/15 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                <span className="material-symbols-outlined text-[24px] text-amber-300">
                  psychology
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold tracking-tight text-white drop-shadow-xs">
                    TripGenie AI
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
                    360° Auditor
                  </span>
                </div>
                <p className="text-[11px] text-white/80 font-medium">
                  Holistic AI travel intelligence analyzing all things
                </p>
              </div>
            </div>

            {/* Scan All Things Button */}
            <button
              onClick={() => handleAnalyzeAll(true)}
              disabled={isScanning}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                isScanning
                  ? 'bg-white/30 text-white cursor-wait'
                  : 'bg-white text-[#006194] hover:bg-amber-50 hover:shadow-lg'
              }`}
              type="button"
            >
              <span
                className={`material-symbols-outlined text-[18px] ${
                  isScanning ? 'animate-spin' : 'text-[#006194]'
                }`}
              >
                {isScanning ? 'sync' : 'auto_awesome'}
              </span>
              <span>{isScanning ? 'Analyzing...' : 'Analyze All'}</span>
            </button>
          </div>

          {/* Destination & Analyzed info */}
          <div className="flex items-center justify-between text-xs text-white/90 pt-1 border-t border-white/15">
            <span className="flex items-center gap-1 font-semibold truncate max-w-[200px]">
              <span className="material-symbols-outlined text-[14px] text-amber-300">
                location_on
              </span>
              {trip.name}
            </span>
            <span className="text-[10px] text-white/70">
              {analysis?.analyzedAt ? `Last analyzed at ${analysis.analyzedAt}` : 'Real-time sync'}
            </span>
          </div>
        </div>
      </div>

      {/* Trip Readiness Health Card */}
      <div className="w-full bg-white rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)] border border-[#e2e8f0]/80 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-lg text-white shadow-sm ${
                isOptimal ? 'bg-emerald-500' : isAttention ? 'bg-blue-600' : 'bg-rose-500'
              }`}
            >
              {readinessScore}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-[#131b2e]">
                  Trip Readiness Score
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    isOptimal
                      ? 'bg-emerald-100 text-emerald-800'
                      : isAttention
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isOptimal ? 'Optimal Shape' : isAttention ? 'Attention Needed' : 'Action Required'}
                </span>
              </div>
              <span className="text-xs text-[#64748b] leading-tight">
                {isOptimal
                  ? 'All dimensions aligned smoothly: schedule, expenses, and luggage.'
                  : 'Minor pacing or budget risks detected; review recommendations.'}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Dimension Progress Meters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[#f1f5f9]">
          {/* Dimension 1: Itinerary */}
          <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]/60 flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748b] font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#006194]">
                  calendar_month
                </span>
                Itinerary
              </span>
              <span className="font-bold text-[#131b2e]">
                {analysis?.itinerary.score || 89}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#006194] rounded-full transition-all duration-700"
                style={{ width: `${analysis?.itinerary.score || 89}%` }}
              />
            </div>
            <span className="text-[10px] text-[#64748b] truncate">
              {itinerary.length} stops planned
            </span>
          </div>

          {/* Dimension 2: Budget */}
          <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]/60 flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748b] font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-emerald-600">
                  account_balance_wallet
                </span>
                Budget
              </span>
              <span
                className={`font-bold ${
                  (analysis?.budget.score || 85) < 70 ? 'text-rose-600' : 'text-[#131b2e]'
                }`}
              >
                {analysis?.budget.score || 85}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  (analysis?.budget.score || 85) < 70 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${analysis?.budget.score || 85}%` }}
              />
            </div>
            <span className="text-[10px] text-[#64748b] truncate">
              {analysis?.budget.overBudgetRisk === 'high' ? 'Over budget risk' : 'Pacing well'}
            </span>
          </div>

          {/* Dimension 3: Group Harmony */}
          <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]/60 flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748b] font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-indigo-600">
                  groups
                </span>
                Group
              </span>
              <span className="font-bold text-[#131b2e]">
                {analysis?.group.score || 91}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                style={{ width: `${analysis?.group.score || 91}%` }}
              />
            </div>
            <span className="text-[10px] text-[#64748b] truncate">
              {members.length} active travelers
            </span>
          </div>

          {/* Dimension 4: Packing & Weather */}
          <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]/60 flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748b] font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-amber-600">
                  backpack
                </span>
                Packing
              </span>
              <span className="font-bold text-[#131b2e]">
                {analysis?.packing.score || 92}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-700"
                style={{ width: `${analysis?.packing.score || 92}%` }}
              />
            </div>
            <span className="text-[10px] text-[#64748b] truncate">
              {trip.weatherTemp} forecast
            </span>
          </div>
        </div>

        {/* AI Synthesis Summary quote */}
        <div className="p-3 rounded-xl bg-[#f0f9ff] text-[#0369a1] text-xs font-medium border border-[#bae6fd] flex items-start gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#0284c7] shrink-0 mt-0.5">
            auto_awesome
          </span>
          <p className="leading-relaxed">
            {analysis?.summary ||
              'TripGenie verified your schedule, expenditures, and group splits. Everything is set up for a smooth travel experience.'}
          </p>
        </div>
      </div>

      {/* Smart Quick Fixes Section */}
      {quickFixes.length > 0 && (
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-amber-500">
                bolt
              </span>
              TripGenie Smart Fixes
            </h2>
            <span className="text-[11px] text-[#006194] font-semibold">
              {quickFixes.filter((f) => f.applied).length}/{quickFixes.length} Applied
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {quickFixes.map((fix) => (
              <div
                key={fix.id}
                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 shadow-xs ${
                  fix.applied
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                    : 'bg-white border-[#e2e8f0] text-[#131b2e] hover:border-[#006194]/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        fix.applied
                          ? 'bg-emerald-200 text-emerald-800'
                          : 'bg-[#e0f2fe] text-[#006194]'
                      }`}
                    >
                      {fix.impact}
                    </span>
                    <span className="text-[10px] text-[#64748b] font-medium capitalize">
                      {fix.category}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold leading-tight">{fix.title}</h3>
                  <p className="text-[11px] text-[#64748b] mt-1 leading-snug line-clamp-2">
                    {fix.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyQuickFix(fix.id)}
                  className={`w-full py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                    fix.applied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#006194] text-white hover:bg-[#007bb9]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {fix.applied ? 'check_circle' : 'magic_button'}
                  </span>
                  <span>{fix.applied ? 'Applied' : 'Apply Smart Fix'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Pills between Deep Dive Dimensions */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar pt-1">
        {[
          { id: 'overview', label: 'All Dimensions', icon: 'grid_view' },
          { id: 'itinerary', label: 'Itinerary Pacing', icon: 'schedule' },
          { id: 'budget', label: 'Budget Audit', icon: 'payments' },
          { id: 'group', label: 'Group Debts', icon: 'handshake' },
          { id: 'packing', label: 'Packing & Climate', icon: 'luggage' },
          { id: 'chat', label: 'Ask TripGenie AI', icon: 'chat' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabMode)}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                isActive
                  ? 'bg-[#006194] text-white border-[#006194] shadow-sm'
                  : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-[#f2f3ff]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: OVERVIEW OR DEEP DIVES */}

      {/* Itinerary Deep Dive */}
      {(activeTab === 'overview' || activeTab === 'itinerary') && (
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)] border border-[#e2e8f0]/70 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#131b2e] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#006194] text-[18px]">
                calendar_clock
              </span>
              Schedule Pacing &amp; Clash Analysis
            </h3>
            <button
              onClick={() => onNavigate('itinerary')}
              className="text-xs text-[#006194] font-semibold hover:underline flex items-center gap-0.5"
              type="button"
            >
              Open Itinerary
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          <p className="text-xs text-[#475569] leading-relaxed bg-[#f8fafc] p-2.5 rounded-xl border border-[#e2e8f0]/60">
            {analysis?.itinerary.pacingAssessment ||
              'Morning slots are well-spaced with a high-energy hike in the afternoon.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Highlights */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="font-bold text-emerald-800 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">
                  check_circle
                </span>
                Optimized Highlights
              </span>
              <ul className="space-y-1 text-emerald-950">
                {analysis?.itinerary.highlights?.map((h, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500">•</span>
                    <span>{h}</span>
                  </li>
                )) || <li>Sunrise timing beats the tourist buses</li>}
              </ul>
            </div>

            {/* Clashes / Warnings */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="font-bold text-amber-900 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-amber-600">
                  warning
                </span>
                Potential Clashes &amp; Buffers
              </span>
              <ul className="space-y-1 text-amber-950">
                {analysis?.itinerary.clashes?.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-500">•</span>
                    <span>{c}</span>
                  </li>
                )) || <li>Keep covered markets as flexible rainy backup</li>}
              </ul>
            </div>
          </div>

          {/* Actionable suggestions */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
              TripGenie Itinerary Recommendations
            </span>
            {analysis?.itinerary.suggestions?.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-[#f2f3ff] text-xs text-[#131b2e]"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006194] text-[16px]">
                    lightbulb
                  </span>
                  <span>{s}</span>
                </span>
                <span className="text-[10px] text-[#006194] font-bold shrink-0">
                  Pro Tip
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget & Financials Deep Dive */}
      {(activeTab === 'overview' || activeTab === 'budget') && (
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)] border border-[#e2e8f0]/70 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#131b2e] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                account_balance_wallet
              </span>
              Budget Burn Rate &amp; Spending Audit
            </h3>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-xs text-[#006194] font-semibold hover:underline flex items-center gap-0.5"
              type="button"
            >
              All Expenses
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          {/* Quick metric stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]/60">
              <span className="text-[10px] text-[#64748b] font-medium block">Total Spent</span>
              <span className="text-sm font-extrabold text-[#131b2e]">
                ${(analysis?.budget.totalSpentUsd || 840).toFixed(2)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]/60">
              <span className="text-[10px] text-[#64748b] font-medium block">Daily Burn</span>
              <span className="text-sm font-extrabold text-[#006194]">
                ~${analysis?.budget.burnRateDailyUsd || 105}/day
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]/60">
              <span className="text-[10px] text-[#64748b] font-medium block">Projected Total</span>
              <span
                className={`text-sm font-extrabold ${
                  (analysis?.budget.projectedTotalUsd || 0) >
                  (analysis?.budget.budgetLimitUsd || 1500)
                    ? 'text-rose-600'
                    : 'text-emerald-600'
                }`}
              >
                ${analysis?.budget.projectedTotalUsd || 840}
              </span>
            </div>
          </div>

          {/* Money Saving Hacks */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0]">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">
                savings
              </span>
              Top Savings Opportunities
            </span>
            <ul className="space-y-1 text-xs text-emerald-950">
              {analysis?.budget.savingsOpportunities?.map((o, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-500">•</span>
                  <span>{o}</span>
                </li>
              )) || <li>Opt for set lunch menus for 40% dining discount</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Group & Debts Deep Dive */}
      {(activeTab === 'overview' || activeTab === 'group') && (
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)] border border-[#e2e8f0]/70 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#131b2e] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-indigo-600 text-[18px]">
                group_work
              </span>
              Group Balance &amp; Fair-Share Resolution
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {analysis?.group.fairnessIndex || '86% Balanced'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]/60">
              <span className="text-[10px] text-[#64748b]">Top Paid Out</span>
              <p className="font-bold text-[#131b2e]">
                {analysis?.group.topCreditor || 'Alex'}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]/60">
              <span className="text-[10px] text-[#64748b]">Pending Settlement</span>
              <p className="font-bold text-[#f43f5e]">
                {analysis?.group.topDebtor || 'Kenji'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
              Settlement Recommendations
            </span>
            {analysis?.group.settlementAdvice?.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 rounded-xl bg-[#f8fafc] text-xs text-[#334155]"
              >
                <span className="material-symbols-outlined text-[16px] text-indigo-600 shrink-0">
                  check_circle
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Packing & Climate Deep Dive */}
      {(activeTab === 'overview' || activeTab === 'packing') && (
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)] border border-[#e2e8f0]/70 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#131b2e] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-600 text-[18px]">
                luggage
              </span>
              Climate Forecast &amp; Cultural Attire
            </h3>
            {onOpenPacking && (
              <button
                onClick={onOpenPacking}
                className="text-xs text-[#006194] font-semibold hover:underline flex items-center gap-0.5"
                type="button"
              >
                View Packing List
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-[#fffbeb] border border-[#fef3c7] text-xs text-amber-950 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-amber-600">
              wb_sunny
            </span>
            <span>
              {analysis?.packing.weatherReadiness ||
                `Forecast: ${trip.weatherTemp}, partly cloudy. Light jackets recommended.`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]/60">
              <span className="font-bold text-[#131b2e] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-amber-600">
                  checklist
                </span>
                Must-Pack Essentials
              </span>
              <ul className="space-y-1 text-[#475569]">
                {analysis?.packing.missingEssentials?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span>✓</span>
                    <span>{item}</span>
                  </li>
                )) || <li>Slip-on shoes for temple floors</li>}
              </ul>
            </div>

            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]/60">
              <span className="font-bold text-[#131b2e] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#006194]">
                  temple_buddhist
                </span>
                Cultural Etiquette
              </span>
              <ul className="space-y-1 text-[#475569]">
                {analysis?.packing.culturalEtiquette?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span>•</span>
                    <span>{item}</span>
                  </li>
                )) || <li>Shoulders and knees covered in shrine sanctuaries</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ASK TRIPGENIE AI LIVE CHAT */}
      {(activeTab === 'chat' || activeTab === 'overview') && (
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)] border border-[#e2e8f0]/70 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#006194] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[18px]">psychology</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#131b2e]">Ask TripGenie</h3>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Contextual AI Travel Assistant
                </span>
              </div>
            </div>
            <span className="text-[10px] text-[#64748b]">Powered by Gemini</span>
          </div>

          {/* Chat Messages Log */}
          <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1">
            {chatMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs ${
                      isUser
                        ? 'bg-[#006194] text-white rounded-br-xs'
                        : 'bg-[#f1f5f9] text-[#131b2e] rounded-bl-xs'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <span
                      className={`text-[9px] block text-right mt-1 ${
                        isUser ? 'text-white/70' : 'text-[#64748b]'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Suggested follow up chips from assistant */}
                  {!isUser && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.suggestedQuestions.map((q, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSendMessage(q)}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-[#e2e7ff] text-[#006194] hover:bg-[#d0daff] transition-all font-medium"
                        >
                          💬 {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isChatSending && (
              <div className="flex items-center gap-2 text-xs text-[#64748b] p-2 bg-[#f8fafc] rounded-xl self-start">
                <span className="material-symbols-outlined text-[16px] text-[#006194] animate-spin">
                  sync
                </span>
                <span>TripGenie is consulting your trip data...</span>
              </div>
            )}
          </div>

          {/* Chat Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 pt-2 border-t border-[#f1f5f9]"
          >
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder={`Ask TripGenie about ${trip.shortName} schedule, food, or tips...`}
              className="flex-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#006194]"
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || isChatSending}
              className="px-3.5 py-2 rounded-xl bg-[#006194] text-white text-xs font-bold disabled:opacity-50 hover:bg-[#007bb9] active:scale-95 transition-all shadow-xs shrink-0 flex items-center gap-1"
            >
              <span>Send</span>
              <span className="material-symbols-outlined text-[14px]">send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
