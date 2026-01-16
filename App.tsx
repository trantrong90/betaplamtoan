
import React, { useState, useEffect, useCallback } from 'react';
import { GameState } from './types';
import { COLORS, FRUITS, ANIMALS } from './constants';
import { speakText, getMathQuestion, VoiceSettings } from './services/geminiService';

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  gender: 'female',
  speed: 1.0,
  tone: 'cheerful'
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.HOME);
  const [currentNum, setCurrentNum] = useState<number>(1);
  const [score, setScore] = useState(0);
  const [quizData, setQuizData] = useState<{items: string[], answer: number, options: number[], content?: string, itemName?: string}>({items: [], answer: 0, options: []});
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shake, setShake] = useState(false);
  const [isPressingNum, setIsPressingNum] = useState(false);
  
  const [showSettings, setShowSettings] = useState(false);
  
  // Khởi tạo voiceSettings từ localStorage hoặc mặc định
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    const saved = localStorage.getItem('voiceSettings');
    return saved ? JSON.parse(saved) : DEFAULT_VOICE_SETTINGS;
  });

  // Lưu cài đặt mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem('voiceSettings', JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  const triggerFeedback = (text: string, correct: boolean | null = null) => {
    setIsCorrect(correct);
    if (correct === false) {
      setShake(true);
      setTimeout(() => setShake(false), 300);
    }
    speakText(text, voiceSettings);
    if (correct === true) {
        setTimeout(() => setIsCorrect(null), 1500);
    }
  };

  const handlePreviewVoice = () => {
    speakText("Chào bé, mình cùng học toán nhé!", voiceSettings);
  };

  const generateCountingQuiz = useCallback(() => {
    const count = Math.floor(Math.random() * 8) + 2;
    const isFruit = Math.random() > 0.5;
    const pool = isFruit ? FRUITS : ANIMALS;
    const itemIdx = Math.floor(Math.random() * pool.length);
    const item = pool[itemIdx];
    const items = Array(count).fill(item);
    
    // Tên vật thể để đọc câu hỏi
    const fruitNames = ['quả táo', 'quả chuối', 'quả nho', 'quả dâu', 'quả cam', 'quả lê', 'quả dứa', 'quả dưa hấu'];
    const animalNames = ['con chó', 'con mèo', 'con thỏ', 'con hổ', 'con sư tử', 'con bò', 'con lợn', 'con ếch'];
    const itemName = isFruit ? fruitNames[itemIdx] : animalNames[itemIdx];

    const options = new Set<number>();
    options.add(count);
    while(options.size < 3) {
      options.add(Math.max(1, Math.min(10, count + (Math.floor(Math.random() * 5) - 2))));
    }
    
    setQuizData({
      items,
      answer: count,
      options: Array.from(options).sort((a, b) => a - b),
      itemName
    });
    setIsCorrect(null);
  }, []);

  const generateMathQuiz = useCallback(async () => {
    const level = Math.floor(score / 50) + 1;
    const q = await getMathQuestion(level);
    const options = new Set<number>();
    options.add(q.answer);
    while(options.size < 3) {
      options.add(Math.max(0, q.answer + (Math.floor(Math.random() * 5) - 2)));
    }
    
    setQuizData({
      items: [],
      content: q.content,
      answer: q.answer,
      options: Array.from(options).sort((a, b) => a - b)
    });
    setIsCorrect(null);
  }, [score]);

  useEffect(() => {
    if (gameState === GameState.COUNTING) generateCountingQuiz();
    else if (gameState === GameState.SIMPLE_MATH) generateMathQuiz();
    
    // Đảm bảo voices được load
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [gameState, generateCountingQuiz, generateMathQuiz]);

  const handleAnswer = (val: number) => {
    if (val === quizData.answer) {
      setScore(s => s + 10);
      triggerFeedback("Tuyệt vời! Bé chọn đúng rồi!", true);
      setTimeout(() => {
        if (gameState === GameState.COUNTING) generateCountingQuiz();
        else generateMathQuiz();
      }, 1500);
    } else {
      triggerFeedback("Gần đúng rồi, bé thử lại xem!", false);
    }
  };

  const handleMathSpeech = () => {
    if (!quizData.content) return;
    // Chuyển đổi + thành cộng và - thành trừ để AI đọc tự nhiên
    const spokenContent = quizData.content
      .replace('+', 'cộng')
      .replace('-', 'trừ');
    triggerFeedback(`Đố bé, ${spokenContent} bằng mấy?`);
  };

  const resetVoiceSettings = () => {
    setVoiceSettings(DEFAULT_VOICE_SETTINGS);
    speakText("Đã đặt lại giọng nói mặc định", DEFAULT_VOICE_SETTINGS);
  };

  const NavItem = ({ state, icon, label, color }: { state: GameState, icon: string, label: string, color: string }) => {
    const isActive = gameState === state;
    return (
      <button 
        onClick={() => setGameState(state)}
        className={`relative flex flex-col items-center justify-center py-2 px-1 flex-1 transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-40'}`}
      >
        <span className="text-2xl z-10 mb-1">{icon}</span>
        <span className={`text-[10px] font-black uppercase tracking-tighter z-10 ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>
          {label}
        </span>
        {isActive && (
          <div className={`absolute -bottom-1 w-1 h-1 rounded-full ${color}`}></div>
        )}
      </button>
    );
  };

  const renderHome = () => (
    <div className="flex flex-col items-center min-h-screen bg-[#FDFCF0] pb-40">
      <div className="w-full bg-gradient-to-br from-[#FFDEE9] to-[#B5FFFC] pt-12 pb-14 px-8 rounded-b-[60px] shadow-2xl relative overflow-hidden">
        <button 
          onClick={() => setShowSettings(true)}
          className="absolute top-8 right-6 p-3 bg-white/50 backdrop-blur-md rounded-2xl shadow-sm z-20 hover:scale-110 active:scale-90 transition-transform"
        >
          ⚙️
        </button>
        <h1 className="text-5xl font-black text-gray-800 text-center drop-shadow-sm leading-none mb-2">BÉ HỌC TOÁN</h1>
        <p className="text-center text-gray-600 font-bold text-sm uppercase tracking-[0.2em] mb-8">Vui học mỗi ngày</p>
        
        <div className="glass rounded-[32px] p-5 flex items-center justify-between shadow-inner border border-white/50">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-tr from-yellow-300 to-orange-400 rounded-2xl flex items-center justify-center text-2xl shadow-lg border-2 border-white transform rotate-3">🦁</div>
            <div className="ml-3">
              <p className="text-gray-500 text-[9px] font-black uppercase">Hạng của bé</p>
              <p className="text-gray-800 font-black text-base">Thông Thái</p>
            </div>
          </div>
          <div className="bg-white/80 px-4 py-2 rounded-2xl shadow-sm border border-white">
            <span className="text-orange-500 font-black text-lg">⭐ {score}</span>
          </div>
        </div>
      </div>
      
      <div className="px-6 -mt-8 w-full space-y-4 z-10">
        {[
          { state: GameState.LEARN_NUMBERS, icon: '1️⃣', title: 'HỌC SỐ', sub: 'Làm quen số 0-9', color: 'from-orange-400 to-yellow-400' },
          { state: GameState.COUNTING, icon: '🍓', title: 'TẬP ĐẾM', sub: 'Đếm hình vui nhộn', color: 'from-emerald-400 to-teal-400' },
          { state: GameState.SIMPLE_MATH, icon: '➕', title: 'LÀM TOÁN', sub: 'Cộng trừ đơn giản', color: 'from-pink-400 to-rose-400' }
        ].map((item, idx) => (
          <div 
            key={idx}
            onClick={() => { setGameState(item.state); triggerFeedback(item.title); }}
            className={`bg-gradient-to-r ${item.color} p-5 rounded-[30px] shadow-xl flex items-center active:scale-[0.97] transition-all cursor-pointer border-b-8 border-black/10`}
          >
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl mr-4 backdrop-blur-sm">
              {item.icon}
            </div>
            <div>
              <h3 className="text-white text-xl font-black">{item.title}</h3>
              <p className="text-white/80 text-xs font-bold">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLearnNumbers = () => (
    <div className="flex flex-col items-center min-h-screen bg-[#FFF9E6] pb-40 pt-8 px-6 animate-slide-up">
      <div className="w-full flex justify-between items-center mb-4">
        <h2 className="text-2xl font-black text-orange-500">HỌC CHỮ SỐ</h2>
        <div className="bg-orange-500 text-white px-4 py-1.5 rounded-full font-black text-[10px]">Số {currentNum}</div>
      </div>
      
      <div 
        onClick={() => {
            setIsPressingNum(true);
            triggerFeedback(`Số ${currentNum}`);
            setTimeout(() => setIsPressingNum(false), 300);
        }}
        className={`w-full bg-white rounded-[50px] shadow-2xl p-6 flex flex-col items-center border-[6px] border-orange-100 flex-1 justify-center relative overflow-hidden transition-all duration-300 mb-6 ${isPressingNum ? 'scale-95 border-orange-400' : ''}`}
      >
        <div className="absolute top-6 text-orange-300 text-[10px] font-black uppercase tracking-widest animate-pulse">Chạm để nghe</div>
        <span className={`text-[160px] font-black text-orange-500 leading-none drop-shadow-2xl z-10 ${isPressingNum ? 'scale-110' : 'animate-float'}`}>
            {currentNum}
        </span>
        <div className="flex flex-wrap justify-center gap-3 mt-4 z-10">
            {currentNum === 0 ? (
                <span className="text-gray-400 font-black italic text-sm bg-gray-50 px-5 py-2 rounded-full border border-gray-100">Số không (trống rỗng)</span>
            ) : (
                Array(currentNum).fill('🎈').map((e, i) => (
                    <span key={i} className="text-4xl">{e}</span>
                ))
            )}
        </div>
      </div>

      <div className="w-full space-y-4">
        <div className="flex gap-4">
            <button onClick={() => { const next = Math.max(0, currentNum - 1); setCurrentNum(next); triggerFeedback(`Số ${next}`); }} className="flex-1 bg-white h-14 rounded-2xl shadow-[0_6px_0_#e5e7eb] border-2 border-gray-100 flex items-center justify-center text-sm font-black text-gray-500 active:translate-y-1 active:shadow-none transition-all">⬅ TRƯỚC</button>
            <button onClick={() => { const next = Math.min(9, currentNum + 1); setCurrentNum(next); triggerFeedback(`Số ${next}`); }} className="flex-1 bg-orange-500 h-14 rounded-2xl shadow-[0_6px_0_#c2410c] border-2 border-orange-400 flex items-center justify-center text-sm font-black text-white active:translate-y-1 active:shadow-none transition-all">SAU ➡</button>
        </div>

        <div className="bg-white rounded-[35px] p-4 shadow-xl border-4 border-orange-100">
          <div className="space-y-3">
            <div className="flex justify-between gap-2">
                {[0, 1, 2, 3, 4].map((n) => (
                    <button key={n} onClick={() => { setCurrentNum(n); triggerFeedback(`Số ${n}`); }} className={`flex-1 h-12 rounded-xl font-black text-xl transition-all border-b-[6px] ${currentNum === n ? 'bg-orange-500 text-white border-orange-800 scale-110 z-10' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>{n}</button>
                ))}
            </div>
            <div className="flex justify-between gap-2">
                {[5, 6, 7, 8, 9].map((n) => (
                    <button key={n} onClick={() => { setCurrentNum(n); triggerFeedback(`Số ${n}`); }} className={`flex-1 h-12 rounded-xl font-black text-xl transition-all border-b-[6px] ${currentNum === n ? 'bg-orange-500 text-white border-orange-800 scale-110 z-10' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>{n}</button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCounting = () => (
    <div className={`flex flex-col items-center min-h-screen bg-[#E6FFF5] pb-40 pt-10 px-8 animate-slide-up ${shake ? 'animate-shake' : ''}`}>
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-emerald-600">TẬP ĐẾM</h2>
        <div className="bg-emerald-500 text-white px-5 py-1.5 rounded-full font-black text-sm">⭐ {score}</div>
      </div>
      <div 
        onClick={() => triggerFeedback(`Đố bé có bao nhiêu ${quizData.itemName}?`)}
        className="w-full bg-white rounded-[50px] shadow-2xl p-8 flex-1 flex flex-col items-center border-[6px] border-emerald-100 relative mb-8 active:scale-[0.98] transition-transform cursor-pointer"
      >
        <p className="text-emerald-800/40 font-black mb-8 uppercase tracking-widest text-[10px] animate-pulse">Chạm để nghe câu hỏi</p>
        <div className="flex flex-wrap justify-center items-center gap-6 flex-grow content-center">
          {quizData.items.map((item, i) => (
            <span key={i} className="text-7xl drop-shadow-md animate-float" style={{animationDelay: `${i*0.2}s`}}>{item}</span>
          ))}
        </div>
      </div>
      <div className="flex gap-4 w-full">
        {quizData.options.map((opt) => (
          <button key={opt} onClick={() => handleAnswer(opt)} className="flex-1 bg-blue-500 text-white text-5xl font-black h-24 rounded-[30px] shadow-[0_8px_0_#1d4ed8] border-b-8 active:translate-y-2 active:shadow-none transition-all">{opt}</button>
        ))}
      </div>
    </div>
  );

  const renderMath = () => (
    <div className={`flex flex-col items-center min-h-screen bg-[#FFF0F5] pb-40 pt-10 px-8 animate-slide-up ${shake ? 'animate-shake' : ''}`}>
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-pink-600">LÀM TOÁN</h2>
        <div className="bg-pink-500 text-white px-5 py-1.5 rounded-full font-black text-sm">⭐ {score}</div>
      </div>
      <div 
        onClick={handleMathSpeech}
        className="w-full bg-white rounded-[50px] shadow-2xl p-10 flex-1 flex flex-col items-center border-[6px] border-pink-100 justify-center text-center mb-8 active:scale-[0.98] transition-transform cursor-pointer relative"
      >
        <p className="absolute top-6 text-pink-300 font-black uppercase tracking-widest text-[10px] animate-pulse">Chạm để nghe phép tính</p>
        <div className="text-[90px] font-black text-gray-800 leading-none mb-4">{quizData.content}</div>
        <div className="text-5xl font-black text-pink-300">= ?</div>
      </div>
      <div className="flex gap-4 w-full">
        {quizData.options.map((opt) => (
          <button key={opt} onClick={() => handleAnswer(opt)} className="flex-1 bg-pink-500 text-white text-5xl font-black h-24 rounded-[30px] shadow-[0_8px_0_#be185d] border-b-8 active:translate-y-2 active:shadow-none transition-all">{opt}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-screen bg-white flex flex-col max-w-lg mx-auto overflow-hidden">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {gameState === GameState.HOME && renderHome()}
        {gameState === GameState.LEARN_NUMBERS && renderLearnNumbers()}
        {gameState === GameState.COUNTING && renderCounting()}
        {gameState === GameState.SIMPLE_MATH && renderMath()}
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-end justify-center">
          <div className="bg-white w-full rounded-t-[50px] p-8 animate-slide-up max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-800">Cài đặt giọng đọc</h2>
              <button 
                onClick={resetVoiceSettings}
                className="text-blue-500 font-bold text-sm px-3 py-1 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                Đặt lại mặc định
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">Chọn giới tính</label>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setVoiceSettings({...voiceSettings, gender: 'female'})}
                    className={`flex-1 py-4 rounded-2xl font-black border-2 transition-all ${voiceSettings.gender === 'female' ? 'bg-pink-500 text-white border-pink-600 shadow-lg scale-105' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
                  >
                    👩 Nữ (Cô)
                  </button>
                  <button 
                    onClick={() => setVoiceSettings({...voiceSettings, gender: 'male'})}
                    className={`flex-1 py-4 rounded-2xl font-black border-2 transition-all ${voiceSettings.gender === 'male' ? 'bg-blue-500 text-white border-blue-600 shadow-lg scale-105' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
                  >
                    👨 Nam (Thầy)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">Tốc độ đọc: {voiceSettings.speed}x</label>
                <div className="flex items-center gap-4">
                  <span className="text-2xl">🐢</span>
                  <input 
                    type="range" min="0.5" max="2.0" step="0.1" 
                    value={voiceSettings.speed} 
                    onChange={(e) => setVoiceSettings({...voiceSettings, speed: parseFloat(e.target.value)})} 
                    className="flex-1 h-3 bg-gray-100 rounded-full appearance-none accent-blue-500" 
                  />
                  <span className="text-2xl">🐰</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">Âm điệu</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {id: 'cheerful', label: '😊 Vui vẻ'},
                    {id: 'soft', label: '☁️ Nhẹ nhàng'},
                    {id: 'excited', label: '🔥 Hào hứng'},
                    {id: 'normal', label: '😐 Bình thường'}
                  ].map((tone) => (
                    <button 
                      key={tone.id}
                      onClick={() => setVoiceSettings({...voiceSettings, tone: tone.id as any})}
                      className={`py-3 rounded-xl font-bold border-2 transition-all ${voiceSettings.tone === tone.id ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 items-stretch">
                <button 
                  onClick={handlePreviewVoice}
                  className="flex-1 bg-blue-50 text-blue-600 py-5 px-2 rounded-[30px] font-black text-base shadow-sm border-2 border-blue-200 active:scale-95 transition-all whitespace-nowrap flex items-center justify-center gap-1"
                >
                  <span className="text-xl">🔊</span> NGHE THỬ
                </button>
                <button 
                  onClick={() => { triggerFeedback("Đã lưu cài đặt!"); setShowSettings(false); }} 
                  className="flex-[1.5] bg-emerald-500 text-white py-5 px-4 rounded-[30px] font-black text-xl shadow-lg border-b-8 border-emerald-700 active:translate-y-2 active:border-b-0 transition-all flex items-center justify-center"
                >
                  XÁC NHẬN
                </button>
              </div>
              <button 
                  onClick={() => setShowSettings(false)} 
                  className="w-full bg-gray-100 text-gray-500 py-4 rounded-[30px] font-black text-sm active:scale-95 transition-all mt-2"
                >
                  ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-[90] max-w-lg mx-auto px-4 pb-6 pt-2 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-2xl border border-gray-100 rounded-[35px] shadow-[0_-10px_40px_rgba(0,0,0,0.12)] px-4 py-3 flex justify-around items-center pointer-events-auto">
            <NavItem state={GameState.HOME} icon="🏠" label="Nhà" color="bg-blue-500" />
            <NavItem state={GameState.LEARN_NUMBERS} icon="🔢" label="Số" color="bg-orange-500" />
            <NavItem state={GameState.COUNTING} icon="🍓" label="Đếm" color="bg-emerald-500" />
            <NavItem state={GameState.SIMPLE_MATH} icon="➕" label="Toán" color="bg-pink-500" />
          </div>
      </div>
      
      {isCorrect === true && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none">
            <div className="text-[180px] animate-bounce">🌟</div>
            <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[2px]"></div>
        </div>
      )}
    </div>
  );
};

export default App;
