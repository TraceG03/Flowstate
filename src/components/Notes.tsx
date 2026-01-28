import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Header from './Header';
import { Plus, FileText, Search, Trash2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Notes() {
  const { state, addNote, updateNote, deleteNote } = useApp();
  const { notes } = state;

  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFont, setCurrentFont] = useState('Inter');
  const [currentSize, setCurrentSize] = useState('16');
  const editorRef = useRef<HTMLDivElement>(null);

  const fonts = [
    'Inter',
    'Arial',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Comic Sans MS',
  ];

  const fontSizes = ['12', '14', '16', '18', '20', '24', '28', '32', '36', '48'];

  const execFormatCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleFontChange = (font: string) => {
    setCurrentFont(font);
    execFormatCommand('fontName', font);
  };

  const handleSizeChange = (size: string) => {
    setCurrentSize(size);
    // execCommand fontSize only accepts 1-7, so we use a different approach
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!range.collapsed) {
        const span = document.createElement('span');
        span.style.fontSize = `${size}px`;
        range.surroundContents(span);
      }
    }
    editorRef.current?.focus();
  };

  const handleEditorInput = () => {
    if (editorRef.current && selectedNote) {
      const content = editorRef.current.innerHTML;
      handleUpdateNote(selectedNote, { content });
    }
  };

  const currentNote = notes.find(n => n.id === selectedNote);

  // Update editor content when note changes
  useEffect(() => {
    if (editorRef.current && currentNote) {
      if (editorRef.current.innerHTML !== currentNote.content) {
        editorRef.current.innerHTML = currentNote.content;
      }
    }
  }, [selectedNote, currentNote]);

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
                  <select
                    value={currentFont}
                    onChange={(e) => handleFontChange(e.target.value)}
                    className="format-select"
                    title="Font Family"
                  >
                    {fonts.map(font => (
                      <option key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </option>
                    ))}
                  </select>

                  <select
                    value={currentSize}
                    onChange={(e) => handleSizeChange(e.target.value)}
                    className="format-select"
                    title="Font Size"
                  >
                    {fontSizes.map(size => (
                      <option key={size} value={size}>
                        {size}px
                      </option>
                    ))}
                  </select>

                  <div className="format-divider" />

                  <button
                    className="format-btn"
                    onClick={() => execFormatCommand('bold')}
                    title="Bold (Ctrl+B)"
                  >
                    <Bold size={16} />
                  </button>
                  <button
                    className="format-btn"
                    onClick={() => execFormatCommand('italic')}
                    title="Italic (Ctrl+I)"
                  >
                    <Italic size={16} />
                  </button>
                  <button
                    className="format-btn"
                    onClick={() => execFormatCommand('underline')}
                    title="Underline (Ctrl+U)"
                  >
                    <Underline size={16} />
                  </button>

                  <div className="format-divider" />

                  <button
                    className="format-btn"
                    onClick={() => execFormatCommand('justifyLeft')}
                    title="Align Left"
                  >
                    <AlignLeft size={16} />
                  </button>
                  <button
                    className="format-btn"
                    onClick={() => execFormatCommand('justifyCenter')}
                    title="Align Center"
                  >
                    <AlignCenter size={16} />
                  </button>
                  <button
                    className="format-btn"
                    onClick={() => execFormatCommand('justifyRight')}
                    title="Align Right"
                  >
                    <AlignRight size={16} />
                  </button>

                  <div className="format-divider" />

                  <button
                    className="format-btn"
                    onClick={() => execFormatCommand('insertUnorderedList')}
                    title="Bullet List"
                  >
                    <List size={16} />
                  </button>
                  <button
                    className="format-btn"
                    onClick={() => execFormatCommand('insertOrderedList')}
                    title="Numbered List"
                  >
                    <ListOrdered size={16} />
                  </button>
                </div>

                <div className="notes-editor-content">
                  <div
                    ref={editorRef}
                    className="rich-text-editor"
                    contentEditable
                    onInput={handleEditorInput}
                    data-placeholder="Start writing your note..."
                    style={{ fontFamily: currentFont }}
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
