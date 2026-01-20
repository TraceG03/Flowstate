import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from './Header';
import Modal from './Modal';
import { Plus, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format, addDays, subDays, parseISO, setHours, setMinutes } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 9 PM

export default function TimeBlocking() {
  const { state, dispatch } = useApp();
  const { tasks, events } = state;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const [newBlock, setNewBlock] = useState({
    taskId: '',
    startHour: 9,
    startMinute: 0,
    endHour: 10,
    endMinute: 0,
  });

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Get time blocks for the selected date
  const timeBlocksForDay = tasks.flatMap(task =>
    task.timeBlocks
      .filter(tb => tb.date === dateStr)
      .map(tb => ({
        ...tb,
        task,
      }))
  );

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
    setSelectedHour(hour);
    setNewBlock({
      taskId: '',
      startHour: hour,
      startMinute: 0,
      endHour: hour + 1,
      endMinute: 0,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlock.taskId) return;

    const task = tasks.find(t => t.id === newBlock.taskId);
    if (!task) return;

    const startTime = `${String(newBlock.startHour).padStart(2, '0')}:${String(newBlock.startMinute).padStart(2, '0')}`;
    const endTime = `${String(newBlock.endHour).padStart(2, '0')}:${String(newBlock.endMinute).padStart(2, '0')}`;

    dispatch({
      type: 'ADD_TIME_BLOCK',
      payload: {
        taskId: task.id,
        timeBlock: {
          id: uuidv4(),
          taskId: task.id,
          date: dateStr,
          startTime,
          endTime,
        },
      },
    });

    setShowModal(false);
  };

  const pendingTasks = tasks.filter(t => t.status !== 'done');

  return (
    <>
      <Header title="Time Blocking" />
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
              <h2>{format(selectedDate, 'EEEE')}</h2>
              <p className="text-muted">{format(selectedDate, 'MMMM d, yyyy')}</p>
            </div>
            <button
              className="btn btn-secondary btn-icon"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 300px', gap: 24 }}>
          {/* Time Grid */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="time-grid">
              {hours.map(hour => (
                <div key={hour} className="time-row">
                  <div className="time-label">
                    {format(setHours(new Date(), hour), 'h a')}
                  </div>
                  <div
                    className="time-slot"
                    onClick={() => handleHourClick(hour)}
                    style={{ minHeight: 60 }}
                  >
                    {/* Render time blocks */}
                    {timeBlocksForDay
                      .filter(tb => {
                        const blockHour = parseInt(tb.startTime.split(':')[0]);
                        return blockHour === hour;
                      })
                      .map(tb => {
                        const style = getBlockStyle(tb.startTime, tb.endTime);
                        return (
                          <div
                            key={tb.id}
                            className="time-block"
                            style={{
                              ...style,
                              background: tb.task.color,
                              position: 'relative',
                              top: 0,
                            }}
                          >
                            <div className="font-semibold">{tb.task.title}</div>
                            <div className="text-sm opacity-80">
                              {tb.startTime} - {tb.endTime}
                            </div>
                          </div>
                        );
                      })}

                    {/* Render events */}
                    {eventsForDay
                      .filter(event => {
                        const eventHour = parseISO(event.startDate).getHours();
                        return eventHour === hour;
                      })
                      .map(event => (
                        <div
                          key={event.id}
                          className="time-block"
                          style={{
                            background: event.color,
                            position: 'relative',
                            top: 0,
                          }}
                        >
                          <div className="font-semibold">{event.title}</div>
                          <div className="text-sm opacity-80">
                            {format(parseISO(event.startDate), 'h:mm a')}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks Sidebar */}
          <div>
            <div className="card mb-4">
              <h3 className="card-title mb-4">Available Tasks</h3>
              <p className="text-sm text-muted mb-4">
                Drag tasks to the calendar or click an hour to add a time block
              </p>
              <div className="flex flex-col gap-2">
                {pendingTasks.slice(0, 8).map(task => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)] cursor-pointer hover:bg-[var(--bg-hover)]"
                    onClick={() => {
                      setNewBlock(prev => ({ ...prev, taskId: task.id }));
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
              </div>
            </div>

            <div className="card">
              <h3 className="card-title mb-4">Today's Summary</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Time Blocks</span>
                  <span className="font-semibold">{timeBlocksForDay.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Events</span>
                  <span className="font-semibold">{eventsForDay.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Free Hours</span>
                  <span className="font-semibold">
                    {16 - timeBlocksForDay.length - eventsForDay.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <Modal title="Add Time Block" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Select Task</label>
              <select
                className="input"
                value={newBlock.taskId}
                onChange={(e) => setNewBlock(prev => ({ ...prev, taskId: e.target.value }))}
              >
                <option value="">Choose a task...</option>
                {pendingTasks.map(task => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
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

            <div className="modal-footer" style={{ margin: '0 -24px -24px', padding: '20px 24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Plus size={18} />
                Add Block
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
