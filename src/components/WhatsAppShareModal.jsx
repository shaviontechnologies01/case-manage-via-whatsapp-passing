import React, { useState, useMemo } from 'react';
import {
  X,
  MessageCircle,
  FileSpreadsheet,
  Globe,
  Smartphone,
  ExternalLink,
  Share2,
  Check,
  Download,
  Link,
  Copy,
  Info,
  Sparkles
} from 'lucide-react';
import { generateExcelWorkbookBlob } from '../utils/exportExcel.js';
import {
  formatWhatsAppPhone,
  getWhatsAppWebUrl,
  getWhatsAppDirectUrl,
  openWhatsApp
} from '../utils/whatsappHelper.js';
import { saveAs } from 'file-saver';

export default function WhatsAppShareModal({
  isOpen,
  onClose,
  cases = [],
  allCases = [],
  selectedSheet = 'All',
  technicians = []
}) {
  if (!isOpen) return null;

  const [targetSheet, setTargetSheet] = useState(selectedSheet === 'All' ? 'ALL' : selectedSheet);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState(null);

  const casesPool = allCases && allCases.length > 0 ? allCases : cases;

  // Distinct sheets
  const sheetOptions = useMemo(() => {
    const list = new Set(['Shubh', 'Aarvee', 'Sheet1']);
    casesPool.forEach(c => {
      if (c.sheetName && c.sheetName.trim()) list.add(c.sheetName.trim());
    });
    return Array.from(list);
  }, [casesPool]);

  // Clean phone number format for WhatsApp
  const cleanPhone = useMemo(() => {
    return formatWhatsAppPhone(recipientPhone);
  }, [recipientPhone]);

  const targetFileName = useMemo(() => {
    return targetSheet === 'ALL' || targetSheet === 'All'
      ? 'AO Smith Open call NEW.xlsx'
      : `AO Smith Open call - ${targetSheet}.xlsx`;
  }, [targetSheet]);

  // Live Excel Download / View Link
  const liveExcelLink = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/api/export/excel?sheet=${encodeURIComponent(targetSheet)}`;
  }, [targetSheet]);

  /**
   * Share Live Excel Link to WhatsApp (100% Without Local Download):
   * This sends the live direct download link to WhatsApp chat.
   * Anyone clicking the link gets the Excel file immediately on phone/PC.
   */
  const handleShareLiveExcelLink = (isWeb = true) => {
    const isAll = targetSheet === 'ALL' || targetSheet === 'All';
    const message = isAll
      ? `📊 *AO SMITH OPEN CALL EXCEL FILE (.xlsx)* 📊\n📁 *Sheets Included:* Shubh, Aarvee, Sheet1 (All Sheets)\n⬇️ *Direct Excel Download Link:*\n${liveExcelLink}`
      : `📊 *AO SMITH OPEN CALL - ${targetSheet} (.xlsx)* 📊\n📁 *Sheet:* ${targetSheet}\n⬇️ *Direct Excel Download Link:*\n${liveExcelLink}`;
    openWhatsApp(cleanPhone, message, isWeb);
    setShareStatus({
      type: 'success',
      text: `WhatsApp opened with ${isAll ? 'Master 3-Sheet' : targetSheet} Excel link (No local download needed)!`
    });
  };

  /**
   * Open WhatsApp Web / App directly (Zero local download)
   */
  const handleOpenWhatsAppChatOnly = (isWeb = true) => {
    openWhatsApp(cleanPhone, '', isWeb);
    setShareStatus({
      type: 'success',
      text: isWeb ? 'WhatsApp Web opened in new tab!' : 'WhatsApp App opened!'
    });
  };

  /**
   * Manual Download when user actually wants to drag & drop the file into WhatsApp
   */
  const handleManualDownload = async () => {
    setIsSharing(true);
    try {
      const { blob } = await generateExcelWorkbookBlob(casesPool, targetFileName, targetSheet);
      saveAs(blob, targetFileName);
      setShareStatus({
        type: 'success',
        text: `Downloaded ${targetFileName}. You can now drag & drop it into WhatsApp Web!`
      });
    } catch (err) {
      console.error(err);
      setShareStatus({
        type: 'error',
        text: 'Download failed: ' + err.message
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(liveExcelLink);
      }
      setIsCopiedLink(true);
      setTimeout(() => setIsCopiedLink(false), 2000);
      setShareStatus({
        type: 'success',
        text: 'Live Excel Link copied to clipboard!'
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Header - Focused WhatsApp Green */}
        <div className="bg-[#075E54] px-5 py-3.5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#25D366] text-slate-950 rounded-xl shadow-xs">
              <MessageCircle className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-1.5 leading-tight">
                <span>Share via WhatsApp</span>
              </h2>
              <p className="text-xs text-emerald-100">
                Laptop se WhatsApp par Excel file share karein (Without Download)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          
          {/* Status Toast */}
          {shareStatus && (
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold animate-in fade-in ${
              shareStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-rose-50 text-rose-900 border-rose-300'
            }`}>
              <div className="flex items-center space-x-2">
                <span>{shareStatus.type === 'success' ? '✅' : '⚠️'}</span>
                <span>{shareStatus.text}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setShareStatus(null)} 
                className="text-slate-400 hover:text-slate-700 ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* File Card info */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-xl flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-emerald-950 text-sm truncate">
                {targetFileName}
              </p>
              <p className="text-[11px] text-emerald-800 font-medium">
                {targetSheet === 'ALL' || targetSheet === 'All'
                  ? `Master Excel workbook (Shubh, Aarvee, Sheet1)`
                  : `${targetSheet} sheet data`}
                {' • '}{casesPool.length} cases
              </p>
            </div>
          </div>

          {/* Settings Box */}
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {/* Sheet Target */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Select Sheet to Share:
              </label>
              <select
                value={targetSheet}
                onChange={(e) => setTargetSheet(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">All Sheets (Master 3-Sheet Workbook)</option>
                {sheetOptions.map(s => (
                  <option key={s} value={s}>{s} Sheet</option>
                ))}
              </select>
            </div>

            {/* Optional Contact / Phone Number */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Recipient WhatsApp Number (Optional):</span>
                <span className="text-[10px] text-slate-400 font-normal">Blank = Select Contact inside WhatsApp</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 9408197990 (10-digit number)"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />

              {/* Quick Tech Badges */}
              {technicians.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-bold">Technicians:</span>
                  {technicians.slice(0, 6).map(t => (
                    <button
                      key={t._id || t.name}
                      type="button"
                      onClick={() => {
                        if (t.phone) setRecipientPhone(t.phone);
                      }}
                      className="text-[10px] bg-white border border-slate-200 hover:border-emerald-500 px-1.5 py-0.5 rounded font-medium text-slate-700 transition-colors cursor-pointer"
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Option 1: Live Excel Link Share (1-Click - ZERO Download!) */}
          <div className="p-3 bg-emerald-50 border border-emerald-400 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>1-Click Live Excel Link (Without Download)</span>
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
              >
                {isCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
            <p className="text-[11px] text-emerald-800">
              WhatsApp par direct link bhejega. Recipient link par click karke direct Excel (.xlsx) file open kar lega.
            </p>
            <button
              type="button"
              onClick={() => handleShareLiveExcelLink(true)}
              className="w-full py-2.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1caa51] text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Send Live Excel Link on WhatsApp</span>
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Option 2: Open WhatsApp Web directly (No Auto Download) */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleOpenWhatsAppChatOnly(true)}
              className="p-2.5 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-500 rounded-xl text-slate-800 font-bold transition-all shadow-2xs flex items-center justify-center space-x-1.5 cursor-pointer text-xs"
            >
              <Globe className="w-4 h-4 text-[#075E54]" />
              <span>Open WhatsApp Web</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => handleOpenWhatsAppChatOnly(false)}
              className="p-2.5 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-500 rounded-xl text-slate-800 font-bold transition-all shadow-2xs flex items-center justify-center space-x-1.5 cursor-pointer text-xs"
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Open WhatsApp App</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleManualDownload}
            disabled={isSharing}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors flex items-center space-x-1 shadow-2xs cursor-pointer disabled:opacity-50"
            title="Download .xlsx to computer if you want to drag & drop"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download .xlsx (Optional)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
