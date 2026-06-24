import { useState, useRef, useEffect } from 'react';
import { sendMedicalChat } from '../../api/aiChat';

export default function AiChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    try {
      const res = await sendMedicalChat(newMessages, language);
      setMessages((prev) => [...prev, res.data]);
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: language === 'ar' ? 'عذراً، حدث خطأ.' : 'Sorry, something went wrong.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white text-base sm:text-lg">
            🤖
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-semibold text-gray-900">Clinical Intelligence Assistant</h1>
            <p className="text-xs text-gray-500 hidden sm:block">AI-powered medical chat</p>
          </div>
        </div>
        <div className="flex items-center bg-gray-100 rounded-md p-0.5">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 rounded text-xs font-medium ${language === 'en' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >EN</button>
          <button
            onClick={() => setLanguage('ar')}
            className={`px-2.5 py-1 rounded text-xs font-medium ${language === 'ar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >AR</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-16 sm:mt-20 px-4">
            <p className="text-sm">
              {language === 'ar' ? 'اسأل عن حالة سريرية أو تفاعلات أدوية...' : 'Ask about a clinical case, drug interactions, or guidelines...'}
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs sm:max-w-xl rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-400">
              {language === 'ar' ? 'جاري الكتابة...' : 'Thinking...'}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === 'ar' ? 'اسأل عن الأدوية أو الحالات...' : 'Ask about patient data, drug interactions...'}
            className="flex-1 border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 transition"
          >
            {language === 'ar' ? 'إرسال' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center hidden sm:block">
          🔒 {language === 'ar' ? 'مشفر' : 'Encrypted'} · ⚕️ {language === 'ar' ? 'إجابات مبنية على مصادر طبية' : 'Evidence-based responses'}
        </p>
      </div>
    </div>
  );
}