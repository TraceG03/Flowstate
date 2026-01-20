import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from './Header';
import Modal from './Modal';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay, parseISO, addMonths, subMonths
} from 'date-fns';

export default function CalendarView() {
  const { state, addEvent } = useApp();
  const { events, tasks } = state;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [, setSelectedDate] = useState<Date | null>(null);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    allDay: false,
    color: '#6366f1',
    recurring: 'none' as const,
    reminder: null as number | null,
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.startDate);
      return isSameDay(eventDate, day);
    });
  };

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = parseISO(task.dueDate);
      return isSameDay(taskDate, day);
    });
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setNewEvent(prev => ({
      ...prev,
      startDate: format(day, "yyyy-MM-dd'T'09:00"),
      endDate: format(day, "yyyy-MM-dd'T'10:00"),
    }));
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title) return;

    addEvent({
      title: newEvent.title,
      description: newEvent.description,
      startDate: newEvent.startDate,
      endDate: newEvent.endDate,
      allDay: newEvent.allDay,
      color: newEvent.color,
      recurring: newEvent.recurring,
      reminder: newEvent.reminder,
    });

    setNewEvent({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      allDay: false,
      color: '#6366f1',
      recurring: 'none',
      reminder: null,
    });
    setShowModal(false);
  };

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6'
  ];

  return (
    <>
      <Header
        title="Calendar"
        onAddClick={() => {
          setSelectedDate(new Date());
          setNewEvent(prev => ({
            ...prev,
            startDate: format(new Date(), "yyyy-MM-dd'T'09:00"),
            endDate: format(new Date(), "yyyy-MM-dd'T'10:00"),
          }));
          setShowModal(true);
        }}
      />
      <div className="content">
        <div className="calendar-container">
          <div className="calendar-header">
            <h2>{format(currentMonth, 'MMMM yyyy')}</h2>
            <div className="calendar-nav">
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </button>
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="calendar-grid">
            {weekDays.map(day => (
              <div key={day} className="calendar-day-header">
                {day}
              </div>
            ))}

            {days.map(day => {
              const dayEvents = getEventsForDay(day);
              const dayTasks = getTasksForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`calendar-day ${isTodayDate ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className={`calendar-day-number ${isTodayDate ? '' : ''}`}>
                    {isTodayDate ? (
                      <span style={{
                        width: 28,
                        height: 28,
                        background: 'var(--gradient-primary)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}>
                        {format(day, 'd')}
                      </span>
                    ) : (
                      format(day, 'd')
                    )}
                  </div>

                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className="calendar-event"
                      style={{ background: event.color, color: 'white' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {event.title}
                    </div>
                  ))}

                  {dayTasks.slice(0, 2 - dayEvents.length).map(task => (
                    <div
                      key={task.id}
                      className="calendar-event"
                      style={{
                        background: 'var(--bg-tertiary)',
                        border: `1px solid ${task.color}`,
                        color: 'var(--text-primary)',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {task.title}
                    </div>
                  ))}

                  {dayEvents.length + dayTasks.length > 2 && (
                    <div className="text-sm text-muted" style={{ padding: '4px 8px' }}>
                      +{dayEvents.length + dayTasks.length - 2} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showModal && (
        <Modal title="Add Event" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Event Title</label>
              <input
                type="text"
                className="input"
                placeholder="Enter event title"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea
                className="input"
                placeholder="Add description..."
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-2">
              <div className="input-group">
                <label className="input-label">Start</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={newEvent.startDate}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="input-group">
                <label className="input-label">End</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={newEvent.endDate}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Color</label>
              <div className="flex gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewEvent(prev => ({ ...prev, color }))}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: color,
                      border: newEvent.color === color ? '3px solid white' : 'none',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Recurring</label>
              <select
                className="input"
                value={newEvent.recurring}
                onChange={(e) => setNewEvent(prev => ({ ...prev, recurring: e.target.value as any }))}
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div className="modal-footer" style={{ margin: '0 -24px -24px', padding: '20px 24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Plus size={18} />
                Add Event
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
