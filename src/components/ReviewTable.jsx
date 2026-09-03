import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  Plus, 
  Check, 
  Save, 
  UserCheck, 
  HelpCircle,
  Eye,
  EyeOff,
  Sparkles,
  Info
} from 'lucide-react';
import { REMARK_PRESETS } from '../utils/remarkPresets.js';

export default function ReviewTable({ 
  rows = [], 
  technicians = [], 
  settings = {},
  onChangeRows, 
  onSaveAll, 
  isSaving = false 
}) {
  const [showRawText, setShowRawText] = useState({});
  const [validationError, setValidationError] = useState('');

  const updateCell = (index, field, value) => {
    const updated = [...rows];
    let newSheet = updated[index].sheetName || 'Shubh';
    if (field === 'sourceTag') {
      if (/aarvee/i.test(value)) {
        newSheet = 'Aarvee';
      }
    }

    updated[index] = {
      ...updated[index],
      [field]: value,
      sheetName: field === 'sheetName' ? value : newSheet
    };

    // Recompute purpose if caseType or product changes
    if (field === 'caseType' || field === 'product') {
      const cType = field === 'caseType' ? value : updated[index].caseType;
      const prod = field === 'product' ? value : updated[index].product;
      updated[index].purpose = [cType, prod].filter(Boolean).join(' — ');
    }

    onChangeRows(updated);
    setValidationError('');
  };

  const deleteRow = (index) => {
    const updated = rows.filter((_, idx) => idx !== index);
    onChangeRows(updated);
  };

  const deleteAllRows = () => {
    onChangeRows([]);
  };

  const addManualRow = () => {
    const defaultTech = technicians.length > 0 ? technicians[0].name : '';
    const newRow = {
      id: 'draft_' + Math.random().toString(36).substring(2, 9),
      caseNumber: '',
      sourceTag: '',
      customerName: '',
      phone1: '',
      phone2: '',
      address: '',
      caseType: 'Installation',
      product: '',
      orderDate: '',
      amount1: '',
      amount2: '',
      note: 'today',
      assignedTo: defaultTech,
      sheetName: 'Shubh',
      purpose: '',
      status: 'Pending',
      workDone: 'today',
      rawText: 'Manually added case',
      isLowConfidence: false,
      warnings: []
    };
    onChangeRows([...rows, newRow]);
  };

  const applyTechnicianToAll = (techName) => {
    if (!techName) return;
    const updated = rows.map(r => ({
      ...r,
      assignedTo: techName
    }));
    onChangeRows(updated);
  };

  const toggleRawText = (index) => {
    setShowRawText(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSaveClick = () => {
    // Zero-failure validation & auto-fill: Ensure all rows have valid fields before saving
    const defaultTech = (technicians.length > 0 ? technicians[0].name : '') || 'Unassigned';

    const sanitized = rows.map((r, idx) => {
      const caseNum = (r.caseNumber || '').trim();
      let custName = (r.customerName || '').trim();
      if (!custName) {
        custName = caseNum ? `Customer (${caseNum})` : `Customer ${idx + 1}`;
      }
      let tech = (r.assignedTo || '').trim();
      if (!tech) {
        tech = defaultTech;
      }
      let sheet = (r.sheetName || '').trim();
      if (!sheet) {
        sheet = /^aarvee/i.test(r.sourceTag) ? 'Aarvee' : 'Shubh';
      }
      let cType = (r.caseType || '').trim();
      if (!cType) {
        cType = 'Installation';
      }

      return {
        ...r,
        caseNumber: caseNum,
        customerName: custName,
        address: '',
        assignedTo: tech,
        assignedTechnicianName: tech,
        sheetName: sheet,
        caseType: cType,
        purpose: r.purpose || [cType, r.product].filter(Boolean).join(' — ')
      };
    });

    setValidationError('');
    onChangeRows(sanitized);
    onSaveAll(sanitized);
  };

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mt-3">
      
      {/* Review Header Bar */}
      <div className="bg-slate-900 text-white px-3.5 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
            Review
          </span>
          <h3 className="text-xs font-bold text-white">
            Parsed Cases ({rows.length})
          </h3>
          <span className="text-[11px] text-slate-400 hidden lg:inline">
            • Review details before saving to portal
          </span>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Quick Assign All */}
          <div className="flex items-center bg-slate-800 rounded-md px-2 py-0.5 border border-slate-700 text-xs">
            <span className="text-slate-400 mr-1.5 text-[11px] whitespace-nowrap">Set All:</span>
            <select
              onChange={(e) => applyTechnicianToAll(e.target.value)}
              defaultValue=""
              className="bg-slate-900 text-white border-0 rounded text-xs font-semibold focus:ring-1 focus:ring-emerald-500 py-0.5 cursor-pointer"
            >
              <option value="" disabled>Choose Technician...</option>
              {technicians.map(t => (
                <option key={t._id || t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Add Manual Row */}
          <button
            type="button"
            onClick={addManualRow}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Add Row</span>
          </button>

          {/* Discard / Delete All Rows */}
          <button
            type="button"
            onClick={deleteAllRows}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-900/80 rounded-md border border-rose-800/50 transition-colors cursor-pointer"
            title="Delete all parsed cases and return to message input"
          >
            <Trash2 className="w-3 h-3 text-rose-400" />
            <span>Discard All</span>
          </button>

          {/* Save All Button */}
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving}
            className="flex items-center space-x-1 px-3.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md shadow-sm transition-all border border-emerald-500 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : `Save & Sync (${rows.length})`}</span>
          </button>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-3 text-rose-800 text-xs flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Validation Blocked: </span>
            <span>{validationError}</span>
          </div>
        </div>
      )}

      {/* Editable Table */}
      <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-300">
            <tr>
              <th className="py-2.5 px-2 text-center w-10 bg-slate-200">#</th>
              <th className="py-2.5 px-2 min-w-[95px]">Source Tag</th>
              <th className="py-2.5 px-2 min-w-[95px]">Target Sheet</th>
              <th className="py-2.5 px-2 min-w-[110px]">Case #</th>
              <th className="py-2.5 px-2 min-w-[150px]">Customer Name *</th>
              <th className="py-2.5 px-2 min-w-[120px]">Phone 1</th>
              <th className="py-2.5 px-2 min-w-[120px]">Phone 2</th>
              <th className="py-2.5 px-2 min-w-[140px]">Case Type</th>
              <th className="py-2.5 px-2 min-w-[150px]">Product / Model</th>
              <th className="py-2.5 px-2 min-w-[90px]">{settings.amount1Label ? settings.amount1Label.split('/')[0] : 'Amt 1'}</th>
              <th className="py-2.5 px-2 min-w-[90px]">{settings.amount2Label ? settings.amount2Label.split('/')[0] : 'Amt 2'}</th>
              <th className="py-2.5 px-2 min-w-[130px]">Technician *</th>
              <th className="py-2.5 px-2 min-w-[120px]">Note / Trailing</th>
              <th className="py-2.5 px-2 text-center w-16">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {rows.map((row, index) => {
              const isMissingCaseNum = !row.caseNumber;
              const isMissingCustomer = !row.customerName;
              const isMissingPhone = !row.phone1;
              const isMissingTech = !row.assignedTo;
              const isMissingProduct = !row.product;

              return (
                <React.Fragment key={row.id || index}>
                  <tr className={`hover:bg-slate-50 transition-colors ${row.isLowConfidence ? 'bg-amber-50/40' : ''}`}>
                    
                    {/* Index & Confidence Badge */}
                    <td className="py-2 px-2 text-center font-mono font-bold text-slate-500 bg-slate-50 border-r border-slate-200">
                      <div className="flex flex-col items-center">
                        <span>{index + 1}</span>
                        {row.isLowConfidence && (
                          <span title="Low confidence extraction - please verify details" className="cursor-help mt-0.5">
                            <HelpCircle className="w-3 h-3 text-amber-500" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Source Tag */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={row.sourceTag || ''}
                        placeholder="e.g. Auto"
                        onChange={(e) => updateCell(index, 'sourceTag', e.target.value)}
                        className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded focus:border-emerald-500 focus:outline-hidden"
                      />
                    </td>

                    {/* Target Sheet */}
                    <td className="py-1.5 px-2">
                      <select
                        value={row.sheetName || 'Shubh'}
                        onChange={(e) => updateCell(index, 'sheetName', e.target.value)}
                        className={`w-full text-xs font-bold px-2 py-1 rounded border focus:outline-hidden ${
                          (row.sheetName || '').toLowerCase() === 'aarvee'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : (row.sheetName || '').toLowerCase() === 'sheet1'
                            ? 'bg-purple-50 text-purple-900 border-purple-300'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        }`}
                      >
                        <option value="Shubh">Shubh</option>
                        <option value="Aarvee">Aarvee</option>
                        <option value="Sheet1">Sheet1</option>
                      </select>
                    </td>

                    {/* Case Number */}
                    <td className="py-1.5 px-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={row.caseNumber || ''}
                          placeholder="Case #"
                          onChange={(e) => updateCell(index, 'caseNumber', e.target.value)}
                          className={`w-full text-xs font-mono font-bold px-2 py-1 rounded focus:outline-hidden ${
                            isMissingCaseNum 
                              ? 'border-2 border-amber-300 bg-amber-50/50 text-amber-900 focus:border-amber-500' 
                              : 'border border-slate-200 bg-white text-slate-900 focus:border-emerald-500'
                          }`}
                        />
                        {isMissingCaseNum && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Customer Name */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={row.customerName || ''}
                        placeholder="Customer Name *"
                        onChange={(e) => updateCell(index, 'customerName', e.target.value)}
                        className={`w-full text-xs font-bold px-2 py-1 rounded focus:outline-hidden ${
                          isMissingCustomer 
                            ? 'border-2 border-rose-400 bg-rose-50 text-rose-900 focus:border-rose-500' 
                            : 'border border-slate-200 bg-white text-slate-900 focus:border-emerald-500'
                        }`}
                      />
                    </td>

                    {/* Phone 1 */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={row.phone1 || ''}
                        placeholder="10-digit Phone"
                        onChange={(e) => updateCell(index, 'phone1', e.target.value)}
                        className={`w-full text-xs font-mono px-2 py-1 rounded focus:outline-hidden ${
                          isMissingPhone 
                            ? 'border-2 border-amber-300 bg-amber-50/50 text-amber-900' 
                            : 'border border-slate-200 bg-white text-slate-900 focus:border-emerald-500'
                        }`}
                      />
                    </td>

                    {/* Phone 2 */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={row.phone2 || ''}
                        placeholder="Alt Phone"
                        onChange={(e) => updateCell(index, 'phone2', e.target.value)}
                        className="w-full text-xs font-mono px-2 py-1 bg-white border border-slate-200 rounded focus:border-emerald-500 focus:outline-hidden"
                      />
                    </td>

                    {/* Case Type */}
                    <td className="py-1.5 px-2">
                      <select
                        value={row.caseType || 'Installation'}
                        onChange={(e) => updateCell(index, 'caseType', e.target.value)}
                        className={`w-full text-xs font-bold px-2 py-1 rounded border focus:outline-hidden ${
                          (row.caseType || '').toLowerCase() === 'installation'
                            ? 'bg-purple-50 text-purple-900 border-purple-300'
                            : (row.caseType || '').toLowerCase() === 'complaint'
                            ? 'bg-rose-50 text-rose-900 border-rose-300'
                            : (row.caseType || '').toLowerCase() === 'order'
                            ? 'bg-blue-50 text-blue-900 border-blue-300'
                            : (row.caseType || '').toLowerCase() === 'auto'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-white text-slate-900 border-slate-200'
                        }`}
                      >
                        <option value="Installation">Installation</option>
                        <option value="Complaint">Complaint</option>
                        <option value="Order">Order</option>
                        <option value="Auto">Auto</option>
                      </select>
                    </td>

                    {/* Product */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={row.product || ''}
                        placeholder="Product Model"
                        onChange={(e) => updateCell(index, 'product', e.target.value)}
                        className={`w-full text-xs px-2 py-1 rounded focus:outline-hidden ${
                          isMissingProduct 
                            ? 'border border-amber-300 bg-amber-50/30 text-amber-900' 
                            : 'border border-slate-200 bg-white text-slate-900 focus:border-emerald-500'
                        }`}
                      />
                    </td>

                    {/* Amount 1 */}
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        value={row.amount1 !== undefined ? row.amount1 : ''}
                        placeholder="0"
                        onChange={(e) => updateCell(index, 'amount1', e.target.value)}
                        className="w-full text-xs font-mono px-2 py-1 bg-white border border-slate-200 rounded focus:border-emerald-500 focus:outline-hidden"
                      />
                    </td>

                    {/* Amount 2 */}
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        value={row.amount2 !== undefined ? row.amount2 : ''}
                        placeholder="0"
                        onChange={(e) => updateCell(index, 'amount2', e.target.value)}
                        className="w-full text-xs font-mono px-2 py-1 bg-white border border-slate-200 rounded focus:border-emerald-500 focus:outline-hidden"
                      />
                    </td>

                    {/* Assigned Technician */}
                    <td className="py-1.5 px-2">
                      <select
                        value={row.assignedTo || ''}
                        onChange={(e) => updateCell(index, 'assignedTo', e.target.value)}
                        className={`w-full text-xs font-bold px-2 py-1 rounded focus:outline-hidden ${
                          isMissingTech 
                            ? 'border-2 border-rose-400 bg-rose-50 text-rose-900' 
                            : 'border border-slate-200 bg-white text-slate-900 focus:border-emerald-500'
                        }`}
                      >
                        <option value="">Select Tech *</option>
                        {technicians.map(t => (
                          <option key={t._id || t.name} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Note / Remarks */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        list="review-remark-presets"
                        value={row.note || row.workDone || ''}
                        placeholder="Notes / Remarks"
                        onChange={(e) => {
                          updateCell(index, 'note', e.target.value);
                          updateCell(index, 'workDone', e.target.value);
                        }}
                        className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded focus:border-emerald-500 focus:outline-hidden"
                      />
                      <datalist id="review-remark-presets">
                        {REMARK_PRESETS.map((p, pIdx) => (
                          <option key={pIdx} value={p} />
                        ))}
                      </datalist>
                    </td>

                    {/* Actions */}
                    <td className="py-1.5 px-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => toggleRawText(index)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded"
                          title="Toggle original WhatsApp message text"
                        >
                          {showRawText[index] ? <EyeOff className="w-3.5 h-3.5 text-blue-600" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRow(index)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>

                  {/* Collapsible Raw Message View */}
                  {showRawText[index] && (
                    <tr className="bg-slate-900 text-slate-300 font-mono text-[11px]">
                      <td colSpan={14} className="py-2 px-4 border-b border-slate-800">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-emerald-400 font-bold mr-2">Original WhatsApp Text:</span>
                            <span className="text-slate-200 whitespace-pre-wrap">{row.rawText}</span>
                          </div>
                          {row.warnings && row.warnings.length > 0 && (
                            <div className="text-amber-400 text-[10px] ml-4 shrink-0 font-sans font-semibold">
                              Parser Notes: {row.warnings.join(', ')}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Review Footer Summary */}
      <div className="bg-slate-50 border-t border-slate-200 p-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-800">Total in Draft: {rows.length} cases</span>
          <span>•</span>
          <span className="text-amber-700">
            Missing Case #: {rows.filter(r => !r.caseNumber).length}
          </span>
          <span>•</span>
          <span className="text-emerald-700">
            Ready to Save: {rows.filter(r => r.customerName && r.address && r.assignedTo).length}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSaveClick}
          disabled={isSaving}
          className="flex items-center space-x-1.5 px-5 py-2 text-xs sm:text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-all border border-emerald-500 disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>Save All {rows.length} Cases to Portal</span>
        </button>
      </div>

    </div>
  );
}
