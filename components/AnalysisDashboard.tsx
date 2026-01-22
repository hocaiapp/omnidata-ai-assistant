
import React from 'react';
import { FileData } from '../types';

interface AnalysisDashboardProps {
  files: FileData[];
  crossAnalysis: any;
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ files, crossAnalysis }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Danh sách file */}
      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <i className="fa-solid fa-magnifying-glass-chart mr-2 text-indigo-500"></i>
          Kết Quả Phân Tích File ({files.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {files.map(file => (
            <div key={file.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                  {file.name.split('.').pop()}
                </span>
                <span className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
              <h4 className="font-semibold text-slate-800 truncate mb-1" title={file.name}>{file.name}</h4>
              <p className="text-sm text-slate-500 mb-4">{file.rowCount} dòng • {file.columns.length} cột</p>
              
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cấu trúc & Kiểu dữ liệu</p>
                <div className="grid grid-cols-1 gap-1">
                  {file.columns.slice(0, 8).map(col => (
                    <div key={col} className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded border border-slate-100">
                      <span className="text-[11px] font-medium text-slate-700 truncate max-w-[120px]">{col}</span>
                      <span className="text-[9px] text-indigo-500 font-bold bg-indigo-50 px-1 rounded">
                        {file.analysis?.dataTypes[col] || 'N/A'}
                      </span>
                    </div>
                  ))}
                  {file.columns.length > 8 && (
                    <p className="text-[10px] text-slate-400 text-center mt-1">và {file.columns.length - 8} cột khác...</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Phân tích chéo */}
      {crossAnalysis && (
        <section className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center mb-6">
            <div className="bg-white/20 p-2 rounded-lg mr-3">
              <i className="fa-solid fa-brain text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold">Trí Tuệ Nhân Tạo Phân Tích</h2>
              <p className="text-indigo-100 text-sm opacity-90">Phát hiện sự tương quan giữa các file dữ liệu</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20">
              <h4 className="text-sm font-bold mb-3 flex items-center uppercase tracking-tight">
                <i className="fa-solid fa-equals mr-2 text-green-300"></i> Cột Trùng Tên
              </h4>
              <div className="flex flex-wrap gap-2">
                {crossAnalysis.commonColumns && crossAnalysis.commonColumns.length > 0 ? (
                  crossAnalysis.commonColumns.map((col: string) => (
                    <span key={col} className="text-xs bg-green-500/30 px-2 py-1 rounded-full border border-green-400/30">
                      {col}
                    </span>
                  ))
                ) : (
                  <span className="text-xs italic opacity-60">Không tìm thấy cột trùng khớp hoàn toàn</span>
                )}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20">
              <h4 className="text-sm font-bold mb-3 flex items-center uppercase tracking-tight">
                <i className="fa-solid fa-arrows-left-right mr-2 text-amber-300"></i> Cột Có Ý Nghĩa Tương Tự
              </h4>
              <ul className="space-y-2">
                {crossAnalysis.similarColumns?.map((group: any, idx: number) => (
                  <li key={idx} className="text-xs flex flex-col gap-1">
                    <div className="flex items-center">
                       <span className="font-bold text-amber-200 mr-2">{group.groupName}:</span>
                       <span className="opacity-80 italic">({group.columns.join(', ')})</span>
                    </div>
                    <p className="text-[10px] text-amber-100/60 leading-tight">{group.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-black/20 rounded-xl border border-white/10">
            <h4 className="text-sm font-bold mb-1 flex items-center">
              <i className="fa-solid fa-wand-magic-sparkles mr-2 text-yellow-300"></i> Chiến Lược Gộp Dữ Liệu
            </h4>
            <p className="text-sm leading-relaxed text-indigo-50">
              {crossAnalysis.mergingStrategy}
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

export default AnalysisDashboard;
