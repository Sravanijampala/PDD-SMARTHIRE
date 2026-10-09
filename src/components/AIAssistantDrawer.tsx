import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User } from 'lucide-react';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistantDrawer({ isOpen, onClose }: AIAssistantDrawerProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: 'Hello Sravani! I am your SmartHire AI Assistant. Ask me anything about your interview preparation, ATS resume optimizations, or live mock practice sessions!'
    }
  ]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);

    // Simulated AI response
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `Great question! Based on your 82% AI Readiness Index, focusing on System Design trade-offs will push your score past 90%. Would you like to launch a 10-minute mock session for Google or Meta?`
        }
      ]);
    }, 800);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0F172A] border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-[#0B1220] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-600 rounded-xl text-white shadow-lg shadow-purple-600/30">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">SmartHire AI Assistant</h3>
            <p className="text-[11px] text-purple-300 font-medium">Real-time Interview Coach</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`p-2 rounded-xl text-xs flex-shrink-0 ${
              m.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
            }`}>
              {m.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            <div className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed ${
              m.sender === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-none'
                : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-[#0B1220] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI Assistant..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
