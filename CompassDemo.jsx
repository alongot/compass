import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './src/lib/supabase.js';

// Components
import { ProfileWizard } from './src/components/ProfileWizard.jsx';
import { LoginScreen } from './src/components/LoginScreen.jsx';
import { Sidebar } from './src/components/Sidebar.jsx';
import { DashboardView } from './src/components/DashboardView.jsx';
import { WhatIfView } from './src/components/WhatIfView.jsx';
import { RoadmapView } from './src/components/RoadmapView.jsx';
import { CourseBrowserView } from './src/components/CourseBrowserView.jsx';
import { LoadingScreen } from './src/components/LoadingScreen.jsx';
import { TransferView } from './src/components/TransferView.jsx';

// Data and utilities
import { MAJOR_CONFIGS } from './src/data/demo/majorConfigs.js';
import { getMajorId, buildKnownCourses, extractCourseId } from './src/utils/courseUtils.js';
import { buildUserRequirements, buildUserQuarterPlan } from './src/utils/requirementsUtils.js';
import { useMajorRequirements } from './src/hooks/useMajorRequirements.js';

const API_BASE = '';

// Persist a user object to the server (fire-and-forget; local state is source of truth)
async function saveUser(user) {
  try {
    await fetch(`${API_BASE}/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
  } catch (_) {}
}

export default function CompassDemo() {
  const [activeView, setActiveView] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [userRequirements, setUserRequirements] = useState(null);
  const [userQuarterPlan, setUserQuarterPlan] = useState([]);

  // Derive major from current user, then fetch live Supabase data for it
  const majorId = getMajorId(currentUser);
  const { requirements: baseRequirements } = useMajorRequirements(majorId);

  // Boot: fetch users on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/users`)
      .then(res => res.json())
      .then(users => {
        setAllUsers(users);
        const lastId = localStorage.getItem('compass_last_user_id');
        const lastUser = users.find(u => u.id === lastId);
        if (lastUser) {
          setCurrentUser(lastUser);
        } else if (users.length > 0) {
          setCurrentUser(users[0]);
        } else {
          setShowWizard(true);
        }
        setIsLoading(false);
      })
      .catch(() => { setShowWizard(true); setIsLoading(false); });
  }, []);

  // Recompute requirements and quarter plan when user or major changes / Supabase data loads
  useEffect(() => {
    if (currentUser) {
      const config = MAJOR_CONFIGS[majorId] ?? MAJOR_CONFIGS.econ_ba;
      const reqs = buildUserRequirements(baseRequirements ?? config.requirements, currentUser.transcript);
      setUserRequirements(reqs);
      const tempKnown = buildKnownCourses(reqs, config.defaultQuarterPlan);
      const plan = buildUserQuarterPlan(config.defaultQuarterPlan, currentUser.transcript, currentUser.currentQuarter, tempKnown);
      setUserQuarterPlan(plan.length > 0 ? plan : config.defaultQuarterPlan);
      localStorage.setItem('compass_last_user_id', currentUser.id);
    }
  }, [currentUser, baseRequirements]); // eslint-disable-line react-hooks/exhaustive-deps

  // Flat list of known courses for autocomplete/lookup
  const userKnownCourses = useMemo(() => {
    const config = MAJOR_CONFIGS[majorId] ?? MAJOR_CONFIGS.econ_ba;
    return buildKnownCourses(userRequirements ?? config.requirements, userQuarterPlan ?? config.defaultQuarterPlan);
  }, [userRequirements, userQuarterPlan, majorId]);

  const handleWizardComplete = (user) => {
    setCurrentUser(user);
    setAllUsers(prev => [...prev, user]);
    setShowWizard(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('compass_last_user_id');
  };

  const handleSwitchUser = (user) => { setCurrentUser(user); };
  const handleCreateNew = () => { setCurrentUser(null); setShowWizard(true); };
  const handleSelectUser = (user) => { setCurrentUser(user); };

  const handleAddCourse = async ({ course, grade, units }) => {
    if (!currentUser) return;
    const updated = structuredClone(currentUser);
    if (!updated.transcript) updated.transcript = { completed: [], in_progress: [] };
    if (!updated.transcript.completed) updated.transcript.completed = [];
    if (updated.transcript.completed.some(c => extractCourseId(c.course) === course)) return;
    updated.transcript.completed.push({ course, grade, units });
    await saveUser(updated);
    setCurrentUser(updated);
  };

  const handleRemoveCourse = async (courseId, type) => {
    if (!currentUser) return;
    const updated = structuredClone(currentUser);
    if (!updated.transcript) return;
    const key = type === 'completed' ? 'completed' : 'in_progress';
    updated.transcript[key] = (updated.transcript[key] || []).filter(c => extractCourseId(c.course) !== courseId);
    await saveUser(updated);
    setCurrentUser(updated);
  };

  const handleEditCourseGrade = async (courseId, newGrade) => {
    if (!currentUser) return;
    const updated = structuredClone(currentUser);
    if (!updated.transcript?.completed) return;
    const course = updated.transcript.completed.find(c => extractCourseId(c.course) === courseId);
    if (course) course.grade = newGrade;
    await saveUser(updated);
    setCurrentUser(updated);
  };

  const handleMarkComplete = async (courseId, grade) => {
    if (!currentUser) return;
    const updated = structuredClone(currentUser);
    if (!updated.transcript) return;
    updated.transcript.in_progress = (updated.transcript.in_progress || []).filter(c => extractCourseId(c.course) !== courseId);
    if (!updated.transcript.completed) updated.transcript.completed = [];
    if (!updated.transcript.completed.some(c => extractCourseId(c.course) === courseId)) {
      const known = userKnownCourses.find(k => k.id === courseId);
      updated.transcript.completed.push({ course: courseId, grade, units: known?.units || 4 });
    }
    await saveUser(updated);
    setCurrentUser(updated);
  };

  const handleAddInProgress = async (courseId) => {
    if (!currentUser) return;
    const updated = structuredClone(currentUser);
    if (!updated.transcript) updated.transcript = { completed: [], in_progress: [] };
    if (!updated.transcript.in_progress) updated.transcript.in_progress = [];
    if (updated.transcript.in_progress.some(c => extractCourseId(c.course) === courseId)) return;
    const known = userKnownCourses.find(k => k.id === courseId);
    updated.transcript.in_progress.push({ course: courseId, units: known?.units || 4 });
    await saveUser(updated);
    setCurrentUser(updated);
  };

  const handleEndQuarter = async (gradeMap, nextCourseIds) => {
    if (!currentUser) return;
    const updated = structuredClone(currentUser);
    if (!updated.transcript) updated.transcript = { completed: [], in_progress: [] };

    // Graduate all in-progress courses with their grades
    for (const [courseId, grade] of Object.entries(gradeMap)) {
      updated.transcript.in_progress = updated.transcript.in_progress.filter(
        c => extractCourseId(c.course) !== courseId
      );
      if (!updated.transcript.completed.some(c => extractCourseId(c.course) === courseId)) {
        const known = userKnownCourses.find(k => k.id === courseId);
        updated.transcript.completed.push({ course: courseId, grade, units: known?.units || 4 });
      }
    }

    // Enroll in next quarter courses
    for (const courseId of nextCourseIds) {
      if (!updated.transcript.in_progress.some(c => extractCourseId(c.course) === courseId)) {
        const known = userKnownCourses.find(k => k.id === courseId);
        updated.transcript.in_progress.push({ course: courseId, units: known?.units || 4 });
      }
    }

    await saveUser(updated);
    setCurrentUser(updated);
  };

  const handleUserUpdate = (updated) => {
    setCurrentUser(updated);
    setAllUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    if (!window.confirm(`Delete account for ${currentUser.firstName} ${currentUser.lastName}? This cannot be undone.`)) return;
    const deletedId = currentUser.id;
    try { await fetch(`${API_BASE}/api/users/${deletedId}`, { method: 'DELETE' }); } catch (_) {}
    const remaining = allUsers.filter(u => u.id !== deletedId);
    setAllUsers(remaining);
    localStorage.removeItem('compass_last_user_id');
    if (remaining.length > 0) { setCurrentUser(remaining[0]); }
    else { setCurrentUser(null); setShowWizard(true); }
  };

  if (isLoading) return <LoadingScreen />;
  if (showWizard) return <ProfileWizard onComplete={handleWizardComplete} />;
  if (!currentUser && allUsers.length > 0) {
    return <LoginScreen users={allUsers} onSelectUser={handleSelectUser} onCreateNew={() => setShowWizard(true)} />;
  }
  if (!currentUser) return <ProfileWizard onComplete={handleWizardComplete} />;
  if (!userRequirements) return <LoadingScreen />;

  const renderView = () => {
    const dashProps = { user: currentUser, requirements: userRequirements, quarterPlan: userQuarterPlan, onAddCourse: handleAddCourse, onRemoveCourse: handleRemoveCourse, onEditCourseGrade: handleEditCourseGrade, onAddInProgress: handleAddInProgress, onMarkComplete: handleMarkComplete, onEndQuarter: handleEndQuarter, knownCourses: userKnownCourses, onUserUpdate: handleUserUpdate };
    switch (activeView) {
      case 'dashboard': return <DashboardView {...dashProps} />;
      case 'roadmap': return <RoadmapView user={currentUser} requirements={userRequirements} quarterPlan={userQuarterPlan} prereqEdges={MAJOR_CONFIGS[majorId]?.prereqEdges ?? []} />;
      case 'courses': return <CourseBrowserView requirements={userRequirements} majorId={majorId} />;
      case 'whatif': return <WhatIfView user={currentUser} requirements={userRequirements} />;
      case 'transfer': return <TransferView majorRequirements={MAJOR_CONFIGS[getMajorId(currentUser)]?.requirements} />;
      default: return <DashboardView {...dashProps} />;
    }
  };

  const userSubtitle = currentUser?.student_type === 'transfer'
    ? (MAJOR_CONFIGS[currentUser.target_major_id]?.name
        ? `Transfer to ${MAJOR_CONFIGS[currentUser.target_major_id].name}`
        : 'Transfer Student')
    : (currentUser?.major || '');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <Sidebar activeView={activeView} setActiveView={setActiveView} currentUser={currentUser} onLogout={handleLogout} allUsers={allUsers} onSwitchUser={handleSwitchUser} onCreateNew={handleCreateNew} onDeleteAccount={handleDeleteAccount} userSubtitle={userSubtitle} />
      <main style={{ marginLeft: '240px', padding: '32px 48px' }}>
        {renderView()}
      </main>
    </div>
  );
}
