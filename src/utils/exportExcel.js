import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

function getStandardCaseRecordType(caseItem) {
  const type = (caseItem.caseType || caseItem.sourceTag || '').trim();
  if (type) {
    const low = type.toLowerCase();
    if (low.startsWith('auto')) return 'Auto';
    if (low.includes('order')) return 'Order';
    if (low.includes('install') || low.includes('demo') || low.includes('req')) return 'Installation';
    if (low.includes('assist') || low.includes('complain') || low.includes('problem') || low.includes('leak') || low.includes('repair') || low.includes('service')) return 'Complaint';
    return type;
  }
  if (caseItem.purpose) {
    const low = caseItem.purpose.toLowerCase();
    if (low.includes('order')) return 'Order';
    if (low.includes('install') || low.includes('demo')) return 'Installation';
    if (low.includes('complain') || low.includes('assist') || low.includes('leak')) return 'Complaint';
    if (low.startsWith('auto')) return 'Auto';
  }
  return 'Installation';
}

/**
 * Helper to style and populate a single worksheet with exact formatting:
 * - Columns A to D: Deep Blue (#1F4E79) Header with White Bold Text
 * - Column E: Emerald Green (#107C41) Header with White Bold Text
 * - Column F: Vivid Yellow (#FFFF00) Header with Black Bold Text
 * - Column G (if present): Extra / Cancellation remarks
 * - Exact Solid Black Thin Borders ('All Borders') on every row and column of data
 * - Real Native Excel AutoFilter on exact data range
 */
function populateWorksheetWithCases(worksheet, caseList) {
  const hasColG = caseList.some(c => c.extraRemarks && String(c.extraRemarks).trim() !== '');

  // Column definitions matching master format
  const baseCols = [
    { header: 'Case Record Type', key: 'caseType', width: 20 },
    { header: 'Case Number', key: 'caseNumber', width: 16 },
    { header: 'Customer Name', key: 'customerName', width: 30 },
    { header: 'Device Category', key: 'product', width: 30 },
    { header: 'Assigned Technician', key: 'technician', width: 22 },
    { header: 'Old remarks', key: 'workDone', width: 42 }
  ];

  if (hasColG) {
    baseCols.push({ header: '', key: 'extraRemarks', width: 26 });
  }

  // Adjust column width based on content so nothing is clipped
  caseList.forEach((c) => {
    const vals = [
      getStandardCaseRecordType(c),
      c.caseNumber || '',
      c.customerName || '',
      c.product || c.purpose || '',
      c.assignedTechnicianName || c.assignedTo || 'Unassigned',
      c.workDone || c.note || ''
    ];
    if (hasColG) vals.push(c.extraRemarks || '');

    baseCols.forEach((col, i) => {
      const valLen = String(vals[i] || '').length;
      if (valLen + 3 > col.width) {
        col.width = Math.min(valLen + 4, 65);
      }
    });
  });

  worksheet.columns = baseCols;
  const numCols = baseCols.length;

  // Header row height and styling
  const headerRow = worksheet.getRow(1);
  headerRow.height = 25;

  const headerStyles = [
    { col: 1, fill: '1F4E79', fontColor: 'FFFFFF' }, // A: Case Record Type (Deep Blue)
    { col: 2, fill: '1F4E79', fontColor: 'FFFFFF' }, // B: Case Number (Deep Blue)
    { col: 3, fill: '1F4E79', fontColor: 'FFFFFF' }, // C: Customer Name (Deep Blue)
    { col: 4, fill: '1F4E79', fontColor: 'FFFFFF' }, // D: Device Category (Deep Blue)
    { col: 5, fill: '107C41', fontColor: 'FFFFFF' }, // E: Assigned Technician (Emerald Green)
    { col: 6, fill: 'FFFF00', fontColor: '000000' }  // F: Old remarks (Vivid Yellow)
  ];

  if (hasColG) {
    headerStyles.push({ col: 7, fill: 'FFFFFF', fontColor: '000000' });
  }

  headerStyles.forEach(({ col, fill, fontColor }) => {
    const cell = headerRow.getCell(col);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + fill }
    };
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FF' + fontColor }
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'left',
      indent: 1
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });

  // Populate data rows with crisp solid black borders on EVERY cell
  caseList.forEach((c, index) => {
    const rowNum = index + 2;
    const row = worksheet.getRow(rowNum);

    const rowValues = [
      getStandardCaseRecordType(c),
      c.caseNumber || '',
      c.customerName || '',
      c.product || c.purpose || '',
      c.assignedTechnicianName || c.assignedTo || 'Unassigned',
      c.workDone || c.note || ''
    ];

    if (hasColG) {
      rowValues.push(c.extraRemarks || '');
    }

    row.height = 20;

    for (let col = 1; col <= numCols; col++) {
      const cell = row.getCell(col);
      cell.value = rowValues[col - 1] || '';

      cell.font = {
        name: 'Calibri',
        size: 11,
        color: { argb: 'FF000000' }
      };

      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
        indent: 1
      };

      // Exact solid thin black border ('All Borders')
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    }
  });

  const totalRows = Math.max(caseList.length + 1, 1);

  // Enable Excel native AutoFilter on the exact bounded range
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: totalRows, column: numCols }
  };
}

/**
 * Generate Excel Workbook Blob and File object
 * ALWAYS guarantees standard sheets ('Shubh', 'Aarvee', 'Sheet1') are included in the master workbook,
 * or generates the selected targetSheet.
 */
export async function generateExcelWorkbookBlob(cases, filename = 'AO Smith Open call NEW.xlsx', targetSheet = 'ALL') {
  if (!cases || cases.length === 0) {
    throw new Error('No cases available to generate Excel.');
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Wedlancer RO Portal';
  workbook.created = new Date();

  // The 3 standard sheets always present
  const standardSheets = ['Shubh', 'Aarvee', 'Sheet1'];
  
  // Find any additional custom sheets
  const customSheets = [];
  cases.forEach(c => {
    const s = (c.sheetName || 'Shubh').trim();
    if (s && !standardSheets.some(std => std.toLowerCase() === s.toLowerCase()) && !customSheets.some(cs => cs.toLowerCase() === s.toLowerCase())) {
      customSheets.push(s);
    }
  });

  const allSheetsToInclude = (targetSheet && targetSheet !== 'ALL')
    ? [targetSheet]
    : [...standardSheets, ...customSheets];

  allSheetsToInclude.forEach(sheetName => {
    const sheetCases = cases.filter(c => {
      const s = (c.sheetName || 'Shubh').trim();
      return s.toLowerCase() === sheetName.toLowerCase();
    });

    const safeName = sheetName.slice(0, 31).replace(/[\\/?*[\]]/g, '');
    const ws = workbook.addWorksheet(safeName || 'Sheet');
    populateWorksheetWithCases(ws, sheetCases);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const file = new File([blob], filename, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  return { blob, file, filename };
}

/**
 * Export cases to formatted Multi-Sheet Excel (.xlsx) file.
 * Always includes all 3 sheets ("Shubh", "Aarvee", "Sheet1") in the single master workbook.
 */
export async function exportCasesToExcel(cases, filename = 'AO Smith Open call NEW.xlsx') {
  if (!cases || cases.length === 0) {
    alert('No cases to export.');
    return;
  }

  const { blob, filename: safeName } = await generateExcelWorkbookBlob(cases, filename, 'ALL');
  saveAs(blob, safeName);
}

/**
 * Share Exported Excel file via WhatsApp
 * - On Mobile / Web Share supported devices: Native share sheet with file attached to WhatsApp (0 text)
 * - On Desktop: Downloads the .xlsx file and opens WhatsApp Web with zero text
 */
export async function shareExcelViaWhatsApp(cases, options = {}) {
  const {
    filename = 'AO Smith Open call NEW.xlsx',
    targetSheet = 'ALL',
    recipientPhone = '',
    customNote = '',
    preferApp = false,
    includeText = false
  } = options;

  if (!cases || cases.length === 0) {
    alert('No cases available to share.');
    return { success: false };
  }

  // Generate empty text if user wants only Excel file
  let messageText = '';
  if (includeText) {
    const targetCases = targetSheet === 'ALL' ? cases : cases.filter(c => (c.sheetName || 'Shubh') === targetSheet);
    const total = targetCases.length;
    let countDone = 0, countToday = 0, countCancel = 0;
    targetCases.forEach(c => {
      const r = (c.workDone || c.note || '').toLowerCase();
      if (r.includes('done')) countDone++;
      else if (r === 'today') countToday++;
      else if (r.includes('cancel')) countCancel++;
    });

    const todayStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    messageText = [
      `📊 *AO SMITH OPEN CALL REPORT* 📊`,
      `📅 *Date:* ${todayStr}`,
      `📌 *Total Calls:* ${total}`,
      customNote ? `📝 *Note:* ${customNote}` : ''
    ].filter(Boolean).join('\n');
  }

  try {
    const { blob, file, filename: generatedFileName } = await generateExcelWorkbookBlob(cases, filename, targetSheet);

    // 1. Try native mobile / OS Web Share first (Shares ONLY the .xlsx file directly into WhatsApp with 0 text!)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        const sharePayload = {
          files: [file],
          title: generatedFileName
        };
        // Only include text if explicitly requested
        if (includeText && messageText) {
          sharePayload.text = messageText;
        }
        await navigator.share(sharePayload);
        return { success: true, method: 'direct_file_share' };
      } catch (shareErr) {
        if (shareErr.name === 'AbortError') {
          return { success: false, aborted: true };
        }
        console.warn('Web Share failed, fallback to download + WhatsApp:', shareErr);
      }
    }

    // 2. Fallback for Desktop browsers without Web Share:
    // Download the Excel file to disk
    try {
      saveAs(blob, generatedFileName);
    } catch (e) {
      console.warn('File download warning:', e);
    }

    // Open WhatsApp without injecting text into the chat
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
    let waUrl = '';
    const textParam = includeText && messageText ? `&text=${encodeURIComponent(messageText)}` : '';
    const soloTextParam = includeText && messageText ? `text=${encodeURIComponent(messageText)}` : '';

    if (preferApp) {
      waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}${includeText && messageText ? `?text=${encodeURIComponent(messageText)}` : ''}`
        : `https://wa.me/${includeText && messageText ? `?text=${encodeURIComponent(messageText)}` : ''}`;
    } else {
      waUrl = cleanPhone
        ? `https://web.whatsapp.com/send?phone=${cleanPhone}${textParam}`
        : `https://web.whatsapp.com/send${soloTextParam ? `?${soloTextParam}` : ''}`;
    }

    const anchor = document.createElement('a');
    anchor.href = waUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    return { 
      success: true, 
      method: 'download_and_web',
      filename: generatedFileName,
      messageText,
      waUrl
    };

  } catch (error) {
    console.error('Error generating or sharing Excel:', error);
    alert('Failed to generate Excel file for WhatsApp sharing: ' + error.message);
    return { success: false, error };
  }
}

/**
 * Export each sheet as its own separate Excel file (.xlsx)
 * e.g., Shubh.xlsx, Aarvee.xlsx, Sheet1.xlsx
 */
export async function exportSeparateSheetsToExcel(cases) {
  if (!cases || cases.length === 0) {
    alert('No cases to export.');
    return;
  }

  const distinctSheets = [];
  cases.forEach(c => {
    const sName = c.sheetName || 'Shubh';
    if (!distinctSheets.includes(sName)) {
      distinctSheets.push(sName);
    }
  });

  for (let i = 0; i < distinctSheets.length; i++) {
    const sheetName = distinctSheets[i];
    const sheetCases = cases.filter(c => (c.sheetName || 'Shubh') === sheetName);
    if (sheetCases.length === 0) continue;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Wedlancer RO Portal';
    workbook.created = new Date();

    const safeName = sheetName.slice(0, 31).replace(/[\\/?*[\]]/g, '');
    const ws = workbook.addWorksheet(safeName);
    populateWorksheetWithCases(ws, sheetCases);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const safeFileName = `AO Smith Open call - ${sheetName}.xlsx`;
    saveAs(blob, safeFileName);
    
    // Tiny delay between downloads so browser doesn't block multiple files
    await new Promise(r => setTimeout(r, 400));
  }
}

/**
 * Export cases to Excel-compatible CSV file (Exact Table Columns)
 */
export function exportCasesToCsv(cases, settings = {}) {
  if (!cases || cases.length === 0) {
    alert('No cases to export.');
    return;
  }

  const hasColG = cases.some(c => c.extraRemarks && String(c.extraRemarks).trim() !== '');

  const headers = [
    'Case Record Type',
    'Case Number',
    'Customer Name',
    'Device Category',
    'Assigned Technician',
    'Old remarks'
  ];

  if (hasColG) {
    headers.push('Extra Remarks');
  }

  const rows = cases.map(c => {
    const row = [
      `"${(c.caseType || c.sourceTag || 'Installation').replace(/"/g, '""')}"`,
      `"${(c.caseNumber || '').replace(/"/g, '""')}"`,
      `"${(c.customerName || '').replace(/"/g, '""')}"`,
      `"${(c.product || c.purpose || '').replace(/"/g, '""')}"`,
      `"${(c.assignedTechnicianName || c.assignedTo || 'Unassigned').replace(/"/g, '""')}"`,
      `"${(c.workDone || c.note || '').replace(/"/g, '""')}"`
    ];

    if (hasColG) {
      row.push(`"${(c.extraRemarks || '').replace(/"/g, '""')}"`);
    }

    return row.join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, 'AO Smith Open call NEW.csv');
}
