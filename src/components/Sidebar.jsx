import React, { useState, useRef, useEffect } from 'react';
import { theme } from '../styles/theme.js';

export const Sidebar = ({ activeView, setActiveView, currentUser, onLogout, allUsers, onSwitchUser, onCreateNew, onDeleteAccount, userSubtitle }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuIndex, setMenuIndex] = useState(-1);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
        <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
      </svg>
    )},
    { id: 'roadmap', label: 'Roadmap', icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 4l4 1.5 6-2 4 1.5v7l-4-1.5-6 2-4-1.5V4z"/><path d="M5 5.5v7M11 3.5v7"/>
      </svg>
    )},
    { id: 'courses', label: 'Course Browser', icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 2h5a2 2 0 012 2v9a2 2 0 01-2 2H2V2z"/><path d="M14 2H9v13h5a1 1 0 001-1V3a1 1 0 00-1-1z"/>
      </svg>
    )},
    { id: 'whatif', label: 'What-If Analysis', icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="7" cy="7" r="5"/><line x1="12" y1="12" x2="15" y2="15"/>
      </svg>
    )},
  ];

  const initials = currentUser
    ? `${currentUser.firstName?.[0] ?? '?'}${currentUser.lastName?.[0] ?? '?'}`
    : '??';

  const otherUsers = allUsers.filter(u => u.id !== currentUser?.id);

  // Build flat list of menu actions for keyboard nav
  const menuActions = [
    ...otherUsers.map(u => ({ type: 'switch', user: u, label: `${u.firstName} ${u.lastName}` })),
    { type: 'create', label: 'Create New Account' },
    { type: 'logout', label: 'Log Out' },
    { type: 'delete', label: 'Delete Account' },
  ];

  const handleMenuKeyDown = (e) => {
    if (!showMenu) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setShowMenu(true);
        setMenuIndex(0);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMenuIndex(i => Math.min(i + 1, menuActions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMenuIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const action = menuActions[menuIndex];
      if (!action) return;
      if (action.type === 'switch') { onSwitchUser(action.user); setShowMenu(false); }
      else if (action.type === 'create') { onCreateNew(); setShowMenu(false); }
      else if (action.type === 'logout') { onLogout(); setShowMenu(false); }
      else if (action.type === 'delete') { onDeleteAccount(); setShowMenu(false); }
      setMenuIndex(-1);
    } else if (e.key === 'Escape') {
      setShowMenu(false);
      setMenuIndex(-1);
    }
  };

  return (
    <aside style={{
      width: '240px',
      backgroundColor: theme.colors.primary,
      minHeight: '100vh',
      padding: '24px 0',
      position: 'fixed',
      left: 0,
      top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 24px', marginBottom: '32px' }}>
        <h1 style={{
          color: 'white',
          fontSize: '1.75rem',
          fontWeight: theme.typography.weight.extrabold,
          fontFamily: theme.typography.display,
          margin: 0,
        }}>
          Compass
        </h1>
        <p style={{ color: theme.colors.secondary, fontSize: '0.75rem', margin: '4px 0 0 0' }}>
          UCSB Academic Planner
        </p>
      </div>

      {/* Navigation */}
      <nav>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '14px 24px',
              border: 'none',
              backgroundColor: activeView === item.id ? 'rgba(254, 188, 17, 0.15)' : 'transparent',
              color: activeView === item.id ? theme.colors.secondary : 'rgba(255,255,255,0.7)',
              fontSize: '0.95rem',
              fontWeight: activeView === item.id ? '600' : '400',
              cursor: 'pointer',
              textAlign: 'left',
              borderLeft: activeView === item.id ? `3px solid ${theme.colors.secondary}` : '3px solid transparent',
              transition: `all ${theme.transitions.base}`,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div ref={menuRef} style={{
        position: 'absolute',
        bottom: '24px',
        left: '24px',
        right: '24px',
      }}>
        {/* User menu popup */}
        {showMenu && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            marginBottom: '8px',
            backgroundColor: 'white',
            borderRadius: theme.radii.lg,
            boxShadow: theme.shadows.lg,
            overflow: 'hidden',
            zIndex: 100,
          }}>
            {otherUsers.length > 0 && (
              <>
                <div style={{ padding: '10px 16px', fontSize: '0.7rem', fontWeight: '600', color: theme.colors.gray[400], textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Switch Account
                </div>
                {otherUsers.map((user, idx) => (
                  <div
                    key={user.id}
                    onClick={() => { onSwitchUser(user); setShowMenu(false); setMenuIndex(-1); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 16px',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                      backgroundColor: menuIndex === idx ? theme.colors.gray[100] : 'white',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.colors.gray[100]; setMenuIndex(idx); }}
                    onMouseLeave={e => { if (menuIndex !== idx) e.currentTarget.style.backgroundColor = 'white'; }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: theme.colors.secondary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      color: theme.colors.primary,
                      fontSize: '0.65rem',
                    }}>
                      {user.firstName?.[0] ?? '?'}{user.lastName?.[0] ?? '?'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: theme.colors.gray[800] }}>
                        {user.firstName} {user.lastName}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: theme.colors.gray[500] }}>{user.student_type === 'transfer' ? 'Transfer Student' : (user.major || '')}</div>
                    </div>
                  </div>
                ))}
                <div style={{ height: '1px', backgroundColor: theme.colors.gray[200] }} />
              </>
            )}

            <div
              onClick={() => { onCreateNew(); setShowMenu(false); setMenuIndex(-1); }}
              style={{
                padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.15s',
                backgroundColor: menuIndex === otherUsers.length ? theme.colors.gray[100] : 'white',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.colors.gray[100]; setMenuIndex(otherUsers.length); }}
              onMouseLeave={e => { if (menuIndex !== otherUsers.length) e.currentTarget.style.backgroundColor = 'white'; }}
            >
              <span style={{ fontSize: '1rem' }}>+</span>
              <span style={{ fontSize: '0.85rem', color: theme.colors.gray[700], fontWeight: '500' }}>Create New Account</span>
            </div>

            <div style={{ height: '1px', backgroundColor: theme.colors.gray[200] }} />

            <div
              onClick={() => { onLogout(); setShowMenu(false); setMenuIndex(-1); }}
              style={{
                padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.15s',
                backgroundColor: menuIndex === otherUsers.length + 1 ? theme.colors.dangerSurface : 'white',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.colors.dangerSurface; setMenuIndex(otherUsers.length + 1); }}
              onMouseLeave={e => { if (menuIndex !== otherUsers.length + 1) e.currentTarget.style.backgroundColor = 'white'; }}
            >
              <span style={{ fontSize: '0.9rem' }}>&#x2192;</span>
              <span style={{ fontSize: '0.85rem', color: theme.colors.danger, fontWeight: '500' }}>Log Out</span>
            </div>

            <div style={{ height: '1px', backgroundColor: theme.colors.gray[200] }} />

            <div
              onClick={() => { onDeleteAccount(); setShowMenu(false); setMenuIndex(-1); }}
              style={{
                padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.15s',
                backgroundColor: menuIndex === otherUsers.length + 2 ? theme.colors.dangerSurface : 'white',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.colors.dangerSurface; setMenuIndex(otherUsers.length + 2); }}
              onMouseLeave={e => { if (menuIndex !== otherUsers.length + 2) e.currentTarget.style.backgroundColor = 'white'; }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={theme.colors.danger} strokeWidth="1.5" strokeLinecap="round">
                <polyline points="1 3 13 3"/><path d="M5 3V1h4v2"/><path d="M2 3l1 9a2 2 0 002 2h4a2 2 0 002-2l1-9"/>
              </svg>
              <span style={{ fontSize: '0.85rem', color: theme.colors.danger, fontWeight: '500' }}>Delete Account</span>
            </div>
          </div>
        )}

        {/* Profile button */}
        <div
          tabIndex={0}
          role="button"
          onClick={() => { setShowMenu(!showMenu); setMenuIndex(showMenu ? -1 : 0); }}
          onKeyDown={handleMenuKeyDown}
          style={{
            padding: '16px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: theme.radii.lg,
            cursor: 'pointer',
            transition: `background-color ${theme.transitions.base}`,
            outline: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: theme.colors.secondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              color: theme.colors.primary,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
                {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'User'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                {userSubtitle ?? ''}
              </div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem' }}>▲</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
