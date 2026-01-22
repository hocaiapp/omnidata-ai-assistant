
import React, { useState, useEffect } from 'react';
import { FileData, ProcessingStatus } from './types';
import { analyzeDataStructure } from './services/geminiService';
import FileUpload from './components/FileUpload';
import AnalysisDashboard from './components/AnalysisDashboard';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [files, setFiles] = useState<FileData[]>([]);
  const [crossAnalysis, setCrossAnalysis] = useState<any>(null);
  const [processedFileUrl, setProcessedFileUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (processedFileUrl) URL.revokeObjectURL(processedFileUrl);
    };
  }, [processedFileUrl]);

  const handleFiles = async (newFiles: FileData[]) => {
    setFiles(newFiles);
    setStatus(ProcessingStatus.ANALYZING);
    try {
      const analysis = await analyzeDataStructure(newFiles);
      setCrossAnalysis(analysis);
      setStatus(ProcessingStatus.CHATTING);
    } catch (error) {
      console.error("Analysis failed", error);
      setStatus(ProcessingStatus.CHATTING);
    }
  };

  const handleReset = () => {
    if (processedFileUrl) URL.revokeObjectURL(processedFileUrl);
    setStatus(ProcessingStatus.IDLE);
    setFiles([]);
    setCrossAnalysis(null);
    setProcessedFileUrl(null);
  };

  const handleMergeFiles = (config?: { columnsToKeep?: string[], columnsToRemove?: string[] }) => {
    setStatus(ProcessingStatus.PROCESSING);
    
    // Luôn dọn dẹp file cũ trước khi tạo file mới
    if (processedFileUrl) {
      URL.revokeObjectURL(processedFileUrl);
      setProcessedFileUrl(null);
    }
    
    setTimeout(() => {
      // 1. Xác định headers sẽ giữ lại
      let allHeaders = Array.from(new Set(files.flatMap(f => f.columns)));
      
      // Fix: Ensure config parameters are treated as strings for filtering
      if (config?.columnsToKeep && config.columnsToKeep.length > 0) {
        // Chỉ lấy những cột AI yêu cầu giữ lại (có tồn tại trong dữ liệu thực tế)
        const requestedKeep = config.columnsToKeep.map(String);
        allHeaders = allHeaders.filter(h => requestedKeep.includes(h));
      }

      if (config?.columnsToRemove && config.columnsToRemove.length > 0) {
        // Loại bỏ các cột AI yêu cầu xóa
        const requestedRemove = config.columnsToRemove.map(String);
        allHeaders = allHeaders.filter(h => !requestedRemove.includes(h));
      }
      
      // 2. Thu thập tất cả các hàng
      const allRows = files.flatMap(f => f.data);
      
      // 3. Loại bỏ dữ liệu trùng lặp (dựa trên các cột còn lại)
      const seen = new Set();
      const uniqueRows = allRows.filter(row => {
        // Fix: Explicitly cast row as Record<string, any> to allow indexing with string keys
        const typedRow = row as Record<string, any>;
        // Chỉ so sánh dựa trên các cột được chọn để gộp
        const simplifiedRow = allHeaders.reduce((acc: Record<string, any>, col) => {
          acc[col] = typedRow[col];
          return acc;
        }, {});
        const stringified = JSON.stringify(simplifiedRow);
        if (seen.has(stringified)) return false;
        seen.add(stringified);
        return true;
      });
      
      // 4. Tạo nội dung CSV
      const csvContent = [
        allHeaders.join(','),
        ...uniqueRows.map(row => {
          const typedRow = row as Record<string, any>;
          return allHeaders.map(h => {
            // Fix: Use typedRow with casted string index to extract value
            const val = typedRow[h] || '';
            return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
          }).join(',');
        })
      ].join('\n');

      // 5. Tạo Blob và URL mới
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      setProcessedFileUrl(url);
      setStatus(ProcessingStatus.CHATTING);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <nav className="sticky top-0 z-50 glass-morphism border-b border-slate-200 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200 transform rotate-3 hover:rotate-0 transition-transform cursor-pointer">
            <i className="fa-solid fa-chart-line text-white"></i>
          </div>
          <span className="font-black text-xl tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">OmniData AI</span>
        </div>
        <div className="flex gap-4">
          {files.length > 0 && (
            <button 
              onClick={handleReset}
              className="text-xs font-black text-red-500 hover:text-red-700 transition-all uppercase tracking-tighter px-4 py-2 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100"
            >
              Làm mới dự án
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {status === ProcessingStatus.IDLE && (
          <div className="max-w-2xl mx-auto mt-16 animate-fade-in">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold text-indigo-700 bg-indigo-50 rounded-full uppercase tracking-widest border border-indigo-100">
                Data Processing 2.0
              </span>
              <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1]">
                Xử Lý Dữ Liệu <br/> <span className="text-indigo-600">Bằng Giọng Nói AI</span>
              </h1>
              <p className="text-slate-500 text-lg max-w-lg mx-auto leading-relaxed">
                Tải lên tệp của bạn và yêu cầu AI làm bất cứ điều gì: gộp, lọc, làm sạch dữ liệu chỉ bằng ngôn ngữ tự nhiên.
              </p>
            </div>
            <FileUpload onFilesProcessed={handleFiles} isLoading={false} />
          </div>
        )}

        {(status !== ProcessingStatus.IDLE) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-8">
              {status === ProcessingStatus.ANALYZING ? (
                <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm">
                  <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 border-8 border-indigo-50 rounded-full"></div>
                    <div className="absolute inset-0 border-8 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <i className="fa-solid fa-brain text-2xl text-indigo-600"></i>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800">Đang khởi tạo AI...</h3>
                  <p className="text-slate-400 mt-2 text-center max-w-xs font-medium">Hệ thống đang đối chiếu dữ liệu giữa {files.length} tệp tin để tìm điểm chung.</p>
                </div>
              ) : (
                <AnalysisDashboard files={files} crossAnalysis={crossAnalysis} />
              )}
            </div>

            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
              <ChatInterface 
                files={files} 
                crossAnalysis={crossAnalysis} 
                onProcessRequest={handleMergeFiles}
              />

              {status === ProcessingStatus.PROCESSING && (
                <div className="bg-white border-2 border-indigo-50 p-6 rounded-3xl shadow-xl flex items-center gap-5 animate-pulse">
                  <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <i className="fa-solid fa-wand-magic-sparkles text-white animate-spin"></i>
                  </div>
                  <div>
                    <span className="block text-sm font-black text-slate-800 uppercase tracking-tighter">AI đang thực thi lệnh...</span>
                    <span className="text-xs text-slate-400 font-medium">Tạo cấu trúc file mới và lọc trùng lặp.</span>
                  </div>
                </div>
              )}

              {processedFileUrl && (
                <div className="bg-white border-2 border-emerald-500 p-8 rounded-[2rem] shadow-2xl flex flex-col gap-6 animate-bounce-in relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-file-csv text-8xl text-emerald-900"></i>
                  </div>
                  
                  <div className="relative z-10 flex items-center gap-5">
                    <div className="bg-emerald-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-200">
                      <i className="fa-solid fa-cloud-arrow-down text-2xl"></i>
                    </div>
                    <div>
                      <h4 className="font-black text-emerald-900 text-xl leading-tight">Xử Lý Hoàn Tất!</h4>
                      <p className="text-sm text-emerald-600 font-bold">File đã được tạo lại theo yêu cầu mới nhất.</p>
                    </div>
                  </div>
                  
                  <a 
                    href={processedFileUrl} 
                    download={`OmniData_AI_Result_${new Date().getTime()}.csv`}
                    className="relative z-10 flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 px-8 rounded-2xl transition-all shadow-xl shadow-emerald-200 active:scale-95 group hover:gap-5"
                  >
                    Tải File Kết Quả (CSV)
                    <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                  </a>
                  
                  <p className="text-[10px] text-emerald-800 text-center font-black uppercase tracking-[0.2em] opacity-40">
                    Secure Processing • UTF-8 Encoding
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
