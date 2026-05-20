import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Languages, 
  FileText, 
  Copy, 
  Check, 
  RotateCcw, 
  FileDown, 
  Clock, 
  Trash2, 
  AlertTriangle, 
  ChevronRight, 
  Info, 
  FileCheck,
  AlignLeft,
  Flame,
  Globe,
  Settings,
  HelpCircle,
  TrendingUp,
  Sliders,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MEETING_TEMPLATES, MeetingTemplate } from "./templates";
import { ToneType, LanguageType, FocusType, GenerateConfig, MeetingRecord } from "./types";
import MarkdownRenderer from "./components/MarkdownRenderer";

export default function App() {
  // Input State
  const [transcript, setTranscript] = useState<string>("");
  const [tone, setTone] = useState<ToneType>("專業");
  const [language, setLanguage] = useState<LanguageType>("繁體中文");
  const [focus, setFocus] = useState<FocusType>("綜合總結");

  // Output State
  const [result, setResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loadingTime, setLoadingTime] = useState<number>(0);
  const [lastExecutionDuration, setLastExecutionDuration] = useState<number | null>(null);

  // Clipboard success feedback state
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Local Storage past history state
  const [records, setRecords] = useState<MeetingRecord[]>([]);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

  // Active loaded template index
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | "">("");

  // Timer for loading feedback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (loadingTime > 0) {
        setLastExecutionDuration(loadingTime);
      }
      setLoadingTime(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Load records from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ai_meeting_records_history");
      if (stored) {
        setRecords(JSON.parse(stored));
      }
    } catch (err) {
      console.error("無法載入瀏覽器歷史會議紀錄：", err);
    }
  }, []);

  // Save records to local storage on change
  const saveRecordsToLocal = (newRecords: MeetingRecord[]) => {
    setRecords(newRecords);
    try {
      localStorage.setItem("ai_meeting_records_history", JSON.stringify(newRecords));
    } catch (err) {
      console.error("無法將會議暫存寫入瀏覽器內存：", err);
    }
  };

  // Preload a transcript template
  const handleLoadTemplate = (index: number) => {
    const template = MEETING_TEMPLATES[index];
    setTranscript(template.transcript);
    setSelectedTemplateIndex(index);
    // clear active record view to focus on the new draft edit area
    setActiveRecordId(null);
  };

  // Reset inputs
  const handleReset = () => {
    setTranscript("");
    setSelectedTemplateIndex("");
    setActiveRecordId(null);
    setError("");
  };

  // Handle call to our Express backend Gemini endpoint
  const handleGenerateAndTranslate = async () => {
    if (!transcript.trim()) {
      setError("請貼上或輸入會議逐字稿內容。");
      return;
    }

    setIsLoading(true);
    setResult("");
    setError("");
    setActiveRecordId(null);

    const startTime = Date.now();

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: transcript.trim(),
          tone,
          language,
          focus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP 伺服器錯誤 (狀態碼 ${response.status})`);
      }

      if (!data.result) {
        throw new Error("伺服器端未產出任何會議結論內容，請重試。");
      }

      setResult(data.result);

      // Create a saved record entry automatically
      const newRecord: MeetingRecord = {
        id: "record_" + Date.now(),
        title: `會議整理 - ${new Date().toLocaleDateString("zh-TW")} (${focus})`,
        createdAt: new Date().toLocaleString("zh-TW"),
        transcript: transcript,
        result: data.result,
        config: {
          tone,
          language,
          focus,
        },
      };

      const durationSec = Math.round((Date.now() - startTime) / 1000);
      setLastExecutionDuration(durationSec > 0 ? durationSec : 3);

      const updatedRecords = [newRecord, ...records];
      saveRecordsToLocal(updatedRecords);
      setActiveRecordId(newRecord.id);

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "伺服器處理連線失敗，請檢查網路連線或金鑰狀態。");
    } finally {
      setIsLoading(false);
    }
  };

  // Copy output markdown to clipboard
  const handleCopyToClipboard = async () => {
    try {
      const contentToCopy = result || (activeRecordId ? records.find(r => r.id === activeRecordId)?.result : "");
      if (!contentToCopy) return;
      
      await navigator.clipboard.writeText(contentToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("無法寫入剪貼簿物：", err);
    }
  };

  // Export Output as MD text file
  const handleDownloadMD = () => {
    const content = result || (activeRecordId ? records.find(r => r.id === activeRecordId)?.result : "");
    if (!content) return;

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Meeting_Minutes_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete historical Record
  const handleDeleteRecord = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm("確定要刪除這筆會議記錄與翻譯歷史嗎？這項動作無法復原。");
    if (!confirmed) return;

    const filtered = records.filter((r) => r.id !== idToDelete);
    saveRecordsToLocal(filtered);
    if (activeRecordId === idToDelete) {
      setActiveRecordId(null);
      setResult("");
      setTranscript("");
    }
  };

  // Select/Click on historical record
  const handleSelectHistoryRecord = (record: MeetingRecord) => {
    setActiveRecordId(record.id);
    setResult(record.result);
    setTranscript(record.transcript);
    setTone(record.config.tone);
    setLanguage(record.config.language);
    setFocus(record.config.focus);
    setError("");
  };

  // Show selected record result or current generation result
  const displayResult = result || (activeRecordId ? records.find(r => r.id === activeRecordId)?.result : "");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top Header Navigation matching Bento theme */}
      <header className="h-16 px-6 md:px-8 flex items-center justify-between border-b border-slate-200 bg-white shadow-sm shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tight">
              智匯會議 AI 秘書
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs md:text-sm text-slate-500">
          <span className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200/60 font-medium">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            Gemini 3.5 核心已連接
          </span>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200">
              AI
            </div>
          </div>
        </div>
      </header>

      {/* Main Bento Responsive Grid Dashboard */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-[1536px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* ================= LEFT BENTO PANELS (lg:col-span-5) ================= */}
        <div className="lg:col-span-5 flex flex-col gap-5 h-full">
          
          {/* Tile 1: System Instruction Bento Box */}
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-violet-50/50 border border-indigo-100/60 rounded-2xl shadow-[0_2px_8px_rgba(79,70,229,0.02)] flex flex-col gap-1 shrink-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-600 text-[10px] font-bold text-white uppercase tracking-wider rounded">系統指令</span>
              <span className="text-[10px] font-semibold text-slate-400 font-mono">System Intent</span>
            </div>
            <p className="text-xs text-indigo-900 leading-relaxed">
              「分析會議、重整重點、提煉具責任歸屬於特定人的行動清單，並流暢翻譯。所有產出請確保為精緻且好讀的 Markdown 排版。」
            </p>
          </div>

          {/* Tile 2: Testing & Preload Center Bento Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-[0_1px_6px_rgba(0,0,0,0.01)] flex flex-col gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                快速載入會議範本
              </h2>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {MEETING_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLoadTemplate(idx)}
                  className={`px-2 py-2.5 rounded-xl text-left border text-[11px] font-bold leading-tight transition-all duration-200 cursor-pointer flex flex-col justify-between h-18 ${
                    selectedTemplateIndex === idx && !activeRecordId
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                >
                  <span className={`px-1 py-0.5 rounded text-[8px] uppercase tracking-wide self-start font-extrabold ${selectedTemplateIndex === idx && !activeRecordId ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-700'}`}>
                    {tmpl.category}
                  </span>
                  <span className="truncate w-full mt-1.5 block">{tmpl.name}</span>
                </button>
              ))}
            </div>

            {transcript && (
              <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100">
                <p className="text-[10px] text-slate-400">已加載範稿、可重設或開始提煉</p>
                <button
                  onClick={handleReset}
                  className="px-2 py-1 rounded-lg text-[9px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 transition-all cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>清除</span>
                </button>
              </div>
            )}
          </div>

          {/* Tile 3: Configuration Panel Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-[0_1px_6px_rgba(0,0,0,0.01)] flex flex-col gap-3.5 shrink-0">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">AI 動態生成參數設定</h3>
              </div>
              <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded font-mono">SETTINGS</span>
            </div>

            <div className="space-y-3">
              {/* Focus Parameter Option Group */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <AlignLeft className="w-2.5 h-2.5 text-indigo-500" />
                  <span>彙整優雅重心</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["綜合總結", "待辦事項與行動", "核心決策與討論"] as FocusType[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFocus(f)}
                      className={`px-1.5 py-2 rounded-lg text-[10px] border font-bold text-center transition-all cursor-pointer truncate ${
                        focus === f
                          ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-105 text-slate-600"
                      }`}
                      title={f}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone Option Group & Target Language Group */}
              <div className="grid grid-cols-2 gap-3">
                {/* Tone Selector */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Flame className="w-2.5 h-2.5 text-indigo-500" />
                    <span>報告語語調</span>
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as ToneType)}
                    className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="專業">商業專業 💼</option>
                    <option value="簡潔">精煉簡潔 ⚡</option>
                    <option value="詳細">脈絡詳細 📝</option>
                  </select>
                </div>

                {/* Translate Language Selector */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Languages className="w-2.5 h-2.5 text-indigo-500" />
                    <span>目標主要譯系</span>
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as LanguageType)}
                    className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="繁體中文">繁體中文 (TW)</option>
                    <option value="English">English (US)</option>
                    <option value="日本語">日本語 (JP)</option>
                    <option value="韓語">韓語 (KR)</option>
                    <option value="簡體中文">簡體中文 (CN)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Tile 4: Text Input Bento Box (Expands smoothly) */}
          <div className="flex-grow min-h-[300px] bg-white border border-slate-200 rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.015)] flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                會議逐字稿內容區
              </span>
              <span className="text-[10px] text-slate-400 font-mono bg-white border border-slate-200/60 px-1.5 py-0.5 rounded">
                共 {transcript.length} 字
              </span>
            </div>

            <textarea
              className="flex-grow w-full p-4 text-xs md:text-sm text-slate-600 leading-relaxed resize-none focus:outline-none placeholder:text-slate-300 font-sans min-h-[200px]"
              placeholder="請點選上方「快速載入會議範本」按鈕快速測試，或直接在此貼上即時錄音逐字稿與討論草案..."
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                setSelectedTemplateIndex("");
              }}
            />

            <div className="p-3 bg-slate-50 border-t border-slate-100">
              <button
                onClick={handleGenerateAndTranslate}
                disabled={isLoading}
                className={`w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-100/80 border border-indigo-600 cursor-pointer ${
                  isLoading ? "opacity-75 cursor-not-allowed" : "hover:scale-[1.005]"
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>正在提煉總結中 ({loadingTime}秒)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>生成會議總結與翻譯</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Validation Err alert block */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-start gap-2 animate-pulse shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">分析未送出：{error}</p>
                <p className="opacity-90 text-[11px] mt-0.5">請填入可分析資訊，或確認 API Key 綁定在與 Cloud 伺服器同步中。</p>
              </div>
            </div>
          )}

        </div>

        {/* ================= RIGHT BENTO PANELS (lg:col-span-7) ================= */}
        <div className="lg:col-span-7 flex flex-col gap-5 h-full">
          
          {/* Tile 5: Dynamic Status Summary Row Bento Card (row-span-1) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-[0_1px_6px_rgba(0,0,0,0.01)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 font-sans">
            <div className="flex flex-wrap items-center gap-4 md:gap-6">
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">目前語言主系</p>
                <p className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                  <Languages className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{language}</span>
                </p>
              </div>
              <div className="hidden sm:block w-px h-6 bg-slate-150"></div>
              
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">摘要過濾模式</p>
                <p className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                  <AlignLeft className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{focus}</span>
                </p>
              </div>
              <div className="hidden sm:block w-px h-6 bg-slate-150"></div>

              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">預計風格語感</p>
                <p className="text-xs font-extrabold text-indigo-600 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>{tone}風格</span>
                </p>
              </div>
              <div className="hidden sm:block w-px h-6 bg-slate-150"></div>

              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">AI 分析耗時</p>
                <p className="text-xs font-extrabold text-slate-700">
                  {lastExecutionDuration ? `${lastExecutionDuration}s` : "就緒"}
                </p>
              </div>
            </div>

            {displayResult && (
              <button
                onClick={handleCopyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0 shadow-md shadow-slate-200 transition-all select-none cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>已複製！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>複製全部</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Tile 6: Markdown Custom Output Card (row-span-5) */}
          <div className="flex-1 min-h-[460px] bg-white border border-slate-200 rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.015)] flex flex-col overflow-hidden relative">
            
            {/* Header portion with clean indicators */}
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-slate-700">AI 智慧產出總結報告</span>
              </div>
              
              {displayResult && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-400">格式: Markdown</span>
                  <button
                    onClick={handleDownloadMD}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg border border-slate-200 bg-white shadow-sm transition-all cursor-pointer"
                    title="導出 Markdown 檔案"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Display body - customized with subtle notebook background feel if result contains values */}
            <div className="flex-1 p-5 md:p-8 overflow-y-auto bg-slate-50/40 relative">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]"
                  >
                    <div className="relative mb-5 flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                      <Sparkles className="w-4 h-4 text-indigo-500 absolute animate-pulse" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-700">正在生成精緻會議記錄...</h4>
                    <p className="text-[11px] text-slate-400 mt-2 max-w-xs leading-relaxed">
                      正在消除口語贅詞、理清人物指令、提取責任人，並極速套用結構化翻譯與關鍵字格式。
                    </p>
                  </motion.div>
                ) : displayResult ? (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-none text-slate-700 text-sm leading-relaxed"
                  >
                    <MarkdownRenderer content={displayResult} />
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-400 text-center h-full my-auto min-h-[300px]">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-350 mb-3.5">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-400">尚無會議整理結果</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                      請在左側填寫或點選載入範稿，按下下方「生成」即可在此產生排版美觀的會議重點！
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Float notification feedback when copied */}
            {isCopied && (
              <div className="absolute bottom-5 right-5 bg-slate-900 border border-slate-800 text-white text-xs py-2 px-3.5 rounded-xl shadow-lg flex items-center gap-1.5 z-50">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>已複製 Markdown 到剪貼簿！</span>
              </div>
            )}
          </div>

          {/* Tile 7: Historical Summaries Logger Card (Bento Row 6) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-[0_1px_6px_rgba(0,0,0,0.01)] flex flex-col shrink-0">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  歷史会议記錄存檔 ({records.length})
                </h3>
              </div>
              
              {records.length > 0 && (
                <button
                  onClick={() => {
                    const confirmed = window.confirm("確定要清除所有存存放的歷史數據？");
                    if (confirmed) saveRecordsToLocal([]);
                  }}
                  className="text-[10px] text-rose-500 hover:text-rose-700 hover:underline cursor-pointer font-bold"
                >
                  清除全部
                </button>
              )}
            </div>

            {records.length === 0 ? (
              <div className="py-4 text-center text-slate-400">
                <p className="text-[11px]">尚無本地歷史記錄。</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {records.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => handleSelectHistoryRecord(rec)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer group flex items-center justify-between gap-3 ${
                      activeRecordId === rec.id
                        ? "bg-indigo-50/50 border-indigo-200 text-indigo-900 shadow-sm"
                        : "bg-slate-50/60 hover:bg-slate-100/60 border-slate-150 text-slate-700"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate group-hover:text-indigo-600 transition-colors">
                        {rec.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-slate-400 font-mono">
                          {rec.createdAt}
                        </span>
                        <span className="text-[9px] bg-slate-200 text-slate-600 px-1 rounded scale-95 origin-left font-bold">
                          {rec.config.language} • {rec.config.tone}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-all shrink-0" />
                      <button
                        type="button"
                        onClick={(e) => handleDeleteRecord(rec.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all shrink-0 cursor-pointer"
                        title="刪除此筆記錄"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Footer Status Bar matching Bento theme */}
      <footer className="h-10 px-6 flex items-center justify-between bg-white border-t border-slate-200 text-[10px] text-slate-400 shrink-0 select-none">
        <div className="flex gap-4 font-mono">
          <span>服務狀態: <span className="text-emerald-500 font-bold">正常運作中</span></span>
          <span className="hidden sm:inline">當前版本: v3.5.0-stable</span>
        </div>
        <div className="flex gap-4">
          <span>隱私加密保護</span>
          <span>© 2026 SmartMinutes AI</span>
        </div>
      </footer>

    </div>
  );
}
