import { useState } from 'react';
import Header from './Header';
import { Plus, FileText, Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

interface NoteItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  color: string;
}

export default function Notes() {
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    const saved = localStorage.getItem('productivityNotes');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const saveNotes = (newNotes: NoteItem[]) => {
    setNotes(newNotes);
    localStorage.setItem('productivityNotes', JSON.stringify(newNotes));
  };

  const createNote = () => {
    const newNote: NoteItem = {
      id: uuidv4(),
      title: 'Untitled Note',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      color: '#6366f1',
    };
    saveNotes([newNote, ...notes]);
    setSelectedNote(newNote.id);
  };

  const updateNote = (id: string, updates: Partial<NoteItem>) => {
    saveNotes(
      notes.map(note =>
        note.id === id
          ? { ...note, ...updates, updatedAt: new Date().toISOString() }
          : note
      )
    );
  };

  const deleteNote = (id: string) => {
    saveNotes(notes.filter(note => note.id !== id));
    if (selectedNote === id) {
      setSelectedNote(null);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentNote = notes.find(n => n.id === selectedNote);

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
                      {format(new Date(note.updatedAt), 'MMM d, h:mm a')}
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
                      onChange={(e) => updateNote(currentNote.id, { title: e.target.value })}
                      placeholder="Note title..."
                    />
                    <div className="flex gap-1">
                      {colors.map(color => (
                        <button
                          key={color}
                          onClick={() => updateNote(currentNote.id, { color })}
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
                    onClick={() => deleteNote(currentNote.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="notes-editor-content">
                  <textarea
                    value={currentNote.content}
                    onChange={(e) => updateNote(currentNote.id, { content: e.target.value })}
                    placeholder="Start writing your note..."
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
