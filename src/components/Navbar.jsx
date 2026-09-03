import React from 'react';
import { 
  Droplet, 
  FileSpreadsheet, 
  Plus, 
  Users, 
  Settings, 
  Download, 
  Upload,
  ClipboardPaste, 
  Layers,
  TableProperties,
  Calendar
} from 'lucide-react';

export default function Navbar({ 
  onOpenParser, 
  onOpenImportExcel,
  onOpenNewCase, 
  onOpenTechModal, 
  onOpenSettings, 
  onOpenDailyTracker,
  onExportExcel,
  onExportCsv,
  viewMode,
  setViewMode,
  totalCases,
  pendingCount
}) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Company Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/10 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-bold shadow-inner shrink-0">
              <Droplet className="w-5 h-5 text-emerald-400 fill-emerald-400/30" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-base sm:text-lg tracking-tight text-white">WEDLANCER</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  RO Portal
                </span>
                {totalCases > 0 && (
                  <span className="hidden md:inline-flex items-center text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                    <span className="font-bold text-white mr-1">{totalCases}</span> Total Cases
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Field Technician Dispatch & Excel Multi-Sheet Manager
              </p>
            </div>
          </div>

          {/* Center/Right Actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            
            {/* View Mode Toggle */}
            <div className="hidden lg:flex items-center bg-slate-800/90 p-1 rounded-lg border border-slate-700/80 text-xs font-medium">
              <button
                type="button"
                onClick={() => setViewMode('excel')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'excel' 
                    ? 'bg-emerald-600 text-white shadow-xs font-bold' 
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Excel Grid Spreadsheet View"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'table' 
                    ? 'bg-emerald-600 text-white shadow-xs font-bold' 
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Standard Table View"
              >
                <TableProperties className="w-3.5 h-3.5" />
                <span>Standard</span>
              </button>
            </div>

            {/* Technicians Button */}
            <button
              type="button"
              onClick={onOpenTechModal}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors shadow-xs"
              title="Manage Field Technicians"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Technicians</span>
            </button>

            {/* Day via Day Tracker Button */}
            {onOpenDailyTracker && (
              <button
                type="button"
                onClick={onOpenDailyTracker}
                className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-950/70 hover:bg-amber-900 border border-amber-600/60 hover:text-white rounded-lg transition-colors shadow-xs"
                title="Day via Day Status Report (Done, Pending, Cancelled)"
              >
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Day via Day</span>
              </button>
            )}

            {/* Import Excel Button */}
            <button
              type="button"
              onClick={onOpenImportExcel}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 hover:text-white rounded-lg transition-colors shadow-xs"
              title="Import master Excel file (.xlsx, .xls, .csv)"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Import Excel</span>
            </button>

            {/* Export Full Excel (.xlsx) Button */}
            <button
              type="button"
              onClick={onExportExcel}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors shadow-xs"
              title="Export complete master Excel sheet (.xlsx) with all sheets"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-700 transition-colors"
              title="Portal Settings & Custom Amount Labels"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Primary Action: Paste WhatsApp Messages */}
            <button
              type="button"
              onClick={onOpenParser}
              className="flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-sm hover:shadow-md transition-all border border-emerald-400/40"
            >
              <ClipboardPaste className="w-4 h-4" />
              <span>Paste WhatsApp</span>
            </button>

            {/* New Manual Case */}
            <button
              type="button"
              onClick={onOpenNewCase}
              className="hidden xl:flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-amber-300" />
              <span>+ Manual Entry</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
}
