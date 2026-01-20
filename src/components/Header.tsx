import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Bell, Mic, MicOff, Plus, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  onAddClick?: () => void;
}

export default function Header({ title, onAddClick }: HeaderProps) {
  const { state, dispatch } = useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsRecording(false);
      };

      rec.onerror = () => {
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  const unreadReminders = state.reminders.filter(r => !r.dismissed).length;

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="header-btn"
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          style={{ display: 'none' }}
        >
          <Menu size={20} />
        </button>
        <h1 className="header-title">{title}</h1>
      </div>

      <div className="header-right">
        <div className="search-bar">
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search tasks, events, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          className={`header-btn ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
          title={isRecording ? 'Stop recording' : 'Voice input'}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button className="header-btn" style={{ position: 'relative' }}>
          <Bell size={20} />
          {unreadReminders > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                background: 'var(--color-error)',
                borderRadius: '50%',
              }}
            />
          )}
        </button>

        {onAddClick && (
          <button className="btn btn-primary" onClick={onAddClick}>
            <Plus size={18} />
            Add New
          </button>
        )}
      </div>
    </header>
  );
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
