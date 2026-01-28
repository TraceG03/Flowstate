import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Plus, Menu } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

interface HeaderProps {
  title: string;
  onAddClick?: () => void;
}

export default function Header({ title, onAddClick }: HeaderProps) {
  const { dispatch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="header-btn mobile-menu-btn"
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
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

        <NotificationCenter />

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

