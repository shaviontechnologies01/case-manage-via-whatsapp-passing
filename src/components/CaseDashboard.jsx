import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  RefreshCw, 
  Plus, 
  FileSpreadsheet, 
  SlidersHorizontal,
  ChevronDown,
  Calendar,
  Layers,
  ArrowUpDown,
  FileText,
  Sparkles,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  Tag,
  Hash,
  RotateCcw
} from 'lucide-react';
import ExcelTableView from './ExcelTableView.jsx';

export default function CaseDashboard({ 
  allCases = [],
  cases = [], 
  technicians = [], 
  settings = {},
  selectedSheet = 'All',
  onSelectSheet,
  selectedTechnician, 
  onSelectTechnician, 
  selectedStatus, 
  onSelectStatus,
  searchQuery, 
  setSearchQuery,
  selectedCaseType,
  setSelectedCaseType,
  dateFilter,
  setDateFilter,
  viewMode,
  onEditCase, 
  onDeleteCase,
  onQuickUpdateStatus,
  onQuickUpdateWorkDone,
  onOpenNewCase,
  onOpenParser,
  onOpenImportExcel,
  onOpenDailyTracker,
  onExportExcel,
  onRefresh
}) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const searchInputRef = useRef(null);

  // Global keyboard shortcut '/' to focus search box
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalPool = allCases.length > 0 ? allCases : cases;

  // Extract distinct sheet names with counts
  const availableSheets = React.useMemo(() => {
    const set = new Set(['Shubh', 'Aarvee', 'Sheet1']);
    totalPool.forEach(c => {
      if (c.sheetName && c.sheetName.trim()) set.add(c.sheetName.trim());
    });
    return Array.from(set);
  }, [totalPool]);

  // Extract unique case types with canonical Excel types first
  const canonicalTypes = ['Installation', 'Complaint', 'Order', 'Auto'];
  const otherTypes = Array.from(new Set([
    ...(settings?.caseTypes || []),
    ...totalPool.map(c => c.caseType).filter(Boolean),
    ...totalPool.map(c => c.sourceTag).filter(Boolean)
  ])).filter(t => !canonicalTypes.includes(t));
  const availableCaseTypes = [...canonicalTypes, ...otherTypes];

  // Helper count calculations
  const getSheetCount = (sheetName) => {
    if (sheetName === 'All') return totalPool.length;
    return totalPool.filter(c => (c.sheetName || 'Shubh').toLowerCase() === sheetName.toLowerCase()).length;
  };

  const getTypeCount = (type) => {
    if (type === 'all') return totalPool.length;
    return totalPool.filter(c => (c.caseType || c.sourceTag || 'Installation').toLowerCase() === type.toLowerCase()).length;
  };

  const getStatusCount = (status) => {
    if (status === 'all') return totalPool.length;
    return totalPool.filter(c => (c.status || 'Pending').toLowerCase() === status.toLowerCase()).length;
  };

  const getTechCount = (techName) => {
    if (techName === 'all') return totalPool.length;
    return totalPool.filter(c => (c.assignedTechnicianName || c.assignedTo || '').toLowerCase() === techName.toLowerCase()).length;
  };

  const clearAllFilters = () => {
    if (onSelectSheet) onSelectSheet('All');
    onSelectTechnician('all');
    onSelectStatus('all');
    setSelectedCaseType('all');
    setSearchQuery('');
    setDateFilter({ start: '', end: '' });
  };

  const hasActiveFilters = 
    (selectedSheet && selectedSheet !== 'All') ||
    selectedTechnician !== 'all' || 
    selectedStatus !== 'all' || 
    selectedCaseType !== 'all' || 
    (searchQuery && searchQuery.trim() !== '') ||
    dateFilter.start !== '' ||
    dateFilter.end !== '';

  const activeFiltersCount = 
    (selectedSheet && selectedSheet !== 'All' ? 1 : 0) +
    (selectedTechnician !== 'all' ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0) +
    (selectedCaseType !== 'all' ? 1 : 0) +
    (searchQuery && searchQuery.trim() !== '' ? 1 : 0) +
    (dateFilter.start || dateFilter.end ? 1 : 0);

  // Quick preset keyword click
  const handleQuickKeywordClick = (kw) => {
    // If it's a sheet
    if (availableSheets.some(s => s.toLowerCase() === kw.toLowerCase())) {
      if (onSelectSheet) onSelectSheet(kw);
      return;
    }
    // If it's a case type
    if (canonicalTypes.some(t => t.toLowerCase() === kw.toLowerCase())) {
      setSelectedCaseType(kw);
      return;
    }
    // Otherwise toggle into search query
    if (searchQuery.toLowerCase().includes(kw.toLowerCase())) {
      setSearchQuery('');
    } else {
      setSearchQuery(prev => prev ? `${prev} ${kw}` : kw);
    }
  };

  return (
    <div className="space-y-3">
      
      {/* Universal Search & Multi-Filter Control Hub */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-3 sm:p-4 space-y-3">
        
        {/* Top Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 sm:gap-3">
          
          {/* Universal Search Box (Field-Free Omnisearch) */}
          <div className="relative flex-1 min-w-[300px]">
            <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchQuery('');
              }}
              placeholder="Universal Search across all fields (Case #, Name, Phone, Address, Tech, Type, Sheet, Remarks, Price...)"
              className="w-full pl-9.5 pr-20 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-hidden transition-all placeholder:text-slate-400 font-medium text-slate-900 shadow-xs"
            />
            
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-slate-200 transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded border border-slate-300" title="Press '/' to search">
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* Quick Dropdown Selectors */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            
            {/* Sheet Dropdown */}
            {onSelectSheet && (
              <div className="flex items-center space-x-1 text-xs">
                <span className="text-slate-400 font-bold hidden sm:inline text-[11px]">Sheet:</span>
                <select
                  value={selectedSheet}
                  onChange={(e) => onSelectSheet(e.target.value)}
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border focus:outline-hidden transition-colors ${
                    selectedSheet !== 'All' 
                      ? 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-400/40' 
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                  }`}
                >
                  <option value="All">All Sheets ({totalPool.length})</option>
                  {availableSheets.map(s => (
                    <option key={s} value={s}>{s} ({getSheetCount(s)})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Technician Filter Dropdown */}
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-400 font-bold hidden sm:inline text-[11px]">Tech:</span>
              <select
                value={selectedTechnician}
                onChange={(e) => onSelectTechnician(e.target.value)}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border focus:outline-hidden transition-colors ${
                  selectedTechnician !== 'all' 
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 ring-1 ring-emerald-400/40' 
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                }`}
              >
                <option value="all">All Technicians ({totalPool.length})</option>
                {technicians.map(t => (
                  <option key={t._id || t.name} value={t.name}>{t.name} ({getTechCount(t.name)})</option>
                ))}
              </select>
            </div>

            {/* Status Filter Dropdown */}
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-400 font-bold hidden sm:inline text-[11px]">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => onSelectStatus(e.target.value)}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border focus:outline-hidden transition-colors ${
                  selectedStatus !== 'all' 
                    ? 'bg-blue-50 text-blue-900 border-blue-300 ring-1 ring-blue-400/40' 
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                }`}
              >
                <option value="all">All Statuses ({totalPool.length})</option>
                <option value="Pending">Pending ({getStatusCount('Pending')})</option>
                <option value="In Progress">In Progress ({getStatusCount('In Progress')})</option>
                <option value="Completed">Completed ({getStatusCount('Completed')})</option>
                <option value="Cancelled">Cancelled ({getStatusCount('Cancelled')})</option>
              </select>
            </div>

            {/* Case Type Dropdown */}
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-400 font-bold hidden sm:inline text-[11px]">Type:</span>
              <select
                value={selectedCaseType}
                onChange={(e) => setSelectedCaseType(e.target.value)}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border focus:outline-hidden transition-colors ${
                  selectedCaseType !== 'all' 
                    ? 'bg-purple-50 text-purple-900 border-purple-300 ring-1 ring-purple-400/40' 
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                }`}
              >
                <option value="all">All Types ({totalPool.length})</option>
                {availableCaseTypes.map(ct => (
                  <option key={ct} value={ct}>{ct} ({getTypeCount(ct)})</option>
                ))}
              </select>
            </div>

            {/* Toggle Advanced Filters (Date Range) */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center space-x-1 ${
                showAdvancedFilters || dateFilter.start || dateFilter.end
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Filter by Date Range"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Date</span>
            </button>

            {/* Clear All Active Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200 shadow-xs"
                title="Reset all active filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ({activeFiltersCount})</span>
              </button>
            )}

            {/* Refresh */}
            <button
              type="button"
              onClick={onRefresh}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shadow-xs"
              title="Refresh Portal Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

          </div>
        </div>

        {/* 1-Click Field-Free Quick Filter Pills Ribbon */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          
          {/* Quick Case Type Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-0.5 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>Quick Types:</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedCaseType('all')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all ${
                selectedCaseType === 'all'
                  ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              All Types
            </button>

            <button
              type="button"
              onClick={() => setSelectedCaseType(selectedCaseType === 'Installation' ? 'all' : 'Installation')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all flex items-center gap-1 ${
                selectedCaseType === 'Installation'
                  ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                  : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
              }`}
            >
              <span>Installation</span>
              <span className={`text-[10px] px-1 rounded-full ${selectedCaseType === 'Installation' ? 'bg-purple-900 text-purple-200' : 'bg-purple-200 text-purple-900'}`}>
                {getTypeCount('Installation')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCaseType(selectedCaseType === 'Complaint' ? 'all' : 'Complaint')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all flex items-center gap-1 ${
                selectedCaseType === 'Complaint'
                  ? 'bg-rose-700 text-white border-rose-800 shadow-xs'
                  : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span>Complaint</span>
              <span className={`text-[10px] px-1 rounded-full ${selectedCaseType === 'Complaint' ? 'bg-rose-900 text-rose-200' : 'bg-rose-200 text-rose-900'}`}>
                {getTypeCount('Complaint')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCaseType(selectedCaseType === 'Order' ? 'all' : 'Order')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all flex items-center gap-1 ${
                selectedCaseType === 'Order'
                  ? 'bg-blue-700 text-white border-blue-800 shadow-xs'
                  : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <span>Order</span>
              <span className={`text-[10px] px-1 rounded-full ${selectedCaseType === 'Order' ? 'bg-blue-900 text-blue-200' : 'bg-blue-200 text-blue-900'}`}>
                {getTypeCount('Order')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCaseType(selectedCaseType === 'Auto' ? 'all' : 'Auto')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all flex items-center gap-1 ${
                selectedCaseType === 'Auto'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span>Auto</span>
              <span className={`text-[10px] px-1 rounded-full ${selectedCaseType === 'Auto' ? 'bg-amber-800 text-amber-100' : 'bg-amber-200 text-amber-900'}`}>
                {getTypeCount('Auto')}
              </span>
            </button>
          </div>

          {/* Quick Status / Common Keywords */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] font-bold text-slate-400 mr-0.5">Quick Status:</span>
            
            <button
              type="button"
              onClick={() => onSelectStatus(selectedStatus === 'Pending' ? 'all' : 'Pending')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all flex items-center gap-1 ${
                selectedStatus === 'Pending'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Pending ({getStatusCount('Pending')})</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectStatus(selectedStatus === 'Completed' ? 'all' : 'Completed')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all flex items-center gap-1 ${
                selectedStatus === 'Completed'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Completed ({getStatusCount('Completed')})</span>
            </button>
          </div>

        </div>

        {/* Active Filter Badges Strip */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-400 font-bold mr-1">Active Filters:</span>
            
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-900 px-2.5 py-0.5 rounded-md border border-emerald-300 font-bold">
                <span>Keyword: <strong>"{searchQuery}"</strong></span>
                <button onClick={() => setSearchQuery('')} className="hover:text-rose-600 font-bold ml-1">✕</button>
              </span>
            )}

            {selectedSheet && selectedSheet !== 'All' && onSelectSheet && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 px-2.5 py-0.5 rounded-md border border-amber-300 font-bold">
                <span>Sheet: <strong>{selectedSheet}</strong></span>
                <button onClick={() => onSelectSheet('All')} className="hover:text-rose-600 font-bold ml-1">✕</button>
              </span>
            )}

            {selectedTechnician !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-900 px-2.5 py-0.5 rounded-md border border-teal-300 font-bold">
                <span>Tech: <strong>{selectedTechnician}</strong></span>
                <button onClick={() => onSelectTechnician('all')} className="hover:text-rose-600 font-bold ml-1">✕</button>
              </span>
            )}

            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-900 px-2.5 py-0.5 rounded-md border border-blue-300 font-bold">
                <span>Status: <strong>{selectedStatus}</strong></span>
                <button onClick={() => onSelectStatus('all')} className="hover:text-rose-600 font-bold ml-1">✕</button>
              </span>
            )}

            {selectedCaseType !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-900 px-2.5 py-0.5 rounded-md border border-purple-300 font-bold">
                <span>Type: <strong>{selectedCaseType}</strong></span>
                <button onClick={() => setSelectedCaseType('all')} className="hover:text-rose-600 font-bold ml-1">✕</button>
              </span>
            )}

            {(dateFilter.start || dateFilter.end) && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 px-2.5 py-0.5 rounded-md border border-amber-300 font-bold">
                <span>Date: <strong>{dateFilter.start || 'Start'} → {dateFilter.end || 'Now'}</strong></span>
                <button onClick={() => setDateFilter({ start: '', end: '' })} className="hover:text-rose-600 font-bold ml-1">✕</button>
              </span>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
              className="text-rose-600 hover:text-rose-800 font-bold underline text-[11px] ml-1"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Date Range Drawer (if toggled) */}
        {showAdvancedFilters && (
          <div className="mt-2 pt-2.5 border-t border-slate-200 flex flex-wrap items-center gap-2 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
            <span className="text-slate-600 font-bold flex items-center text-xs">
              <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Order / Created Date:
            </span>
            <div className="flex items-center space-x-1.5">
              <input
                type="date"
                value={dateFilter.start || ''}
                onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-slate-50 font-medium"
              />
              <span className="text-slate-400 text-xs font-bold">to</span>
              <input
                type="date"
                value={dateFilter.end || ''}
                onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-slate-50 font-medium"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                setDateFilter({ start: today, end: today });
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                const yDate = d.toISOString().slice(0, 10);
                setDateFilter({ start: yDate, end: yDate });
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 7);
                setDateFilter({ start: d.toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) });
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setDate(1);
                setDateFilter({ start: d.toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) });
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
            >
              This Month
            </button>
            {onOpenDailyTracker && (
              <button
                type="button"
                onClick={onOpenDailyTracker}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black transition-colors flex items-center gap-1 shadow-xs ml-auto"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Day via Day Breakdown</span>
              </button>
            )}
            {(dateFilter.start || dateFilter.end) && (
              <button
                type="button"
                onClick={() => setDateFilter({ start: '', end: '' })}
                className="px-2 py-1 text-rose-600 hover:text-rose-800 text-xs font-bold"
              >
                Clear Date
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Table / Excel View */}
      <ExcelTableView
        cases={cases}
        allCases={totalPool}
        technicians={technicians}
        settings={settings}
        searchQuery={searchQuery}
        selectedSheet={selectedSheet}
        onSelectSheet={onSelectSheet}
        onEditCase={onEditCase}
        onDeleteCase={onDeleteCase}
        onQuickUpdateStatus={onQuickUpdateStatus}
        onQuickUpdateWorkDone={onQuickUpdateWorkDone}
        onOpenNewCase={onOpenNewCase}
        onOpenImportExcel={onOpenImportExcel}
        onOpenDailyTracker={onOpenDailyTracker}
        onExportExcel={onExportExcel}
        onRefresh={onRefresh}
      />

    </div>
  );
}
