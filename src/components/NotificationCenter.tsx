import { useState } from 'react';
import { Bell, X, CheckCircle, Target, Calendar, Clock, BellOff, BellRing } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import type { NotificationItem } from '../types';
import { format, parseISO } from 'date-fns';

export default function NotificationCenter() {
  const { 
    notifications, 
    dismissNotification, 
    permissionGranted, 
    requestPermission 
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'task':
        return <CheckCircle size={16} color="var(--color-info)" />;
      case 'goal':
        return <Target size={16} color="var(--accent-primary)" />;
      case 'event':
        return <Calendar size={16} color="var(--color-success)" />;
      case 'reminder':
        return <Clock size={16} color="var(--color-warning)" />;
      default:
        return <Bell size={16} />;
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn btn-icon btn-ghost"
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative' }}
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--color-error)',
            }}
          />
        )}
      </button>

      {isOpen && (
        <>
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              width: 360,
              maxHeight: 480,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              zIndex: 100,
            }}
          >
            <div
              style={{
                padding: '16px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16 }}>Notifications</h3>
              {!permissionGranted && (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={requestPermission}
                  style={{ fontSize: 12 }}
                >
                  <BellRing size={14} />
                  Enable
                </button>
              )}
            </div>

            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: 32,
                    textAlign: 'center',
                  }}
                >
                  <BellOff size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                  <p className="text-muted" style={{ margin: 0 }}>No notifications</p>
                  <p className="text-muted" style={{ margin: '8px 0 0', fontSize: 13 }}>
                    You'll be notified when tasks or goals are due
                  </p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {getIcon(notification.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>
                        {notification.title}
                      </p>
                      <p className="text-muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
                        {notification.message}
                      </p>
                      <p className="text-muted" style={{ margin: '4px 0 0', fontSize: 12 }}>
                        {format(parseISO(notification.timestamp), 'h:mm a')}
                      </p>
                    </div>
                    <button
                      className="btn btn-icon btn-ghost"
                      style={{ flexShrink: 0 }}
                      onClick={() => dismissNotification(notification.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {!permissionGranted && (
              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--bg-tertiary)',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <p className="text-muted" style={{ margin: 0, fontSize: 12 }}>
                  Enable browser notifications to get alerts even when the app is in the background
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
