import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Copy, 
  Check, 
  Trash2, 
  Phone, 
  UserCheck, 
  FileText, 
  Calendar, 
  IndianRupee,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { REMARK_PRESETS, CATEGORIZED_REMARKS } from '../utils/remarkPresets.js';

export default function CaseDetailModal({ 
  caseItem, 
  technicians = [], 
  settings = {}, 
  availableSheets = ['Shubh', 'Aarvee', 'Sheet1'],
  isOpen, 
  onClose, 
  onSave,
  onDelete
}) {
  const [formData, setFormData] = useState({
    sheetName: 'Shubh',
    status: 'Pending',
    workDone: '',
    extraRemarks: '',
    amount1: '',
    amount2: ''
  });

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'dispatch' | 'raw'

  useEffect(() => {
    if (caseItem) {
      setFormData({
        ...caseItem,
        sheetName: caseItem.sheetName || 'Shubh',
        status: caseItem.status || 'Pending',
        workDone: caseItem.workDone || caseItem.note || '',
        extraRemarks: caseItem.extraRemarks || '',
        amount1: caseItem.amount1 !== undefined ? caseItem.amount1 : '',
        amount2: caseItem.amount2 !== undefined ? caseItem.amount2 : ''
      });
    }
  }, [caseItem]);

  if (!isOpen || !caseItem) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(caseItem._id, formData);
    onClose();
  };

  const getDispatchText = () => {
    return `*WEDLANCER PRIVATE — JOB DISPATCH*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Case #:* ${formData.caseNumber || 'N/A'}\n` +
      `*Customer:* ${formData.customerName}\n` +
      `*Phone 1:* ${formData.phone1 || 'N/A'}\n` +
      `${formData.phone2 ? `*Phone 2:* ${formData.phone2}\n` : ''}` +
      `*Job Type:* ${formData.caseType || formData.sourceTag || 'Service'}\n` +
      `*Product/Model:* ${formData.product || formData.purpose || 'N/A'}\n` +
      `*Assigned Technician:* ${formData.assignedTechnicianName || formData.assignedTo || 'Unassigned'}\n` +
      `*Amounts:* ₹${formData.amount1 || 0} (${settings.amount1Label || 'Amt 1'}) + ₹${formData.amount2 || 0} (${settings.amount2Label || 'Amt 2'})\n` +
      `${formData.note ? `*Special Note:* ${formData.note}\n` : ''}` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_Please reply with completion remarks and work done after visiting site._`;
  };

  const copyDispatch = () => {
    navigator.clipboard.writeText(getDispatchText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base text-white">
                  Case #{formData.caseNumber || 'N/A'} — {formData.customerName}
                </h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                  formData.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  formData.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                  formData.status === 'Cancelled' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                  'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {formData.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Created on {new Date(formData.createdAt || Date.now()).toLocaleDateString()}
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

        {/* Tab Navigation */}
        <div className="bg-slate-100 px-6 pt-3 flex space-x-4 border-b border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-emerald-600 text-emerald-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Case Details & Work Done
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dispatch')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center space-x-1 ${
              activeTab === 'dispatch'
                ? 'border-emerald-600 text-emerald-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Dispatch Format</span>
          </button>
          {formData.rawText && (
            <button
              type="button"
              onClick={() => setActiveTab('raw')}
              className={`pb-2.5 border-b-2 transition-colors ${
                activeTab === 'raw'
                  ? 'border-emerald-600 text-emerald-700 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Original Raw Message
            </button>
          )}
        </div>

        {caseItem.sheetName === 'Sheet1' && (
          <div className="bg-amber-50 border-b border-amber-300 px-6 py-2.5 text-xs text-amber-950 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded text-[11px] border border-amber-300 flex items-center gap-1">
                <span>🔒</span>
                <span>Sheet1 Preserved</span>
              </span>
              <span>This record belongs to <strong>Sheet1</strong> and is kept untouched as-is. It will be bundled with <strong>Shubh</strong> and <strong>Aarvee</strong> upon export.</span>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Row 1: Status & Assigned Technician */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Job Status:
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Pending">⏳ Pending</option>
                    <option value="In Progress">⚡ In Progress</option>
                    <option value="Completed">✅ Completed</option>
                    <option value="Cancelled">❌ Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Field Technician:
                  </label>
                  <select
                    value={formData.assignedTo || formData.assignedTechnicianName || ''}
                    onChange={(e) => {
                      handleChange('assignedTo', e.target.value);
                      handleChange('assignedTechnicianName', e.target.value);
                    }}
                    className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="">Select Technician</option>
                    {technicians.map(t => (
                      <option key={t._id || t.name} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Work Done / Completion Remarks */}
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Work Done / Old Remarks:</span>
                  </label>
                  
                  {/* Preset Dropdown Select */}
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleChange('workDone', e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="text-xs bg-white border border-amber-300 rounded px-2 py-1 text-slate-700 font-medium cursor-pointer"
                  >
                    <option value="">⚡ Select standard remark...</option>
                    <optgroup label="Frequently Used">
                      {CATEGORIZED_REMARKS['Quick Status'].map((r, i) => (
                        <option key={i} value={r}>{r}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Charges & Fees">
                      {CATEGORIZED_REMARKS['Charges & Fees'].map((r, i) => (
                        <option key={i} value={r}>{r}</option>
                      ))}
                    </optgroup>
                    <optgroup label="GKK & Service">
                      {CATEGORIZED_REMARKS['GKK & Service'].map((r, i) => (
                        <option key={i} value={r}>{r}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Cancellation & Issues">
                      {CATEGORIZED_REMARKS['Cancellation & Issues'].map((r, i) => (
                        <option key={i} value={r}>{r}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <textarea
                  rows={2}
                  value={formData.workDone || ''}
                  onChange={(e) => handleChange('workDone', e.target.value)}
                  placeholder="Type or click any preset chip below..."
                  className="w-full text-xs p-2.5 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-slate-800"
                />

                {/* Fast Click Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['done', 'today', 'cancel done', 'call not received', 'not ready to replace GKK', 'not ready to pay service charge', 'NOT CONTACTED', 'not given appointment'].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChange('workDone', chip)}
                      className={`text-[11px] px-2 py-0.5 rounded border transition-all ${
                        (formData.workDone || '').toLowerCase() === chip.toLowerCase()
                          ? 'bg-blue-600 text-white border-blue-700 font-bold'
                          : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100 hover:border-amber-400'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: Customer, Case #, Excel Sheet, Source */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Case Number:</label>
                  <input
                    type="text"
                    value={formData.caseNumber || ''}
                    onChange={(e) => handleChange('caseNumber', e.target.value)}
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Customer Name *:</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName || ''}
                    onChange={(e) => handleChange('customerName', e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1">Excel Sheet:</label>
                  <select
                    value={formData.sheetName || 'Shubh'}
                    onChange={(e) => handleChange('sheetName', e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-lg focus:bg-white focus:outline-hidden text-emerald-900"
                  >
                    {availableSheets.map(s => (
                      <option key={s} value={s}>Sheet: {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Source Tag:</label>
                  <input
                    type="text"
                    value={formData.sourceTag || ''}
                    onChange={(e) => handleChange('sourceTag', e.target.value)}
                    placeholder="e.g. Auto, Repit"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Row 3: Phones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phone 1:</label>
                  <input
                    type="text"
                    value={formData.phone1 || ''}
                    onChange={(e) => handleChange('phone1', e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phone 2 (Alt):</label>
                  <input
                    type="text"
                    value={formData.phone2 || ''}
                    onChange={(e) => handleChange('phone2', e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Row 4: Case Type, Product, Purpose */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Case Record Type:</label>
                  <select
                    value={formData.caseType || 'Installation'}
                    onChange={(e) => handleChange('caseType', e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden"
                  >
                    <option value="Installation">Installation</option>
                    <option value="Complaint">Complaint</option>
                    <option value="Order">Order</option>
                    <option value="Auto">Auto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Product / Device Category:</label>
                  <input
                    type="text"
                    value={formData.product || ''}
                    onChange={(e) => handleChange('product', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Row 6: Amounts & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    {settings.amount1Label || 'Amount 1 (Product Price)'}:
                  </label>
                  <input
                    type="number"
                    value={formData.amount1}
                    onChange={(e) => handleChange('amount1', e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    {settings.amount2Label || 'Amount 2 (Service Charge)'}:
                  </label>
                  <input
                    type="number"
                    value={formData.amount2}
                    onChange={(e) => handleChange('amount2', e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Special Notes:</label>
                  <input
                    type="text"
                    value={formData.note || ''}
                    onChange={(e) => handleChange('note', e.target.value)}
                    placeholder="e.g. Out warranty"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this case?')) {
                      onDelete(caseItem._id);
                      onClose();
                    }
                  }}
                  className="px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Case</span>
                </button>

                <div className="flex items-center space-x-2">
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
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>

            </form>
          )}

          {activeTab === 'dispatch' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Formatted message to paste directly into technician's WhatsApp chat:
              </p>
              
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs whitespace-pre-wrap border border-slate-800 shadow-inner">
                {getDispatchText()}
              </div>

              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={copyDispatch}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy WhatsApp Message'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Original text originally parsed from WhatsApp:
              </p>
              <div className="bg-slate-100 p-4 rounded-xl font-mono text-xs text-slate-800 whitespace-pre-wrap border border-slate-200">
                {formData.rawText}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
