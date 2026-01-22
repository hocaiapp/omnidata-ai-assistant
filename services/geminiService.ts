
import { GoogleGenAI, Type } from "@google/genai";
import { FileData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeDataStructure = async (files: FileData[]) => {
  const model = 'gemini-3-flash-preview';
  
  const fileContext = files.map(f => ({
    name: f.name,
    columns: f.columns,
    rowCount: f.rowCount,
    sample: f.preview.slice(0, 3),
    dataTypes: f.analysis?.dataTypes
  }));

  const prompt = `
    Bạn là một chuyên gia phân tích dữ liệu. Tôi có các tệp tin sau: ${JSON.stringify(fileContext)}.
    Hãy phân tích kỹ và trả về kết quả dưới dạng JSON (tiếng Việt).
    Yêu cầu:
    1. Tìm các cột có tên giống hệt nhau.
    2. Tìm các cột có ý nghĩa tương tự.
    3. Đề xuất chiến lược gộp.
    4. Cảnh báo vấn đề cấu trúc.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          commonColumns: { type: Type.ARRAY, items: { type: Type.STRING } },
          similarColumns: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                groupName: { type: Type.STRING },
                columns: { type: Type.ARRAY, items: { type: Type.STRING } },
                reason: { type: Type.STRING }
              }
            }
          },
          mergingStrategy: { type: Type.STRING },
          structuralWarnings: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["commonColumns", "similarColumns", "mergingStrategy"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const chatWithData = async (query: string, history: any[], files: FileData[], analysis: any) => {
  const model = 'gemini-3-pro-preview';
  
  const fileContext = files.map(f => ({
    name: f.name,
    cols: f.columns,
    rows: f.rowCount,
  }));

  const systemPrompt = `
    Bạn là Trợ Lý Phân Tích Dữ Liệu AI. Bạn đang làm việc với các file: ${JSON.stringify(fileContext)}.
    Phân tích hiện tại: ${JSON.stringify(analysis)}.
    
    Nhiệm vụ đặc biệt: Nếu người dùng yêu cầu xử lý dữ liệu (ví dụ: "chỉ lấy cột A, B", "bỏ cột C", "gộp theo yêu cầu"), 
    hãy trả lời xác nhận và LUÔN kèm theo một khối JSON ở cuối phản hồi với định dạng:
    ACTION_CONFIG: {"columnsToKeep": ["tên cột 1", "..."], "columnsToRemove": ["..."], "action": "merge_custom"}
    
    Lưu ý: 
    - columnsToKeep: Danh sách chính xác các cột người dùng muốn giữ.
    - columnsToRemove: Danh sách các cột người dùng muốn bỏ qua.
    - Nếu không có yêu cầu xử lý cụ thể, không cần kèm JSON này.
    - Trả lời thân thiện bằng tiếng Việt.
  `;

  const chat = ai.chats.create({
    model,
    config: { systemInstruction: systemPrompt }
  });

  const response = await chat.sendMessage({ message: query });
  return response.text;
};
