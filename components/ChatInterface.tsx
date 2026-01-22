
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, FileData } from '../types';
import { chatWithData } from '../services/geminiService';

interface ChatInterfaceProps {
  files: FileData[];
  crossAnalysis: any;
  onProcessRequest: (config?: any) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ files, crossAnalysis, onProcessRequest }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Xin chào! Tôi đã sẵn sàng xử lý dữ liệu. Bạn có thể yêu cầu tôi gộp file, hoặc chỉ lấy/loại bỏ các cột cụ thể (VD: 'Chỉ lấy cột Họ Tên và Email')." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastConfig, setLastConfig] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);
    setLastConfig(null);

    try {
      const response = await chatWithData(userMsg, messages, files, crossAnalysis);
      let cleanResponse = response || "";
      
      // Tìm và tách cấu hình hành động từ AI
      const configMatch = cleanResponse.match(/ACTION_CONFIG:\s*({.*})/);
      if (configMatch) {
        try {
          const config = JSON.parse(configMatch[1]);
          setLastConfig(config);
          cleanResponse = cleanResponse.replace(/ACTION_CONFIG:\s*{.*}/, "").trim();
        } catch (e) {
          console.error("Failed to parse AI config", e);
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: cleanResponse }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'system', content: "Có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl transition-all">
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3 shadow-inner">
            <i className="fa-solid fa-robot text-sm"></i>
          </div>
          <div>
            <h3 className="font-bold text-sm">Trợ Lý Dữ Liệu AI</h3>
            <p className="text-[10px] text-slate-400">Gemini 3 Pro Processing</p>
          </div>
        </div>
        <button 
          onClick={() => onProcessRequest()} 
          className="text-xs bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg font-bold transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
        >
          <i className="fa-solid fa-code-merge mr-1"></i> Gộp Nhanh
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`
              max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
              ${msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : msg.role === 'system'
                ? 'bg-red-50 text-red-600 italic text-center w-full border border-red-100'
                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'}
            `}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              
              {/* Hiển thị nút hành động nếu AI đề xuất cấu hình mới */}
              {i === messages.length - 1 && msg.role === 'assistant' && lastConfig && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-tighter">AI đã sẵn sàng thực hiện:</p>
                  <button 
                    onClick={() => onProcessRequest(lastConfig)}
                    className="flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2 rounded-xl border border-indigo-200 transition-all active:scale-95"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    Tạo Lại File Theo Yêu Cầu
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Yêu cầu xử lý (VD: bỏ cột ngày tạo)..." 
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
        />
        <button 
          onClick={handleSend}
          disabled={isTyping || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-indigo-200 active:scale-90"
        >
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
