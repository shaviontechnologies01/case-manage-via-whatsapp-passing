import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import StatsBar from './components/StatsBar.jsx';
import CaseDashboard from './components/CaseDashboard.jsx';
import WhatsAppParser from './components/WhatsAppParser.jsx';
import CaseDetailModal from './components/CaseDetailModal.jsx';
import TechnicianModal from './components/TechnicianModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import NewCaseModal from './components/NewCaseModal.jsx';
import ImportExcelModal from './components/ImportExcelModal.jsx';
import DailyTrackerModal from './components/DailyTrackerModal.jsx';
import { exportCasesToCsv, exportCasesToExcel } from './utils/exportExcel.js';
import { 
  ClipboardPaste, 
  Plus, 
  Sparkles, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Users
} from 'lucide-react';

export default function App() {
  const [cases, setCases] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [settings, setSettings] = useState({
    amount1Label: 'Product Price / Amount 1',
    amount2Label: 'Service / Visit Charge',
    caseTypes: []
  });

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('excel'); // 'excel' | 'table'
  
  // Filter States
  const [selectedTechnician, setSelectedTechnician] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCaseType, setSelectedCaseType] = useState('all');
  const [selectedSheet, setSelectedSheet] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

  // Modal States
  const [isParserOpen, setIsParserOpen] = useState(false);
  const [isImportExcelOpen, setIsImportExcelOpen] = useState(false);
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [newCaseTargetSheet, setNewCaseTargetSheet] = useState('Shubh');
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDailyTrackerOpen, setIsDailyTrackerOpen] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const availableSheets = Array.from(new Set([
    'Shubh', 'Aarvee', 'Sheet1',
    ...cases.map(c => c.sheetName).filter(Boolean)
  ]));

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleFilterByDateAndStatus = (date, status = 'all') => {
    setDateFilter({ start: date, end: date });
    if (status && status !== 'all') {
      setSelectedStatus(status);
    } else {
      setSelectedStatus('all');
    }
    showToast(`Showing ${status !== 'all' ? status : 'all'} cases for date: ${date}`);
  };

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [casesRes, techRes, settingsRes] = await Promise.all([
        fetch('/api/cases'),
        fetch('/api/technicians'),
        fetch('/api/settings')
      ]);

      const casesData = await casesRes.json();
      const techData = await techRes.json();
      const settingsData = await settingsRes.json();

      if (casesData.cases) setCases(casesData.cases);
      if (techData.technicians) setTechnicians(techData.technicians);
      if (settingsData.settings) setSettings(settingsData.settings);
    } catch (err) {
      console.error('Failed to load portal data:', err);
      showToast('Error connecting to backend API', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers for Case operations
  const handleCreateCase = async (newCaseData) => {
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCaseData)
      });
      const data = await res.json();
      if (data.success) {
        setCases(prev => [data.case, ...prev]);
        showToast('New case added successfully!');
      } else {
        showToast(data.error || 'Failed to add case', 'error');
      }
    } catch (err) {
      showToast('Error creating case: ' + err.message, 'error');
    }
  };

  const handleSaveParsedCases = async (parsedCasesArray) => {
    try {
      const res = await fetch('/api/cases/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cases: parsedCasesArray })
      });
      const data = await res.json();
      if (data.success) {
        setCases(prev => [...(data.cases || []), ...prev]);
        showToast(`Saved ${data.count} cases to WEDLANCER database!`);
        setIsParserOpen(false);
      } else {
        throw new Error(data.error || 'Bulk save failed');
      }
    } catch (err) {
      showToast('Failed to save parsed cases: ' + err.message, 'error');
      throw err;
    }
  };

  const handleUpdateCase = async (id, updates) => {
    try {
      const res = await fetch(`/api/cases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        setCases(prev => prev.map(c => c._id === id ? data.case : c));
        showToast('Case updated successfully!');
      }
    } catch (err) {
      showToast('Error updating case: ' + err.message, 'error');
    }
  };

  const handleDeleteCase = async (id) => {
    try {
      const res = await fetch(`/api/cases/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCases(prev => prev.filter(c => c._id !== id));
        showToast('Case removed from portal.');
      }
    } catch (err) {
      showToast('Error deleting case: ' + err.message, 'error');
    }
  };

  const handleQuickUpdateStatus = async (id, nextStatus) => {
    try {
      const res = await fetch(`/api/cases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        setCases(prev => prev.map(c => c._id === id ? { ...c, status: nextStatus } : c));
        showToast(`Case status changed to ${nextStatus}`);
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleQuickUpdateWorkDone = async (id, workDone) => {
    try {
      const res = await fetch(`/api/cases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workDone, note: workDone })
      });
      const data = await res.json();
      if (data.success) {
        setCases(prev => prev.map(c => c._id === id ? { ...c, workDone, note: workDone } : c));
        showToast('Field remarks updated.');
      }
    } catch (err) {
      showToast('Failed to update remarks', 'error');
    }
  };

  // Technician Handlers
  const handleAddTechnician = async (techData) => {
    try {
      const res = await fetch('/api/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(techData)
      });
      const data = await res.json();
      if (data.success) {
        setTechnicians(prev => [...prev, data.technician]);
        showToast(`Added technician ${data.technician.name}`);
      }
    } catch (err) {
      showToast('Failed to add technician', 'error');
    }
  };

  const handleUpdateTechnician = async (id, techData) => {
    try {
      const res = await fetch(`/api/technicians/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(techData)
      });
      const data = await res.json();
      if (data.success) {
        setTechnicians(prev => prev.map(t => (t._id === id || t.name === id) ? data.technician : t));
        showToast('Technician updated');
      }
    } catch (err) {
      showToast('Failed to update technician', 'error');
    }
  };

  const handleDeleteTechnician = async (id) => {
    try {
      const res = await fetch(`/api/technicians/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTechnicians(prev => prev.filter(t => t._id !== id && t.name !== id));
        showToast('Technician removed');
      }
    } catch (err) {
      showToast('Failed to delete technician', 'error');
    }
  };

  // Settings Handlers
  const handleSaveSettings = async (newSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        showToast('Settings saved');
      }
    } catch (err) {
      showToast('Failed to save settings', 'error');
    }
  };

  // Filter cases client-side for ultra-fast response
  const filteredCases = cases.filter(item => {
    // Sheet Filter
    if (selectedSheet !== 'All') {
      const itemSheet = item.sheetName || 'Shubh';
      if (itemSheet.toLowerCase() !== selectedSheet.toLowerCase()) return false;
    }

    // Technician Filter
    if (selectedTechnician !== 'all') {
      const assigned = (item.assignedTechnicianName || item.assignedTo || '').toLowerCase();
      if (assigned !== selectedTechnician.toLowerCase()) return false;
    }

    // Status Filter (checks status and remarks)
    if (selectedStatus !== 'all') {
      const st = (item.status || 'Pending').toLowerCase();
      const rem = (item.workDone || item.note || '').toLowerCase();
      const sel = selectedStatus.toLowerCase();

      if (sel === 'completed') {
        const isDone = st === 'completed' || rem === 'done' || rem.startsWith('done') || rem.includes('completed');
        if (!isDone) return false;
      } else if (sel === 'cancelled') {
        const isCancel = st === 'cancelled' || rem.includes('cancel');
        if (!isCancel) return false;
      } else if (sel === 'pending') {
        const isPending = (st === 'pending' || st === 'in progress') && !rem.includes('done') && !rem.includes('completed') && !rem.includes('cancel');
        if (!isPending) return false;
      } else {
        if (st !== sel) return false;
      }
    }

    // Case Type Filter
    if (selectedCaseType !== 'all') {
      const cType = (item.caseType || item.sourceTag || '').toLowerCase();
      if (cType !== selectedCaseType.toLowerCase()) return false;
    }

    // Universal Multi-Word Search (Field-Free Omnisearch across ALL fields)
    if (searchQuery && searchQuery.trim()) {
      const tokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
      
      const searchableText = [
        item.caseNumber,
        item.customerName,
        item.phone1,
        item.phone2,
        item.product,
        item.purpose,
        item.brand,
        item.caseType,
        item.sourceTag,
        item.status,
        item.sheetName || 'Shubh',
        item.assignedTechnicianName,
        item.assignedTo,
        item.workDone,
        item.note,
        item.extraRemarks,
        item.amount1,
        item.amount2,
        item.rawMessage
      ].filter(Boolean).join(' ').toLowerCase();

      // Check if ALL search keywords/tokens match somewhere in the case record
      const allTokensMatch = tokens.every(token => searchableText.includes(token));
      if (!allTokensMatch) return false;
    }

    // Date Filters
    const cDateStr = (item.createdAt ? item.createdAt.slice(0, 10) : '') || item.orderDate || '';
    if (dateFilter.start && dateFilter.end && dateFilter.start === dateFilter.end) {
      const targetDate = dateFilter.start;
      const matchesDate = cDateStr.includes(targetDate) || (item.createdAt && item.createdAt.slice(0, 10) === targetDate);
      if (!matchesDate) return false;
    } else {
      if (dateFilter.start) {
        const s = new Date(dateFilter.start);
        s.setHours(0, 0, 0, 0);
        const itemDate = new Date(item.orderDate || item.createdAt);
        if (!isNaN(itemDate.getTime()) && itemDate < s) return false;
      }
      if (dateFilter.end) {
        const e = new Date(dateFilter.end);
        e.setHours(23, 59, 59, 999);
        const itemDate = new Date(item.orderDate || item.createdAt);
        if (!isNaN(itemDate.getTime()) && itemDate > e) return false;
      }
    }

    return true;
  });

  // Export full Excel workbook containing all live and previous cases
  const handleExportExcel = () => {
    exportCasesToExcel(cases, 'AO Smith Open call NEW.xlsx');
    showToast(`Exported ${cases.length} cases to "AO Smith Open call NEW.xlsx"!`);
  };

  const handleExportCsv = () => {
    exportCasesToCsv(filteredCases, settings);
    showToast(`Exported ${filteredCases.length} cases to Excel CSV!`);
  };

  const handleImportExcelComplete = async (importedCasesArray) => {
    try {
      const res = await fetch('/api/cases/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cases: importedCasesArray })
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        showToast(`Successfully synchronized ${importedCasesArray.length} cases from Excel file!`);
      } else {
        throw new Error(data.error || 'Failed to import cases');
      }
    } catch (err) {
      showToast('Excel Import error: ' + err.message, 'error');
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        onOpenParser={() => setIsParserOpen(true)}
        onOpenImportExcel={() => setIsImportExcelOpen(true)}
        onOpenNewCase={() => setIsNewCaseOpen(true)}
        onOpenTechModal={() => setIsTechModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDailyTracker={() => setIsDailyTrackerOpen(true)}
        onExportExcel={handleExportExcel}
        onExportCsv={handleExportCsv}
        viewMode={viewMode}
        setViewMode={setViewMode}
        totalCases={cases.length}
        pendingCount={cases.filter(c => (c.status || 'Pending') === 'Pending').length}
      />

      {/* KPI & Technician Filter Stats Bar */}
      <StatsBar
        cases={cases}
        technicians={technicians}
        selectedTechnician={selectedTechnician}
        onSelectTechnician={setSelectedTechnician}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        onOpenDailyTracker={() => setIsDailyTrackerOpen(true)}
        settings={settings}
      />

      {/* Main Content Area - Full Screen Width Utilization */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 py-4">
        
        {/* If Parser is Opened at Top */}
        {isParserOpen && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-200">
            <WhatsAppParser
              technicians={technicians}
              settings={settings}
              onSaveParsedCases={handleSaveParsedCases}
              onClose={() => setIsParserOpen(false)}
            />
          </div>
        )}

        {/* Dashboard and Table */}
        <CaseDashboard
          allCases={cases}
          cases={filteredCases}
          technicians={technicians}
          settings={settings}
          selectedSheet={selectedSheet}
          onSelectSheet={setSelectedSheet}
          selectedTechnician={selectedTechnician}
          onSelectTechnician={setSelectedTechnician}
          selectedStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCaseType={selectedCaseType}
          setSelectedCaseType={setSelectedCaseType}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          viewMode={viewMode}
          onEditCase={(item) => setEditingCase(item)}
          onDeleteCase={handleDeleteCase}
          onQuickUpdateStatus={handleQuickUpdateStatus}
          onQuickUpdateWorkDone={handleQuickUpdateWorkDone}
          onOpenNewCase={(targetSheet) => {
            if (targetSheet) setNewCaseTargetSheet(targetSheet);
            setIsNewCaseOpen(true);
          }}
          onOpenParser={() => setIsParserOpen(true)}
          onOpenImportExcel={() => setIsImportExcelOpen(true)}
          onOpenDailyTracker={() => setIsDailyTrackerOpen(true)}
          onExportExcel={handleExportExcel}
          onRefresh={fetchData}
        />

      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className={`px-4 py-3 rounded-xl shadow-xl border flex items-center space-x-2 text-xs font-bold text-white ${
            toastMessage.type === 'error' ? 'bg-rose-600 border-rose-700' : 'bg-slate-900 border-slate-800'
          }`}>
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Import Excel Modal */}
      <ImportExcelModal
        isOpen={isImportExcelOpen}
        onClose={() => setIsImportExcelOpen(false)}
        technicians={technicians}
        onImportComplete={handleImportExcelComplete}
      />

      {/* Case Detail / Edit Modal */}
      <CaseDetailModal
        caseItem={editingCase}
        technicians={technicians}
        settings={settings}
        availableSheets={availableSheets}
        isOpen={Boolean(editingCase)}
        onClose={() => setEditingCase(null)}
        onSave={handleUpdateCase}
        onDelete={handleDeleteCase}
      />

      {/* New Case Manual Modal */}
      <NewCaseModal
        technicians={technicians}
        settings={settings}
        availableSheets={availableSheets}
        defaultSheet={newCaseTargetSheet}
        isOpen={isNewCaseOpen}
        onClose={() => setIsNewCaseOpen(false)}
        onCreateCase={handleCreateCase}
      />

      {/* Technician Management Modal */}
      <TechnicianModal
        technicians={technicians}
        cases={cases}
        isOpen={isTechModalOpen}
        onClose={() => setIsTechModalOpen(false)}
        onAddTechnician={handleAddTechnician}
        onUpdateTechnician={handleUpdateTechnician}
        onDeleteTechnician={handleDeleteTechnician}
      />

      {/* Settings Modal */}
      <SettingsModal
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSettings={handleSaveSettings}
      />

      {/* Day via Day Status Tracker Modal */}
      <DailyTrackerModal
        isOpen={isDailyTrackerOpen}
        onClose={() => setIsDailyTrackerOpen(false)}
        cases={cases}
        technicians={technicians}
        onFilterByDateAndStatus={handleFilterByDateAndStatus}
      />

    </div>
  );
}
