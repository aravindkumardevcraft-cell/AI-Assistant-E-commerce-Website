import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { MessageSquare, X, Send, Sparkles, ShoppingCart, Info, ExternalLink } from 'lucide-react';

export const ChatbotWidget = () => {
  const { token, triggerLoginModal } = useAuth();
  const { addToCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Hi there! I am your AI Shopping Assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Suggested prompts
  const publicPrompts = [
    'Do you have Dove soap?',
    'Show me cleaning products under ₹500.',
    'Suggest an alternative for an unavailable product.',
    'How long does delivery take?'
  ];

  const authPrompts = [
    'Where is my order?',
    'How many loyalty points do I have?',
    'Show my recent orders.'
  ];

  const activePrompts = token ? [...publicPrompts, ...authPrompts] : publicPrompts;

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:8000/api/chatbot/query/', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ query: text })
      });

      if (response.status === 401) {
        // Authenticate if account actions are requested
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'assistant',
          text: 'This action requires authentication. Please log in first.',
          timestamp: new Date()
        }]);
        triggerLoginModal(() => {
          setMessages(prev => [...prev, {
            id: Date.now() + 2,
            sender: 'assistant',
            text: 'Great! You are logged in. Try asking your question again.',
            timestamp: new Date()
          }]);
        });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to reach AI assistant');
      }

      const data = await response.json();
      // Expecting backend response format: 
      // { text: "...", products: [...], orders: [...] }
      
      const assistantMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: data.text,
        products: data.products || [],
        orders: data.orders || [],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'assistant',
        text: 'Sorry, I encountered an error connecting to my service. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 999 }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition-normal)',
            animation: 'pulse-glow 3s infinite'
          }}
          title="Ask AI Assistant"
        >
          <MessageSquare size={26} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          width: '380px',
          height: '520px',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          animation: 'scaleIn var(--transition-normal) forwards'
        }} className="glass">
          {/* Header */}
          <div style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex'
              }}>
                <Sparkles size={16} />
              </div>
              <div>
                <h4 style={{ color: 'white', margin: 0, fontSize: '1rem', fontWeight: 600 }}>AI Store Assistant</h4>
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Online &bull; Instant Help</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{
            flexGrow: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: 'rgba(248, 250, 252, 0.5)'
          }}>
            {messages.map((msg) => (
              <div 
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'var(--surface)',
                  color: msg.sender === 'user' ? 'white' : 'var(--text)',
                  fontSize: '0.9rem',
                  boxShadow: 'var(--shadow-sm)',
                  border: msg.sender === 'user' ? 'none' : '1px solid var(--border)'
                }}>
                  {msg.text}
                </div>

                {/* Render Product Cards if returned */}
                {msg.products && msg.products.length > 0 && (
                  <div style={{
                    marginTop: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    width: '100%'
                  }}>
                    {msg.products.map((prod) => (
                      <div key={prod.id} style={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '10px',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center'
                      }}>
                        {prod.image_url && (
                          <img 
                            src={prod.image_url} 
                            alt={prod.name} 
                            style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                          />
                        )}
                        <div style={{ flexGrow: 1 }}>
                          <h5 style={{ fontSize: '0.85rem', margin: 0 }}>{prod.name}</h5>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
                            ₹{prod.variants?.[0]?.price || prod.price}
                          </span>
                        </div>
                        {prod.variants?.[0] && (
                          <button 
                            onClick={() => addToCart(prod, prod.variants[0], 1)}
                            className="btn btn-primary"
                            style={{ padding: '6px', borderRadius: '4px' }}
                            title="Add to Cart"
                          >
                            <ShoppingCart size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Render Order details if returned */}
                {msg.orders && msg.orders.length > 0 && (
                  <div style={{
                    marginTop: '8px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px',
                    width: '100%',
                    fontSize: '0.8rem'
                  }}>
                    {msg.orders.map((order) => (
                      <div key={order.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '6px' }}>
                        <div><strong>Order:</strong> #{order.id.slice(-6)}</div>
                        <div><strong>Status:</strong> <span className="badge badge-primary">{order.status}</span></div>
                        <div><strong>Total:</strong> ₹{order.total_amount}</div>
                        <div><strong>ETA:</strong> {order.delivery_eta || 'Pending confirmation'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '4px', padding: '12px' }}>
                <span className="animate-fadein" style={{ width: '6px', height: '6px', backgroundColor: 'var(--text-muted)', borderRadius: '50%' }}></span>
                <span className="animate-fadein" style={{ width: '6px', height: '6px', backgroundColor: 'var(--text-muted)', borderRadius: '50%', animationDelay: '0.2s' }}></span>
                <span className="animate-fadein" style={{ width: '6px', height: '6px', backgroundColor: 'var(--text-muted)', borderRadius: '50%', animationDelay: '0.4s' }}></span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          <div style={{
            padding: '8px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {activePrompts.map((prompt, idx) => (
              <button 
                key={idx}
                onClick={() => sendMessage(prompt)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  color: 'var(--text)'
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleFormSubmit} style={{
            display: 'flex',
            padding: '12px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--surface)'
          }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ask anything..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{ flexGrow: 1, borderRadius: 'var(--radius-full) 0 0 var(--radius-full)', padding: '10px 16px' }}
              disabled={loading}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ borderRadius: '0 var(--radius-full) var(--radius-full) 0', padding: '10px 16px' }}
              disabled={loading}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
