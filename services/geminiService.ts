
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface VoiceSettings {
  gender: 'female' | 'male';
  speed: number;
  tone: 'cheerful' | 'soft' | 'excited' | 'normal';
}

export const speakText = (text: string, settings: VoiceSettings) => {
  if (!('speechSynthesis' in window)) {
    console.warn("Trình duyệt không hỗ trợ Speech Synthesis");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Lấy danh sách giọng đọc và lọc theo tiếng Việt và giới tính
  const voices = window.speechSynthesis.getVoices();
  const vietnameseVoices = voices.filter(v => v.lang.includes('vi-VN'));
  
  // Cố gắng tìm giọng theo giới tính yêu cầu
  let selectedVoice = null;
  if (settings.gender === 'female') {
    selectedVoice = vietnameseVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('nữ') || v.name.toLowerCase().includes('an')) || vietnameseVoices[0];
  } else {
    selectedVoice = vietnameseVoices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('nam') || v.name.toLowerCase().includes('minh')) || vietnameseVoices[0];
  }
  
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.rate = settings.speed;
  
  // Điều chỉnh pitch dựa trên tone
  switch (settings.tone) {
    case 'cheerful':
    case 'excited':
      utterance.pitch = 1.3;
      break;
    case 'soft':
      utterance.pitch = 0.9;
      break;
    default:
      utterance.pitch = 1.1;
  }

  utterance.lang = 'vi-VN';
  window.speechSynthesis.speak(utterance);
};

export const getMathQuestion = async (level: number) => {
    const num1 = Math.floor(Math.random() * (level * 5)) + 1;
    const num2 = Math.floor(Math.random() * (level * 3)) + 1;
    const isPlus = Math.random() > 0.4;
    
    if (isPlus) {
        return {
            content: `${num1} + ${num2}`,
            answer: num1 + num2
        };
    } else {
        const max = Math.max(num1, num2);
        const min = Math.min(num1, num2);
        return {
            content: `${max} - ${min}`,
            answer: max - min
        };
    }
};
