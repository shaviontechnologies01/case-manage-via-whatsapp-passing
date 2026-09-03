import React from 'react';
import { 
  ClipboardList, 
  Clock, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function StatsBar({ 
  cases = [], 
  technicians = [], 
  selectedTechnician, 
  onSelectTechnician,
  selectedStatus,
  onSelectStatus,
  onOpenDailyTracker,
  settings
}) {
  const total = cases.length;
  const pending = cases.filter(c => (c.status || 'Pending') === 'Pending').length;
  const inProgress = cases.filter(c => c.status === 'In Progress').length;
  const completed = cases.filter(c => c.status === 'Completed').length;
  const cancelled = cases.filter(c => c.status === 'Cancelled').length;

  // Today specific calculation
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCases = cases.filter(c => {
    const cDate = (c.createdAt ? c.createdAt.slice(0, 10) : '') || c.orderDate || '';
    return cDate === todayStr || (c.orderDate && c.orderDate.includes(todayStr));
  });

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

  const todayDone = todayCases.filter(c => getEffectiveStatus(c) === 'Done').length;
  const todayCancelled = todayCases.filter(c => getEffectiveStatus(c) === 'Cancelled').length;
  const todayPending = todayCases.filter(c => getEffectiveStatus(c) === 'Pending').length;

  return (
    <div className="bg-white border-b border-slate-200/80 py-2.5 px-2 sm:px-4 lg:px-6 shadow-xs">
      <div className="w-full max-w-[1920px] mx-auto flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        
        {/* KPI Pills + Today's Live Counter */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          
          {/* Day via Day / Today's Tracker Button */}
          <button
            type="button"
            onClick={onOpenDailyTracker}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border-2 border-emerald-600 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-950 font-bold text-xs shadow-xs transition-all ring-1 ring-emerald-500/20 group"
            title="Open Day-by-Day Daily Tracker & Analytics"
          >
            <Calendar className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-emerald-900">Day via Day:</span>
              <span className="bg-emerald-600 text-white px-1.5 py-0.2 rounded text-[11px] font-mono">
                Done: {todayDone}
              </span>
              <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded text-[11px] font-mono">
                Pending: {todayPending}
              </span>
              <span className="bg-rose-600 text-white px-1.5 py-0.2 rounded text-[11px] font-mono">
                Cancel: {todayCancelled}
              </span>
            </div>
            <ArrowRight className="w-3 h-3 text-emerald-700 ml-0.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

          {/* Total Cases */}
          <button
            type="button"
            onClick={() => onSelectStatus('all')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              selectedStatus === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
            <span>Total Cases:</span>
            <span className="font-black text-sm ml-0.5">{total}</span>
          </button>

          {/* Pending */}
          <button
            type="button"
            onClick={() => onSelectStatus('Pending')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              selectedStatus === 'Pending'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50/80 text-amber-900 border-amber-200/80 hover:bg-amber-100'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${selectedStatus === 'Pending' ? 'text-amber-200' : 'text-amber-600'}`} />
            <span>Pending:</span>
            <span className="font-black text-sm ml-0.5">{pending}</span>
          </button>

          {/* In Progress */}
          <button
            type="button"
            onClick={() => onSelectStatus('In Progress')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              selectedStatus === 'In Progress'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-blue-50/80 text-blue-900 border-blue-200/80 hover:bg-blue-100'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${selectedStatus === 'In Progress' ? 'text-blue-200' : 'text-blue-600'}`} />
            <span>In Progress:</span>
            <span className="font-black text-sm ml-0.5">{inProgress}</span>
          </button>

          {/* Completed */}
          <button
            type="button"
            onClick={() => onSelectStatus('Completed')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              selectedStatus === 'Completed'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50/80 text-emerald-900 border-emerald-200/80 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${selectedStatus === 'Completed' ? 'text-emerald-200' : 'text-emerald-600'}`} />
            <span>Completed:</span>
            <span className="font-black text-sm ml-0.5">{completed}</span>
          </button>

          {/* Cancelled */}
          <button
            type="button"
            onClick={() => onSelectStatus('Cancelled')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              selectedStatus === 'Cancelled'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50/80 text-rose-900 border-rose-200/80 hover:bg-rose-100'
            }`}
          >
            <XCircle className={`w-3.5 h-3.5 ${selectedStatus === 'Cancelled' ? 'text-rose-200' : 'text-rose-600'}`} />
            <span>Cancelled:</span>
            <span className="font-black text-sm ml-0.5">{cancelled}</span>
          </button>
        </div>

        {/* Technician Quick Filter Tabs */}
        <div className="flex items-center overflow-x-auto pb-1 xl:pb-0 gap-1.5 text-xs select-none">
          <span className="text-slate-500 font-bold whitespace-nowrap mr-1 flex items-center text-[11px]">
            <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Filter Technician:
          </span>

          <button
            type="button"
            onClick={() => onSelectTechnician('all')}
            className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all text-xs ${
              selectedTechnician === 'all'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Techs
          </button>

          {technicians.map(tech => {
            const count = cases.filter(c => (c.assignedTechnicianName || c.assignedTo || '').toLowerCase() === tech.name.toLowerCase()).length;
            const isSelected = selectedTechnician.toLowerCase() === tech.name.toLowerCase();

            return (
              <button
                key={tech._id || tech.name}
                type="button"
                onClick={() => onSelectTechnician(isSelected ? 'all' : tech.name)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all text-xs border ${
                  isSelected
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span>{tech.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isSelected ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-200 text-slate-800'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
