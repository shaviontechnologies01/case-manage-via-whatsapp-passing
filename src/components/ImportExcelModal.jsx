import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight,
  FileCheck,
  Sparkles,
  Info
} from 'lucide-react';
import { parseExcelFile } from '../utils/importExcel.js';

export default function ImportExcelModal({
  isOpen,
  onClose,
  technicians = [],
  onImportComplete
}) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [defaultTech, setDefaultTech] = useState('');
  const [selectedPreviewSheet, setSelectedPreviewSheet] = useState('ALL');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const processFile = async (f) => {
    setFile(f);
    setLoading(true);
    setError(null);
    setSelectedPreviewSheet('ALL');
    try {
      const result = await parseExcelFile(f, defaultTech);
      setPreviewData(result);
    } catch (err) {
      console.error('Excel parse error:', err);
      setError(err.message || 'Failed to read Excel file. Please ensure it is a valid .xlsx, .xls, or .csv file.');
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || !previewData.cases || previewData.cases.length === 0) return;
    setLoading(true);
    try {
      await onImportComplete(previewData.cases);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to import cases');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setError(null);
    setSelectedPreviewSheet('ALL');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filter cases for the selected sheet tab in preview
  const displayedCases = previewData?.cases
    ? selectedPreviewSheet === 'ALL'
      ? previewData.cases
      : previewData.cases.filter(c => c.sheetName === selectedPreviewSheet)
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-400/30">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Import Master Excel Sheet (.xlsx / .csv)</h2>
              <p className="text-xs text-emerald-200/80">
                Upload your existing Excel file to load previous cases and update existing records
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-rose-800 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Error reading file:</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {!previewData ? (
            /* Upload Drop Area */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-4"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                {loading ? (
                  <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-8 h-8" />
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {loading ? 'Reading Excel file...' : 'Click to Browse or Drag & Drop Excel File here'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Supports .xlsx, .xls, and .csv files (Columns A: Type, B: Case #, C: Customer, D: Device, E: Tech, F: Old remarks)
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Existing cases matching Case # will be updated, new ones will be added!</span>
              </div>
            </div>
          ) : (
            /* Preview Screen */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
                <div className="flex items-center space-x-2.5">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="text-sm font-bold text-emerald-900">{previewData.fileName}</span>
                    <span className="ml-2 text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                      {previewData.totalRows} cases detected
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-slate-600 hover:text-slate-900 underline font-medium px-2 py-1"
                  >
                    Choose different file
                  </button>
                </div>
              </div>

              {/* Multi-Sheet Detection Bar */}
              {previewData.sheetNames && previewData.sheetNames.length > 0 && (
                <div className="bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Detected {previewData.sheetNames.length} Excel Sheet{previewData.sheetNames.length > 1 ? 's' : ''}:
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      All sheets preserved for multi-sheet export
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedPreviewSheet('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
                        selectedPreviewSheet === 'ALL'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <span>All Sheets Combined</span>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-black/20 font-mono">
                        {previewData.cases.length}
                      </span>
                    </button>

                    {previewData.sheetNames.map((sName) => {
                      const count = previewData.cases.filter(c => c.sheetName === sName).length;
                      const isActive = selectedPreviewSheet === sName;
                      return (
                        <button
                          key={sName}
                          type="button"
                          onClick={() => setSelectedPreviewSheet(sName)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
                            isActive
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <span>Sheet: {sName}</span>
                          <span className="text-[10px] px-1 py-0.2 rounded bg-black/10 font-mono">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Table Preview (First 8 rows of selected sheet) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 border-b border-slate-200 flex items-center justify-between">
                  <span>
                    Previewing {selectedPreviewSheet === 'ALL' ? 'All Records' : `Sheet: "${selectedPreviewSheet}"`} (Showing {Math.min(displayedCases.length, 8)} of {displayedCases.length}):
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">All 6 columns + Sheet Name mapped</span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-800 text-white text-[11px] sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Sheet</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Case #</th>
                        <th className="py-2 px-3">Customer</th>
                        <th className="py-2 px-3">Device Category</th>
                        <th className="py-2 px-3">Technician</th>
                        <th className="py-2 px-3 bg-amber-500 text-slate-950 font-bold">Old remarks / Work Done</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {displayedCases.slice(0, 8).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-emerald-800 bg-emerald-50/50">
                            {row.sheetName || 'Shubh'}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-700">{row.caseType || row.sourceTag || '-'}</td>
                          <td className="py-2 px-3 font-mono font-bold text-blue-700">{row.caseNumber || '-'}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{row.customerName}</td>
                          <td className="py-2 px-3 text-slate-600 truncate max-w-[150px]">{row.product || '-'}</td>
                          <td className="py-2 px-3 text-emerald-700 font-medium">{row.assignedTo || 'Unassigned'}</td>
                          <td className="py-2 px-3 bg-amber-50/60 text-slate-800 font-medium">{row.workDone || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Quick Explainer on How to import */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              <span>How Excel Synchronization Works:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Previous Master Sheet:</strong> Import your master file once to populate all historic cases.</li>
              <li><strong>WhatsApp Live Updates:</strong> When you paste WhatsApp messages, they will automatically record <code>today</code> in the old remarks.</li>
              <li><strong>Master Export:</strong> Whenever you click <strong>Export Excel</strong>, the portal generates a complete Excel workbook with all historic and newly added/updated records combined.</li>
            </ul>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          {previewData && (
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirmImport}
              className="flex items-center space-x-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Importing...</span>
              ) : (
                <>
                  <span>Import {previewData.totalRows} Cases to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
