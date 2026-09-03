import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Filter, 
  X, 
  Check, 
  Edit3, 
  Sparkles, 
  Upload, 
  Download, 
  RotateCcw, 
  CheckSquare, 
  Square, 
  Plus, 
  Layers, 
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  FolderSymlink,
  FileDown,
  Copy,
  Phone,
  MessageCircle,
  Maximize2,
  Minimize2,
  Sliders,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { REMARK_PRESETS, CATEGORIZED_REMARKS } from '../utils/remarkPresets.js';
import { exportCasesToExcel, exportSeparateSheetsToExcel, exportCasesToCsv, shareExcelViaWhatsApp, generateExcelWorkbookBlob } from '../utils/exportExcel.js';
import { saveAs } from 'file-saver';
import WhatsAppShareModal from './WhatsAppShareModal.jsx';
// Note: Row-level WhatsApp chat buttons removed per user preference

// Text highlighter for search keywords matching
function HighlightText({ text = '', query = '' }) {
  if (!query || !query.trim() || text === null || text === undefined || text === '') {
    return <span>{text || '—'}</span>;
  }
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return <span>{text || '—'}</span>;

  try {
    const escaped = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const str = String(text);
    const parts = str.split(regex);

    return (
      <span>
        {parts.map((part, i) => {
          const isMatch = tokens.some(tok => tok.toLowerCase() === part.toLowerCase());
          return isMatch ? (
            <mark key={i} className="bg-amber-300 text-slate-950 font-bold px-0.5 rounded shadow-2xs">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          );
        })}
      </span>
    );
  } catch (err) {
    return <span>{text || '—'}</span>;
  }
}

export default function ExcelTableView({ 
  cases = [], 
  allCases = [],
  technicians = [],
  settings = {},
  searchQuery = '',
  selectedSheet: propSelectedSheet,
  onSelectSheet,
  onEditCase, 
  onDeleteCase,
  onQuickUpdateStatus,
  onQuickUpdateWorkDone,
  onOpenNewCase,
  onOpenImportExcel,
  onOpenDailyTracker,
  onExportExcel,
  onRefresh
}) {
  // Density mode: 'compact' (max density, default), 'standard', 'comfortable'
  const [density, setDensity] = useState('compact');

  // Column specific filters state: { [columnKey]: Set of selected values or null }
  const [columnFilters, setColumnFilters] = useState({});
  // Column specific sort state: { column: 'caseNumber', direction: 'asc' | 'desc' } | null
  const [sortConfig, setSortConfig] = useState(null);
  
  // Open filter popover state: 'caseType' | 'caseNumber' | 'customerName' | 'product' | 'assignedTechnicianName' | 'workDone' | null
  const [activeFilterCol, setActiveFilterCol] = useState(null);
  const [filterSearchText, setFilterSearchText] = useState('');
  const [tempSelectedValues, setTempSelectedValues] = useState(new Set());
  
  // Sheet tab selection: 'All' or specific sheet name (e.g. 'Shubh', 'Aarvee', 'Sheet1')
  const [internalSheet, setInternalSheet] = useState('All');
  const selectedSheet = propSelectedSheet !== undefined ? propSelectedSheet : internalSheet;
  const setSelectedSheet = (sheet) => {
    if (onSelectSheet) onSelectSheet(sheet);
    setInternalSheet(sheet);
  };

  // Custom added sheets by user during session
  const [customSheets, setCustomSheets] = useState([]);
  const [isAddingSheet, setIsAddingSheet] = useState(false);
  const [newSheetInput, setNewSheetInput] = useState('');

  // Export dropdown state
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);

  // WhatsApp Share Modal state
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Inline remarks popover / editing state
  const [popoverRemarksCaseId, setPopoverRemarksCaseId] = useState(null);
  const [editingRemarksId, setEditingRemarksId] = useState(null);
  const [remarksValue, setRemarksValue] = useState('');
  const [activeRemarkCategory, setActiveRemarkCategory] = useState('All');

  // Copy feedback state: { [caseId]: boolean }
  const [copiedId, setCopiedId] = useState(null);

  // Inline technician editing state
  const [assigningTechId, setAssigningTechId] = useState(null);
  // Inline Case Record Type editing state
  const [editingCaseTypeId, setEditingCaseTypeId] = useState(null);
  // Inline sheet moving state
  const [movingSheetId, setMovingSheetId] = useState(null);

  const filterPopoverRef = useRef(null);
  const remarksPopoverRef = useRef(null);

  // Close filter popover, remarks popover and export menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target)) {
        setActiveFilterCol(null);
      }
      if (remarksPopoverRef.current && !remarksPopoverRef.current.contains(event.target)) {
        setPopoverRemarksCaseId(null);
        setEditingRemarksId(null);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Extract distinct sheet names from cases + custom added sheets
  const availableSheets = useMemo(() => {
    const sheets = new Set();
    ['Shubh', 'Aarvee', 'Sheet1'].forEach(s => sheets.add(s));
    
    const pool = allCases && allCases.length > 0 ? allCases : cases;
    pool.forEach(c => {
      if (c.sheetName && c.sheetName.trim()) sheets.add(c.sheetName.trim());
    });
    customSheets.forEach(s => {
      if (s && s.trim()) sheets.add(s.trim());
    });
    return Array.from(sheets);
  }, [cases, allCases, customSheets]);

  // Check if any case has Column G (extra remarks)
  const hasColG = useMemo(() => {
    return cases.some(c => c.extraRemarks && String(c.extraRemarks).trim() !== '');
  }, [cases]);

  // Column definitions matching master Excel layout
  const columns = useMemo(() => {
    const cols = [
      { key: 'caseType', label: 'Case Record Type', colLetter: 'A', width: '135px', headerBg: '#1b3f63', textColor: '#ffffff' },
      { key: 'caseNumber', label: 'Case Number', colLetter: 'B', width: '130px', headerBg: '#1b3f63', textColor: '#ffffff' },
      { key: 'customerName', label: 'Customer Name', colLetter: 'C', width: '220px', headerBg: '#1b3f63', textColor: '#ffffff' },
      { key: 'product', label: 'Device Category', colLetter: 'D', width: '200px', headerBg: '#1b3f63', textColor: '#ffffff' },
      { key: 'assignedTechnicianName', label: 'Assigned Technician', colLetter: 'E', width: '160px', headerBg: '#0e703c', textColor: '#ffffff' },
      { key: 'workDone', label: 'Old remarks', colLetter: 'F', width: '260px', isYellowHeader: true, headerBg: '#fff275', textColor: '#0f172a' }
    ];
    if (hasColG) {
      cols.push({ key: 'extraRemarks', label: 'Extra Remarks', colLetter: 'G', width: '150px', headerBg: '#f1f5f9', textColor: '#0f172a' });
    }
    return cols;
  }, [hasColG]);

  // Helper to get normalized value for a column from a case object
  const getColValue = (item, colKey) => {
    if (colKey === 'caseType') return item.caseType || item.sourceTag || 'Installation';
    if (colKey === 'caseNumber') return item.caseNumber || '';
    if (colKey === 'customerName') return item.customerName || '';
    if (colKey === 'product') return item.product || item.purpose || '';
    if (colKey === 'assignedTechnicianName') return item.assignedTechnicianName || item.assignedTo || 'Unassigned';
    if (colKey === 'workDone') return item.workDone || item.note || '';
    if (colKey === 'extraRemarks') return item.extraRemarks || '';
    return item[colKey] || '';
  };

  // Get all unique values for a specific column
  const getUniqueValuesForCol = (colKey) => {
    const valueMap = new Map();
    const sourceCases = selectedSheet === 'All' ? cases : cases.filter(c => (c.sheetName || 'Shubh') === selectedSheet);
    
    sourceCases.forEach(item => {
      const val = getColValue(item, colKey) || '(Blank)';
      valueMap.set(val, (valueMap.get(val) || 0) + 1);
    });

    return Array.from(valueMap.entries())
      .map(([val, count]) => ({ val, count }))
      .sort((a, b) => a.val.localeCompare(b.val));
  };

  // Open filter popover for a column
  const handleOpenFilter = (colKey, e) => {
    e.stopPropagation();
    if (activeFilterCol === colKey) {
      setActiveFilterCol(null);
      return;
    }
    setActiveFilterCol(colKey);
    setFilterSearchText('');
    const existing = columnFilters[colKey];
    if (existing) {
      setTempSelectedValues(new Set(existing));
    } else {
      const uniqueVals = getUniqueValuesForCol(colKey).map(u => u.val);
      setTempSelectedValues(new Set(uniqueVals));
    }
  };

  // Apply column filter
  const handleApplyFilter = (colKey) => {
    const allUniqueVals = getUniqueValuesForCol(colKey).map(u => u.val);
    if (tempSelectedValues.size === allUniqueVals.length) {
      const next = { ...columnFilters };
      delete next[colKey];
      setColumnFilters(next);
    } else {
      setColumnFilters(prev => ({
        ...prev,
        [colKey]: Array.from(tempSelectedValues)
      }));
    }
    setActiveFilterCol(null);
  };

  // Clear single column filter
  const handleClearColFilter = (colKey) => {
    const next = { ...columnFilters };
    delete next[colKey];
    setColumnFilters(next);
    setActiveFilterCol(null);
  };

  // Clear all active column filters
  const handleClearAllFilters = () => {
    setColumnFilters({});
    setSortConfig(null);
    setActiveFilterCol(null);
  };

  // Toggle selection for a single value in filter popover
  const handleToggleValue = (val) => {
    const next = new Set(tempSelectedValues);
    if (next.has(val)) {
      next.delete(val);
    } else {
      next.add(val);
    }
    setTempSelectedValues(next);
  };

  // Toggle Select All in filter popover
  const handleToggleSelectAll = (filteredVals) => {
    const allFilteredVals = filteredVals.map(v => v.val);
    const isAllSelected = allFilteredVals.every(v => tempSelectedValues.has(v));
    const next = new Set(tempSelectedValues);
    if (isAllSelected) {
      allFilteredVals.forEach(v => next.delete(v));
    } else {
      allFilteredVals.forEach(v => next.add(v));
    }
    setTempSelectedValues(next);
  };

  // Handle column sorting
  const handleSort = (colKey, direction) => {
    if (sortConfig && sortConfig.column === colKey && sortConfig.direction === direction) {
      setSortConfig(null);
    } else {
      setSortConfig({ column: colKey, direction });
    }
    setActiveFilterCol(null);
  };

  // Filter and sort the cases
  const processedCases = useMemo(() => {
    let result = [...cases];

    // 1. Sheet tab filter
    if (selectedSheet !== 'All') {
      result = result.filter(c => (c.sheetName || 'Shubh') === selectedSheet);
    }

    // 2. Individual column filters
    Object.entries(columnFilters).forEach(([colKey, allowedVals]) => {
      if (allowedVals && allowedVals.length > 0) {
        const allowedSet = new Set(allowedVals);
        result = result.filter(item => {
          const val = getColValue(item, colKey) || '(Blank)';
          return allowedSet.has(val);
        });
      }
    });

    // 3. Sorting
    if (sortConfig) {
      const { column, direction } = sortConfig;
      result.sort((a, b) => {
        const valA = String(getColValue(a, column) || '').toLowerCase();
        const valB = String(getColValue(b, column) || '').toLowerCase();
        const cmp = valA.localeCompare(valB, undefined, { numeric: true });
        return direction === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [cases, selectedSheet, columnFilters, sortConfig]);

  // Remarks inline save
  const startEditRemarks = (item) => {
    setPopoverRemarksCaseId(item._id);
    setEditingRemarksId(item._id);
    setRemarksValue(item.workDone || item.note || '');
    setActiveRemarkCategory('All');
  };

  const saveRemarks = (id, overrideVal) => {
    const valToSave = overrideVal !== undefined ? overrideVal : remarksValue;
    onQuickUpdateWorkDone(id, valToSave);
    setEditingRemarksId(null);
    setPopoverRemarksCaseId(null);
  };

  // Reassign technician quick inline
  const handleAssignTechnician = async (caseId, techName) => {
    try {
      await fetch(`/api/cases/${caseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: techName,
          assignedTechnicianName: techName
        })
      });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    }
    setAssigningTechId(null);
  };

  // Update Case Record Type quick inline
  const handleUpdateCaseType = async (caseId, newCaseType) => {
    try {
      await fetch(`/api/cases/${caseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseType: newCaseType,
          sourceTag: newCaseType === 'Auto' ? 'Auto' : newCaseType
        })
      });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    }
    setEditingCaseTypeId(null);
  };

  // Move case to different sheet
  const handleMoveSheet = async (caseId, targetSheetName) => {
    try {
      await fetch(`/api/cases/${caseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetName: targetSheetName
        })
      });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    }
    setMovingSheetId(null);
  };

  // Copy case number helper
  const handleCopyCaseNumber = (caseId, caseNum, e) => {
    e.stopPropagation();
    if (!caseNum) return;
    navigator.clipboard.writeText(caseNum);
    setCopiedId(caseId);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Add new sheet tab
  const handleCreateNewSheet = () => {
    if (!newSheetInput.trim()) return;
    const cleanName = newSheetInput.trim();
    if (!customSheets.includes(cleanName)) {
      setCustomSheets(prev => [...prev, cleanName]);
    }
    setSelectedSheet(cleanName);
    setNewSheetInput('');
    setIsAddingSheet(false);
  };

  const fullCasePool = (allCases && allCases.length > 0) ? allCases : cases;

  // Export handlers
  const handleExportMaster = () => {
    exportCasesToExcel(fullCasePool, 'AO Smith Open call NEW.xlsx');
    setIsExportMenuOpen(false);
  };

  const handleExportCurrentSheet = async () => {
    try {
      const targetSheet = selectedSheet === 'All' ? 'Shubh' : selectedSheet;
      const sheetCases = fullCasePool.filter(c => (c.sheetName || 'Shubh').toLowerCase() === targetSheet.toLowerCase());
      const targetFileName = `AO Smith Open call - ${targetSheet}.xlsx`;
      const { blob } = await generateExcelWorkbookBlob(sheetCases, targetFileName, targetSheet);
      saveAs(blob, targetFileName);
    } catch (err) {
      console.error('Export sheet error:', err);
    }
    setIsExportMenuOpen(false);
  };

  const handleExportAllSeparate = async () => {
    await exportSeparateSheetsToExcel(fullCasePool);
    setIsExportMenuOpen(false);
  };

  const handleExportCsvData = () => {
    exportCasesToCsv(fullCasePool, settings);
    setIsExportMenuOpen(false);
  };

  const activeFiltersCount = Object.keys(columnFilters).length + (sortConfig ? 1 : 0);

  // Density-based CSS classes
  const densityStyles = {
    compact: {
      rowPadding: 'py-1 px-2.5',
      cellText: 'text-[11.5px] leading-tight',
      headerPadding: 'py-1.5 px-2.5 text-[11px]',
      badgeSize: 'text-[10.5px] px-1.5 py-0.5',
      actionIcon: 'w-3 h-3',
      rowNumSize: 'text-[10px] py-1 px-1.5'
    },
    standard: {
      rowPadding: 'py-2 px-3',
      cellText: 'text-xs leading-normal',
      headerPadding: 'py-2 px-3 text-xs',
      badgeSize: 'text-[11px] px-2 py-0.5',
      actionIcon: 'w-3.5 h-3.5',
      rowNumSize: 'text-[11px] py-2 px-2'
    },
    comfortable: {
      rowPadding: 'py-2.5 px-3.5',
      cellText: 'text-sm leading-relaxed',
      headerPadding: 'py-2.5 px-3.5 text-xs',
      badgeSize: 'text-xs px-2.5 py-1',
      actionIcon: 'w-4 h-4',
      rowNumSize: 'text-xs py-2.5 px-2.5'
    }
  }[density];

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-300 overflow-hidden font-sans flex flex-col">
      
      {/* Top Excel Ribbon Bar - Sleek & Modern */}
      <div className="bg-[#0e6d38] px-3.5 py-2 text-white flex flex-wrap items-center justify-between gap-2 select-none border-b border-emerald-800 shadow-2xs">
        
        {/* Left Title, Sheet Indicator & Row Count */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <div className="bg-white/15 p-1 rounded-md shadow-2xs flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-tight">AO Smith Open call NEW.xlsx</span>
          
          {selectedSheet !== 'All' && (
            <span className={`text-[11px] px-2 py-0.5 rounded-md font-bold border flex items-center gap-1 shadow-2xs ${
              selectedSheet === 'Sheet1'
                ? 'bg-amber-900/90 text-amber-200 border-amber-400'
                : 'bg-emerald-950 text-amber-300 border-emerald-600/60'
            }`}>
              {selectedSheet === 'Sheet1' && <span>🔒</span>}
              <span className="opacity-75">Sheet:</span>
              <span className="font-extrabold underline underline-offset-2">{selectedSheet}</span>
              {selectedSheet === 'Sheet1' && <span className="text-[9px] bg-amber-800 text-amber-100 px-1 rounded font-normal">Preserved</span>}
            </span>
          )}

          <span className="text-[11px] bg-emerald-950/80 px-2 py-0.5 rounded text-emerald-100 font-mono font-medium border border-emerald-700/50">
            <strong>{processedCases.length}</strong> of {cases.length} rows
          </span>

          {activeFiltersCount > 0 && (
            <span className="text-[10px] bg-amber-400 text-slate-950 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs animate-pulse">
              <Filter className="w-2.5 h-2.5" />
              <span>{activeFiltersCount} Filter(s)</span>
            </span>
          )}
        </div>

        {/* Right Action Controls: Density Toggle, Clear Filters, Add, Import, Export */}
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
          
          {/* Density Selector (Compact / Standard / Comfortable) */}
          <div className="flex items-center bg-emerald-950/70 p-0.5 rounded-lg border border-emerald-700/60 text-[10.5px]">
            <span className="text-emerald-300 font-bold px-1.5 hidden md:inline text-[10px]">Density:</span>
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                density === 'compact'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-100 hover:text-white'
              }`}
              title="Compact View: Maximum information density (15-20 rows visible)"
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => setDensity('standard')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                density === 'standard'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-100 hover:text-white'
              }`}
              title="Standard View: Balanced spacing"
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setDensity('comfortable')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                density === 'comfortable'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-100 hover:text-white'
              }`}
              title="Comfortable View: Spacious rows"
            >
              Relaxed
            </button>
          </div>

          {/* Reset Filters */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="flex items-center space-x-1 px-2 py-1 text-[11px] font-bold text-rose-100 bg-rose-900/80 hover:bg-rose-800 border border-rose-500/60 rounded-md shadow-xs transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          )}

          {/* Add Case to Active Sheet */}
          {onOpenNewCase && (
            <button
              type="button"
              onClick={() => onOpenNewCase(selectedSheet === 'All' || selectedSheet === 'Sheet1' ? 'Shubh' : selectedSheet)}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-slate-950 bg-amber-300 hover:bg-amber-200 active:bg-amber-400 rounded-md shadow-xs transition-colors"
              title={selectedSheet === 'Sheet1' ? 'Sheet1 is preserved as-is. Click to add new case into "Shubh"' : `Add new case into "${selectedSheet === 'All' ? 'Shubh' : selectedSheet}"`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Add Case</span>
            </button>
          )}

          {/* Import Excel */}
          {onOpenImportExcel && (
            <button
              type="button"
              onClick={onOpenImportExcel}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-white rounded-md shadow-xs transition-colors"
              title="Import multi-sheet Excel file (.xlsx, .xls, .csv)"
            >
              <Upload className="w-3 h-3 text-emerald-800" />
              <span className="hidden sm:inline">Import</span>
            </button>
          )}

          {/* Day via Day Tracker */}
          {onOpenDailyTracker && (
            <button
              type="button"
              onClick={onOpenDailyTracker}
              className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-black text-amber-950 bg-amber-400 hover:bg-amber-300 border border-amber-500/80 rounded-md shadow-xs transition-all"
              title="Open Day-by-Day Daily Status Tracker (Done / Pending / Cancelled)"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-950" />
              <span>Day via Day</span>
            </button>
          )}

          {/* WhatsApp Share Button */}
          <button
            type="button"
            onClick={() => setIsWhatsAppModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1caa51] border border-[#1ebd5a] rounded-md shadow-xs transition-all animate-in fade-in"
            title="Export and share Excel file (.xlsx) or task list via WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current" />
            <span>WhatsApp Share</span>
          </button>

          {/* Export Dropdown Menu */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-950 border border-emerald-700 rounded-md shadow-xs transition-colors"
            >
              <Download className="w-3 h-3 text-emerald-300" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-40 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-300 w-72 py-2 text-xs font-sans animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="font-extrabold text-slate-900">Export & Share Options</p>
                  <p className="text-[10px] text-slate-500">Choose single workbook, separate files or WhatsApp</p>
                </div>

                <div className="p-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      setIsWhatsAppModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 rounded-lg flex items-center space-x-2 transition-colors group bg-emerald-50/50"
                  >
                    <div className="p-1.5 bg-[#25D366] text-white rounded-md shadow-2xs">
                      <MessageCircle className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <p className="font-bold text-emerald-950 flex items-center gap-1">
                        <span>Share on WhatsApp</span>
                        <span className="text-[9px] bg-[#25D366] text-white px-1 py-0.2 rounded font-black">NEW</span>
                      </p>
                      <p className="text-[10px] text-emerald-700">Send Excel file (.xlsx) or summary on WhatsApp</p>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    type="button"
                    onClick={handleExportMaster}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 rounded-lg flex items-center space-x-2 transition-colors group"
                  >
                    <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-md group-hover:bg-emerald-200">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Export Master 3-Sheet Workbook</p>
                      <p className="text-[10px] text-slate-500">All sheets (Shubh, Aarvee, Sheet1) in 1 .xlsx file</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCurrentSheet}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg flex items-center space-x-2 transition-colors group"
                  >
                    <div className="p-1.5 bg-blue-100 text-blue-800 rounded-md group-hover:bg-blue-200">
                      <FileDown className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Export Active Sheet Only (.xlsx)</p>
                      <p className="text-[10px] text-slate-500">Only "{selectedSheet === 'All' ? 'Shubh' : selectedSheet}" tab records</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportAllSeparate}
                    className="w-full text-left px-3 py-2 hover:bg-purple-50 rounded-lg flex items-center space-x-2 transition-colors group"
                  >
                    <div className="p-1.5 bg-purple-100 text-purple-800 rounded-md group-hover:bg-purple-200">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Export 3 Separate Excel Files (.xlsx)</p>
                      <p className="text-[10px] text-slate-500">Downloads Shubh.xlsx, Aarvee.xlsx, Sheet1.xlsx</p>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    type="button"
                    onClick={handleExportCsvData}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 rounded-lg flex items-center space-x-2 text-slate-600"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Export Visible Data as CSV (.csv)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Sheet1 Preserved Banner */}
      {selectedSheet === 'Sheet1' && (
        <div className="bg-amber-50 border-b border-amber-300 px-3.5 py-1.5 text-xs text-amber-950 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center space-x-2">
            <span className="bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded text-[10.5px] border border-amber-300 flex items-center gap-1">
              <span>🔒</span>
              <span>Sheet1: Preserved (As-Is)</span>
            </span>
            <span className="font-medium text-slate-800 text-[11.5px]">
              This sheet is preserved in its original imported format without any modification. It will be bundled and exported automatically together with your updated <strong>Shubh</strong> and <strong>Aarvee</strong> sheets.
            </span>
          </div>
          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
            Read-Only Preserved Mode
          </span>
        </div>
      )}

      {/* Main Table Grid Area - Maximum Height with Sticky Headers */}
      <div className="overflow-x-auto min-h-[460px] max-h-[calc(100vh-220px)] overflow-y-auto relative scrollbar-thin scrollbar-thumb-slate-300">
        <table className="w-full text-left border-collapse select-text">
          
          {/* Excel Top Column Letters Header Row */}
          <thead>
            <tr className="bg-[#eaeaea] text-slate-500 text-[10px] font-bold text-center border-b border-slate-300 select-none">
              <th className="w-10 py-0.5 bg-[#dedede] border-r border-slate-300 text-slate-700 font-mono">#</th>
              {columns.map((col) => (
                <th 
                  key={col.colLetter} 
                  className={`py-0.5 border-r border-slate-300 ${col.isYellowHeader ? 'bg-amber-200 text-amber-950' : ''}`}
                  style={{ width: col.width }}
                >
                  {col.colLetter}
                </th>
              ))}
              <th className="w-20 py-0.5 bg-[#dedede] text-slate-700">Action</th>
            </tr>

            {/* Main Header Row with Navy Blue, Green & Yellow Style matching Master Excel */}
            <tr className="border-b border-slate-400 select-none sticky top-0 z-20 shadow-xs">
              
              {/* Row Indicator Column Header */}
              <th className={`text-center bg-[#15324e] text-white border-r border-slate-600 w-10 font-mono font-bold ${densityStyles.headerPadding}`}>
                Row
              </th>

              {/* Data Column Headers */}
              {columns.map((col) => {
                const isFiltered = !!columnFilters[col.key];
                const isSorted = sortConfig && sortConfig.column === col.key;
                const isYellow = col.isYellowHeader;

                return (
                  <th
                    key={col.key}
                    className={`border-r border-slate-400/80 whitespace-nowrap relative select-none font-bold ${densityStyles.headerPadding}`}
                    style={{ 
                      minWidth: col.width,
                      backgroundColor: col.headerBg || (isYellow ? '#fff275' : '#1b3f63'),
                      color: col.textColor || (isYellow ? '#0f172a' : '#ffffff')
                    }}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate tracking-tight font-extrabold">{col.label}</span>

                      {/* Excel Native-style Header Filter Dropdown Square Button */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenFilter(col.key, e)}
                        className={`w-4.5 h-4.5 rounded-[2px] transition-all flex items-center justify-center shrink-0 border shadow-2xs ${
                          isFiltered
                            ? 'bg-amber-400 text-slate-950 border-amber-600 ring-2 ring-amber-300 font-bold'
                            : isYellow
                            ? 'bg-white hover:bg-slate-100 text-slate-900 border-amber-400'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                        title={`Excel Filter: ${col.label}`}
                      >
                        {isSorted ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-blue-700 stroke-[2.5]" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-blue-700 stroke-[2.5]" />
                          )
                        ) : isFiltered ? (
                          <Filter className="w-2.5 h-2.5 text-slate-950 fill-slate-950" />
                        ) : (
                          <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-slate-700 mt-0.5" />
                        )}
                      </button>
                    </div>
                  </th>
                );
              })}

              <th className={`bg-[#15324e] text-white text-center w-20 font-bold ${densityStyles.headerPadding}`}>
                Manage
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className={`divide-y divide-slate-200 bg-white font-sans ${densityStyles.cellText}`}>
            {processedCases.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="py-12 text-center text-slate-500 bg-slate-50">
                  <div className="flex flex-col items-center justify-center">
                    <Filter className="w-7 h-7 text-slate-400 mb-1.5 opacity-60" />
                    <p className="text-xs sm:text-sm font-bold text-slate-700">No cases match the active filters in sheet "{selectedSheet}"</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Try resetting column filters or switching sheet tabs.</p>
                    {activeFiltersCount > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllFilters}
                        className="mt-2.5 px-3 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              processedCases.map((item, index) => {
                const rowNum = index + 1;
                const isRemarksEditing = editingRemarksId === item._id;
                const isTechAssigning = assigningTechId === item._id;
                const isCaseTypeEditing = editingCaseTypeId === item._id;
                const isSheetMoving = movingSheetId === item._id;
                const isRemarksPopoverOpen = popoverRemarksCaseId === item._id;
                const recordType = item.caseType || item.sourceTag || 'Installation';
                const assignedTech = item.assignedTechnicianName || item.assignedTo || 'Unassigned';
                const remarks = item.workDone || item.note || '';
                const caseSheet = item.sheetName || 'Shubh';
                const isCopied = copiedId === item._id;

                return (
                  <tr
                    key={item._id || index}
                    className="hover:bg-blue-50/50 transition-colors border-b border-slate-200 group"
                  >
                    {/* Excel Row Margin Number */}
                    <td className={`text-center bg-[#f7f7f7] text-slate-500 font-mono border-r border-slate-300 select-none font-semibold ${densityStyles.rowNumSize}`}>
                      {rowNum}
                    </td>

                    {/* Column A: Case Record Type (Quick 1-Click Select) */}
                    <td 
                      className={`border-r border-slate-200 whitespace-nowrap relative ${densityStyles.rowPadding}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isCaseTypeEditing ? (
                        <div className="flex items-center space-x-1">
                          <select
                            autoFocus
                            value={recordType}
                            onChange={(e) => handleUpdateCaseType(item._id, e.target.value)}
                            onBlur={() => setEditingCaseTypeId(null)}
                            className="text-xs font-bold px-1.5 py-0.5 bg-white border-2 border-blue-600 rounded text-slate-900 shadow-xs focus:outline-hidden"
                          >
                            <option value="Installation">Installation</option>
                            <option value="Complaint">Complaint</option>
                            <option value="Order">Order</option>
                            <option value="Auto">Auto</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setEditingCaseTypeId(null)}
                            className="text-slate-400 hover:text-slate-600 text-xs px-1"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => setEditingCaseTypeId(item._id)}
                          className="flex items-center space-x-1 cursor-pointer hover:opacity-85"
                          title="Click to switch Case Record Type (Installation / Complaint / Order / Auto)"
                        >
                          <span className={`inline-block rounded font-bold transition-transform group-hover:scale-[1.02] ${densityStyles.badgeSize} ${
                            recordType.toLowerCase() === 'installation'
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : recordType.toLowerCase() === 'complaint'
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : recordType.toLowerCase() === 'order'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : recordType.toLowerCase() === 'auto'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-800 border border-slate-300'
                          }`}>
                            {recordType}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Column B: Case Number */}
                    <td className={`border-r border-slate-200 font-mono font-bold text-slate-900 whitespace-nowrap ${densityStyles.rowPadding}`}>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-blue-700 hover:underline">
                          <HighlightText text={item.caseNumber} query={searchQuery} />
                        </span>
                        {item.caseNumber && (
                          <button
                            type="button"
                            onClick={(e) => handleCopyCaseNumber(item._id, item.caseNumber, e)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-blue-700 rounded transition-opacity"
                            title="Copy Case Number"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Column C: Customer Name */}
                    <td className={`border-r border-slate-200 font-semibold text-slate-900 whitespace-nowrap ${densityStyles.rowPadding}`}>
                      <div className="flex items-center space-x-1.5 max-w-[280px]">
                        <span className="group-hover:text-blue-700 transition-colors truncate">
                          <HighlightText text={item.customerName} query={searchQuery} />
                        </span>
                        
                        {/* Sheet badge when viewing all records */}
                        {selectedSheet === 'All' && (
                          <span className="text-[9px] bg-slate-100 text-slate-500 font-mono px-1 rounded border border-slate-200 shrink-0">
                            {caseSheet}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Column D: Device Category */}
                    <td className={`border-r border-slate-200 text-slate-800 whitespace-nowrap font-medium max-w-[240px] truncate ${densityStyles.rowPadding}`} title={item.product || item.purpose || ''}>
                      <HighlightText text={item.product || item.purpose} query={searchQuery} />
                    </td>

                    {/* Column E: Assigned Technician (Quick 1-Click Dropdown) */}
                    <td 
                      className={`border-r border-slate-200 whitespace-nowrap relative ${densityStyles.rowPadding}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isTechAssigning ? (
                        <div className="flex items-center space-x-1">
                          <select
                            autoFocus
                            value={assignedTech}
                            onChange={(e) => handleAssignTechnician(item._id, e.target.value)}
                            onBlur={() => setAssigningTechId(null)}
                            className="text-xs font-bold px-1.5 py-0.5 bg-white border-2 border-emerald-500 rounded text-slate-800 shadow-xs"
                          >
                            <option value="">Select Technician</option>
                            {technicians.map(t => (
                              <option key={t._id || t.name} value={t.name}>{t.name}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setAssigningTechId(null)}
                            className="text-slate-400 hover:text-slate-600 text-xs px-1"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => setAssigningTechId(item._id)}
                          className="flex items-center space-x-1 cursor-pointer hover:opacity-85"
                          title="Click to reassign technician"
                        >
                          <span className={`inline-flex items-center font-bold rounded ${densityStyles.badgeSize} ${
                            assignedTech.toLowerCase() === 'patil'
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : assignedTech.toLowerCase() === 'anwar'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : assignedTech.toLowerCase() === 'jignesh'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : assignedTech.toLowerCase() === 'bhavesh'
                              ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                              : assignedTech.toLowerCase() === 'shoeb'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : assignedTech.toLowerCase() === 'unassigned'
                              ? 'bg-slate-100 text-slate-500 border border-slate-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            <HighlightText text={assignedTech} query={searchQuery} />
                          </span>

                        </div>
                      )}
                    </td>

                    {/* Column F: Old remarks / Work Done (Clean, Space-Efficient Single-Line with Popover & Quick Hover Buttons) */}
                    <td 
                      className={`border-r border-slate-200 bg-amber-50/20 hover:bg-amber-50/60 cursor-pointer min-w-[240px] max-w-[320px] relative ${densityStyles.rowPadding}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditRemarks(item);
                      }}
                      title="Click to edit remarks or choose preset"
                    >
                      <div className="flex items-center justify-between gap-1.5 group/cell">
                        
                        {/* Compact Single-line Remark Pill */}
                        <div className="flex items-center space-x-1 truncate flex-1 min-w-0">
                          {remarks ? (
                            <span className={`inline-block truncate font-semibold rounded px-1.5 py-0.5 border ${
                              remarks.toLowerCase().includes('done') || remarks.toLowerCase() === 'today'
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                                : remarks.toLowerCase().includes('cancel')
                                ? 'bg-rose-50 text-rose-900 border-rose-300 font-bold'
                                : remarks.toLowerCase().includes('charge') || remarks.toLowerCase().includes('gkk')
                                ? 'bg-amber-100 text-amber-950 border-amber-300 font-bold'
                                : 'bg-white text-slate-800 border-slate-200'
                            }`}>
                              <HighlightText text={remarks} query={searchQuery} />
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px] group-hover:text-slate-600">
                              + Add remark...
                            </span>
                          )}
                        </div>

                        {/* Quick 1-Click Actions (Visible on Row Hover - Saves Space without Stretching Row Height!) */}
                        <div 
                          className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => saveRemarks(item._id, 'today')}
                            className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-2xs transition-colors"
                            title='Set remark to "today"'
                          >
                            today
                          </button>
                          <button
                            type="button"
                            onClick={() => saveRemarks(item._id, 'done')}
                            className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-2xs transition-colors"
                            title='Set remark to "done"'
                          >
                            done
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditRemarks(item)}
                            className="p-1 text-slate-500 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors"
                            title="Open all preset remarks & custom editor"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>

                      </div>

                      {/* Floating Non-Intrusive Preset & Editor Popover */}
                      {isRemarksPopoverOpen && (
                        <div 
                          ref={remarksPopoverRef}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-0 top-full mt-1 z-40 bg-white border border-amber-400 rounded-xl shadow-2xl p-3 w-84 text-left font-sans animate-in fade-in zoom-in-95"
                        >
                          {/* Top Input & Save Row */}
                          <div className="space-y-2 pb-2 border-b border-slate-100">
                            <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-800">
                              <span className="flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <span>Edit Old Remarks (Col F)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setPopoverRemarksCaseId(null)}
                                className="text-slate-400 hover:text-slate-700 p-0.5"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="flex items-center space-x-1.5">
                              <input
                                type="text"
                                autoFocus
                                value={remarksValue}
                                onChange={(e) => setRemarksValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveRemarks(item._id);
                                  if (e.key === 'Escape') setPopoverRemarksCaseId(null);
                                }}
                                placeholder="Type custom remark..."
                                className="w-full text-xs px-2.5 py-1.5 border-2 border-blue-500 rounded-lg bg-white shadow-2xs focus:outline-hidden font-medium text-slate-900"
                              />
                              <button
                                type="button"
                                onClick={() => saveRemarks(item._id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 shadow-xs"
                              >
                                Save
                              </button>
                            </div>
                          </div>

                          {/* Quick Categories */}
                          <div className="pt-2 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Click 1-Click Preset:
                              </span>
                              <div className="flex gap-1 text-[10px]">
                                {['All', 'Status', 'Charges', 'Issues'].map(cat => (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setActiveRemarkCategory(cat)}
                                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition-colors ${
                                      activeRemarkCategory === cat ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {cat}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Preset Buttons Grid */}
                            <div className="max-h-40 overflow-y-auto flex flex-wrap gap-1 p-0.5">
                              {(activeRemarkCategory === 'All'
                                ? REMARK_PRESETS
                                : activeRemarkCategory === 'Status'
                                ? CATEGORIZED_REMARKS['Quick Status']
                                : activeRemarkCategory === 'Charges'
                                ? CATEGORIZED_REMARKS['Charges & Fees']
                                : CATEGORIZED_REMARKS['Cancellation & Issues']
                              ).map((preset, pIdx) => {
                                const isSelected = (remarksValue || '').toLowerCase() === preset.toLowerCase();
                                const isDone = preset === 'done' || preset === 'today';
                                const isCancel = preset.includes('cancel');
                                const isCharge = preset.includes('charge');

                                return (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => saveRemarks(item._id, preset)}
                                    className={`text-left px-2 py-1 rounded text-[11px] font-medium border transition-all truncate max-w-full ${
                                      isSelected
                                        ? 'bg-blue-600 text-white border-blue-700 font-bold shadow-xs'
                                        : isDone
                                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 font-semibold'
                                        : isCancel
                                        ? 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100 font-semibold'
                                        : isCharge
                                        ? 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100 font-semibold'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {preset}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                        </div>
                      )}

                    </td>

                    {/* Column G: Extra Remarks (if present in dataset) */}
                    {hasColG && (
                      <td className={`border-r border-slate-200 text-slate-800 whitespace-nowrap font-mono ${densityStyles.rowPadding}`}>
                        <HighlightText text={item.extraRemarks} query={searchQuery} />
                      </td>
                    )}

                    {/* Actions Column: Move Sheet, Delete */}
                    <td 
                      className={`text-center whitespace-nowrap ${densityStyles.rowPadding}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {caseSheet === 'Sheet1' ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300" title="Sheet1 is preserved as-is. It will be exported intact.">
                          <span>🔒</span>
                          <span>Preserved</span>
                        </span>
                      ) : (
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Move Sheet Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setMovingSheetId(movingSheetId === item._id ? null : item._id)}
                              className="p-1 text-emerald-700 hover:bg-emerald-100 rounded transition-colors"
                              title={`Move case from "${caseSheet}" to another sheet tab`}
                            >
                              <FolderSymlink className={densityStyles.actionIcon} />
                            </button>

                            {isSheetMoving && (
                              <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-slate-300 rounded-lg shadow-xl p-1.5 w-40 text-left animate-in fade-in zoom-in-95">
                                <p className="text-[10px] font-bold text-slate-400 px-2 py-0.5 uppercase">Move to Sheet:</p>
                                {availableSheets.filter(s => s !== caseSheet && s !== 'Sheet1').map(targetSheet => (
                                  <button
                                    key={targetSheet}
                                    type="button"
                                    onClick={() => handleMoveSheet(item._id, targetSheet)}
                                    className="w-full text-left px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 rounded transition-colors"
                                  >
                                    → {targetSheet}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Delete Case */}
                          <button
                            type="button"
                            onClick={() => onDeleteCase(item._id)}
                            className="p-1 text-rose-500 hover:bg-rose-100 rounded transition-colors"
                            title="Delete case record"
                          >
                            <Trash2 className={densityStyles.actionIcon} />
                          </button>
                        </div>
                      )}
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Column Filter Floating Popover Modal */}
      {activeFilterCol && (
        <div
          ref={filterPopoverRef}
          className="fixed z-50 bg-white rounded-xl shadow-2xl border border-slate-300 p-3.5 w-72 space-y-2.5 text-slate-900 font-sans animate-in fade-in zoom-in-95"
          style={{
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center space-x-1.5">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-xs text-slate-900">
                Filter: {columns.find(c => c.key === activeFilterCol)?.label || activeFilterCol}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveFilterCol(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sort Buttons */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => handleSort(activeFilterCol, 'asc')}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center justify-center space-x-1 transition-colors ${
                sortConfig && sortConfig.column === activeFilterCol && sortConfig.direction === 'asc'
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Sort A → Z</span>
            </button>
            <button
              type="button"
              onClick={() => handleSort(activeFilterCol, 'desc')}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center justify-center space-x-1 transition-colors ${
                sortConfig && sortConfig.column === activeFilterCol && sortConfig.direction === 'desc'
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Sort Z → A</span>
            </button>
          </div>

          {/* Search box within column values */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search in column values..."
              value={filterSearchText}
              onChange={(e) => setFilterSearchText(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-blue-500 font-medium"
            />
          </div>

          {/* Values List with Checkboxes */}
          {(() => {
            const uniqueVals = getUniqueValuesForCol(activeFilterCol);
            const filteredVals = filterSearchText.trim()
              ? uniqueVals.filter(u => u.val.toLowerCase().includes(filterSearchText.toLowerCase()))
              : uniqueVals;

            const isAllSelected = filteredVals.length > 0 && filteredVals.every(u => tempSelectedValues.has(u.val));

            return (
              <div className="space-y-1.5">
                {/* Select All Row */}
                <div 
                  onClick={() => handleToggleSelectAll(filteredVals)}
                  className="flex items-center justify-between p-1.5 bg-slate-100 rounded-md cursor-pointer hover:bg-slate-200 text-slate-800 font-semibold"
                >
                  <div className="flex items-center space-x-2">
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>(Select All)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {tempSelectedValues.size} / {uniqueVals.length}
                  </span>
                </div>

                {/* Values Scroll List */}
                <div className="max-h-44 overflow-y-auto space-y-1 border border-slate-200 rounded-lg p-1 bg-slate-50/50">
                  {filteredVals.length === 0 ? (
                    <p className="text-center py-4 text-slate-400 italic text-[11px]">No matching values</p>
                  ) : (
                    filteredVals.map(({ val, count }) => {
                      const isChecked = tempSelectedValues.has(val);
                      return (
                        <div
                          key={val}
                          onClick={() => handleToggleValue(val)}
                          className="flex items-center justify-between px-2 py-1 rounded hover:bg-white cursor-pointer transition-colors text-slate-700"
                        >
                          <div className="flex items-center space-x-2 truncate max-w-[200px]">
                            {isChecked ? (
                              <CheckSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            )}
                            <span className="truncate text-[11px]">{val}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono font-semibold ml-2">
                            ({count})
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
            <button
              type="button"
              onClick={() => handleClearColFilter(activeFilterCol)}
              className="text-slate-500 hover:text-rose-600 text-xs font-semibold py-1 px-2"
            >
              Clear Filter
            </button>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setActiveFilterCol(null)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApplyFilter(activeFilterCol)}
                className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Bottom Multi-Sheet Tab Navigation - Clean & Crisp */}
      <div className="bg-[#eaeaea] border-t border-slate-300 px-3 py-1 flex flex-wrap items-center justify-between text-xs text-slate-700 select-none">
        
        {/* Sheet Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
          <div className="flex items-center text-slate-400 mr-1">
            <ChevronLeft className="w-3.5 h-3.5 cursor-pointer hover:text-slate-700" />
            <ChevronRight className="w-3.5 h-3.5 cursor-pointer hover:text-slate-700" />
          </div>

          {/* 'All Records' Tab */}
          <button
            type="button"
            onClick={() => setSelectedSheet('All')}
            className={`px-3 py-1 text-xs font-semibold transition-all border-b-2 flex items-center space-x-1.5 ${
              selectedSheet === 'All'
                ? 'bg-white text-[#0e6d38] border-[#0e6d38] font-bold shadow-2xs'
                : 'bg-[#dadada] text-slate-700 hover:bg-[#f0f0f0] border-transparent'
            }`}
          >
            <Layers className="w-3 h-3 text-emerald-600" />
            <span>All Records</span>
            <span className="text-[10px] opacity-75">({cases.length})</span>
          </button>

          {/* Individual Named Sheet Tabs (e.g. Shubh, Aarvee, Sheet1 from user excel) */}
          {availableSheets.map(sheetName => {
            const count = cases.filter(c => (c.sheetName || 'Shubh') === sheetName).length;
            const isActive = selectedSheet === sheetName;
            const isSheet1 = sheetName === 'Sheet1';
            return (
              <button
                key={sheetName}
                type="button"
                onClick={() => setSelectedSheet(sheetName)}
                className={`px-3 py-1 text-xs font-semibold transition-all border-b-2 flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-white text-[#0e6d38] border-[#0e6d38] font-bold shadow-2xs'
                    : isSheet1
                    ? 'bg-[#e0d6c3] text-amber-950 hover:bg-[#eaeaea] border-transparent'
                    : 'bg-[#dadada] text-slate-700 hover:bg-[#f0f0f0] border-transparent'
                }`}
              >
                {isSheet1 && <span className="text-[10px]" title="Preserved Sheet">🔒</span>}
                <span>{sheetName}</span>
                <span className="text-[10px] opacity-75">({count})</span>
                {isSheet1 && (
                  <span className="text-[9px] bg-amber-200/90 text-amber-900 px-1 py-0.2 rounded font-mono font-medium">
                    as-is
                  </span>
                )}
              </button>
            );
          })}

          {/* Add New Sheet Input / Button */}
          {isAddingSheet ? (
            <div className="flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-emerald-500 shadow-xs">
              <input
                type="text"
                autoFocus
                placeholder="Sheet Name..."
                value={newSheetInput}
                onChange={(e) => setNewSheetInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateNewSheet();
                  if (e.key === 'Escape') setIsAddingSheet(false);
                }}
                className="w-24 text-xs font-bold px-1 py-0.5 outline-hidden"
              />
              <button
                type="button"
                onClick={handleCreateNewSheet}
                className="text-emerald-700 font-bold hover:text-emerald-900 px-1"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => setIsAddingSheet(false)}
                className="text-slate-400 hover:text-slate-600 px-1"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingSheet(true)}
              className="px-2 py-1 text-slate-600 hover:text-slate-900 bg-[#dadada] hover:bg-white rounded flex items-center space-x-1 transition-colors text-xs font-semibold"
              title="Add a new Excel Sheet tab"
            >
              <Plus className="w-3 h-3" />
              <span>New Sheet</span>
            </button>
          )}

        </div>

        {/* Excel Status Metrics */}
        <div className="flex items-center space-x-3 text-[11px] text-slate-600 py-0.5">
          <span className="font-semibold text-emerald-800">Ready</span>
          <span>Showing: <strong className="text-slate-900">{processedCases.length}</strong></span>
          <span className="hidden sm:inline">Completed: <strong className="text-emerald-700">{processedCases.filter(c => (c.workDone || c.note || '').toLowerCase().includes('done')).length}</strong></span>
          <span className="hidden sm:inline">Today: <strong className="text-blue-700">{processedCases.filter(c => (c.workDone || c.note || '').toLowerCase().includes('today')).length}</strong></span>
          <span className="hidden md:inline bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-500 font-mono text-[10px]">
            {density.toUpperCase()} DENSITY
          </span>
        </div>

      </div>

      {/* WhatsApp Export & Share Modal */}
      <WhatsAppShareModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        cases={processedCases}
        allCases={fullCasePool}
        selectedSheet={selectedSheet}
        technicians={technicians}
        settings={settings}
      />

    </div>
  );
}
