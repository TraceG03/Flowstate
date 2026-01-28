import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Header from './Header';
import Modal from './Modal';
import { Plus, ChevronLeft, ChevronRight, Trash2, Clock, Calendar, GripVertical } from 'lucide-react';
import { format, addDays, subDays, parseISO, setHours, isToday } from 'date-fns';
import type { PlannerItem } from '../types';

const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM

export default function TimeBlocking() {
  const { state, addPlannerItem, updatePlannerItem, deletePlannerItem } = useApp();
  const { tasks, events, plannerItems } = state;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PlannerItem | null>(null);
  
  // Drag state - supports move, resize-top, and resize-bottom
  const [draggedItem, setDraggedItem] = useState<{
    id: string;
    originalStartTime: string;
    originalEndTime: string;
    startY: number;
    mode: 'move' | 'resize-top' | 'resize-bottom';
  } | null>(null);
  const timeGridRef = useRef<HTMLDivElement>(null);
  const justFinishedDragging = useRef(false);

  const [newBlock, setNewBlock] = useState({
    title: '',
    description: '',
    taskId: '',
    startHour: 9,
    startMinute: 0,
    endHour: 10,
    endMinute: 0,
    color: '#6366f1',
  });

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6'
  ];

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Get planner items for the selected date
  const plannerItemsForDay = plannerItems.filter(item => item.date === dateStr);

  // Get events for the selected date
  const eventsForDay = events.filter(event => {
    const eventDate = format(parseISO(event.startDate), 'yyyy-MM-dd');
    return eventDate === dateStr;
  });

  const getBlockStyle = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startOffset = (startHour - 6) * 60 + startMin;
    const duration = (endHour - startHour) * 60 + (endMin - startMin);

    const top = (startOffset / 60) * 60; // 60px per hour
    const height = Math.max((duration / 60) * 60, 30);

    return { top, height };
  };

  const handleHourClick = (hour: number) => {
    setEditingItem(null);
    setNewBlock({
      title: '',
      description: '',
      taskId: '',
      startHour: hour,
      startMinute: 0,
      endHour: hour + 1,
      endMinute: 0,
      color: '#6366f1',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlock.title.trim()) return;

    const startTime = `${String(newBlock.startHour).padStart(2, '0')}:${String(newBlock.startMinute).padStart(2, '0')}`;
    const endTime = `${String(newBlock.endHour).padStart(2, '0')}:${String(newBlock.endMinute).padStart(2, '0')}`;

    if (editingItem) {
      // Update existing item
      updatePlannerItem({
        ...editingItem,
        title: newBlock.title,
        description: newBlock.description,
        startTime,
        endTime,
        color: newBlock.color,
        taskId: newBlock.taskId || undefined,
      });
    } else {
      // Create new item
      addPlannerItem({
        title: newBlock.title,
        description: newBlock.description,
        date: dateStr,
        startTime,
        endTime,
        color: newBlock.color,
        completed: false,
        taskId: newBlock.taskId || undefined,
      });
    }

    setShowModal(false);
    setEditingItem(null);
  };

  const handleEditItem = (item: PlannerItem) => {
    const [startHour, startMinute] = item.startTime.split(':').map(Number);
    const [endHour, endMinute] = item.endTime.split(':').map(Number);
    
    setEditingItem(item);
    setNewBlock({
      title: item.title,
      description: item.description,
      taskId: item.taskId || '',
      startHour,
      startMinute,
      endHour,
      endMinute,
      color: item.color,
    });
    setShowModal(true);
  };

  const handleDeleteItem = (id: string) => {
    deletePlannerItem(id);
  };

  const handleToggleComplete = (id: string) => {
    const item = plannerItems.find(p => p.id === id);
    if (item) {
      updatePlannerItem({ ...item, completed: !item.completed });
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const completedItemsCount = plannerItemsForDay.filter(i => i.completed).length;
  const totalItemsCount = plannerItemsForDay.length;

  // Format time as HH:MM
  const formatTime = (hour: number, minute: number): string => {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  // Handle drag start for moving the entire block
  const handleDragStart = (e: React.MouseEvent, item: PlannerItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!timeGridRef.current) return;
    
    const rect = timeGridRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    setDraggedItem({
      id: item.id,
      originalStartTime: item.startTime,
      originalEndTime: item.endTime,
      startY: y,
      mode: 'move',
    });
  };

  // Handle resize from top edge (changes start time)
  const handleResizeTopStart = (e: React.MouseEvent, item: PlannerItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!timeGridRef.current) return;
    
    const rect = timeGridRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    setDraggedItem({
      id: item.id,
      originalStartTime: item.startTime,
      originalEndTime: item.endTime,
      startY: y,
      mode: 'resize-top',
    });
  };

  // Handle resize from bottom edge (changes end time)
  const handleResizeBottomStart = (e: React.MouseEvent, item: PlannerItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!timeGridRef.current) return;
    
    const rect = timeGridRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    setDraggedItem({
      id: item.id,
      originalStartTime: item.startTime,
      originalEndTime: item.endTime,
      startY: y,
      mode: 'resize-bottom',
    });
  };

  // Track pending updates during drag to avoid excessive Supabase calls
  const pendingUpdateRef = useRef<PlannerItem | null>(null);

  // Handle drag/resize with useEffect for global mouse events
  useEffect(() => {
    if (!draggedItem) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!timeGridRef.current || !draggedItem) return;
      
      const rect = timeGridRef.current.getBoundingClientRect();
      const currentY = e.clientY - rect.top;
      const deltaY = currentY - draggedItem.startY;
      
      // Calculate how many minutes moved (60px = 60 minutes = 1 hour)
      const minutesMoved = Math.round(deltaY / 15) * 15; // Snap to 15 min intervals
      
      // Parse original times
      const [origStartHour, origStartMin] = draggedItem.originalStartTime.split(':').map(Number);
      const [origEndHour, origEndMin] = draggedItem.originalEndTime.split(':').map(Number);
      const origStartMinutes = origStartHour * 60 + origStartMin;
      const origEndMinutes = origEndHour * 60 + origEndMin;
      
      let newStartTime: string;
      let newEndTime: string;

      if (draggedItem.mode === 'move') {
        // Moving the entire block - preserve duration
        const duration = origEndMinutes - origStartMinutes;
        let newStartMinutes = origStartMinutes + minutesMoved;
        
        // Clamp to valid range (6 AM to 10 PM minus duration)
        newStartMinutes = Math.max(6 * 60, Math.min(newStartMinutes, 22 * 60 - duration));
        
        const newStartHour = Math.floor(newStartMinutes / 60);
        const newStartMin = newStartMinutes % 60;
        const newEndMinutes = newStartMinutes + duration;
        const newEndHour = Math.floor(newEndMinutes / 60);
        const newEndMin = newEndMinutes % 60;
        
        newStartTime = formatTime(newStartHour, newStartMin);
        newEndTime = formatTime(newEndHour, newEndMin);
      } else if (draggedItem.mode === 'resize-top') {
        // Resizing from top - change start time, keep end time fixed
        let newStartMinutes = origStartMinutes + minutesMoved;
        
        // Clamp: minimum 6 AM, and at least 15 minutes before end time
        newStartMinutes = Math.max(6 * 60, Math.min(newStartMinutes, origEndMinutes - 15));
        
        const newStartHour = Math.floor(newStartMinutes / 60);
        const newStartMin = newStartMinutes % 60;
        
        newStartTime = formatTime(newStartHour, newStartMin);
        newEndTime = draggedItem.originalEndTime;
      } else {
        // Resizing from bottom - change end time, keep start time fixed
        let newEndMinutes = origEndMinutes + minutesMoved;
        
        // Clamp: at least 15 minutes after start time, maximum 10 PM
        newEndMinutes = Math.max(origStartMinutes + 15, Math.min(newEndMinutes, 22 * 60));
        
        const newEndHour = Math.floor(newEndMinutes / 60);
        const newEndMin = newEndMinutes % 60;
        
        newStartTime = draggedItem.originalStartTime;
        newEndTime = formatTime(newEndHour, newEndMin);
      }
      
      // Find the current item and store the pending update
      const currentItem = plannerItems.find(item => item.id === draggedItem.id);
      if (currentItem) {
        pendingUpdateRef.current = { ...currentItem, startTime: newStartTime, endTime: newEndTime };
        // Update via context (optimistic update)
        updatePlannerItem(pendingUpdateRef.current);
      }
    };

    const handleMouseUp = () => {
      if (draggedItem) {
        // Set flag to prevent click handler from opening edit modal
        justFinishedDragging.current = true;
        // Reset the flag after a short delay
        setTimeout(() => {
          justFinishedDragging.current = false;
        }, 100);
        pendingUpdateRef.current = null;
      }
      setDraggedItem(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedItem, plannerItems, updatePlannerItem]);

  return (
    <>
      <Header title="Daily Planner" onAddClick={() => handleHourClick(9)} />
      <div className="content">
        {/* Date Navigation */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <button
              className="btn btn-secondary btn-icon"
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <h2 className="flex items-center justify-center gap-2">
                {isToday(selectedDate) && (
                  <span style={{ 
                    background: 'var(--gradient-primary)', 
                    color: 'white', 
                    padding: '2px 8px', 
                    borderRadius: 4, 
                    fontSize: 12 
                  }}>
                    TODAY
                  </span>
                )}
                {format(selectedDate, 'EEEE')}
              </h2>
              <p className="text-muted">{format(selectedDate, 'MMMM d, yyyy')}</p>
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </button>
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 320px', gap: 24 }}>
          {/* Time Grid */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="time-grid" ref={timeGridRef} style={{ position: 'relative' }}>
              {/* Hour rows (background grid) */}
              {hours.map(hour => (
                <div key={hour} className="time-row" style={{ display: 'flex', minHeight: 60 }}>
                  <div className="time-label" style={{ width: 70, flexShrink: 0, padding: '8px 12px', borderRight: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: 12 }}>
                    {format(setHours(new Date(), hour), 'h a')}
                  </div>
                  <div
                    className="time-slot"
                    onClick={() => handleHourClick(hour)}
                    style={{ 
                      flex: 1, 
                      minHeight: 60, 
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                    }}
                  />
                </div>
              ))}

              {/* Planner items overlay - positioned absolutely to span multiple hours */}
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 70, 
                right: 0, 
                bottom: 0, 
                pointerEvents: 'none' 
              }}>
                {plannerItemsForDay.map(item => {
                  const style = getBlockStyle(item.startTime, item.endTime);
                  const isDragging = draggedItem?.id === item.id;
                  const isResizing = isDragging && (draggedItem?.mode === 'resize-top' || draggedItem?.mode === 'resize-bottom');
                  return (
                    <div
                      key={item.id}
                      className="time-block"
                      style={{
                        position: 'absolute',
                        top: style.top,
                        left: 4,
                        right: 4,
                        height: style.height,
                        background: item.completed ? 'var(--bg-tertiary)' : item.color,
                        opacity: item.completed ? 0.7 : isDragging ? 0.9 : 1,
                        cursor: isDragging ? (isResizing ? 'ns-resize' : 'grabbing') : 'grab',
                        pointerEvents: 'auto',
                        borderRadius: 8,
                        padding: '8px 12px',
                        color: 'white',
                        overflow: 'visible',
                        boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.2)',
                        zIndex: isDragging ? 100 : 10,
                        userSelect: 'none',
                        transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
                      }}
                      onMouseDown={(e) => handleDragStart(e, item)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        // Only open edit modal if not dragging and didn't just finish dragging
                        if (!draggedItem && !justFinishedDragging.current) {
                          handleEditItem(item);
                        }
                      }}
                    >
                      {/* Top resize handle */}
                      <div
                        onMouseDown={(e) => handleResizeTopStart(e, item)}
                        style={{
                          position: 'absolute',
                          top: -3,
                          left: 0,
                          right: 0,
                          height: 8,
                          cursor: 'ns-resize',
                          borderRadius: '8px 8px 0 0',
                          background: 'transparent',
                        }}
                        title="Drag to change start time"
                      >
                        <div style={{
                          position: 'absolute',
                          top: 3,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 30,
                          height: 3,
                          background: 'rgba(255,255,255,0.5)',
                          borderRadius: 2,
                          opacity: 0,
                          transition: 'opacity 0.2s',
                        }} className="resize-indicator" />
                      </div>

                      {/* Bottom resize handle */}
                      <div
                        onMouseDown={(e) => handleResizeBottomStart(e, item)}
                        style={{
                          position: 'absolute',
                          bottom: -3,
                          left: 0,
                          right: 0,
                          height: 8,
                          cursor: 'ns-resize',
                          borderRadius: '0 0 8px 8px',
                          background: 'transparent',
                        }}
                        title="Drag to change end time"
                      >
                        <div style={{
                          position: 'absolute',
                          bottom: 3,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 30,
                          height: 3,
                          background: 'rgba(255,255,255,0.5)',
                          borderRadius: 2,
                          opacity: 0,
                          transition: 'opacity 0.2s',
                        }} className="resize-indicator" />
                      </div>

                      {/* Content */}
                      <div style={{ overflow: 'hidden', height: '100%' }}>
                        <div className="flex items-center gap-2">
                          <GripVertical 
                            size={14} 
                            style={{ 
                              opacity: 0.6, 
                              cursor: 'grab',
                              flexShrink: 0,
                            }} 
                          />
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleComplete(item.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            style={{ cursor: 'pointer' }}
                          />
                          <span className={`font-semibold ${item.completed ? 'line-through' : ''}`} style={{ fontSize: style.height < 50 ? 12 : 14 }}>
                            {item.title}
                          </span>
                        </div>
                        {style.height >= 50 && (
                          <div className="text-sm opacity-80" style={{ fontSize: 11, marginTop: 2, marginLeft: 22 }}>
                            {item.startTime} - {item.endTime}
                          </div>
                        )}
                        {style.height >= 80 && item.description && (
                          <div className="text-sm opacity-70" style={{ fontSize: 11, marginTop: 4, marginLeft: 22 }}>
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Render events overlay */}
                {eventsForDay.map(event => {
                  const eventStart = parseISO(event.startDate);
                  const eventEnd = event.endDate ? parseISO(event.endDate) : new Date(eventStart.getTime() + 60 * 60 * 1000);
                  const startTime = format(eventStart, 'HH:mm');
                  const endTime = format(eventEnd, 'HH:mm');
                  const style = getBlockStyle(startTime, endTime);
                  
                  return (
                    <div
                      key={event.id}
                      className="time-block"
                      style={{
                        position: 'absolute',
                        top: style.top,
                        left: 4,
                        right: 4,
                        height: Math.max(style.height, 40),
                        background: event.color,
                        borderLeft: '4px solid white',
                        cursor: 'default',
                        pointerEvents: 'auto',
                        borderRadius: 8,
                        padding: '8px 12px',
                        color: 'white',
                        overflow: 'hidden',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        zIndex: 5,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span className="font-semibold" style={{ fontSize: style.height < 50 ? 12 : 14 }}>
                          {event.title}
                        </span>
                      </div>
                      {style.height >= 50 && (
                        <div className="text-sm opacity-80" style={{ fontSize: 11, marginTop: 2 }}>
                          {format(eventStart, 'h:mm a')} (Event)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Day Summary */}
            <div className="card mb-4">
              <h3 className="card-title mb-4 flex items-center gap-2">
                <Clock size={18} />
                Day Summary
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Planned Items</span>
                  <span className="font-semibold">{totalItemsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Completed</span>
                  <span className="font-semibold text-[var(--color-success)]">{completedItemsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Events</span>
                  <span className="font-semibold">{eventsForDay.length}</span>
                </div>
                {totalItemsCount > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Progress</span>
                      <span className="text-sm font-semibold">
                        {Math.round((completedItemsCount / totalItemsCount) * 100)}%
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${(completedItemsCount / totalItemsCount) * 100}%`,
                          height: '100%',
                          background: 'var(--color-success)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="card mb-4">
              <h3 className="card-title mb-4">Today's Schedule</h3>
              {plannerItemsForDay.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">
                  No items planned. Click on a time slot to add one.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {plannerItemsForDay
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)] cursor-pointer hover:bg-[var(--bg-hover)]"
                        onClick={() => handleEditItem(item)}
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleComplete(item.id);
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: item.color,
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className={`truncate ${item.completed ? 'line-through text-muted' : ''}`}>
                            {item.title}
                          </span>
                          <div className="text-xs text-muted">{item.startTime} - {item.endTime}</div>
                        </div>
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(item.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Quick Add from Tasks */}
            <div className="card">
              <h3 className="card-title mb-4">Quick Add from Tasks</h3>
              <p className="text-sm text-muted mb-4">
                Click a task to schedule it
              </p>
              <div className="flex flex-col gap-2" style={{ maxHeight: 200, overflowY: 'auto' }}>
                {pendingTasks.slice(0, 10).map(task => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)] cursor-pointer hover:bg-[var(--bg-hover)]"
                    onClick={() => {
                      setEditingItem(null);
                      setNewBlock(prev => ({ 
                        ...prev, 
                        title: task.title,
                        description: task.description,
                        taskId: task.id,
                        color: task.color,
                      }));
                      setShowModal(true);
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: task.color,
                      }}
                    />
                    <span className="flex-1 truncate">{task.title}</span>
                    <span className={`priority-badge priority-${task.priority}`} style={{ fontSize: '0.65rem' }}>
                      {task.priority}
                    </span>
                  </div>
                ))}
                {pendingTasks.length === 0 && (
                  <p className="text-sm text-muted text-center py-2">No pending tasks</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <Modal 
          title={editingItem ? "Edit Schedule Item" : "Add to Schedule"} 
          onClose={() => { setShowModal(false); setEditingItem(null); }}
        >
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Title</label>
              <input
                type="text"
                className="input"
                placeholder="What are you planning?"
                value={newBlock.title}
                onChange={(e) => setNewBlock(prev => ({ ...prev, title: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description (optional)</label>
              <textarea
                className="input"
                placeholder="Add notes..."
                value={newBlock.description}
                onChange={(e) => setNewBlock(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-2">
              <div className="input-group">
                <label className="input-label">Start Time</label>
                <div className="flex gap-2">
                  <select
                    className="input"
                    value={newBlock.startHour}
                    onChange={(e) => setNewBlock(prev => ({ ...prev, startHour: parseInt(e.target.value) }))}
                  >
                    {hours.map(h => (
                      <option key={h} value={h}>{format(setHours(new Date(), h), 'h a')}</option>
                    ))}
                  </select>
                  <select
                    className="input"
                    value={newBlock.startMinute}
                    onChange={(e) => setNewBlock(prev => ({ ...prev, startMinute: parseInt(e.target.value) }))}
                  >
                    <option value={0}>:00</option>
                    <option value={15}>:15</option>
                    <option value={30}>:30</option>
                    <option value={45}>:45</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">End Time</label>
                <div className="flex gap-2">
                  <select
                    className="input"
                    value={newBlock.endHour}
                    onChange={(e) => setNewBlock(prev => ({ ...prev, endHour: parseInt(e.target.value) }))}
                  >
                    {hours.map(h => (
                      <option key={h} value={h}>{format(setHours(new Date(), h), 'h a')}</option>
                    ))}
                  </select>
                  <select
                    className="input"
                    value={newBlock.endMinute}
                    onChange={(e) => setNewBlock(prev => ({ ...prev, endMinute: parseInt(e.target.value) }))}
                  >
                    <option value={0}>:00</option>
                    <option value={15}>:15</option>
                    <option value={30}>:30</option>
                    <option value={45}>:45</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Color</label>
              <div className="flex gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewBlock(prev => ({ ...prev, color }))}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: color,
                      border: newBlock.color === color ? '3px solid white' : 'none',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Link to Task (optional)</label>
              <select
                className="input"
                value={newBlock.taskId}
                onChange={(e) => setNewBlock(prev => ({ ...prev, taskId: e.target.value }))}
              >
                <option value="">No linked task</option>
                {pendingTasks.map(task => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
            </div>

            <div className="modal-footer" style={{ margin: '0 -24px -24px', padding: '20px 24px' }}>
              {editingItem && (
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  style={{ marginRight: 'auto', color: 'var(--color-error)' }}
                  onClick={() => {
                    handleDeleteItem(editingItem.id);
                    setShowModal(false);
                    setEditingItem(null);
                  }}
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              )}
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => { setShowModal(false); setEditingItem(null); }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Plus size={18} />
                {editingItem ? 'Save Changes' : 'Add to Schedule'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
