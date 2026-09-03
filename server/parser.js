/**
 * WhatsApp Bulk Message Parser for WEDLANCER PRIVATE Case Portal
 * Implements the 10-step parsing algorithm and multi-message splitter
 * 
 * Standard Case Record Types (matching Column A in Master Excel):
 * 1. Auto (Message starts with Auto / source tag Auto)
 * 2. Complaint (Assistance Required, Costumer assist, customer assist, complain, problem, leakage, issue, retention, repair, service)
 * 3. Installation (Instalation req, Installtion, Installation Request, Demo, Install)
 * 4. Order (Product price in addition to service charge, e.g., 250 400, 2900 400, 3000 400, 4200 400, 3100 400, or Order keyword)
 * 
 * Sheet Routing:
 * - If message starts with 'Aarvee' / 'Arvee' -> Sheet 'Aarvee'
 * - Otherwise -> Sheet 'Shubh'
 */

export const KNOWN_SOURCE_TAGS = ['Auto', 'Repit', 'Repeat', 'Aarvee', 'Arvee', 'Phone', 'Order'];

export const SEED_CASE_TYPES = [
  'Installation Request',
  'Installation',
  'Instalation req',
  'Installtion req',
  'costumer assist',
  'customer assist',
  'Customer Assist',
  'assistant required',
  'Assistance Required',
  'Leakage Issue',
  'leakage',
  'Leakage',
  'Order',
  'consumer retention',
  'Consumer Retention',
  'Complaint',
  'complain',
  'Service Request',
  'Service',
  'Maintenance',
  'Repair',
  'Filter Change',
  'Demo',
  'Uninstallation',
  'Re-installation'
];

export function isPincode(str) {
  if (!str) return false;
  const cleaned = String(str).replace(/[^\d]/g, '');
  if (cleaned.length === 6 && /^[1-9]\d{5}$/.test(cleaned)) {
    return true;
  }
  return false;
}

export function classifyCaseRecordType({
  sourceTag = '',
  detectedType = '',
  rawText = '',
  amount1 = '',
  amount2 = '',
  product = '',
  beforeBracket = ''
}) {
  const normRaw = (rawText || '').trim();
  const normSource = (sourceTag || '').trim();
  const normDetected = (detectedType || '').trim().toLowerCase();
  const textBlob = `${normSource} ${detectedType} ${beforeBracket} ${normRaw} ${product}`.toLowerCase();

  // Rule 1: Auto - Message starts with Auto
  if (/^auto\b/i.test(normSource) || /^\s*auto\b/i.test(normRaw)) {
    return 'Auto';
  }

  // Rule 2: Explicit Assistance / Complaint keywords -> ALWAYS Complaint
  if (
    /assist|complain|problem|leak|repair|retention|maintenance|service/i.test(normDetected) ||
    /assistance\s*required|costumer\s*assist|customer\s*assist|assistant\s*required|leakage\s*issue|leakage|complain|complaint|problem/i.test(textBlob)
  ) {
    return 'Complaint';
  }

  // Rule 3: Explicit Installation keywords -> ALWAYS Installation
  if (
    /instal+ation|install+tion|install|demo|re-install/i.test(normDetected) ||
    /instal+ation\s*req|install+tion\s*req|installation\s*request|installation|installtion|instalation|demo/i.test(textBlob)
  ) {
    return 'Installation';
  }

  // Rule 4: Order - Price in addition to 400 (e.g. 250 400, 2900 400, 3000 400, 4200 400, 3100 400), or explicit Order keyword
  const numAmt1 = Number(amount1) || 0;
  const numAmt2 = Number(amount2) || 0;
  const hasMultiplePrices = (numAmt1 > 0 && numAmt2 > 0);
  const hasOrderKeyword = /\border\b/i.test(normDetected) || /\border\b/i.test(normSource) || /\border\b/i.test(textBlob);

  if (hasMultiplePrices || hasOrderKeyword) {
    return 'Order';
  }

  if (numAmt1 > 500 && !numAmt2) {
    return 'Order';
  }

  return 'Installation';
}

/**
 * Splits a multi-message paste into individual message strings.
 */
export function splitMessages(rawBatchText) {
  if (!rawBatchText || !rawBatchText.trim()) return [];

  let normalized = rawBatchText.replace(/\r\n/g, '\n').trim();

  // Clean WhatsApp exported message headers at lines
  normalized = normalized.replace(/\[\d{1,2}[/-]\d{1,2}[/-]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[apAP][mM])?\]\s*[^:\n]+:\s*/g, '\n');
  normalized = normalized.replace(/\d{1,2}[/-]\d{1,2}[/-]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[apAP][mM])?\s*-\s*[^:\n]+:\s*/g, '\n');

  // Strategy: Line start with known source tag or 7-8 digit case number
  const startPattern = /(?:^|\n)(?=(?:Auto|Repit|Repeat|Aarvee|Arvee|Phone|Order)\b|\b\d{7,8}\b)/i;

  const segmentsByStart = normalized
    .split(startPattern)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const validByStartCount = segmentsByStart.filter(s => /\b\d{7,8}\b|[6-9]\d{4}[\s-]?\d{5}/.test(s)).length;

  if (segmentsByStart.length > 1 && validByStartCount >= segmentsByStart.length * 0.5) {
    return segmentsByStart;
  }

  const segmentsByDoubleNewline = normalized
    .split(/\n\s*\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (segmentsByDoubleNewline.length > 1) {
    return segmentsByDoubleNewline;
  }

  return segmentsByStart.length > 0 ? segmentsByStart : [normalized];
}

/**
 * Parses an individual WhatsApp message into a structured Case object.
 */
export function parseSingleMessage(messageText, defaultTechnician = '', customCaseTypes = SEED_CASE_TYPES) {
  if (!messageText || typeof messageText !== 'string') {
    return createEmptyDraft(defaultTechnician);
  }

  let working = messageText.trim();
  const rawText = working;
  let isLowConfidence = false;
  const warnings = [];

  // Step 0: Strip WhatsApp chat export timestamps and sender prefix
  working = working.replace(/^\[\d{1,2}[/-]\d{1,2}[/-]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[apAP][mM])?\]\s*[^:\n]+:\s*/, '');
  working = working.replace(/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[apAP][mM])?\s*-\s*[^:\n]+:\s*/, '');
  working = working.replace(/^\[\d{1,2}:\d{2}(?::\d{2})?(?:\s*[apAP][mM])?,?\s+\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\]\s*[^:\n]+:\s*/, '');
  working = working.replace(/^Forwarded\s*(?:message)?\s*\n?/i, '');
  working = working.trim();

  // Step 1: Source tag
  let sourceTag = '';
  const sourceTagMatch = working.match(/^(Auto|Repit|Repeat|Aarvee|Arvee|Phone|Order)\b/i);
  if (sourceTagMatch) {
    sourceTag = sourceTagMatch[1];
    if (sourceTag.toLowerCase() === 'arvee') sourceTag = 'Aarvee';
    working = working.substring(sourceTagMatch[0].length).trim();
  }

  const sheetName = /^aarvee$/i.test(sourceTag) ? 'Aarvee' : 'Shubh';

  // Step 2: Case number
  let caseNumber = '';
  const prefixCaseMatch = working.match(/(?:case\s*(?:no\.?|#)?|complaint\s*no\.?|req\s*no\.?)\s*[:\-]?\s*(\d{6,9})/i);
  if (prefixCaseMatch) {
    caseNumber = prefixCaseMatch[1];
    working = working.replace(prefixCaseMatch[0], ' ').trim();
  } else {
    const caseNumMatch = working.match(/\b\d{7,8}\b/);
    if (caseNumMatch && !isPincode(caseNumMatch[0])) {
      caseNumber = caseNumMatch[0];
      working = working.replace(caseNumMatch[0], ' ').trim();
    } else {
      warnings.push('Missing Case Number');
    }
  }

  // Step 3: Extract Phone numbers
  const phonePattern = /(?:\+?91[\s-]?)?([6-9]\d{4}[\s-]?\d{5})\b/g;
  const rawPhoneMatches = [...working.matchAll(phonePattern)];
  const extractedPhones = [];

  for (const match of rawPhoneMatches) {
    const digitsOnly = match[1].replace(/[\s-]/g, '');
    if (digitsOnly.length === 10 && !isPincode(digitsOnly) && !extractedPhones.includes(digitsOnly)) {
      extractedPhones.push(digitsOnly);
    }
  }

  const phone1 = extractedPhones[0] || '';
  const phone2 = extractedPhones[1] || '';

  if (!phone1) {
    warnings.push('Missing Primary Phone');
  }

  // Step 4: Extract Trailing segment (date, amounts, notes)
  let orderDate = '';
  let amount1 = '';
  let amount2 = '';
  let note = '';

  const trailingDateAmountMatch = working.match(/--(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})--(\d+(?:\.\d{2})?)\s*(?:\/[-=]?)?$/i);
  if (trailingDateAmountMatch) {
    orderDate = normalizeDate(trailingDateAmountMatch[1]);
    amount2 = parseFloat(trailingDateAmountMatch[2]) || '';
    working = working.substring(0, working.length - trailingDateAmountMatch[0].length).trim();
  } else {
    const trailingDateOnlyMatch = working.match(/--(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})$/i);
    if (trailingDateOnlyMatch) {
      orderDate = normalizeDate(trailingDateOnlyMatch[1]);
      working = working.substring(0, working.length - trailingDateOnlyMatch[0].length).trim();
    }
  }

  const trailingNoteMatch = working.match(/\b(Out warranty|out of warranty|single vali|double vali|cancle done|cancelled|cancel|not ready[^\n]*|future appointment|today|on-[\d/]+)\s*$/i);
  if (trailingNoteMatch) {
    note = trailingNoteMatch[1].trim();
    working = working.substring(0, working.length - trailingNoteMatch[0].length).trim();
  }

  // Dual or single trailing prices
  const trailingPricesDualMatch = working.match(/(?:\s+|^)(\d{2,5})\s*(?:[+/]|\s+)\s*(\d{2,5})\s*(?:\/[-=]?)?(?:\s*\(([^)]+)\))?\s*$/i);
  if (trailingPricesDualMatch) {
    const cand1 = trailingPricesDualMatch[1];
    const cand2 = trailingPricesDualMatch[2];
    const bracketNote = trailingPricesDualMatch[3];

    if (!isPincode(cand1) && !isPincode(cand2)) {
      const num1 = parseFloat(cand1);
      const num2 = parseFloat(cand2);
      if (num2 === 400 || num2 === 500) {
        amount1 = num1;
        amount2 = num2;
      } else if (num1 === 400 || num1 === 500) {
        amount2 = num1;
        amount1 = num2;
      } else {
        amount1 = num1;
        amount2 = num2;
      }
      if (bracketNote && !note) note = bracketNote.trim();
      working = working.substring(0, working.length - trailingPricesDualMatch[0].length).trim();
    }
  } else {
    const trailingPriceSingleMatch = working.match(/(?:\s+|^)(?:Rs\.?|₹)?\s*(\d{2,5})\s*(?:\/[-=]?)?(?:\s*\(([^)]+)\))?\s*$/i);
    if (trailingPriceSingleMatch) {
      const cand = trailingPriceSingleMatch[1];
      const bracketNote = trailingPriceSingleMatch[2];
      if (!isPincode(cand)) {
        const val = parseFloat(cand);
        if (val === 400 || val === 500) {
          amount2 = val;
        } else if (val > 0) {
          amount1 = val;
        }
        if (bracketNote && !note) note = bracketNote.trim();
        working = working.substring(0, working.length - trailingPriceSingleMatch[0].length).trim();
      }
    }
  }

  // Step 5: Extract Model in [...] or standalone
  let rawDetectedType = '';
  let product = '';
  let customerName = '';
  let beforeBracketStr = '';

  const allKnownCaseTypes = Array.from(new Set([...customCaseTypes, ...SEED_CASE_TYPES]));
  allKnownCaseTypes.sort((a, b) => b.length - a.length);

  const bracketMatch = working.match(/\[([^\]]+)\]/);

  if (bracketMatch) {
    product = bracketMatch[1].trim();
    const bracketIdx = bracketMatch.index;

    beforeBracketStr = working.substring(0, bracketIdx).trim();

    // Clean any phones from beforeBracketStr
    let cleanBefore = beforeBracketStr;
    for (const match of rawPhoneMatches) {
      cleanBefore = cleanBefore.replace(match[0], ' ');
    }
    cleanBefore = cleanBefore.replace(/\s+/g, ' ').trim();

    let matchedCaseType = false;
    for (const ct of allKnownCaseTypes) {
      const ctRegex = new RegExp(`(?:\\s+|^)(${escapeRegExp(ct)})$`, 'i');
      const ctMatch = cleanBefore.match(ctRegex);
      if (ctMatch) {
        rawDetectedType = ctMatch[1].trim();
        customerName = cleanBefore.substring(0, ctMatch.index).trim();
        matchedCaseType = true;
        break;
      }
    }

    if (!matchedCaseType) {
      for (const ct of allKnownCaseTypes) {
        const ctRegex = new RegExp(`\\b(${escapeRegExp(ct)})\\b`, 'i');
        const ctMatch = cleanBefore.match(ctRegex);
        if (ctMatch) {
          rawDetectedType = ctMatch[1].trim();
          customerName = cleanBefore.replace(ctRegex, ' ').trim();
          matchedCaseType = true;
          break;
        }
      }
    }

    if (!matchedCaseType) {
      const words = cleanBefore.split(/\s+/).filter(Boolean);
      if (words.length >= 3) {
        const lastTwo = words.slice(-2).join(' ');
        const lastOne = words.slice(-1).join(' ');
        if (/request|issue|assist|order|service|complaint|install|repair|retention|leakage|demo|maintenance/i.test(lastTwo)) {
          rawDetectedType = lastTwo;
          customerName = words.slice(0, -2).join(' ');
        } else if (/request|issue|assist|order|service|complaint|install|repair|retention|leakage|demo|maintenance/i.test(lastOne)) {
          rawDetectedType = lastOne;
          customerName = words.slice(0, -1).join(' ');
        } else {
          customerName = words.slice(0, 2).join(' ');
          rawDetectedType = words.slice(2).join(' ');
        }
      } else if (words.length === 2) {
        customerName = words.join(' ');
        rawDetectedType = 'Installation Request';
      } else if (words.length === 1) {
        customerName = words[0];
      }
    }

    // Text after brackets (address, location, etc.) is skipped completely as requested.

  } else {
    const standaloneModelMatch = working.match(/\b(GCU[RVD]\d{3}[A-Za-z]?|GC[A-Za-z]{2}\d{2,3}|gcrx\d+|gbab\d+|geas\d+|Revito[^\n,]*|Copper[^\n,]*|Titan[^\n,]*|Classic[^\n,]*)\b/i);
    if (standaloneModelMatch) {
      product = standaloneModelMatch[1].trim();
      working = working.replace(standaloneModelMatch[0], ' ').trim();
    }

    let textWithoutPhones = working;
    for (const match of rawPhoneMatches) {
      textWithoutPhones = textWithoutPhones.replace(match[0], ' ');
    }
    textWithoutPhones = textWithoutPhones.replace(/(?:^|\s+)[\/&,-]+(?:\s+|$)/g, ' ');
    textWithoutPhones = textWithoutPhones.replace(/\s+/g, ' ').trim();

    const lines = working.split(/\n+/).map(l => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      let firstLine = lines[0];
      for (const match of rawPhoneMatches) {
        firstLine = firstLine.replace(match[0], ' ');
      }
      if (sourceTag) firstLine = firstLine.replace(new RegExp(`^${escapeRegExp(sourceTag)}\\b`, 'i'), '');
      if (caseNumber) firstLine = firstLine.replace(new RegExp(`\\b${escapeRegExp(caseNumber)}\\b`), '');
      firstLine = firstLine.replace(/[\*#@~]/g, '').trim().replace(/^[\s,.-]+|[\s,.-]+$/g, '');

      if (firstLine.length > 0 && firstLine.length < 35) {
        customerName = firstLine;
      }
    }

    if (!customerName) {
      const addressStartRegex = /\b(?:(?:[A-Z]\s*[-/]?\s*\d{1,4})|(?:\d{1,2}\s*[-/]\s*[A-Za-z]+)|(?:\d+\s*(?:st|nd|rd|th)?\s*floor)|(?:flat|plot|shop|bunglow|house|block|tower|building|opp|near|beside)\b|\b\d{2,4}\s+[A-Za-z])/i;
      const addrMatch = textWithoutPhones.match(addressStartRegex);
      if (addrMatch && addrMatch.index > 0) {
        customerName = textWithoutPhones.substring(0, addrMatch.index).trim();
      } else {
        const words = textWithoutPhones.split(/\s+/).filter(Boolean);
        if (words.length <= 3) {
          customerName = words.join(' ');
        } else {
          const nameWordCount = (words[0] && (words[0].toLowerCase() === 'mr.' || words[0].toLowerCase() === 'dr.' || words[0].toLowerCase() === 'mrs.' || words[0].toLowerCase() === 'ms.')) ? 3 : 2;
          customerName = words.slice(0, nameWordCount).join(' ');
        }
      }
    }

    for (const phrase of allKnownCaseTypes) {
      const phraseRegex = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'i');
      if (phraseRegex.test(customerName)) {
        rawDetectedType = phrase;
        customerName = customerName.replace(phraseRegex, ' ').trim();
        break;
      }
    }
  }

  // Step 6: Final clean-up
  customerName = customerName
    .replace(/(?:\+?91[\s-]?)?[6-9]\d{9}/g, '')
    .replace(/[\*#@~]/g, '')
    .replace(/^[\s,.:\/-]+|[\s,.:\/-]+$/g, '')
    .replace(/\bnull\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  customerName = customerName.replace(/^(Customer|Client|Name)\s*[:\-]?\s*/i, '').trim();

  if (!customerName) {
    customerName = caseNumber ? `Customer (${caseNumber})` : 'Customer';
  }

  // Address is skipped and set empty
  const address = '';

  // Step 7: Standardize Case Record Type
  const standardizedCaseType = classifyCaseRecordType({
    sourceTag,
    detectedType: rawDetectedType,
    rawText,
    amount1,
    amount2,
    product,
    beforeBracket: beforeBracketStr
  });

  const purpose = [standardizedCaseType, product].filter(Boolean).join(' — ');
  const initialRemarks = note || 'today';

  return {
    caseNumber,
    sourceTag: sourceTag || (standardizedCaseType === 'Auto' ? 'Auto' : ''),
    customerName,
    phone1,
    phone2,
    address,
    caseType: standardizedCaseType,
    rawCaseType: rawDetectedType || standardizedCaseType,
    product,
    orderDate,
    amount1: amount1 !== '' ? Number(amount1) : 0,
    amount2: amount2 !== '' ? Number(amount2) : 0,
    note: initialRemarks,
    assignedTo: defaultTechnician || 'Unassigned',
    assignedTechnicianName: defaultTechnician || 'Unassigned',
    sheetName: sheetName,
    purpose,
    status: initialRemarks.toLowerCase().includes('done') ? 'Completed' : initialRemarks.toLowerCase().includes('cancel') ? 'Cancelled' : 'Pending',
    workDone: initialRemarks,
    rawText,
    isLowConfidence,
    warnings
  };
}

function createEmptyDraft(defaultTechnician) {
  return {
    caseNumber: '',
    sourceTag: '',
    customerName: 'Customer',
    phone1: '',
    phone2: '',
    address: '',
    caseType: 'Installation',
    rawCaseType: 'Installation',
    product: '',
    orderDate: '',
    amount1: 0,
    amount2: 0,
    note: 'today',
    assignedTo: defaultTechnician || 'Unassigned',
    assignedTechnicianName: defaultTechnician || 'Unassigned',
    sheetName: 'Shubh',
    purpose: '',
    status: 'Pending',
    workDone: 'today',
    rawText: '',
    isLowConfidence: false,
    warnings: []
  };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeDate(rawDateStr) {
  if (!rawDateStr) return '';
  const parts = rawDateStr.split(/[/-]/);
  if (parts.length === 3) {
    let day = parts[0].padStart(2, '0');
    let month = parts[1].padStart(2, '0');
    let year = parts[2];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }
  return rawDateStr;
}

