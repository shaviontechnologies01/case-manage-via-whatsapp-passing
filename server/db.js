import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create data dir:', e);
  }
}

// Initial seed technicians as required: Patil, Anwar, Jignesh, Bhavesh (+ Shoeb from Excel)
export const DEFAULT_TECHNICIANS = [
  { _id: 'tech_1', name: 'Patil', phone: '9825100001', active: true },
  { _id: 'tech_2', name: 'Anwar', phone: '9825100002', active: true },
  { _id: 'tech_3', name: 'Jignesh', phone: '9825100003', active: true },
  { _id: 'tech_4', name: 'Bhavesh', phone: '9825100004', active: true },
  { _id: 'tech_5', name: 'Shoeb', phone: '9825100005', active: true }
];

export const DEFAULT_SETTINGS = {
  amount1Label: 'Product Price / Amount 1',
  amount2Label: 'Service / Visit Charge',
  caseTypes: [
    'costumer assist',
    'Order',
    'assistant required',
    'Leakage Issue',
    'leakage',
    'Installation',
    'Installation Request',
    'Assistance Required',
    'consumer retention',
    'Complaint'
  ]
};

// Initial sample cases matching the user's Excel reference sheet
export const DEFAULT_CASES = [
  {
    _id: 'case_1',
    caseNumber: '50629573',
    sourceTag: 'Complaint',
    customerName: 'JEEVAN PRADEEP PURI',
    phone1: '9879012345',
    address: 'Flat 402, Royal Residency, Adajan, Surat',
    caseType: 'Complaint',
    product: 'Ultima Mineral RO+UV+MF',
    purpose: 'Complaint — Ultima Mineral RO+UV+MF',
    assignedTo: 'Anwar',
    assignedTechnicianName: 'Anwar',
    status: 'In Progress',
    workDone: 'not ready to pay service charge',
    note: 'not ready to pay service charge',
    amount1: 2900,
    amount2: 400,
    rawText: '50629573 JEEVAN PRADEEP PURI Complaint[Ultima Mineral RO+UV+MF] 9879012345 Flat 402, Royal Residency, Adajan, Surat 2900 400',
    createdAt: new Date('2025-08-10').toISOString()
  },
  {
    _id: 'case_2',
    caseNumber: '50635631',
    sourceTag: 'Installation',
    customerName: 'sravan sushar',
    phone1: '9913759313',
    address: 'B-201, Green City, Pal Bhatha, Surat',
    caseType: 'Installation',
    product: 'Revito Pro WR5840P',
    purpose: 'Installation — Revito Pro WR5840P',
    assignedTo: 'Shoeb',
    assignedTechnicianName: 'Shoeb',
    status: 'Completed',
    workDone: 'Installation completed with 1 year warranty card issued',
    note: '',
    amount1: 4500,
    amount2: 500,
    rawText: '50635631 sravan sushar Installation[Revito Pro WR5840P] 9913759313 B-201, Green City, Pal Bhatha, Surat 4500 500',
    createdAt: new Date('2025-08-11').toISOString()
  },
  {
    _id: 'case_3',
    caseNumber: '50644781',
    sourceTag: 'Complaint',
    customerName: 'MEERA R SHAH',
    phone1: '9033806949',
    address: '12- Shashank residency, nr western hightn, ugat canal road',
    caseType: 'Complaint',
    product: 'Classic UV 6000L Refresh',
    purpose: 'Complaint — Classic UV 6000L Refresh',
    assignedTo: 'Patil',
    assignedTechnicianName: 'Patil',
    status: 'Pending',
    workDone: 'not given cancel ocde',
    note: 'not given cancel ocde',
    amount1: 3000,
    amount2: 400,
    rawText: '50644781 MEERA R SHAH Complaint[Classic UV 6000L Refresh] 9033806949 12- Shashank residency 3000 400',
    createdAt: new Date('2025-08-12').toISOString()
  },
  {
    _id: 'case_4',
    caseNumber: '50671699',
    sourceTag: 'Order',
    customerName: 'Manisha s Ghiwala',
    phone1: '9737844360',
    address: 'A-901, Ramji Residency, Near Omkar Heights, Jahangirabad, Surat',
    caseType: 'Order',
    product: 'GCUV300',
    purpose: 'Order — GCUV300',
    assignedTo: 'Jignesh',
    assignedTechnicianName: 'Jignesh',
    status: 'In Progress',
    workDone: 'not ready to replace GKK',
    note: 'not ready to replace GKK',
    amount1: 3100,
    amount2: 400,
    rawText: '50671699 Manisha s Ghiwala Order[GCUV300] 9737844360 A-901 Ramji Residency 3100 400',
    createdAt: new Date('2025-08-14').toISOString()
  },
  {
    _id: 'case_5',
    caseNumber: '50670291',
    sourceTag: 'Order',
    customerName: 'DR. DHAVAL MERCHANT',
    phone1: '9824102938',
    address: 'G-101, KINGSTON APARTMENT APPOSITE-GREEN CITY, PAL-BHATHA,SURAT',
    caseType: 'Order',
    product: 'GPRD500',
    purpose: 'Order — GPRD500',
    assignedTo: 'Patil',
    assignedTechnicianName: 'Patil',
    status: 'Pending',
    workDone: 'not ready to replace GKK',
    note: 'not ready to replace GKK',
    amount1: 4200,
    amount2: 400,
    rawText: '50670291 DR. DHAVAL MERCHANT Order[GPRD500] 9824102938 G-101 KINGSTON 4200 400',
    createdAt: new Date('2025-08-15').toISOString()
  },
  {
    _id: 'case_6',
    caseNumber: '50711723',
    sourceTag: 'Installation',
    customerName: 'CHAATRA SINGH',
    phone1: '7984487996',
    address: 'B-1104, Shyam enclave, mora bhagal, Surat',
    caseType: 'Installation',
    product: 'Revito Pro WR5840P',
    purpose: 'Installation — Revito Pro WR5840P',
    assignedTo: 'Anwar',
    assignedTechnicianName: 'Anwar',
    status: 'Cancelled',
    workDone: 'cancel(after 10 days) - O/S',
    note: 'cancel(after 10 days)',
    amount1: 4500,
    amount2: 500,
    rawText: '50711723 CHAATRA SINGH Installation[Revito Pro WR5840P] 7984487996 B-1104 Shyam enclave 4500 500',
    createdAt: new Date('2025-08-16').toISOString()
  },
  {
    _id: 'case_7',
    caseNumber: '50714546',
    sourceTag: 'Order',
    customerName: 'DINESH SHAH',
    phone1: '9574994067',
    address: 'A-903, Shiv Samarth-2, Pal gam, Surat',
    caseType: 'Order',
    product: 'gcrx200',
    purpose: 'Order — gcrx200',
    assignedTo: 'Bhavesh',
    assignedTechnicianName: 'Bhavesh',
    status: 'Completed',
    workDone: 'no any order / checked filter status',
    note: 'no any order',
    amount1: 2900,
    amount2: 400,
    rawText: '50714546 DINESH SHAH Order[gcrx200] 9574994067 A-903 Shiv Samarth 2900 400',
    createdAt: new Date('2025-08-18').toISOString()
  }
];

// In-Memory / File Persistent Store
class JsonStore {
  constructor() {
    this.data = {
      technicians: [...DEFAULT_TECHNICIANS],
      cases: [...DEFAULT_CASES],
      settings: { ...DEFAULT_SETTINGS }
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.technicians && parsed.technicians.length > 0) {
          this.data.technicians = parsed.technicians;
        }
        if (parsed.cases && parsed.cases.length > 0) {
          this.data.cases = parsed.cases;
        }
        if (parsed.settings) {
          this.data.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
        }
      } else {
        this.save();
      }
    } catch (e) {
      console.warn('Could not load db.json, using defaults:', e.message);
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save db.json:', e);
    }
  }

  // Technicians
  getTechnicians() {
    return this.data.technicians;
  }

  addTechnician(tech) {
    const id = 'tech_' + Date.now();
    const newTech = { _id: id, ...tech, active: true };
    this.data.technicians.push(newTech);
    this.save();
    return newTech;
  }

  updateTechnician(id, updates) {
    const idx = this.data.technicians.findIndex(t => t._id === id || t.name === id);
    if (idx !== -1) {
      this.data.technicians[idx] = { ...this.data.technicians[idx], ...updates };
      this.save();
      return this.data.technicians[idx];
    }
    return null;
  }

  deleteTechnician(id) {
    this.data.technicians = this.data.technicians.filter(t => t._id !== id && t.name !== id);
    this.save();
    return true;
  }

  // Cases
  getCases(filters = {}) {
    let result = [...this.data.cases];

    if (filters.technician && filters.technician !== 'all') {
      result = result.filter(c => 
        (c.assignedTo && c.assignedTo.toLowerCase() === filters.technician.toLowerCase()) ||
        (c.assignedTechnicianName && c.assignedTechnicianName.toLowerCase() === filters.technician.toLowerCase())
      );
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter(c => c.status && c.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.caseType && filters.caseType !== 'all') {
      result = result.filter(c => c.caseType && c.caseType.toLowerCase() === filters.caseType.toLowerCase());
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(c => 
        (c.customerName && c.customerName.toLowerCase().includes(q)) ||
        (c.caseNumber && c.caseNumber.toLowerCase().includes(q)) ||
        (c.phone1 && c.phone1.includes(q)) ||
        (c.phone2 && c.phone2.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.product && c.product.toLowerCase().includes(q)) ||
        (c.workDone && c.workDone.toLowerCase().includes(q)) ||
        (c.note && c.note.toLowerCase().includes(q))
      );
    }

    if (filters.date) {
      const qDate = filters.date.trim();
      result = result.filter(c => {
        const cDate = (c.createdAt ? c.createdAt.slice(0, 10) : '') || c.orderDate || (c.entryDate || '');
        return cDate === qDate || (c.orderDate && c.orderDate.includes(qDate));
      });
    }

    if (filters.startDate) {
      const sDate = new Date(filters.startDate);
      result = result.filter(c => {
        const itemDate = new Date(c.orderDate || c.createdAt);
        return itemDate >= sDate;
      });
    }

    if (filters.endDate) {
      const eDate = new Date(filters.endDate);
      eDate.setHours(23, 59, 59, 999);
      result = result.filter(c => {
        const itemDate = new Date(c.orderDate || c.createdAt);
        return itemDate <= eDate;
      });
    }

    // Sort by createdAt desc
    result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return result;
  }

  getCaseById(id) {
    return this.data.cases.find(c => c._id === id || c.id === id);
  }

  addCase(caseData) {
    const id = 'case_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const purpose = caseData.purpose || [caseData.caseType, caseData.product].filter(Boolean).join(' — ');
    const now = new Date().toISOString();
    const workDoneVal = caseData.workDone || caseData.note || 'today';
    const low = workDoneVal.toLowerCase();
    
    let status = caseData.status;
    if (!status) {
      if (low === 'done' || low.startsWith('done') || low.includes('completed')) {
        status = 'Completed';
      } else if (low.includes('cancel')) {
        status = 'Cancelled';
      } else {
        status = 'Pending';
      }
    }

    const newCase = {
      _id: id,
      ...caseData,
      workDone: workDoneVal,
      note: workDoneVal,
      status,
      completedAt: status === 'Completed' ? now : null,
      cancelledAt: status === 'Cancelled' ? now : null,
      sheetName: caseData.sheetName || 'Shubh',
      purpose,
      createdAt: caseData.createdAt || now
    };
    this.data.cases.unshift(newCase);
    this.save();
    return newCase;
  }

  addBulkCases(casesArray) {
    const saved = [];
    const now = new Date().toISOString();

    for (const item of casesArray) {
      const caseNum = (item.caseNumber || '').trim();
      const existingIdx = caseNum ? this.data.cases.findIndex(c => c.caseNumber && c.caseNumber.trim() === caseNum) : -1;
      const purpose = item.purpose || [item.caseType, item.product].filter(Boolean).join(' — ');

      const workDoneVal = item.workDone !== undefined && item.workDone !== '' ? item.workDone : (item.note || 'today');
      const low = workDoneVal.toLowerCase();
      let status = item.status;
      if (!status) {
        if (low === 'done' || low.startsWith('done') || low.includes('completed')) {
          status = 'Completed';
        } else if (low.includes('cancel')) {
          status = 'Cancelled';
        } else {
          status = 'Pending';
        }
      }

      if (existingIdx !== -1) {
        // Update existing case
        const existing = this.data.cases[existingIdx];
        const updatedStatus = status || existing.status;
        const updated = {
          ...existing,
          sourceTag: item.sourceTag || existing.sourceTag,
          customerName: item.customerName || existing.customerName,
          phone1: item.phone1 || existing.phone1,
          phone2: item.phone2 || existing.phone2,
          address: item.address || existing.address,
          caseType: item.caseType || existing.caseType,
          product: item.product || existing.product,
          purpose: purpose || existing.purpose,
          sheetName: item.sheetName || existing.sheetName || 'Shubh',
          assignedTo: item.assignedTo || existing.assignedTo,
          assignedTechnicianName: item.assignedTechnicianName || item.assignedTo || existing.assignedTechnicianName,
          workDone: workDoneVal,
          extraRemarks: item.extraRemarks !== undefined ? item.extraRemarks : (existing.extraRemarks || ''),
          note: workDoneVal,
          status: updatedStatus,
          completedAt: updatedStatus === 'Completed' ? (existing.completedAt || now) : null,
          cancelledAt: updatedStatus === 'Cancelled' ? (existing.cancelledAt || now) : null,
          updatedAt: now
        };
        this.data.cases[existingIdx] = updated;
        saved.push(updated);
      } else {
        // Insert new case
        const id = 'case_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const newCase = {
          _id: id,
          caseNumber: item.caseNumber || '',
          sourceTag: item.sourceTag || '',
          customerName: item.customerName || '',
          phone1: item.phone1 || '',
          phone2: item.phone2 || '',
          address: item.address || '',
          caseType: item.caseType || '',
          product: item.product || '',
          orderDate: item.orderDate || '',
          amount1: item.amount1 !== '' && item.amount1 !== undefined ? Number(item.amount1) : '',
          amount2: item.amount2 !== '' && item.amount2 !== undefined ? Number(item.amount2) : '',
          note: workDoneVal,
          sheetName: item.sheetName || 'Shubh',
          assignedTo: item.assignedTo || '',
          assignedTechnicianName: item.assignedTechnicianName || item.assignedTo || '',
          purpose,
          status,
          completedAt: status === 'Completed' ? now : null,
          cancelledAt: status === 'Cancelled' ? now : null,
          workDone: workDoneVal,
          extraRemarks: item.extraRemarks || '',
          rawText: item.rawText || '',
          createdAt: item.createdAt || now
        };
        this.data.cases.unshift(newCase);
        saved.push(newCase);
      }
    }
    this.save();
    return saved;
  }

  updateCase(id, updates) {
    const idx = this.data.cases.findIndex(c => c._id === id || c.id === id);
    if (idx !== -1) {
      const current = this.data.cases[idx];
      const purpose = updates.purpose || [updates.caseType || current.caseType, updates.product || current.product].filter(Boolean).join(' — ');
      const now = new Date().toISOString();

      let effectiveStatus = updates.status !== undefined ? updates.status : current.status;
      // Auto-detect status if workDone is provided and status is not explicitly set
      if (updates.workDone !== undefined && updates.status === undefined) {
        const low = String(updates.workDone || '').toLowerCase();
        if (low === 'done' || low.startsWith('done') || low.includes('completed')) {
          effectiveStatus = 'Completed';
        } else if (low.includes('cancel')) {
          effectiveStatus = 'Cancelled';
        } else if (low === 'today') {
          effectiveStatus = 'Pending';
        }
      }

      // If status is updated to Completed but workDone is still 'today', set workDone to 'done'
      let workDoneVal = updates.workDone !== undefined ? updates.workDone : current.workDone;
      if (effectiveStatus === 'Completed' && (!workDoneVal || workDoneVal === 'today')) {
        workDoneVal = 'done';
      }

      this.data.cases[idx] = {
        ...current,
        ...updates,
        status: effectiveStatus,
        workDone: workDoneVal,
        note: updates.note !== undefined ? updates.note : workDoneVal,
        completedAt: effectiveStatus === 'Completed' ? (current.completedAt || now) : null,
        cancelledAt: effectiveStatus === 'Cancelled' ? (current.cancelledAt || now) : null,
        purpose,
        updatedAt: now
      };
      this.save();
      return this.data.cases[idx];
    }
    return null;
  }

  deleteCase(id) {
    const initialLen = this.data.cases.length;
    this.data.cases = this.data.cases.filter(c => c._id !== id && c.id !== id);
    this.save();
    return this.data.cases.length < initialLen;
  }

  // Settings
  getSettings() {
    return this.data.settings;
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
    return this.data.settings;
  }
}

export const dbStore = new JsonStore();

// Mongoose Connection Setup (optional if MONGODB_URI is provided)
let isMongooseConnected = false;

export async function initMongoose() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('Using persistent JSON store at /data/db.json (Set MONGODB_URI to use external MongoDB).');
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000
    });
    isMongooseConnected = true;
    console.log('Connected to MongoDB via Mongoose!');
  } catch (err) {
    console.warn('MongoDB connection failed, continuing with file-backed JSON store:', err.message);
  }
}
