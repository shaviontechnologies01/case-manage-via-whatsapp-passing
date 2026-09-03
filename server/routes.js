import express from 'express';
import ExcelJS from 'exceljs';
import { dbStore } from './db.js';
import { splitMessages, parseSingleMessage } from './parser.js';

const router = express.Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'WEDLANCER PRIVATE Case Portal API' });
});

// --- PARSER ROUTES ---
router.post('/parser/parse', (req, res) => {
  try {
    const { rawText, defaultTechnician } = req.body;
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: 'Please provide WhatsApp message text to parse.' });
    }

    const settings = dbStore.getSettings();
    const customTypes = settings?.caseTypes || [];

    // Split text into individual messages
    const messageSegments = splitMessages(rawText);
    
    // Parse each segment
    const parsedRows = messageSegments.map(segment => {
      return parseSingleMessage(segment, defaultTechnician, customTypes);
    });

    res.json({
      success: true,
      totalDetected: parsedRows.length,
      rows: parsedRows
    });
  } catch (error) {
    console.error('Parser error:', error);
    res.status(500).json({ error: 'Failed to parse text: ' + error.message });
  }
});

// --- TECHNICIANS ROUTES ---
router.get('/technicians', (req, res) => {
  try {
    const technicians = dbStore.getTechnicians();
    res.json({ success: true, technicians });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/technicians', (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Technician name is required.' });
    }
    const created = dbStore.addTechnician({ name: name.trim(), phone: (phone || '').trim() });
    res.status(201).json({ success: true, technician: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/technicians/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;
    const updated = dbStore.updateTechnician(id, { name, phone });
    if (!updated) {
      return res.status(404).json({ error: 'Technician not found.' });
    }
    res.json({ success: true, technician: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/technicians/:id', (req, res) => {
  try {
    const { id } = req.params;
    dbStore.deleteTechnician(id);
    res.json({ success: true, message: 'Technician removed successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CASES ROUTES ---
router.get('/cases', (req, res) => {
  try {
    const { technician, status, search, startDate, endDate, caseType } = req.query;
    const cases = dbStore.getCases({ technician, status, search, startDate, endDate, caseType });
    res.json({ success: true, total: cases.length, cases });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/cases/:id', (req, res) => {
  try {
    const c = dbStore.getCaseById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Case not found.' });
    res.json({ success: true, case: c });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cases', (req, res) => {
  try {
    const caseData = req.body;
    if (!caseData.customerName || !caseData.customerName.trim()) {
      return res.status(400).json({ error: 'Customer Name is required.' });
    }
    if (!caseData.assignedTo || !caseData.assignedTo.trim()) {
      return res.status(400).json({ error: 'Technician assignment is required.' });
    }

    const created = dbStore.addCase(caseData);
    res.status(201).json({ success: true, case: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk Insert Cases (from WhatsApp Parser Review Table)
router.post('/cases/bulk', (req, res) => {
  try {
    const { cases } = req.body;
    if (!cases || !Array.isArray(cases) || cases.length === 0) {
      return res.status(400).json({ error: 'No cases provided for bulk save.' });
    }

    // Sanitize and ensure mandatory fields have safe defaults so imports never fail
    cases.forEach((c, idx) => {
      if (!c.customerName || !c.customerName.trim()) {
        c.customerName = c.caseNumber ? `Customer (${c.caseNumber})` : `Customer ${idx + 1}`;
      }
      c.address = '';
      if (!c.assignedTo || !c.assignedTo.trim()) {
        c.assignedTo = c.assignedTechnicianName || 'Unassigned';
      }
      if (!c.assignedTechnicianName || !c.assignedTechnicianName.trim()) {
        c.assignedTechnicianName = c.assignedTo;
      }
      if (!c.sheetName || !c.sheetName.trim()) {
        c.sheetName = 'Shubh';
      }
    });

    const savedCases = dbStore.addBulkCases(cases);
    res.status(201).json({
      success: true,
      message: `Successfully saved ${savedCases.length} case(s).`,
      count: savedCases.length,
      cases: savedCases
    });
  } catch (error) {
    console.error('Bulk save error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/cases/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = dbStore.updateCase(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Case not found.' });
    }
    res.json({ success: true, case: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/cases/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleted = dbStore.deleteCase(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Case not found.' });
    }
    res.json({ success: true, message: 'Case deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- STATS & SUMMARY ---
router.get('/stats', (req, res) => {
  try {
    const cases = dbStore.getCases();
    const technicians = dbStore.getTechnicians();

    const total = cases.length;
    const pending = cases.filter(c => c.status === 'Pending').length;
    const inProgress = cases.filter(c => c.status === 'In Progress').length;
    const completed = cases.filter(c => c.status === 'Completed').length;
    const cancelled = cases.filter(c => c.status === 'Cancelled').length;

    const techCounts = {};
    technicians.forEach(t => {
      techCounts[t.name] = {
        total: 0,
        pending: 0,
        completed: 0,
        inProgress: 0,
        cancelled: 0
      };
    });

    cases.forEach(c => {
      const tech = c.assignedTechnicianName || c.assignedTo;
      if (tech && techCounts[tech]) {
        techCounts[tech].total += 1;
        const st = (c.status || 'Pending').toLowerCase();
        if (st === 'pending') techCounts[tech].pending += 1;
        else if (st === 'in progress') techCounts[tech].inProgress += 1;
        else if (st === 'completed') techCounts[tech].completed += 1;
        else if (st === 'cancelled') techCounts[tech].cancelled += 1;
      }
    });

    res.json({
      success: true,
      stats: {
        total,
        pending,
        inProgress,
        completed,
        cancelled,
        techCounts
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- DAY VIA DAY (DAILY) STATS BREAKDOWN ---
router.get('/stats/daily', (req, res) => {
  try {
    const cases = dbStore.getCases();
    const technicians = dbStore.getTechnicians();

    const getEffectiveStatus = (c) => {
      const st = (c.status || '').toLowerCase().trim();
      const rem = (c.workDone || c.note || '').toLowerCase().trim();
      if (st === 'completed' || rem === 'done' || rem.startsWith('done') || rem.includes('completed')) {
        return 'Done';
      }
      if (st === 'cancelled' || rem.includes('cancel')) {
        return 'Cancelled';
      }
      return 'Pending';
    };

    const getCaseDateStr = (c) => {
      if (c.createdAt) {
        return c.createdAt.slice(0, 10);
      }
      if (c.orderDate) {
        const parts = c.orderDate.split(/[-/]/);
        if (parts.length === 3 && parts[2].length === 4) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        return c.orderDate.slice(0, 10);
      }
      return new Date().toISOString().slice(0, 10);
    };

    const todayStr = new Date().toISOString().slice(0, 10);
    const dayMap = {};

    cases.forEach(c => {
      const dStr = getCaseDateStr(c);
      const effStatus = getEffectiveStatus(c);
      const tech = c.assignedTechnicianName || c.assignedTo || 'Unassigned';

      if (!dayMap[dStr]) {
        dayMap[dStr] = {
          date: dStr,
          isToday: dStr === todayStr,
          total: 0,
          done: 0,
          pending: 0,
          cancelled: 0,
          technicians: {}
        };
      }

      dayMap[dStr].total += 1;
      if (effStatus === 'Done') dayMap[dStr].done += 1;
      else if (effStatus === 'Cancelled') dayMap[dStr].cancelled += 1;
      else dayMap[dStr].pending += 1;

      if (!dayMap[dStr].technicians[tech]) {
        dayMap[dStr].technicians[tech] = { done: 0, pending: 0, cancelled: 0, total: 0 };
      }
      dayMap[dStr].technicians[tech].total += 1;
      if (effStatus === 'Done') dayMap[dStr].technicians[tech].done += 1;
      else if (effStatus === 'Cancelled') dayMap[dStr].technicians[tech].cancelled += 1;
      else dayMap[dStr].technicians[tech].pending += 1;
    });

    if (!dayMap[todayStr]) {
      dayMap[todayStr] = {
        date: todayStr,
        isToday: true,
        total: 0,
        done: 0,
        pending: 0,
        cancelled: 0,
        technicians: {}
      };
    }

    const dayByDay = Object.values(dayMap).sort((a, b) => b.date.localeCompare(a.date));
    const todayStats = dayMap[todayStr];

    res.json({
      success: true,
      todayDate: todayStr,
      todayStats,
      dayByDay
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- SETTINGS ROUTES ---
router.get('/settings', (req, res) => {
  try {
    const settings = dbStore.getSettings();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings', (req, res) => {
  try {
    const updated = dbStore.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- EXPORT TO CSV ---
router.get('/export', (req, res) => {
  try {
    const { technician, status, search, startDate, endDate, caseType } = req.query;
    const cases = dbStore.getCases({ technician, status, search, startDate, endDate, caseType });
    const settings = dbStore.getSettings();

    const headers = [
      'Case Record Type',
      'Case Number',
      'Customer Name',
      'Device Category / Product',
      'Technician',
      'Status',
      'Old Remarks / Work Done',
      'Phone 1',
      'Phone 2',
      settings?.amount1Label || 'Amount 1',
      settings?.amount2Label || 'Amount 2',
      'Notes',
      'Order Date',
      'Created At'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = cases.map(c => [
      escapeCsv(c.caseType || c.sourceTag || ''),
      escapeCsv(c.caseNumber || ''),
      escapeCsv(c.customerName || ''),
      escapeCsv(c.product || c.purpose || ''),
      escapeCsv(c.assignedTechnicianName || c.assignedTo || ''),
      escapeCsv(c.status || 'Pending'),
      escapeCsv(c.workDone || c.note || ''),
      escapeCsv(c.phone1 || ''),
      escapeCsv(c.phone2 || ''),
      escapeCsv(c.amount1 !== '' ? c.amount1 : ''),
      escapeCsv(c.amount2 !== '' ? c.amount2 : ''),
      escapeCsv(c.note || ''),
      escapeCsv(c.orderDate || ''),
      escapeCsv(c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '')
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="WEDLANCER_Cases_Export.csv"');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- DYNAMIC EXCEL (.XLSX) EXPORT & LIVE SHARE ROUTE ---
router.get('/export/excel', async (req, res) => {
  try {
    const { sheet = 'ALL' } = req.query;
    const cases = dbStore.getCases();
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Wedlancer RO Portal';
    workbook.created = new Date();

    const getRecordType = (c) => {
      const type = (c.caseType || c.sourceTag || '').trim();
      if (type) {
        const low = type.toLowerCase();
        if (low.startsWith('auto')) return 'Auto';
        if (low.includes('order')) return 'Order';
        if (low.includes('install') || low.includes('demo') || low.includes('req')) return 'Installation';
        if (low.includes('assist') || low.includes('complain') || low.includes('problem') || low.includes('leak') || low.includes('repair') || low.includes('service')) return 'Complaint';
        return type;
      }
      if (c.purpose) {
        const low = c.purpose.toLowerCase();
        if (low.includes('order')) return 'Order';
        if (low.includes('install') || low.includes('demo')) return 'Installation';
        if (low.includes('complain') || low.includes('assist') || low.includes('leak')) return 'Complaint';
        if (low.startsWith('auto')) return 'Auto';
      }
      return 'Installation';
    };

    const populateWs = (ws, caseList) => {
      const hasColG = caseList.some(c => c.extraRemarks && String(c.extraRemarks).trim() !== '');
      const baseCols = [
        { header: 'Case Record Type', key: 'caseType', width: 20 },
        { header: 'Case Number', key: 'caseNumber', width: 16 },
        { header: 'Customer Name', key: 'customerName', width: 30 },
        { header: 'Device Category', key: 'product', width: 30 },
        { header: 'Assigned Technician', key: 'technician', width: 22 },
        { header: 'Old remarks', key: 'workDone', width: 42 }
      ];
      if (hasColG) baseCols.push({ header: '', key: 'extraRemarks', width: 26 });
      ws.columns = baseCols;

      const headerRow = ws.getRow(1);
      headerRow.height = 25;
      const headerStyles = [
        { col: 1, fill: '1F4E79', fontColor: 'FFFFFF' },
        { col: 2, fill: '1F4E79', fontColor: 'FFFFFF' },
        { col: 3, fill: '1F4E79', fontColor: 'FFFFFF' },
        { col: 4, fill: '1F4E79', fontColor: 'FFFFFF' },
        { col: 5, fill: '107C41', fontColor: 'FFFFFF' },
        { col: 6, fill: 'FFFF00', fontColor: '000000' }
      ];
      if (hasColG) headerStyles.push({ col: 7, fill: 'FFFFFF', fontColor: '000000' });

      headerStyles.forEach(({ col, fill, fontColor }) => {
        const cell = headerRow.getCell(col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + fill } };
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF' + fontColor } };
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'medium', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });

      caseList.forEach((c, idx) => {
        const row = ws.getRow(idx + 2);
        row.height = 20;
        const vals = [
          getRecordType(c),
          c.caseNumber || '',
          c.customerName || '',
          c.product || c.purpose || '',
          c.assignedTechnicianName || c.assignedTo || 'Unassigned',
          c.workDone || c.note || ''
        ];
        if (hasColG) vals.push(c.extraRemarks || '');
        for (let col = 1; col <= baseCols.length; col++) {
          const cell = row.getCell(col);
          cell.value = vals[col - 1] || '';
          cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF000000' } };
          cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
        }
      });

      ws.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: Math.max(caseList.length + 1, 1), column: baseCols.length }
      };
    };

    // The 3 standard sheets always present
    const standardSheets = ['Shubh', 'Aarvee', 'Sheet1'];
    const customSheets = [];
    cases.forEach(c => {
      const s = (c.sheetName || 'Shubh').trim();
      if (s && !standardSheets.some(std => std.toLowerCase() === s.toLowerCase()) && !customSheets.some(cs => cs.toLowerCase() === s.toLowerCase())) {
        customSheets.push(s);
      }
    });

    const isSpecificSheet = sheet && sheet !== 'ALL' && sheet !== 'All';
    const allSheetsToInclude = isSpecificSheet ? [sheet] : [...standardSheets, ...customSheets];

    allSheetsToInclude.forEach(sName => {
      const sheetCases = cases.filter(c => {
        const s = (c.sheetName || 'Shubh').trim();
        return s.toLowerCase() === sName.toLowerCase();
      });
      const ws = workbook.addWorksheet(sName.slice(0, 31).replace(/[\\/?*[\]]/g, ''));
      populateWs(ws, sheetCases);
    });

    const filename = isSpecificSheet ? `AO Smith Open call - ${sheet}.xlsx` : 'AO Smith Open call NEW.xlsx';

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
