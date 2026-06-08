import { useState, useEffect, useRef, useCallback } from 'react';
import cx from 'classnames';

interface Message {
  role: 'user' | 'bot' | 'error';
  text: string;
}

const ChatHistory = ({ messages }: { messages: Message[] }) => {
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);
  return (
    <div
      ref={chatHistoryRef}
      className="h-[60vh] overflow-y-auto p-2.5 mb-5 border border-solid border-[#eee] rounded-[5px]"
    >
      {messages.length === 0 && (
        <div className="text-gray-400 text-center mt-[20vh]">
          Mulai percakapan dengan DeepSeek AI
        </div>
      )}
      {messages.map((msg, index) => (
        <div
          key={index}
          className={cx('p-2.5 my-1 rounded-[5px] max-w-[80%] wrap-break-word', {
            'bg-[#e3f2fd] ml-auto': msg.role === 'user',
            'bg-[#ffebee] text-red-500': msg.role === 'error',
            'bg-[#f5f5f5]': msg.role === 'bot',
          })}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
};

const TypingIndicator = () => (
  <div className="p-2.5 bg-[#f5f5f5] rounded-[5px] mb-2.5 text-gray-500 text-sm">
    AI thinking...
  </div>
);

const ChatInput: React.FC<{
  isProcessing: boolean;
  handleSendMessage: (value: string) => void;
}> = ({ isProcessing, handleSendMessage }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = inputValue.trim();
  const canSend = !isProcessing && trimmed.length > 0;

  const send = useCallback(() => {
    if (!canSend) return;
    handleSendMessage(trimmed);
    setInputValue('');
    // 发送后重新聚焦输入框
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [canSend, trimmed, handleSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && canSend) {
        e.preventDefault();
        send();
      }
    },
    [canSend, send],
  );

  return (
    <div className="flex gap-2.5">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ketik pesan Anda di sini..."
        disabled={isProcessing}
        autoFocus
        className="flex-1 p-2.5 border border-solid border-[#ddd] rounded-[5px] text-base
                     disabled:opacity-50 outline-none focus:border-[#2196f3] transition-colors"
      />
      <button
        onClick={send}
        disabled={!canSend}
        className="py-2.5 px-5 bg-[#2196f3] text-white border-none rounded-[5px] cursor-pointer
                     hover:bg-[#1976d2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Kirim
      </button>
    </div>
  );
};

const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const isProcessingRef = useRef(false);

  // 保持 ref 与 state 同步，避免 handleSendMessage 的闭包过期问题
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    window.electronAPI.onChatUpdate((content: string) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'bot') {
          return [...prev.slice(0, -1), { ...last, text: last.text + content }];
        }
        return [...prev, { role: 'bot', text: content }];
      });
    });
    window.electronAPI.onChatError((error: Error) => {
      setMessages((prev) => [...prev, { role: 'error', text: `Error: ${error.message || error}` }]);
      setIsTyping(false);
      setIsProcessing(false);
    });
    window.electronAPI.onChatCancelled(() => {
      setIsTyping(false);
      setIsProcessing(false);
    });
  }, []);

  const handleSendMessage = useCallback(async (value: string) => {
    if (isProcessingRef.current || !value.trim()) return;
    const message = value.trim();
    setMessages((prev) => [...prev, { role: 'user', text: message }]);
    isProcessingRef.current = true;
    setIsProcessing(true);
    setIsTyping(true);
    try {
      await window.electronAPI.startChat(message);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'error', text: `Error: ${(error as Error).message}` },
      ]);
    } finally {
      isProcessingRef.current = false;
      setIsTyping(false);
      setIsProcessing(false);
    }
  }, []);

  return { messages, isProcessing, isTyping, handleSendMessage };
};

const App = () => {
  const { messages, isProcessing, isTyping, handleSendMessage } = useChat();
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-5">
      {/* 聊天记录区域 */}
      <ChatHistory messages={messages} />
      {/* 打字指示器 */}
      {isTyping && <TypingIndicator />}
      {/* 输入区域 */}
      <ChatInput handleSendMessage={handleSendMessage} isProcessing={isProcessing} />
    </div>
  );
};

export default App;
