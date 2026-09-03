import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Settings, 
  Tag, 
  Plus, 
  Trash2,
  CheckCircle2 
} from 'lucide-react';

export default function SettingsModal({ 
  settings = {}, 
  isOpen, 
  onClose, 
  onSaveSettings 
}) {
  const [amount1Label, setAmount1Label] = useState(settings.amount1Label || 'Product Price / Amount 1');
  const [amount2Label, setAmount2Label] = useState(settings.amount2Label || 'Service / Visit Charge');
  const [caseTypes, setCaseTypes] = useState(settings.caseTypes || []);
  const [newTypeInput, setNewTypeInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddType = (e) => {
    e.preventDefault();
    if (!newTypeInput.trim()) return;
    if (!caseTypes.includes(newTypeInput.trim())) {
      setCaseTypes([...caseTypes, newTypeInput.trim()]);
    }
    setNewTypeInput('');
  };

  const handleRemoveType = (typeToRemove) => {
    setCaseTypes(caseTypes.filter(t => t !== typeToRemove));
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveSettings({
      amount1Label: amount1Label.trim(),
      amount2Label: amount2Label.trim(),
      caseTypes
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Portal Settings & Labels
              </h3>
              <p className="text-xs text-slate-400">
                Customize column labels & known case types without code change
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

        <form onSubmit={handleSave} className="p-6 space-y-6">
          
          {/* Amount Labels */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Editable Amount Column Headers
            </h4>
            <p className="text-xs text-slate-500">
              Customize what Amount 1 and Amount 2 represent in your business Excel sheets.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount 1 Column Label:
              </label>
              <input
                type="text"
                value={amount1Label}
                onChange={(e) => setAmount1Label(e.target.value)}
                placeholder="e.g. Product Price / Amount 1"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount 2 Column Label:
              </label>
              <input
                type="text"
                value={amount2Label}
                onChange={(e) => setAmount2Label(e.target.value)}
                placeholder="e.g. Service / Visit Charge"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Known Case Types List */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center">
              <Tag className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Known Case Type Keywords (§5.3)
            </h4>
            <p className="text-xs text-slate-500">
              The WhatsApp parser automatically detects these phrases when messages do not contain square brackets.
            </p>

            <div className="flex space-x-2">
              <input
                type="text"
                value={newTypeInput}
                onChange={(e) => setNewTypeInput(e.target.value)}
                placeholder="Add new phrase (e.g. Filter Change)"
                className="flex-1 text-xs px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddType}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
              {caseTypes.map((ct) => (
                <span
                  key={ct}
                  className="inline-flex items-center px-2 py-1 rounded bg-white text-slate-800 text-xs font-medium border border-slate-200 shadow-2xs"
                >
                  <span>{ct}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveType(ct)}
                    className="ml-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-xs text-emerald-600 font-bold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Settings Saved!
              </span>
            ) : <span />}

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
                <span>Save Settings</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
