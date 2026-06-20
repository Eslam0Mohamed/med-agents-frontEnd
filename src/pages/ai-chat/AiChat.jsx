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
      const assistantMessage = res.data;
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            language === 'ar'
              ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.'
              : 'Sorry, something went wrong. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = () =>
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white text-lg">
            🤖
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">Clinical Intelligence Assistant</h1>
            <p className="text-xs text-gray-500">AI-powered medical chat</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 rounded-md text-xs font-medium ${
              language === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('ar')}
            className={`px-3 py-1 rounded-md text-xs font-medium ${
              language === 'ar' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            AR
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-sm">
              {language === 'ar'
                ? 'اسأل عن حالة سريرية، تفاعلات أدوية، أو إرشادات طبية...'
                : 'Ask about a clinical case, drug interactions, or guidelines...'}
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xl rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
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
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              language === 'ar'
                ? 'اسأل عن بيانات المريض أو تفاعلات الأدوية...'
                : 'Ask about patient data, drug interactions, or guidelines...'
            }
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 transition"
          >
            {language === 'ar' ? 'إرسال' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          🔒 {language === 'ar' ? 'مشفر' : 'Encrypted'} · ⚕️ {language === 'ar' ? 'إجابات مبنية على مصادر طبية' : 'Evidence-based responses'}
        </p>
      </div>
    </div>
  );
}