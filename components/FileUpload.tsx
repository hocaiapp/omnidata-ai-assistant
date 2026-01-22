
import React from 'react';
import { FileData } from '../types';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onFilesProcessed: (files: FileData[]) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesProcessed, isLoading }) => {
  
  const detectDataType = (value: any): string => {
    if (value === null || value === undefined || value === '') return 'Trống';
    if (!isNaN(Date.parse(value)) && isNaN(Number(value))) return 'Ngày tháng';
    if (!isNaN(Number(value))) return 'Số';
    if (typeof value === 'boolean') return 'Boolean';
    return 'Văn bản';
  };

  const parseFile = async (file: File): Promise<FileData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const extension = file.name.split('.').pop()?.toLowerCase();

      reader.onload = (e) => {
        try {
          let data: any[] = [];
          let columns: string[] = [];

          if (extension === 'xlsx' || extension === 'xls') {
            const workbook = XLSX.read(e.target?.result, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            data = XLSX.utils.sheet_to_json(worksheet);
            if (data.length > 0) {
              columns = Object.keys(data[0]);
            }
          } else {
            const content = e.target?.result as string;
            const lines = content.split('\n').filter(l => l.trim() !== '');
            if (lines.length > 0) {
              columns = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
              data = lines.slice(1).map(line => {
                const values = line.split(',');
                const obj: any = {};
                columns.forEach((h, i) => obj[h] = values[i]?.trim().replace(/"/g, ''));
                return obj;
              });
            }
          }

          // Phân tích sâu kiểu dữ liệu
          const dataTypes: Record<string, string> = {};
          if (data.length > 0) {
            columns.forEach(col => {
              const sampleValue = data.find(row => row[col] !== undefined && row[col] !== '')?.[col];
              dataTypes[col] = detectDataType(sampleValue);
            });
          }

          resolve({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: extension || 'unknown',
            columns: columns,
            rowCount: data.length,
            preview: data.slice(0, 5),
            data: data,
            analysis: {
              dataTypes: dataTypes,
              summary: `File ${extension?.toUpperCase()} với ${data.length} dòng và ${columns.length} cột.`
            }
          });
        } catch (err) {
          reject(err);
        }
      };

      if (extension === 'xlsx' || extension === 'xls') {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    try {
      const processedFiles = await Promise.all(files.map(parseFile));
      onFilesProcessed(processedFiles);
    } catch (err) {
      alert("Có lỗi khi đọc file. Vui lòng kiểm tra định dạng file.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-indigo-200 rounded-2xl bg-white hover:border-indigo-400 transition-all duration-300">
      <div className="text-center">
        <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-file-csv text-3xl text-indigo-600"></i>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Tải Lên File Dữ Liệu</h3>
        <p className="text-slate-500 mb-6 text-sm max-w-xs mx-auto">
          Hỗ trợ định dạng <strong>.xlsx, .csv, .txt</strong>. Hệ thống sẽ phân tích cấu trúc và kiểu dữ liệu tự động.
        </p>
        
        <label className={`
          inline-flex items-center px-6 py-3 rounded-lg font-semibold text-white cursor-pointer transition-all
          ${isLoading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'}
        `}>
          {isLoading ? (
            <><i className="fa-solid fa-circle-notch animate-spin mr-2"></i> Đang phân tích...</>
          ) : (
            <><i className="fa-solid fa-plus mr-2"></i> Chọn File Phân Tích</>
          )}
          <input 
            type="file" 
            multiple 
            className="hidden" 
            onChange={handleFileChange} 
            disabled={isLoading}
            accept=".csv,.txt,.xlsx,.xls"
          />
        </label>
      </div>
    </div>
  );
};

export default FileUpload;
