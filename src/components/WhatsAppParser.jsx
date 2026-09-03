import React, { useState } from 'react';
import { 
  ClipboardPaste, 
  Sparkles, 
  Trash2, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck,
  Zap,
  HelpCircle,
  FileSpreadsheet,
  X,
  ChevronDown,
  ChevronUp,
  Keyboard
} from 'lucide-react';
import { splitMessagesClient, parseSingleMessageClient } from '../utils/parser.js';
import ReviewTable from './ReviewTable.jsx';

export const WORKED_EXAMPLES = {
  standard: `51633000 BHUPENDRA PATEL  Installation Request[Copper ECO AS]  9825122095  25 SAILENT ZOON OPP AIRPORT, NEAR MAGDALLA ROAD`,

  ex1: `51603667 SHREYAS SHAH      costumer assist  [Copper UV Plus]  9913759313  9033806949   G-101, KINGSTON APARTMENT APPOSITE-GREEN CITY, PAL-BHATHA,SURAT--25/12/2023--400/-`,
  
  ex2: `51611396 Mr. Amarnath Ghosh 9330163619
Order[Classic Nxt RO+MF] 3 floor a 301 anand aspire beside d mart jahangir bad surat gujarat
2900 400`,

  ex3: `Phone Satish bhai  99137 75134  12- Shashank residency, nr western hightn, ugat canal road   3000 400(single vali)`,

  ex4: `Repit 51619296 Surekha Thakkar 9737844360 9737844360 Leakage Issue [Vital Max WR3740D]
A-901, Ramji Residency, Near Omkar Heights, Jahangirabad, Surat Out warranty`,

  ex5: `Auto 51624123 JAHNVI PANDYA    Assistance Required[Revito Max WR5940P]  7984487996  B-1104,Shyam enclave, mora bhagal--15/02/2025`,

  ex6: `Aarvee 51620869  JIGNESH K SOMPURA .      9574994067  8460085410  A-903, Shiv Samarth-2, Near shiv digja, Gaurav path road, Pal gam, Surat, Gujarat   4200   400`,

  ex7: `51625742 Chetan Zinzala *
B7 504 Janki Residency near Vaishno Devi Heights Canal Road Jahangirabad Surat 8000064394
GCUR303  3100   400`,

  allBatch: `51633000 BHUPENDRA PATEL  Installation Request[Copper ECO AS]  9825122095  25 SAILENT ZOON OPP AIRPORT, NEAR MAGDALLA ROAD

51603667 SHREYAS SHAH      costumer assist  [Copper UV Plus]  9913759313  9033806949   G-101, KINGSTON APARTMENT APPOSITE-GREEN CITY, PAL-BHATHA,SURAT--25/12/2023--400/-

51611396 Mr. Amarnath Ghosh 9330163619
Order[Classic Nxt RO+MF] 3 floor a 301 anand aspire beside d mart jahangir bad surat gujarat
2900 400

Phone Satish bhai  99137 75134  12- Shashank residency, nr western hightn, ugat canal road   3000 400(single vali)

Repit 51619296 Surekha Thakkar 9737844360 9737844360 Leakage Issue [Vital Max WR3740D]
A-901, Ramji Residency, Near Omkar Heights, Jahangirabad, Surat Out warranty

Auto 51624123 JAHNVI PANDYA    Assistance Required[Revito Max WR5940P]  7984487996  B-1104,Shyam enclave, mora bhagal--15/02/2025`
};

export default function WhatsAppParser({ 
  technicians = [], 
  settings = {}, 
  onSaveParsedCases,
  onClose
}) {
  const [inputText, setInputText] = useState('');
  const [defaultTechnician, setDefaultTechnician] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [isInputCollapsed, setIsInputCollapsed] = useState(false);

  const handleParse = () => {
    if (!inputText.trim()) {
      setMessage({ type: 'error', text: 'Please paste at least one WhatsApp message into the text box.' });
      return;
    }

    setIsParsing(true);
    setMessage(null);

    try {
      const segments = splitMessagesClient(inputText);
      const customTypes = settings?.caseTypes || [];
      const rows = segments.map(seg => parseSingleMessageClient(seg, defaultTechnician, customTypes));
      
      setParsedRows(rows);
      setIsInputCollapsed(true); // Automatically collapse input to prioritize the Review Table
      setMessage({ 
        type: 'success', 
        text: `Successfully parsed ${rows.length} case(s)! Verify rows below and click "Save & Sync Cases".` 
      });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error parsing text: ' + err.message });
    } finally {
      setIsParsing(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setInputText(text);
          setIsInputCollapsed(false);
          setMessage({ type: 'info', text: 'Pasted WhatsApp text from clipboard!' });
        } else {
          setMessage({ type: 'error', text: 'Clipboard is empty.' });
        }
      } else {
        setMessage({ type: 'info', text: 'Press Ctrl+V to paste directly into the box.' });
      }
    } catch (e) {
      setMessage({ type: 'info', text: 'Press Ctrl+V to paste directly into the box.' });
    }
  };

  const handleParsedRowsChange = (newRows) => {
    setParsedRows(newRows);
    if (!newRows || newRows.length === 0) {
      setIsInputCollapsed(false);
      setMessage(null);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleParse();
    }
  };

  const handleLoadSample = (key) => {
    const text = WORKED_EXAMPLES[key];
    if (text) {
      setInputText(text);
      setIsInputCollapsed(false);
      setMessage({ 
        type: 'info', 
        text: `Loaded Sample: ${key === 'allBatch' ? 'Daily Batch (7 Cases)' : key === 'standard' ? 'Standard Request (Bhupendra)' : key.toUpperCase()}` 
      });
    }
  };

  const handleSaveAll = async (rowsToSave) => {
    setIsSaving(true);
    try {
      await onSaveParsedCases(rowsToSave);
      setMessage({ type: 'success', text: `Saved all ${rowsToSave.length} cases to portal!` });
      setParsedRows([]);
      setInputText('');
      setIsInputCollapsed(false);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save cases: ' + err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const lineCount = inputText ? inputText.split('\n').filter(l => l.trim()).length : 0;
  const charCount = inputText.length;

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden transition-all">
      
      {/* Sleek Compact Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Left: Branding & Title */}
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/30 flex items-center justify-center">
              <ClipboardPaste className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold tracking-tight text-white">
                  WhatsApp Bulk Parser
                </h2>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 hidden sm:inline-block">
                  Auto-Split & Classify
                </span>
              </div>
            </div>
          </div>

          {/* Right: Inline Controls (Pre-assign tech, Paste, Clear, Close) */}
          <div className="flex items-center space-x-2">
            
            {/* Technician Pre-fill selector */}
            <div className="flex items-center space-x-1.5 bg-slate-800/80 rounded-lg px-2 py-1 border border-slate-700">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] text-slate-300 font-medium hidden md:inline">Assign:</span>
              <select
                value={defaultTechnician}
                onChange={(e) => setDefaultTechnician(e.target.value)}
                className="bg-transparent text-white text-xs font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-slate-300">Assign per row</option>
                {technicians.map(t => (
                  <option key={t._id || t.name} value={t.name} className="bg-slate-900 text-white">{t.name}</option>
                ))}
              </select>
            </div>

            {/* Paste from Clipboard Button */}
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="px-2.5 py-1 text-xs font-semibold bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 hover:text-white rounded-lg border border-emerald-500/40 flex items-center space-x-1 transition-colors"
              title="Paste text from clipboard"
            >
              <ClipboardPaste className="w-3 h-3" />
              <span className="hidden sm:inline">Paste</span>
            </button>

            {/* Clear Button */}
            {inputText && (
              <button
                type="button"
                onClick={() => { setInputText(''); setMessage(null); }}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                title="Clear input"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Close Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Close Parser"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Input Section with Collapse Toggle if cases already parsed */}
      <div className="p-3 sm:p-4">
        
        {parsedRows.length > 0 && (
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setIsInputCollapsed(!isInputCollapsed)}
              className="flex items-center space-x-1 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors"
            >
              {isInputCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              <span>{isInputCollapsed ? 'Show WhatsApp Input Box' : 'Hide WhatsApp Input Box'}</span>
              <span className="text-[11px] font-normal text-slate-400">
                ({lineCount} lines • {charCount} chars)
              </span>
            </button>

            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ✓ {parsedRows.length} Cases in Review Below
            </span>
          </div>
        )}

        {/* Textarea Box (Collapsible if parsed) */}
        {!isInputCollapsed && (
          <div className="space-y-2">
            <div className="relative">
              <textarea
                rows={8}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste raw WhatsApp messages here (e.g. 51603667 SHREYAS SHAH costumer assist [Copper UV Plus] 9913759313 G-101 KINGSTON APARTMENT SURAT--25/12/2023--400/-)..."
                className="w-full text-xs sm:text-sm font-mono leading-relaxed p-3.5 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white text-slate-800 transition-all resize-y min-h-[180px] sm:min-h-[210px]"
              />

              {inputText && (
                <div className="absolute bottom-2 right-2 flex items-center space-x-1.5 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded border border-slate-200 text-[10px] text-slate-500 font-mono shadow-xs">
                  <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
                  <span>•</span>
                  <span>{charCount} chars</span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
              <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Auto-detects multi-case batches & routes to <strong>Shubh</strong> or <strong>Aarvee</strong>.</span>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleParse}
                  disabled={isParsing || !inputText.trim()}
                  className="flex items-center justify-center space-x-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-98 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isParsing ? 'Parsing...' : 'Parse WhatsApp Text'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div className={`mt-2.5 p-2.5 rounded-lg text-xs font-medium flex items-center justify-between space-x-2 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
            message.type === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> :
               message.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /> :
               <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />}
              <span>{message.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Review Table (Mandatory QA Step) */}
        {parsedRows.length > 0 && (
          <ReviewTable
            rows={parsedRows}
            technicians={technicians}
            settings={settings}
            onChangeRows={handleParsedRowsChange}
            onSaveAll={handleSaveAll}
            isSaving={isSaving}
          />
        )}

      </div>
    </div>
  );
}

