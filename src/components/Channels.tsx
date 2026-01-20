import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Header from './Header';
import Modal from './Modal';
import { Hash, Send, Plus, Settings, Users } from 'lucide-react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export default function Channels() {
  const { state, dispatch } = useApp();
  const { channels } = state;

  const [selectedChannel, setSelectedChannel] = useState(channels[0]?.id || null);
  const [messageInput, setMessageInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newChannel, setNewChannel] = useState({
    name: '',
    description: '',
    color: '#6366f1',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentChannel = channels.find(c => c.id === selectedChannel);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChannel?.messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChannel) return;

    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        channelId: selectedChannel,
        message: {
          id: uuidv4(),
          content: messageInput,
          author: 'You',
          createdAt: new Date().toISOString(),
          attachments: [],
        },
      },
    });

    setMessageInput('');
  };

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannel.name.trim()) return;

    dispatch({
      type: 'ADD_CHANNEL',
      payload: {
        id: uuidv4(),
        name: newChannel.name,
        description: newChannel.description,
        color: newChannel.color,
        messages: [],
      },
    });

    setNewChannel({ name: '', description: '', color: '#6366f1' });
    setShowModal(false);
  };

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6'
  ];

  return (
    <>
      <Header title="Channels" onAddClick={() => setShowModal(true)} />
      <div className="content">
        <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 200px)' }}>
          {/* Channel List */}
          <div style={{ width: 280 }}>
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="card-title">Channels</h3>
                <button
                  className="btn btn-secondary btn-icon"
                  onClick={() => setShowModal(true)}
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="channel-list flex-1">
                {channels.map(channel => (
                  <div
                    key={channel.id}
                    className={`channel-item ${selectedChannel === channel.id ? 'active' : ''}`}
                    onClick={() => setSelectedChannel(channel.id)}
                  >
                    <div
                      className="channel-icon"
                      style={{ background: channel.color }}
                    >
                      <Hash size={18} color="white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{channel.name}</div>
                      <div className="text-sm text-muted truncate">
                        {channel.messages.length} messages
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div style={{ flex: 1 }}>
            {currentChannel ? (
              <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}>
                {/* Channel Header */}
                <div style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: currentChannel.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Hash size={20} color="white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{currentChannel.name}</h3>
                    <p className="text-sm text-muted">{currentChannel.description}</p>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                  {currentChannel.messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 48 }}>
                      <Hash size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                      <h3 className="mb-2">Welcome to #{currentChannel.name}</h3>
                      <p className="text-muted">
                        This is the start of the channel. Send a message to get started!
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {currentChannel.messages.map(message => (
                        <div key={message.id} className="flex gap-3">
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              background: 'var(--gradient-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 600,
                              flexShrink: 0,
                            }}
                          >
                            {message.author[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{message.author}</span>
                              <span className="text-sm text-muted">
                                {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            <p style={{ marginTop: 4 }}>{message.content}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div style={{
                  padding: '16px 24px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  gap: 12,
                }}>
                  <input
                    type="text"
                    className="input"
                    placeholder={`Message #${currentChannel.name}`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button className="btn btn-primary" onClick={handleSendMessage}>
                    <Send size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="card" style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}>
                <Hash size={64} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                <h3 className="mb-2">No Channel Selected</h3>
                <p className="text-muted">Select a channel from the sidebar to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <Modal title="Create Channel" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreateChannel}>
            <div className="input-group">
              <label className="input-label">Channel Name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., project-updates"
                value={newChannel.name}
                onChange={(e) => setNewChannel(prev => ({ ...prev, name: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea
                className="input"
                placeholder="What's this channel about?"
                value={newChannel.description}
                onChange={(e) => setNewChannel(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Color</label>
              <div className="flex gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewChannel(prev => ({ ...prev, color }))}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: color,
                      border: newChannel.color === color ? '3px solid white' : 'none',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="modal-footer" style={{ margin: '0 -24px -24px', padding: '20px 24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Plus size={18} />
                Create Channel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
