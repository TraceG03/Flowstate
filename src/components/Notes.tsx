import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Header from './Header';
import { Plus, FileText, Search, Trash2, List, Minus } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Notes() {
  const { state, addNote, updateNote, deleteNote } = useApp();
  const { notes } = state;

  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fontSize, setFontSize] = useState('16');
  const [lineSpacing, setLineSpacing] = useState('1.7');
  const [textColor, setTextColor] = useState('#f0f2f5');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fontSizes = ['12', '14', '16', '18', '20', '24', '28', '32'];
  const textColors = [
    { label: 'Default', value: '#f0f2f5' },
    { label: 'White', value: '#ffffff' },
    { label: 'Gray', value: '#9ca3af' },
    { label: 'Red', value: '#ef4444' },
    { label: 'Orange', value: '#f97316' },
    { label: 'Yellow', value: '#eab308' },
    { label: 'Green', value: '#22c55e' },
    { label: 'Blue', value: '#3b82f6' },
    { label: 'Purple', value: '#8b5cf6' },
    { label: 'Pink', value: '#ec4899' },
  ];
  const lineSpacings = [
    { label: 'Compact', value: '1.3' },
    { label: 'Normal', value: '1.7' },
    { label: 'Relaxed', value: '2.0' },
    { label: 'Loose', value: '2.5' },
  ];

  const insertBulletPoint = () => {
    if (!textareaRef.current || !selectedNote) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    // Check if we're at the start of a line
    const beforeCursor = text.substring(0, start);
    const lineStart = beforeCursor.lastIndexOf('\n') + 1;
    const currentLineStart = text.substring(lineStart, start);
    
    let newText: string;
    let newCursorPos: number;
    
    if (currentLineStart.trim() === '' && start === lineStart) {
      // At the start of a line, add bullet
      newText = text.substring(0, start) + '• ' + text.substring(end);
      newCursorPos = start + 2;
    } else {
      // In the middle of text, add new line with bullet
      newText = text.substring(0, start) + '\n• ' + text.substring(end);
      newCursorPos = start + 3;
    }
    
    handleUpdateNote(selectedNote, { content: newText });
    
    // Set cursor position after React re-renders
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const currentNote = notes.find(n => n.id === selectedNote);

  const createNote = () => {
    addNote({
      title: 'Untitled Note',
      content: '',
      color: '#6366f1',
    });
  };

  const handleUpdateNote = (id: string, updates: { title?: string; content?: string; color?: string }) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      updateNote({
        ...note,
        ...updates,
      });
    }
  };

  const handleDeleteNote = (id: string) => {
    deleteNote(id);
    if (selectedNote === id) {
      setSelectedNote(null);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6'
  ];

  return (
    <>
      <Header title="Notes" onAddClick={createNote} />
      <div className="content">
        <div className="notes-container">
          {/* Notes List */}
          <div className="notes-list">
            <div className="notes-list-header">
              <div className="search-bar" style={{ width: '100%' }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="notes-list-items">
              {filteredNotes.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center' }}>
                  <FileText size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                  <p className="text-muted">No notes yet</p>
                  <button
                    className="btn btn-primary mt-4"
                    onClick={createNote}
                  >
                    <Plus size={16} />
                    Create Note
                  </button>
                </div>
              ) : (
                filteredNotes.map(note => (
                  <div
                    key={note.id}
                    className={`note-preview ${selectedNote === note.id ? 'active' : ''}`}
                    onClick={() => setSelectedNote(note.id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: note.color,
                        }}
                      />
                      <h4 className="font-semibold truncate flex-1">{note.title}</h4>
                    </div>
                    <p className="text-sm text-muted truncate">
                      {note.content || 'No content'}
                    </p>
                    <p className="text-sm text-muted mt-1">
                      {format(parseISO(note.updatedAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notes Editor */}
          <div className="notes-editor">
            {currentNote ? (
              <>
                <div className="notes-editor-header">
                  <div className="flex items-center gap-4 flex-1">
                    <input
                      type="text"
                      className="input"
                      style={{ fontSize: '1.2rem', fontWeight: 600 }}
                      value={currentNote.title}
                      onChange={(e) => handleUpdateNote(currentNote.id, { title: e.target.value })}
                      placeholder="Note title..."
                    />
                    <div className="flex gap-1">
                      {colors.map(color => (
                        <button
                          key={color}
                          onClick={() => handleUpdateNote(currentNote.id, { color })}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            background: color,
                            border: currentNote.color === color ? '2px solid white' : 'none',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-icon"
                    onClick={() => handleDeleteNote(currentNote.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {/* Formatting Toolbar */}
                <div className="notes-formatting-toolbar">
                  <div className="format-group">
                    <label className="format-label">Size</label>
                    <select
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value)}
                      className="format-select"
                      title="Font Size"
                    >
                      {fontSizes.map(size => (
                        <option key={size} value={size}>
                          {size}px
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="format-group">
                    <label className="format-label">Spacing</label>
                    <select
                      value={lineSpacing}
                      onChange={(e) => setLineSpacing(e.target.value)}
                      className="format-select"
                      title="Line Spacing"
                    >
                      {lineSpacings.map(spacing => (
                        <option key={spacing.value} value={spacing.value}>
                          {spacing.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="format-group">
                    <label className="format-label">Color</label>
                    <select
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="format-select"
                      title="Text Color"
                      style={{ color: textColor }}
                    >
                      {textColors.map(color => (
                        <option key={color.value} value={color.value} style={{ color: color.value }}>
                          {color.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="format-divider" />

                  <button
                    className="format-btn"
                    onClick={insertBulletPoint}
                    title="Insert Bullet Point"
                  >
                    <List size={16} />
                  </button>
                  <button
                    className="format-btn"
                    onClick={() => {
                      if (textareaRef.current && selectedNote) {
                        const textarea = textareaRef.current;
                        const start = textarea.selectionStart;
                        const text = textarea.value;
                        const newText = text.substring(0, start) + '—' + text.substring(start);
                        handleUpdateNote(selectedNote, { content: newText });
                        setTimeout(() => {
                          textarea.focus();
                          textarea.setSelectionRange(start + 1, start + 1);
                        }, 0);
                      }
                    }}
                    title="Insert Dash"
                  >
                    <Minus size={16} />
                  </button>
                </div>

                <div className="notes-editor-content">
                  <textarea
                    ref={textareaRef}
                    value={currentNote.content}
                    onChange={(e) => handleUpdateNote(currentNote.id, { content: e.target.value })}
                    placeholder="Start writing your note..."
                    style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: lineSpacing,
                      color: textColor,
                    }}
                  />
                </div>
              </>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <FileText size={64} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                <h3 className="mb-2">Select a note</h3>
                <p className="text-muted mb-4">Choose a note from the sidebar or create a new one</p>
                <button className="btn btn-primary" onClick={createNote}>
                  <Plus size={18} />
                  New Note
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
