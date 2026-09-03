/**
 * WhatsApp Helper Utilities for Web and App
 * Handles URL encoding, safe character length limits (prevents 414 URI Too Large errors),
 * pre-composed templates, and clipboard copying.
 */

// Safe URL length for WhatsApp Web / wa.me API
const MAX_URL_TEXT_LENGTH = 1200;

/**
 * Clean phone number to WhatsApp international standard
 * e.g., "9825122095" -> "919825122095", "+91 98251-22095" -> "919825122095"
 */
export function formatWhatsAppPhone(phone = '') {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 10) {
    return '91' + digits; // Default to India country code 91
  }
  return digits;
}

/**
 * Generate a safe WhatsApp Web URL
 */
export function getWhatsAppWebUrl(phone = '', message = '') {
  const cleanPhone = formatWhatsAppPhone(phone);
  if (!message || message.trim() === '') {
    if (cleanPhone) {
      return `https://web.whatsapp.com/send?phone=${cleanPhone}`;
    }
    return `https://web.whatsapp.com/`;
  }

  let safeText = message;
  if (safeText.length > MAX_URL_TEXT_LENGTH) {
    safeText = safeText.substring(0, MAX_URL_TEXT_LENGTH) + '\n\n...(Full text copied to clipboard. Press Ctrl+V to paste)';
  }

  const encodedText = encodeURIComponent(safeText);
  if (cleanPhone) {
    return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }
  return `https://web.whatsapp.com/send?text=${encodedText}`;
}

/**
 * Generate a safe WhatsApp App / wa.me URL
 */
export function getWhatsAppDirectUrl(phone = '', message = '') {
  const cleanPhone = formatWhatsAppPhone(phone);
  if (!message || message.trim() === '') {
    if (cleanPhone) {
      return `https://wa.me/${cleanPhone}`;
    }
    return `https://wa.me/`;
  }

  let safeText = message;
  if (safeText.length > MAX_URL_TEXT_LENGTH) {
    safeText = safeText.substring(0, MAX_URL_TEXT_LENGTH) + '\n\n...(Full text copied to clipboard)';
  }

  const encodedText = encodeURIComponent(safeText);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

/**
 * Open WhatsApp directly in new window / tab safely
 */
export function openWhatsApp(phone = '', message = '', preferWeb = true) {
  // 1. Copy full text to clipboard first as backup
  try {
    if (navigator?.clipboard?.writeText && message) {
      navigator.clipboard.writeText(message).catch(() => {});
    }
  } catch (_) {}

  // 2. Determine target URL
  const url = preferWeb ? getWhatsAppWebUrl(phone, message) : getWhatsAppDirectUrl(phone, message);

  // 3. Trigger navigation using anchor element
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

/**
 * Generate standard message template for a Single Case to Customer
 */
export function generateCustomerCaseMessage(c = {}) {
  const num = c.caseNumber || 'N/A';
  const name = c.customerName || 'Customer';
  const type = c.caseType || c.sourceTag || 'Service';
  const prod = c.product || c.purpose || 'AO Smith Water Purifier';
  const tech = c.assignedTechnicianName || c.assignedTo || 'Technician';

  return [
    `*AO SMITH SERVICE UPDATE*`,
    `Hello ${name} ji,`,
    `This is regarding your ${type} request for *${prod}* (Case #${num}).`,
    tech && tech !== 'Unassigned' ? `👨‍🔧 *Assigned Technician:* ${tech}` : '',
    `Our technician will contact you shortly to confirm the visit time.`,
    `Thank you,\n*Wedlancer AO Smith Service Care*`
  ].filter(Boolean).join('\n');
}

/**
 * Generate standard message template for a Single Case to Technician
 */
export function generateTechnicianCaseMessage(c = {}) {
  const num = c.caseNumber || 'N/A';
  const name = c.customerName || 'Customer';
  const phone = c.phone1 || c.phone || 'No phone';
  const phone2 = c.phone2 ? ` / ${c.phone2}` : '';
  const type = c.caseType || c.sourceTag || 'Installation';
  const prod = c.product || c.purpose || '';
  const remark = c.workDone || c.note || '';
  const sheet = c.sheetName || 'Shubh';

  return [
    `🔧 *NEW AO SMITH CASE ASSIGNED* 🔧`,
    `📑 *Sheet:* ${sheet}`,
    `📌 *Case No:* ${num}`,
    `🏷️ *Type:* ${type}`,
    `👤 *Customer:* ${name}`,
    `📞 *Phone:* ${phone}${phone2}`,
    prod ? `🏷️ *Model:* ${prod}` : '',
    c.amount1 ? `💰 *Amount:* Rs. ${c.amount1} ${c.amount2 ? '+ ' + c.amount2 : ''}` : '',
    remark ? `📝 *Remarks:* ${remark}` : '',
    `━━━━━━━━━━━━━━━━━━━`,
    `_Please contact customer and update status (Today / Done / Cancel) once visited._`
  ].filter(Boolean).join('\n');
}
