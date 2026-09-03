import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ClipboardList, 
  Share2, 
  Copy, 
  Check, 
  ArrowRight, 
  Filter, 
  UserCheck, 
  TrendingUp, 
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react';

export default function DailyTrackerModal({
  isOpen,
  onClose,
  cases = [],
  technicians = [],
  onFilterByDateAndStatus
}) {
  const [copied, setCopied] = useState(false);
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);

  if (!isOpen) return null;

  // Helper to determine effective status: 'Done', 'Pending', 'Cancelled'
  const getEffectiveStatus = (c) => {
    const st = (c.status || '').toLowerCase().trim();
    const rem = (c.workDone || c.note || '').toLowerCase().trim();
    if (st === 'completed' || rem === 'done' || rem.startsWith('done') || rem.includes('completed')) {
      return 'Done';
    }
    if (st === 'cancelled' || rem.includes('cancel')) {
      return 'Cancelled';
    }
    return 'Pending';
  };

  // Helper to get date string YYYY-MM-DD
  const getCaseDateStr = (c) => {
    if (c.createdAt) {
      return c.createdAt.slice(0, 10);
    }
    if (c.orderDate) {
      const parts = c.orderDate.split(/[-/]/);
      if (parts.length === 3 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      return c.orderDate.slice(0, 10);
    }
    return new Date().toISOString().slice(0, 10);
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  // Group cases by date
  const dayMap = {};
  cases.forEach(c => {
    const dStr = getCaseDateStr(c);
    const effStatus = getEffectiveStatus(c);
    const tech = c.assignedTechnicianName || c.assignedTo || 'Unassigned';

    if (!dayMap[dStr]) {
      dayMap[dStr] = {
        date: dStr,
        isToday: dStr === todayStr,
        isYesterday: dStr === yesterdayStr,
        total: 0,
        done: 0,
        pending: 0,
        cancelled: 0,
        cases: [],
        technicians: {}
      };
    }

    dayMap[dStr].total += 1;
    dayMap[dStr].cases.push(c);

    if (effStatus === 'Done') dayMap[dStr].done += 1;
    else if (effStatus === 'Cancelled') dayMap[dStr].cancelled += 1;
    else dayMap[dStr].pending += 1;

    if (!dayMap[dStr].technicians[tech]) {
      dayMap[dStr].technicians[tech] = { done: 0, pending: 0, cancelled: 0, total: 0 };
    }
    dayMap[dStr].technicians[tech].total += 1;
    if (effStatus === 'Done') dayMap[dStr].technicians[tech].done += 1;
    else if (effStatus === 'Cancelled') dayMap[dStr].technicians[tech].cancelled += 1;
    else dayMap[dStr].technicians[tech].pending += 1;
  });

  // Ensure today is present
  if (!dayMap[todayStr]) {
    dayMap[todayStr] = {
      date: todayStr,
      isToday: true,
      isYesterday: false,
      total: 0,
      done: 0,
      pending: 0,
      cancelled: 0,
      cases: [],
      technicians: {}
    };
  }

  const sortedDays = Object.values(dayMap).sort((a, b) => b.date.localeCompare(a.date));
  const todayData = dayMap[todayStr];

  const formatDisplayDate = (dStr) => {
    if (dStr === todayStr) return 'Today (आज)';
    if (dStr === yesterdayStr) return 'Yesterday (कल)';
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' });
      }
    } catch {
      // fallback
    }
    return dStr;
  };

  // Handle 1-click filter
  const handleApplyFilter = (date, status = 'all') => {
    if (onFilterByDateAndStatus) {
      onFilterByDateAndStatus(date, status);
    }
    onClose();
  };

  // Copy WhatsApp summary for Today or selected day
  const handleCopyReport = (dayObj = todayData) => {
    const text = `📊 *AO SMITH DAILY CASE REPORT* 📊\n📅 *Date:* ${formatDisplayDate(dayObj.date)} (${dayObj.date})\n━━━━━━━━━━━━━━━━━━━━\n✅ *Done (Completed):* ${dayObj.done}\n⏳ *Pending / Today:* ${dayObj.pending}\n❌ *Cancelled:* ${dayObj.cancelled}\n📋 *Total Cases:* ${dayObj.total}\n━━━━━━━━━━━━━━━━━━━━\n${Object.keys(dayObj.technicians).length > 0 ? '👷 *Technician Breakdown:*\n' + Object.entries(dayObj.technicians).map(([tech, counts]) => `• ${tech}: ${counts.done} Done | ${counts.pending} Pending | ${counts.cancelled} Cancel`).join('\n') + '\n━━━━━━━━━━━━━━━━━━━━\n' : ''}*WEDLANCER Case Portal Live*`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-emerald-800/40">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/20 border border-emerald-400/30 p-2 rounded-xl">
              <Calendar className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Day via Day Status Tracker</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  दैनिक रिपोर्ट
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Daily breakdown: Kitna Done hua, kitna Pending rha, aur kitna Cancel hua
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleCopyReport(todayData)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all"
              title="Copy today's report text formatted for WhatsApp"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Daily Report'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 bg-slate-50/50">
          
          {/* TODAY'S LIVE SUMMARY CARDS */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Today's Status / आज का स्टेटस ({formatDisplayDate(todayStr)} - {todayStr})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleApplyFilter(todayStr, 'all')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
              >
                <span>View all {todayData.total} cases of today in table</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Total Today */}
              <div 
                onClick={() => handleApplyFilter(todayStr, 'all')}
                className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl p-3 cursor-pointer transition-all hover:border-slate-300 shadow-2xs group"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
                  <span>Total Active Today</span>
                  <ClipboardList className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                </div>
                <div className="text-2xl font-black text-slate-900">{todayData.total}</div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <span>Click to view all</span>
                </div>
              </div>

              {/* Done Today */}
              <div 
                onClick={() => handleApplyFilter(todayStr, 'Completed')}
                className="bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl p-3 cursor-pointer transition-all hover:border-emerald-300 shadow-2xs group"
              >
                <div className="flex items-center justify-between text-xs text-emerald-800 font-bold mb-1">
                  <span>Done (काम पूरा)</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-black text-emerald-700">{todayData.done}</div>
                <div className="text-[11px] text-emerald-700 mt-1 font-medium">
                  {todayData.total > 0 ? `${Math.round((todayData.done / todayData.total) * 100)}% of today's total` : '0%'}
                </div>
              </div>

              {/* Pending Today */}
              <div 
                onClick={() => handleApplyFilter(todayStr, 'Pending')}
                className="bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 rounded-xl p-3 cursor-pointer transition-all hover:border-amber-300 shadow-2xs group"
              >
                <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-1">
                  <span>Pending (आज का काम)</span>
                  <Clock className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-black text-amber-700">{todayData.pending}</div>
                <div className="text-[11px] text-amber-700 mt-1 font-medium">
                  {todayData.total > 0 ? `${Math.round((todayData.pending / todayData.total) * 100)}% pending` : '0%'}
                </div>
              </div>

              {/* Cancelled Today */}
              <div 
                onClick={() => handleApplyFilter(todayStr, 'Cancelled')}
                className="bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200 rounded-xl p-3 cursor-pointer transition-all hover:border-rose-300 shadow-2xs group"
              >
                <div className="flex items-center justify-between text-xs text-rose-800 font-bold mb-1">
                  <span>Cancelled (कैंसिल)</span>
                  <XCircle className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-black text-rose-700">{todayData.cancelled}</div>
                <div className="text-[11px] text-rose-700 mt-1 font-medium">
                  {todayData.total > 0 ? `${Math.round((todayData.cancelled / todayData.total) * 100)}% cancelled` : '0%'}
                </div>
              </div>
            </div>

            {/* Quick Action Hint */}
            <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-lg px-3 py-2 text-xs text-emerald-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Jab aap WhatsApp message paste karte hain, remarks auto <strong>"today"</strong> le leta hai aur case <strong>Pending</strong> me rehta hai. Done hone par remarks <strong>"done"</strong> aur cancel hone par <strong>"cancel"</strong> ho jata hai.</span>
              </span>
            </div>
          </div>

          {/* DAY-BY-DAY HISTORICAL LOG */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Day via Day Breakdown (तारीख के अनुसार दैनिक विवरण)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {sortedDays.length} date(s) recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-2.5 px-3">Date (तारीख)</th>
                    <th className="py-2.5 px-3 text-center">Total</th>
                    <th className="py-2.5 px-3 text-center">Done (पूरा)</th>
                    <th className="py-2.5 px-3 text-center">Pending (बाकी)</th>
                    <th className="py-2.5 px-3 text-center">Cancelled (कैंसिल)</th>
                    <th className="py-2.5 px-3">Progress</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedDays.map((day) => {
                    const donePercent = day.total > 0 ? Math.round((day.done / day.total) * 100) : 0;
                    const pendingPercent = day.total > 0 ? Math.round((day.pending / day.total) * 100) : 0;
                    const cancelPercent = day.total > 0 ? Math.round((day.cancelled / day.total) * 100) : 0;

                    return (
                      <tr 
                        key={day.date}
                        className={`hover:bg-slate-50/80 transition-colors ${day.isToday ? 'bg-emerald-50/40 font-medium' : ''}`}
                      >
                        {/* Date */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">
                              {formatDisplayDate(day.date)}
                            </span>
                            {day.isToday && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-extrabold shadow-2xs">
                                Today
                              </span>
                            )}
                            {day.isYesterday && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-600 text-white font-semibold">
                                Yesterday
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {day.date}
                          </div>
                        </td>

                        {/* Total Cases */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-1 rounded-md text-xs">
                            {day.total}
                          </span>
                        </td>

                        {/* Done */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleApplyFilter(day.date, 'Completed')}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200 transition-colors"
                            title="Filter to Done cases on this date"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{day.done}</span>
                          </button>
                        </td>

                        {/* Pending */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleApplyFilter(day.date, 'Pending')}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold hover:bg-amber-200 transition-colors"
                            title="Filter to Pending cases on this date"
                          >
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{day.pending}</span>
                          </button>
                        </td>

                        {/* Cancelled */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleApplyFilter(day.date, 'Cancelled')}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 font-bold hover:bg-rose-200 transition-colors"
                            title="Filter to Cancelled cases on this date"
                          >
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>{day.cancelled}</span>
                          </button>
                        </td>

                        {/* Progress Bar */}
                        <td className="py-3 px-3 min-w-[120px]">
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex shadow-2xs">
                            <div 
                              className="bg-emerald-500 h-full" 
                              style={{ width: `${donePercent}%` }} 
                              title={`Done: ${day.done} (${donePercent}%)`}
                            />
                            <div 
                              className="bg-amber-400 h-full" 
                              style={{ width: `${pendingPercent}%` }} 
                              title={`Pending: ${day.pending} (${pendingPercent}%)`}
                            />
                            <div 
                              className="bg-rose-500 h-full" 
                              style={{ width: `${cancelPercent}%` }} 
                              title={`Cancelled: ${day.cancelled} (${cancelPercent}%)`}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                            <span className="text-emerald-700 font-bold">{donePercent}% done</span>
                            <span className="text-amber-700 font-bold">{day.pending} left</span>
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleApplyFilter(day.date, 'all')}
                              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center space-x-1 shadow-2xs transition-colors"
                              title="Filter main table to view cases of this day"
                            >
                              <Filter className="w-3 h-3" />
                              <span>View Cases</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyReport(day)}
                              className="p-1 rounded text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
                              title="Copy this day's report for WhatsApp"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs">
          <div className="text-slate-500 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Clicking any <strong>"Done"</strong>, <strong>"Pending"</strong>, or <strong>"Cancelled"</strong> pill immediately filters the table.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
