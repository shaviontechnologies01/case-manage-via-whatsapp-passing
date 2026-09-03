import * as XLSX from 'xlsx';

/**
 * Parses an Excel (.xlsx, .xls) or CSV file into structured case objects.
 * Handles both single-sheet and multi-sheet workbooks (e.g., "Shubh", "Aarvee", "Sheet1").
 * Preserves exact columns A to F:
 * A: Case Record Type
 * B: Case Number
 * C: Customer Name
 * D: Device Category
 * E: Assigned Technician
 * F: Old remarks / Work Done
 */
export async function parseExcelFile(file, defaultTechnician = '') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const sheetNames = workbook.SheetNames || [];
        if (sheetNames.length === 0) {
          throw new Error('The uploaded file has no sheets.');
        }

        const allParsedCases = [];

        for (const sheetName of sheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) continue;

          // Convert worksheet to array of row arrays
          const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          if (!rawRows || rawRows.length === 0) continue;

          // Find header row
          let headerRowIndex = 0;
          let isHeaderPresent = false;

          for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
            const rowStr = rawRows[i].map(c => String(c).toLowerCase()).join(' ');
            if (
              rowStr.includes('case') || 
              rowStr.includes('customer') || 
              rowStr.includes('technician') || 
              rowStr.includes('remark') ||
              rowStr.includes('device') ||
              rowStr.includes('phone')
            ) {
              headerRowIndex = i;
              isHeaderPresent = true;
              break;
            }
          }

          const dataRows = isHeaderPresent ? rawRows.slice(headerRowIndex + 1) : rawRows;
          const headerRow = isHeaderPresent ? rawRows[headerRowIndex].map(h => String(h || '').trim()) : [];

          // Map column indices
          let colIndexMap = {
            caseType: -1,
            caseNumber: -1,
            customerName: -1,
            product: -1,
            technician: -1,
            workDone: -1,
            extraRemarks: -1,
            phone1: -1,
            phone2: -1,
            address: -1,
            orderDate: -1,
            amount1: -1,
            amount2: -1
          };

          if (isHeaderPresent) {
            headerRow.forEach((colName, idx) => {
              const low = colName.toLowerCase();
              if (low.includes('record type') || low === 'type' || low === 'case type') {
                colIndexMap.caseType = idx;
              } else if (low.includes('case number') || low.includes('case #') || low === 'case' || low.includes('complaint no')) {
                colIndexMap.caseNumber = idx;
              } else if (low.includes('customer') || low.includes('client') || (low.includes('name') && !low.includes('technician') && !low.includes('sheet'))) {
                colIndexMap.customerName = idx;
              } else if (low.includes('device') || low.includes('product') || low.includes('model') || low.includes('category')) {
                colIndexMap.product = idx;
              } else if (low.includes('technician') || low.includes('assigned') || low.includes('tech') || low.includes('engineer')) {
                colIndexMap.technician = idx;
              } else if (low.includes('old remark') || low.includes('work done') || (low.includes('remark') && !low.includes('extra') && !low.includes('2')) || low.includes('status')) {
                colIndexMap.workDone = idx;
              } else if (low.includes('extra') || low.includes('cancel') || low.includes('remark 2') || low.includes('additional')) {
                colIndexMap.extraRemarks = idx;
              } else if (low.includes('phone') || low.includes('mobile') || low.includes('contact')) {
                if (colIndexMap.phone1 === -1) colIndexMap.phone1 = idx;
                else if (colIndexMap.phone2 === -1) colIndexMap.phone2 = idx;
              } else if (low.includes('address') || low.includes('location') || low.includes('city')) {
                colIndexMap.address = idx;
              } else if (low.includes('date') || low.includes('order date')) {
                colIndexMap.orderDate = idx;
              } else if (low.includes('amount') || low.includes('price') || low.includes('bill')) {
                if (colIndexMap.amount1 === -1) colIndexMap.amount1 = idx;
                else if (colIndexMap.amount2 === -1) colIndexMap.amount2 = idx;
              }
            });
          }

          // Positional defaults (Standard A=Type, B=Case#, C=Name, D=Product, E=Tech, F=Remarks, G=Extra)
          if (colIndexMap.caseType === -1) colIndexMap.caseType = 0;
          if (colIndexMap.caseNumber === -1) colIndexMap.caseNumber = 1;
          if (colIndexMap.customerName === -1) colIndexMap.customerName = 2;
          if (colIndexMap.product === -1) colIndexMap.product = 3;
          if (colIndexMap.technician === -1) colIndexMap.technician = 4;
          if (colIndexMap.workDone === -1) colIndexMap.workDone = 5;
          if (colIndexMap.extraRemarks === -1 && rawRows[0] && rawRows[0].length > 6) colIndexMap.extraRemarks = 6;

          dataRows.forEach((row, rIdx) => {
            // Skip completely empty rows
            if (!row || row.every(cell => !cell || String(cell).trim() === '')) return;

            const getVal = (idx) => (idx >= 0 && idx < row.length ? String(row[idx] ?? '').trim() : '');

            const rawCaseType = getVal(colIndexMap.caseType);
            let caseType = 'Installation';
            const lowCaseType = (rawCaseType || '').toLowerCase();
            if (lowCaseType.startsWith('auto')) {
              caseType = 'Auto';
            } else if (lowCaseType.includes('order')) {
              caseType = 'Order';
            } else if (lowCaseType.includes('install') || lowCaseType.includes('demo') || lowCaseType.includes('req')) {
              caseType = 'Installation';
            } else if (lowCaseType.includes('assist') || lowCaseType.includes('complain') || lowCaseType.includes('problem') || lowCaseType.includes('leak') || lowCaseType.includes('repair') || lowCaseType.includes('service')) {
              caseType = 'Complaint';
            } else if (rawCaseType) {
              caseType = rawCaseType;
            }
            const rawCaseNumber = getVal(colIndexMap.caseNumber);
            const caseNumber = rawCaseNumber;
            const customerName = getVal(colIndexMap.customerName) || `Customer ${rIdx + 1}`;
            const product = getVal(colIndexMap.product);
            const assignedTech = getVal(colIndexMap.technician) || defaultTechnician || 'Unassigned';
            const workDone = getVal(colIndexMap.workDone);
            const extraRemarks = colIndexMap.extraRemarks !== -1 ? getVal(colIndexMap.extraRemarks) : getVal(6);
            const phone1 = getVal(colIndexMap.phone1);
            const phone2 = getVal(colIndexMap.phone2);
            const address = '';
            const orderDate = colIndexMap.orderDate !== -1 ? getVal(colIndexMap.orderDate) : '';
            const amount1 = colIndexMap.amount1 !== -1 ? getVal(colIndexMap.amount1) : '';
            const amount2 = colIndexMap.amount2 !== -1 ? getVal(colIndexMap.amount2) : '';

            const purpose = [caseType, product].filter(Boolean).join(' — ');

            allParsedCases.push({
              id: 'draft_' + Math.random().toString(36).substring(2, 9),
              caseNumber,
              sourceTag: caseType,
              caseType,
              customerName,
              phone1,
              phone2,
              address,
              product,
              purpose,
              sheetName: sheetName || 'Shubh',
              assignedTo: assignedTech,
              assignedTechnicianName: assignedTech,
              workDone: workDone || '',
              extraRemarks: extraRemarks || '',
              note: workDone || '',
              orderDate: orderDate || '',
              amount1: amount1 !== '' && !isNaN(Number(amount1)) ? Number(amount1) : amount1,
              amount2: amount2 !== '' && !isNaN(Number(amount2)) ? Number(amount2) : amount2,
              status: workDone.toLowerCase().includes('done') ? 'Completed' : workDone.toLowerCase().includes('cancel') ? 'Cancelled' : 'Pending',
              createdAt: new Date().toISOString()
            });
          });
        }

        resolve({
          fileName: file.name,
          sheetNames,
          totalRows: allParsedCases.length,
          cases: allParsedCases
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
