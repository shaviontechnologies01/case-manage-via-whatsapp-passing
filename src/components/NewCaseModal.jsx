import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Save, 
  AlertCircle 
} from 'lucide-react';

export default function NewCaseModal({ 
  technicians = [], 
  settings = {}, 
  availableSheets = ['Shubh', 'Aarvee', 'Sheet1'],
  defaultSheet = 'Shubh',
  isOpen, 
  onClose, 
  onCreateCase 
}) {
  const initialSheet = defaultSheet && defaultSheet !== 'Sheet1' 
    ? defaultSheet 
    : (availableSheets.find(s => s !== 'Sheet1') || 'Shubh');

  const [formData, setFormData] = useState({
    caseNumber: '',
    sourceTag: 'Manual',
    customerName: '',
    phone1: '',
    phone2: '',
    address: '',
    caseType: 'Installation',
    product: '',
    sheetName: initialSheet,
    orderDate: new Date().toISOString().slice(0, 10),
    amount1: '',
    amount2: '',
    note: '',
    assignedTo: technicians[0]?.name || '',
    status: 'Pending',
    workDone: '',
    extraRemarks: '',
    rawText: 'Manual Portal Entry'
  });

  const [isCustomSheet, setIsCustomSheet] = useState(false);
  const [customSheetName, setCustomSheetName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const activeSheet = defaultSheet && defaultSheet !== 'Sheet1' 
        ? defaultSheet 
        : (availableSheets.find(s => s !== 'Sheet1') || 'Shubh');
      setFormData(prev => ({
        ...prev,
        sheetName: activeSheet
      }));
    }
  }, [isOpen, defaultSheet, availableSheets]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      setError('Customer Name is required.');
      return;
    }
    if (!formData.assignedTo.trim()) {
      setError('Technician assignment is required.');
      return;
    }

    const finalSheetName = isCustomSheet && customSheetName.trim() ? customSheetName.trim() : formData.sheetName || 'Shubh';

    onCreateCase({
      ...formData,
      sheetName: finalSheetName,
      purpose: [formData.caseType, formData.product].filter(Boolean).join(' — ')
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Create New RO Case
              </h3>
              <p className="text-xs text-slate-400">
                Single case manual entry into WEDLANCER database
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="bg-rose-50 text-rose-800 p-3 rounded-lg text-xs flex items-center space-x-2 border border-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Customer Name & Case Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Customer Name *:
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => handleChange('customerName', e.target.value)}
                placeholder="e.g. JEEVAN PRADEEP PURI"
                className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Case Number (Optional):
              </label>
              <input
                type="text"
                value={formData.caseNumber}
                onChange={(e) => handleChange('caseNumber', e.target.value)}
                placeholder="e.g. 50629573"
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Row 2: Phones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Phone:
              </label>
              <input
                type="text"
                value={formData.phone1}
                onChange={(e) => handleChange('phone1', e.target.value)}
                placeholder="e.g. 9913759313"
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alt Phone:
              </label>
              <input
                type="text"
                value={formData.phone2}
                onChange={(e) => handleChange('phone2', e.target.value)}
                placeholder="e.g. 9033806949"
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Row 3: Case Type & Product */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Case Record Type:
              </label>
              <select
                value={formData.caseType}
                onChange={(e) => handleChange('caseType', e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Installation">Installation</option>
                <option value="Complaint">Complaint</option>
                <option value="Order">Order</option>
                <option value="Auto">Auto</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Device Category / Product:
              </label>
              <input
                type="text"
                value={formData.product}
                onChange={(e) => handleChange('product', e.target.value)}
                placeholder="e.g. Ultima Mineral RO+UV+MF"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Row 5: Technician & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assign to Field Technician *:
              </label>
              <select
                required
                value={formData.assignedTo}
                onChange={(e) => handleChange('assignedTo', e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="">Select Technician</option>
                {technicians.map(t => (
                  <option key={t._id || t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Initial Status:
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Pending">⏳ Pending</option>
                <option value="In Progress">⚡ In Progress</option>
                <option value="Completed">✅ Completed</option>
                <option value="Cancelled">❌ Cancelled</option>
              </select>
            </div>
          </div>

          {/* Row 6: Target Excel Sheet & Old Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-emerald-900">
                  Target Excel Sheet:
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomSheet(!isCustomSheet)}
                  className="text-[10px] text-emerald-700 font-semibold hover:underline"
                >
                  {isCustomSheet ? 'Select from list' : '+ New Sheet Name'}
                </button>
              </div>

              {isCustomSheet ? (
                <input
                  type="text"
                  value={customSheetName}
                  onChange={(e) => setCustomSheetName(e.target.value)}
                  placeholder="e.g. Sheet2, Hazira, Vapi"
                  className="w-full text-xs font-bold px-3 py-2 bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              ) : (
                <select
                  value={formData.sheetName}
                  onChange={(e) => handleChange('sheetName', e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-emerald-900"
                >
                  {availableSheets.map(s => {
                    const isSheet1 = s === 'Sheet1';
                    return (
                      <option key={s} value={s} disabled={isSheet1}>
                        {isSheet1 ? `🔒 Sheet: ${s} (Preserved - Read Only)` : `Sheet: ${s}`}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Old remarks / Work Done:
              </label>
              <input
                type="text"
                value={formData.workDone}
                onChange={(e) => handleChange('workDone', e.target.value)}
                placeholder="e.g. today / done / not ready to replace GKK"
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Row 6: Amounts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {settings.amount1Label || 'Amount 1'}:
              </label>
              <input
                type="number"
                value={formData.amount1}
                onChange={(e) => handleChange('amount1', e.target.value)}
                placeholder="0"
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {settings.amount2Label || 'Amount 2'}:
              </label>
              <input
                type="number"
                value={formData.amount2}
                onChange={(e) => handleChange('amount2', e.target.value)}
                placeholder="0"
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Create Case</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
