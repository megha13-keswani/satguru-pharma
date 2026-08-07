import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../../api/client';

export default function AdminChat() {
  const { shopId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  async function loadMessages() {
    const res = await client.get(`/chat/admin/${shopId}`);
    setMessages(res.data.messages);
    setLoading(false);
  }

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [shopId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    await client.post(`/chat/admin/${shopId}`, { body: text.trim() });
    setText('');
    await loadMessages();
    setSending(false);
  }

  if (loading) return <div className="text-center py-24 text-gray-400">Loading chat...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-120px)]">
      <Link to={`/admin/shops/${shopId}`} className="text-sm text-gray-500 hover:text-[#1A3C6E] mb-3">← Back to Shop</Link>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Shop Chat</h1>

      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl p-4 space-y-3 mb-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">No messages yet.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.senderRole === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  m.senderRole === 'ADMIN'
                    ? 'bg-[#1A3C6E] text-white rounded-br-sm'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                }`}
              >
                <p>{m.body}</p>
                <p className={`text-[10px] mt-1 ${m.senderRole === 'ADMIN' ? 'text-white/60' : 'text-gray-400'}`}>
                  {new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a reply..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C6E]/20"
        />
        <button
          type="submit"
          disabled={sending}
          className="bg-[#1A3C6E] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#142f57] transition disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}