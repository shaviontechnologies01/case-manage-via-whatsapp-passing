import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Users, 
  Phone, 
  Trash2, 
  Edit2, 
  Check, 
  AlertCircle 
} from 'lucide-react';

export default function TechnicianModal({ 
  technicians = [], 
  cases = [], 
  isOpen, 
  onClose, 
  onAddTechnician, 
  onUpdateTechnician, 
  onDeleteTechnician 
}) {
  const [newTechName, setNewTechName] = useState('');
  const [newTechPhone, setNewTechPhone] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTechName.trim()) {
      setError('Technician name is required.');
      return;
    }
    
    // Check duplicate
    if (technicians.some(t => t.name.toLowerCase() === newTechName.trim().toLowerCase())) {
      setError('A technician with this name already exists.');
      return;
    }

    onAddTechnician({ name: newTechName.trim(), phone: newTechPhone.trim() });
    setNewTechName('');
    setNewTechPhone('');
    setError('');
  };

  const startEdit = (tech) => {
    setEditingId(tech._id || tech.name);
    setEditName(tech.name);
    setEditPhone(tech.phone || '');
  };

  const saveEdit = (id) => {
    if (!editName.trim()) return;
    onUpdateTechnician(id, { name: editName.trim(), phone: editPhone.trim() });
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Field Technicians Management
              </h3>
              <p className="text-xs text-slate-400">
                Add, rename, or remove RO service technicians
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

        <div className="p-6">
          
          {/* Add New Technician Form */}
          <form onSubmit={handleAdd} className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center">
              <UserPlus className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Add New Technician
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                placeholder="Technician Name (e.g. Patil)"
                value={newTechName}
                onChange={(e) => setNewTechName(e.target.value)}
                className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <input
                type="text"
                placeholder="Phone Number (Optional)"
                value={newTechPhone}
                onChange={(e) => setNewTechPhone(e.target.value)}
                className="text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {error && (
              <p className="text-rose-600 text-xs mb-2 flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 py-2 rounded-lg transition-colors flex items-center justify-center space-x-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add to Roster</span>
            </button>
          </form>

          {/* Current Roster List */}
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">
            Current Active Technicians ({technicians.length})
          </h4>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {technicians.map((tech) => {
              const id = tech._id || tech.name;
              const isEditing = editingId === id;
              const activeCaseCount = cases.filter(c => 
                (c.assignedTechnicianName || c.assignedTo || '').toLowerCase() === tech.name.toLowerCase() &&
                (c.status !== 'Completed' && c.status !== 'Cancelled')
              ).length;
              const totalCaseCount = cases.filter(c => 
                (c.assignedTechnicianName || c.assignedTo || '').toLowerCase() === tech.name.toLowerCase()
              ).length;

              return (
                <div 
                  key={id}
                  className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors shadow-2xs"
                >
                  {isEditing ? (
                    <div className="flex-1 flex items-center space-x-2 mr-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-xs font-bold px-2 py-1 border border-emerald-500 rounded bg-white w-1/2"
                      />
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="text-xs font-mono px-2 py-1 border border-emerald-500 rounded bg-white w-1/2"
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit(id)}
                        className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-slate-900">{tech.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {activeCaseCount} active / {totalCaseCount} total
                        </span>
                      </div>
                      {tech.phone && (
                        <p className="text-xs font-mono text-slate-500 flex items-center mt-0.5">
                          <Phone className="w-3 h-3 mr-1 text-slate-400" />
                          {tech.phone}
                        </p>
                      )}
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => startEdit(tech)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Rename technician"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Remove ${tech.name} from technicians list?`)) {
                            onDeleteTechnician(id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete technician"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
