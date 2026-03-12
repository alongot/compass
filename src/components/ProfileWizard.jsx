import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { theme } from '../styles/theme.js';
import { MAJOR_CONFIGS } from '../data/demo/majorConfigs.js';
import { buildKnownCourses, extractCourseId } from '../utils/courseUtils.js';
import { useDeptCourses } from '../hooks/useDeptCourses.js';
import { SearchableSelect } from './shared/SearchableSelect.jsx';
import { useInstitutions, useArticulations } from '../hooks/useArticulations.js';

const API_BASE = '';

const schoolOptions = [
  { id: 'ucsb', name: 'University of California Santa Barbara (UCSB)' },
];

const majorOptions = Object.entries(MAJOR_CONFIGS).map(([id, cfg]) => ({ id, name: cfg.name }));

export const ProfileWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [studentType, setStudentType] = useState(null); // 'ucsb' | 'transfer'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [school, setSchool] = useState(null);
  const [major, setMajor] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadError, setUploadError] = useState('');
  const [manualCourses, setManualCourses] = useState([]);
  const [manualInput, setManualInput] = useState('');
  const [manualGrade, setManualGrade] = useState('A');
  const [manualUnits, setManualUnits] = useState('4');
  const [showManualSuggestions, setShowManualSuggestions] = useState(false);
  const [manualSuggestionIndex, setManualSuggestionIndex] = useState(-1);
  const manualInputRef = useRef(null);
  const manualSuggestionsRef = useRef(null);
  const [transcriptMode, setTranscriptMode] = useState(null); // 'upload' | 'manual' | null
  const [currentQuarterName, setCurrentQuarterName] = useState('Winter 2026');
  const [currentQtrCourses, setCurrentQtrCourses] = useState([]);
  const [currentQtrInput, setCurrentQtrInput] = useState('');
  const [showQtrSuggestions, setShowQtrSuggestions] = useState(false);
  const [qtrSuggestionIndex, setQtrSuggestionIndex] = useState(-1);
  const qtrInputRef = useRef(null);
  const qtrSuggestionsRef = useRef(null);

  // Transfer-specific state
  const [transferInstitution, setTransferInstitution] = useState(null); // { id, name, short_name }
  const [transferTargetMajor, setTransferTargetMajor] = useState(null); // { id, name }
  const [transferCompleted, setTransferCompleted] = useState([]); // [{ course, grade, units }]
  const [transferInProgress, setTransferInProgress] = useState([]); // [{ course, units }]
  const [transferCourseInput, setTransferCourseInput] = useState('');
  const [transferCourseGrade, setTransferCourseGrade] = useState('A');
  const [transferCourseUnits, setTransferCourseUnits] = useState(3);
  const [showTransferSuggestions, setShowTransferSuggestions] = useState(false);
  const [transferSuggestionIndex, setTransferSuggestionIndex] = useState(-1);
  const transferSuggestionsRef = useRef(null);
  const [transferCurrentInput, setTransferCurrentInput] = useState('');
  const [transferCurrentUnits, setTransferCurrentUnits] = useState(3);
  const [showTransferCurrentSuggestions, setShowTransferCurrentSuggestions] = useState(false);
  const [transferCurrentSuggestionIndex, setTransferCurrentSuggestionIndex] = useState(-1);
  const transferCurrentSuggestionsRef = useRef(null);

  // Hook calls for transfer path
  const { institutions } = useInstitutions();
  const { articulations } = useArticulations(transferInstitution?.id ?? null);

  // Enter key support for Continue button
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'Enter') return;
      // If no student type selected yet, Enter does nothing
      if (step === 1 && studentType === null) return;
      if (step === 1 && firstName.trim() && lastName.trim()) {
        setStep(2);
      } else if (step === 2 && studentType === 'ucsb' && school && major && e.target.tagName !== 'INPUT') {
        setStep(3);
      } else if (step === 2 && studentType === 'transfer' && transferInstitution && transferTargetMajor && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
        setStep(3);
      } else if (step === 3 && studentType === 'ucsb' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
        setStep(4);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, studentType, firstName, lastName, school, major, transferInstitution, transferTargetMajor]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadStatus('uploading');
    setUploadError('');

    const formData = new FormData();
    formData.append('transcript', file);

    try {
      const res = await fetch(`${API_BASE}/api/transcript/parse`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }
      const data = await res.json();
      setTranscript(data);
      setUploadStatus('success');
    } catch (err) {
      setUploadError(err.message);
      setUploadStatus('error');
    }
  };

  const addManualCourse = () => {
    if (!manualInput.trim()) return;
    setManualCourses(prev => [...prev, {
      course: manualInput.trim(),
      grade: manualGrade,
      units: parseFloat(manualUnits) || 4,
      quarter: 'Manual Entry',
    }]);
    setManualInput('');
    setShowManualSuggestions(false);
    setManualSuggestionIndex(-1);
  };

  const removeManualCourse = (index) => {
    setManualCourses(prev => prev.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    let transcriptData = transcript;
    if (!transcriptData && manualCourses.length > 0) {
      transcriptData = {
        completed: manualCourses,
        failed: [],
        withdrawn: [],
        in_progress: [],
      };
    }
    if (!transcriptData) {
      transcriptData = { completed: [], failed: [], withdrawn: [], in_progress: [] };
    }

    // Merge current-quarter courses into in_progress (avoiding duplicates)
    const existingInProgressIds = new Set(
      (transcriptData.in_progress || []).map(c => extractCourseId(c.course))
    );
    const newInProgress = [
      ...(transcriptData.in_progress || []),
      ...currentQtrCourses
        .filter(id => !existingInProgressIds.has(id))
        .map(id => ({ course: id, units: 4 })),
    ];
    transcriptData = { ...transcriptData, in_progress: newInProgress };

    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          school: school.name,
          major: major.name,
          majorId: major.id,
          currentQuarter: currentQtrCourses.length > 0 ? currentQuarterName : null,
          transcript: transcriptData,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('Failed to create user:', errData.error || res.status);
        return;
      }
      const user = await res.json();
      localStorage.setItem('compass_last_user_id', user.id);
      onComplete(user);
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  const handleTransferComplete = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          student_type: 'transfer',
          source_institution_id: transferInstitution.id,
          target_major_id: transferTargetMajor.id,
          transcript: {
            completed: transferCompleted,
            in_progress: transferInProgress,
            failed: [],
            withdrawn: [],
          },
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('Failed to create transfer user:', errData.error || res.status);
        return;
      }
      const user = await res.json();
      localStorage.setItem('compass_last_user_id', user.id);
      onComplete(user);
    } catch (err) {
      console.error('Failed to create transfer user:', err);
    }
  };

  const cardStyle = {
    maxWidth: '520px',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: theme.radii.xl,
    padding: theme.spacing[12],
    boxShadow: theme.shadows.lg,
  };

  const btnStyle = (enabled) => ({
    padding: '14px 32px',
    borderRadius: theme.radii.lg,
    border: 'none',
    backgroundColor: enabled ? theme.colors.primary : theme.colors.gray[200],
    color: enabled ? 'white' : theme.colors.gray[400],
    fontSize: '1rem',
    fontWeight: '600',
    cursor: enabled ? 'pointer' : 'default',
    transition: `all ${theme.transitions.base}`,
  });

  const backBtn = (
    <button
      onClick={() => {
        if (step === 1) {
          // Back from name input → return to type selection
          setStudentType(null);
        } else {
          setStep(s => s - 1);
        }
      }}
      style={{
        padding: '14px 24px',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: 'transparent',
        color: theme.colors.gray[500],
        fontSize: '1rem',
        cursor: 'pointer',
      }}
    >
      Back
    </button>
  );

  const stepIndicator = (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '32px' }}>
      {[1, 2, 3, 4].map(s => (
        <div key={s} style={{
          width: s === step ? '32px' : '8px',
          height: '8px',
          borderRadius: '4px',
          backgroundColor: s === step ? theme.colors.secondary : s < step ? theme.colors.primary : theme.colors.gray[200],
          transition: 'all 0.3s',
        }} />
      ))}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.colors.pageBg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: theme.typography.body,
      padding: '32px',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{
          color: theme.colors.primary,
          fontSize: '2.5rem',
          fontWeight: '800',
          fontFamily: theme.typography.display,
          margin: 0,
        }}>
          Compass
        </h1>
        <p style={{ color: theme.colors.secondary, fontSize: '0.85rem', margin: '4px 0 0 0', fontWeight: '600' }}>
          UCSB Academic Planner
        </p>
      </div>

      {stepIndicator}

      {/* Step 1: Student type selection (sub-step before name) */}
      {step === 1 && studentType === null && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: theme.colors.primary, fontWeight: '700' }}>
            Create your profile
          </h2>
          <p style={{ margin: '0 0 32px 0', color: theme.colors.gray[500] }}>
            How are you using Compass?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              onClick={() => setStudentType('ucsb')}
              style={{
                display: 'block',
                width: '100%',
                padding: '20px 24px',
                borderRadius: theme.radii.lg,
                border: `2px solid ${theme.colors.gray[200]}`,
                backgroundColor: theme.colors.white,
                textAlign: 'left',
                cursor: 'pointer',
                transition: `all ${theme.transitions.base}`,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = theme.colors.primary; e.currentTarget.style.backgroundColor = theme.colors.primarySurface; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = theme.colors.gray[200]; e.currentTarget.style.backgroundColor = theme.colors.white; }}
            >
              <div style={{ fontWeight: '700', fontSize: '1.05rem', color: theme.colors.gray[800], marginBottom: '4px' }}>
                UCSB Student
              </div>
              <div style={{ fontSize: '0.85rem', color: theme.colors.gray[500] }}>
                Planning my UCSB degree
              </div>
            </button>

            <button
              onClick={() => setStudentType('transfer')}
              style={{
                display: 'block',
                width: '100%',
                padding: '20px 24px',
                borderRadius: theme.radii.lg,
                border: `2px solid ${theme.colors.gray[200]}`,
                backgroundColor: theme.colors.white,
                textAlign: 'left',
                cursor: 'pointer',
                transition: `all ${theme.transitions.base}`,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = theme.colors.primary; e.currentTarget.style.backgroundColor = theme.colors.primarySurface; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = theme.colors.gray[200]; e.currentTarget.style.backgroundColor = theme.colors.white; }}
            >
              <div style={{ fontWeight: '700', fontSize: '1.05rem', color: theme.colors.gray[800], marginBottom: '4px' }}>
                CC Transfer Student
              </div>
              <div style={{ fontSize: '0.85rem', color: theme.colors.gray[500] }}>
                Planning my transfer to UCSB
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Name (after type is chosen) */}
      {step === 1 && studentType !== null && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: theme.colors.primary, fontWeight: '700' }}>
            Create your profile
          </h2>
          <p style={{ margin: '0 0 32px 0', color: theme.colors.gray[500] }}>
            Let's start with your name
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: theme.colors.gray[700] }}>
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: theme.radii.lg,
                border: `2px solid ${theme.colors.gray[200]}`,
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: theme.colors.gray[700] }}>
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Enter your last name"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: theme.radii.lg,
                border: `2px solid ${theme.colors.gray[200]}`,
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {backBtn}
            <button
              onClick={() => setStep(2)}
              disabled={!firstName.trim() || !lastName.trim()}
              style={btnStyle(firstName.trim() && lastName.trim())}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: School + Major (UCSB path) */}
      {step === 2 && studentType === 'ucsb' && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: theme.colors.primary, fontWeight: '700' }}>
            School &amp; Major
          </h2>
          <p style={{ margin: '0 0 24px 0', color: theme.colors.gray[500] }}>
            Select your school and degree program
          </p>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: theme.colors.gray[700] }}>
              School
            </label>
            <SearchableSelect
              options={schoolOptions}
              value={school}
              onChange={setSchool}
              placeholder="Search for your school (e.g. UCSB)..."
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: theme.colors.gray[700] }}>
              Major
            </label>
            <SearchableSelect
              options={majorOptions}
              value={major}
              onChange={setMajor}
              placeholder="Search for your major (e.g. Economics)..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {backBtn}
            <button
              onClick={() => setStep(3)}
              disabled={!school || !major}
              style={btnStyle(!!(school && major))}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: CC + Target Major (transfer path) */}
      {step === 2 && studentType === 'transfer' && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: theme.colors.primary, fontWeight: '700' }}>
            Your Transfer
          </h2>
          <p style={{ margin: '0 0 24px 0', color: theme.colors.gray[500] }}>
            Select your community college and target UCSB major
          </p>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: theme.colors.gray[700] }}>
              Community College
            </label>
            <select
              value={transferInstitution?.id ?? ''}
              onChange={e => {
                const inst = institutions.find(i => i.id === e.target.value) ?? null;
                setTransferInstitution(inst);
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: theme.radii.lg,
                border: `2px solid ${theme.colors.gray[200]}`,
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: theme.colors.white,
                boxSizing: 'border-box',
              }}
            >
              <option value="">Select your community college...</option>
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: theme.colors.gray[700] }}>
              Target UCSB Major
            </label>
            <select
              value={transferTargetMajor?.id ?? ''}
              onChange={e => {
                const opt = majorOptions.find(m => m.id === e.target.value) ?? null;
                setTransferTargetMajor(opt);
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: theme.radii.lg,
                border: `2px solid ${theme.colors.gray[200]}`,
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: theme.colors.white,
                boxSizing: 'border-box',
              }}
            >
              <option value="">Select your target major...</option>
              {majorOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {backBtn}
            <button
              onClick={() => setStep(3)}
              disabled={!transferInstitution || !transferTargetMajor}
              style={btnStyle(!!(transferInstitution && transferTargetMajor))}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Transcript (UCSB path) */}
      {step === 3 && studentType === 'ucsb' && (
        <div style={{ ...cardStyle, maxWidth: '640px' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: theme.colors.primary, fontWeight: '700' }}>
            Import your courses
          </h2>
          <p style={{ margin: '0 0 32px 0', color: theme.colors.gray[500] }}>
            Upload your transcript or enter courses manually
          </p>

          {/* Mode selection */}
          {!transcriptMode && uploadStatus !== 'success' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {/* Upload card */}
              <div
                onClick={() => setTranscriptMode('upload')}
                style={{
                  padding: '24px',
                  borderRadius: theme.radii.lg,
                  border: `2px solid ${theme.colors.gray[200]}`,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = theme.colors.primary; e.currentTarget.style.backgroundColor = theme.colors.primarySurface; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = theme.colors.gray[200]; e.currentTarget.style.backgroundColor = 'white'; }}
              >
                <div style={{ marginBottom: '10px', color: theme.colors.gray[500] }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                </div>
                <div style={{ fontWeight: '600', color: theme.colors.gray[800], marginBottom: '4px' }}>Upload PDF</div>
                <div style={{ fontSize: '0.8rem', color: theme.colors.gray[500] }}>Upload your unofficial transcript</div>
              </div>

              {/* Manual entry card */}
              <div
                onClick={() => setTranscriptMode('manual')}
                style={{
                  padding: '24px',
                  borderRadius: theme.radii.lg,
                  border: `2px solid ${theme.colors.gray[200]}`,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = theme.colors.primary; e.currentTarget.style.backgroundColor = theme.colors.primarySurface; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = theme.colors.gray[200]; e.currentTarget.style.backgroundColor = 'white'; }}
              >
                <div style={{ marginBottom: '10px', color: theme.colors.gray[500] }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </div>
                <div style={{ fontWeight: '600', color: theme.colors.gray[800], marginBottom: '4px' }}>Enter Manually</div>
                <div style={{ fontSize: '0.8rem', color: theme.colors.gray[500] }}>Type in your completed courses</div>
              </div>
            </div>
          )}

          {/* Upload mode */}
          {transcriptMode === 'upload' && uploadStatus !== 'success' && (
            <div style={{
              padding: '32px',
              borderRadius: '16px',
              border: `2px dashed ${theme.colors.gray[300]}`,
              textAlign: 'center',
              marginBottom: '24px',
              backgroundColor: theme.colors.gray[50],
            }}>
              {uploadStatus === 'idle' || uploadStatus === 'error' ? (
                <>
                  <div style={{ marginBottom: '12px', color: theme.colors.gray[400] }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                  </div>
                  <p style={{ color: theme.colors.gray[600], marginBottom: '16px' }}>
                    Select your unofficial transcript PDF
                  </p>
                  <label style={{
                    display: 'inline-block',
                    padding: '10px 24px',
                    borderRadius: theme.radii.md,
                    backgroundColor: theme.colors.primary,
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}>
                    Choose File
                    <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                  {uploadError && (
                    <p style={{ color: theme.colors.danger, marginTop: '12px', fontSize: '0.85rem' }}>
                      {uploadError}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    border: `4px solid ${theme.colors.gray[200]}`,
                    borderTop: `4px solid ${theme.colors.primary}`,
                    borderRadius: '50%',
                    margin: '0 auto 16px',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <p style={{ color: theme.colors.gray[600] }}>Parsing your transcript...</p>
                </>
              )}
            </div>
          )}

          {/* Upload success */}
          {uploadStatus === 'success' && transcript && (
            <div style={{
              padding: '24px',
              borderRadius: '16px',
              border: `2px solid ${theme.colors.success}`,
              backgroundColor: theme.colors.successSurfaceLight,
              marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ color: theme.colors.success, fontSize: '1.25rem', fontWeight: '700' }}>✓</span>
                <span style={{ fontWeight: '600', color: theme.colors.successText, fontSize: '1.1rem' }}>Transcript parsed successfully</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: theme.colors.primary }}>
                    {transcript.summary?.completed_count || transcript.completed?.length || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: theme.colors.gray[500] }}>Completed</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: theme.colors.info }}>
                    {transcript.summary?.in_progress_count || transcript.in_progress?.length || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: theme.colors.gray[500] }}>In Progress</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: theme.colors.danger }}>
                    {transcript.summary?.failed_count || transcript.failed?.length || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: theme.colors.gray[500] }}>Failed</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: theme.colors.warning }}>
                    {transcript.summary?.withdrawn_count || transcript.withdrawn?.length || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: theme.colors.gray[500] }}>Withdrawn</div>
                </div>
              </div>
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {transcript.completed?.slice(0, 10).map((c, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: `1px solid ${theme.colors.gray[200]}`,
                    fontSize: '0.85rem',
                  }}>
                    <span style={{ color: theme.colors.gray[700] }}>{c.course}</span>
                    <span style={{ fontWeight: '600', color: theme.colors.successText }}>{c.grade}</span>
                  </div>
                ))}
                {(transcript.completed?.length || 0) > 10 && (
                  <div style={{ padding: '8px 0', fontSize: '0.8rem', color: theme.colors.gray[500], textAlign: 'center' }}>
                    ... and {transcript.completed.length - 10} more courses
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Manual entry mode */}
          {transcriptMode === 'manual' && (() => {
            const manualWizardKnown = major ? buildKnownCourses((MAJOR_CONFIGS[major.id] ?? MAJOR_CONFIGS.econ_ba).requirements, []) : [];
            const alreadyAddedIds = new Set(manualCourses.map(c => extractCourseId(c.course)));
            const manualFilteredSugs = manualWizardKnown.filter(c =>
              !alreadyAddedIds.has(c.id) &&
              c.id.toLowerCase().includes(manualInput.toLowerCase())
            );
            const isValidManual = manualWizardKnown.some(c => c.id === manualInput.trim());
            return (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, position: 'relative' }} ref={manualInputRef}>
                <input
                  type="text"
                  value={manualInput}
                  onChange={e => { setManualInput(e.target.value.toUpperCase()); setShowManualSuggestions(true); setManualSuggestionIndex(-1); }}
                  onFocus={() => { setShowManualSuggestions(true); setManualSuggestionIndex(-1); }}
                  onBlur={() => setTimeout(() => setShowManualSuggestions(false), 150)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (manualSuggestionIndex >= 0 && manualFilteredSugs.length > 0) {
                        e.preventDefault();
                        const c = manualFilteredSugs[manualSuggestionIndex];
                        if (c) { setManualInput(c.id); setManualUnits(String(c.units)); setShowManualSuggestions(false); setManualSuggestionIndex(-1); }
                      } else {
                        addManualCourse();
                      }
                      return;
                    }
                    if (!showManualSuggestions || manualFilteredSugs.length === 0) return;
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setManualSuggestionIndex(i => {
                        const next = Math.min(i + 1, manualFilteredSugs.length - 1);
                        if (manualSuggestionsRef.current) {
                          const item = manualSuggestionsRef.current.children[next];
                          if (item) item.scrollIntoView({ block: 'nearest' });
                        }
                        return next;
                      });
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setManualSuggestionIndex(i => {
                        const next = Math.max(i - 1, 0);
                        if (manualSuggestionsRef.current) {
                          const item = manualSuggestionsRef.current.children[next];
                          if (item) item.scrollIntoView({ block: 'nearest' });
                        }
                        return next;
                      });
                    } else if (e.key === 'Escape') {
                      setShowManualSuggestions(false);
                      setManualSuggestionIndex(-1);
                    }
                  }}
                  placeholder="Search courses..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: theme.radii.md,
                    border: `2px solid ${manualInput.trim() && !isValidManual ? theme.colors.danger : theme.colors.gray[200]}`,
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {showManualSuggestions && manualInput.trim() && manualFilteredSugs.length > 0 && (
                  <div ref={manualSuggestionsRef} style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: `1px solid ${theme.colors.gray[300]}`,
                    borderRadius: theme.radii.md,
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 10,
                    boxShadow: theme.shadows.md,
                  }}>
                    {manualFilteredSugs.map((c, idx) => (
                      <div
                        key={c.id}
                        onMouseDown={() => {
                          setManualInput(c.id);
                          setManualUnits(String(c.units));
                          setShowManualSuggestions(false);
                          setManualSuggestionIndex(-1);
                        }}
                        onMouseEnter={() => setManualSuggestionIndex(idx)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: `1px solid ${theme.colors.gray[100]}`,
                          fontSize: '0.85rem',
                          backgroundColor: idx === manualSuggestionIndex ? theme.colors.gray[100] : 'white',
                        }}
                      >
                        <span style={{ fontWeight: '600', color: theme.colors.primary }}>{c.id}</span>
                        <span style={{ color: theme.colors.gray[500], marginLeft: '8px' }}>{c.name}</span>
                        <span style={{ color: theme.colors.gray[400], marginLeft: '8px', fontSize: '0.75rem' }}>{c.units} units</span>
                      </div>
                    ))}
                  </div>
                )}
                {manualInput.trim() && !isValidManual && !showManualSuggestions && (
                  <div style={{ fontSize: '0.75rem', color: theme.colors.danger, marginTop: '2px' }}>
                    Course not found. Select from the list or type a custom ID.
                  </div>
                )}
                </div>
                <select
                  value={manualGrade}
                  onChange={e => setManualGrade(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: theme.radii.md,
                    border: `2px solid ${theme.colors.gray[200]}`,
                    fontSize: '0.9rem',
                    outline: 'none',
                    backgroundColor: 'white',
                  }}
                >
                  {['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','P'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={manualUnits}
                  onChange={e => setManualUnits(e.target.value)}
                  style={{
                    width: '60px',
                    padding: '10px 8px',
                    borderRadius: theme.radii.md,
                    border: `2px solid ${theme.colors.gray[200]}`,
                    fontSize: '0.9rem',
                    outline: 'none',
                    textAlign: 'center',
                  }}
                  min="1"
                  max="8"
                />
                <button
                  onClick={addManualCourse}
                  disabled={!manualInput.trim()}
                  style={{
                    padding: '10px 16px',
                    borderRadius: theme.radii.md,
                    border: 'none',
                    backgroundColor: manualInput.trim() ? theme.colors.primary : theme.colors.gray[200],
                    color: manualInput.trim() ? 'white' : theme.colors.gray[400],
                    fontWeight: '600',
                    cursor: manualInput.trim() ? 'pointer' : 'default',
                  }}
                >
                  Add
                </button>
              </div>

              {manualCourses.length > 0 && (
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: `1px solid ${theme.colors.gray[200]}`,
                  borderRadius: theme.radii.lg,
                  padding: '8px',
                }}>
                  {manualCourses.map((c, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: theme.colors.gray[50],
                      marginBottom: i < manualCourses.length - 1 ? '4px' : 0,
                    }}>
                      <span style={{ fontWeight: '600', color: theme.colors.gray[700], fontSize: '0.9rem' }}>{c.course}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: theme.colors.successText, fontWeight: '600', fontSize: '0.85rem' }}>{c.grade}</span>
                        <span style={{ color: theme.colors.gray[500], fontSize: '0.8rem' }}>{c.units}u</span>
                        <button
                          onClick={() => removeManualCourse(i)}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: theme.colors.danger,
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '1rem',
                            padding: '0 4px',
                          }}
                        >
                          x
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ); })()}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {backBtn}
              {transcriptMode && (
                <button
                  onClick={() => { setTranscriptMode(null); setUploadStatus('idle'); setUploadError(''); }}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: theme.colors.gray[500],
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  Change method
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button
                onClick={() => setStep(4)}
                style={btnStyle(true)}
              >
                {transcript || manualCourses.length > 0 ? 'Continue' : 'Skip for now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Completed CC courses (transfer path) */}
      {step === 3 && studentType === 'transfer' && (() => {
        const transferFilteredSugs = articulations.filter(a =>
          (a.source_course_code?.toLowerCase().includes(transferCourseInput.toLowerCase()) ||
           a.source_course_title?.toLowerCase().includes(transferCourseInput.toLowerCase())) &&
          !transferCompleted.some(c => c.course === a.source_course_code)
        );
        const addTransferCourse = () => {
          if (!transferCourseInput.trim()) return;
          setTransferCompleted(prev => [...prev, {
            course: transferCourseInput.trim(),
            grade: transferCourseGrade,
            units: Number(transferCourseUnits) || 3,
          }]);
          setTransferCourseInput('');
          setShowTransferSuggestions(false);
          setTransferSuggestionIndex(-1);
        };
        return (
          <div style={{ ...cardStyle, maxWidth: '640px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: theme.colors.primary, fontWeight: '700' }}>
              Completed CC Courses
            </h2>
            <p style={{ margin: '0 0 24px 0', color: theme.colors.gray[500] }}>
              Add courses you have completed at your community college
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  value={transferCourseInput}
                  onChange={e => {
                    setTransferCourseInput(e.target.value);
                    setShowTransferSuggestions(true);
                    setTransferSuggestionIndex(-1);
                  }}
                  onFocus={() => { setShowTransferSuggestions(true); setTransferSuggestionIndex(-1); }}
                  onBlur={() => setTimeout(() => setShowTransferSuggestions(false), 150)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (transferSuggestionIndex >= 0 && transferFilteredSugs.length > 0) {
                        e.preventDefault();
                        const a = transferFilteredSugs[transferSuggestionIndex];
                        if (a) {
                          setTransferCourseInput(a.source_course_code);
                          setTransferCourseUnits(a.source_units || 3);
                          setShowTransferSuggestions(false);
                          setTransferSuggestionIndex(-1);
                        }
                      } else {
                        addTransferCourse();
                      }
                      return;
                    }
                    if (!showTransferSuggestions || transferFilteredSugs.length === 0) return;
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setTransferSuggestionIndex(i => {
                        const next = Math.min(i + 1, transferFilteredSugs.length - 1);
                        if (transferSuggestionsRef.current) {
                          const item = transferSuggestionsRef.current.children[next];
                          if (item) item.scrollIntoView({ block: 'nearest' });
                        }
                        return next;
                      });
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setTransferSuggestionIndex(i => {
                        const next = Math.max(i - 1, 0);
                        if (transferSuggestionsRef.current) {
                          const item = transferSuggestionsRef.current.children[next];
                          if (item) item.scrollIntoView({ block: 'nearest' });
                        }
                        return next;
                      });
                    } else if (e.key === 'Escape') {
                      setShowTransferSuggestions(false);
                      setTransferSuggestionIndex(-1);
                    }
                  }}
                  placeholder="Search CC courses (e.g. CS 110)..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: theme.radii.md,
                    border: `2px solid ${theme.colors.gray[200]}`,
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {showTransferSuggestions && transferCourseInput.trim() && transferFilteredSugs.length > 0 && (
                  <div ref={transferSuggestionsRef} style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: theme.colors.white,
                    border: `1px solid ${theme.colors.gray[300]}`,
                    borderRadius: theme.radii.md,
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 10,
                    boxShadow: theme.shadows.md,
                  }}>
                    {transferFilteredSugs.map((a, idx) => (
                      <div
                        key={a.source_course_code + idx}
                        onMouseDown={() => {
                          setTransferCourseInput(a.source_course_code);
                          setTransferCourseUnits(a.source_units || 3);
                          setShowTransferSuggestions(false);
                          setTransferSuggestionIndex(-1);
                        }}
                        onMouseEnter={() => setTransferSuggestionIndex(idx)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: `1px solid ${theme.colors.gray[100]}`,
                          fontSize: '0.85rem',
                          backgroundColor: idx === transferSuggestionIndex ? theme.colors.gray[100] : theme.colors.white,
                        }}
                      >
                        <span style={{ fontWeight: '600', color: theme.colors.primary }}>{a.source_course_code}</span>
                        {a.source_course_title && (
                          <span style={{ color: theme.colors.gray[500], marginLeft: '8px' }}>{a.source_course_title}</span>
                        )}
                        {a.source_units && (
                          <span style={{ color: theme.colors.gray[400], marginLeft: '8px', fontSize: '0.75rem' }}>{a.source_units} units</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <select
                value={transferCourseGrade}
                onChange={e => setTransferCourseGrade(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: theme.radii.md,
                  border: `2px solid ${theme.colors.gray[200]}`,
                  fontSize: '0.9rem',
                  outline: 'none',
                  backgroundColor: theme.colors.white,
                }}
              >
                {['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','P'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <input
                type="number"
                value={transferCourseUnits}
                onChange={e => setTransferCourseUnits(e.target.value)}
                style={{
                  width: '60px',
                  padding: '10px 8px',
                  borderRadius: theme.radii.md,
                  border: `2px solid ${theme.colors.gray[200]}`,
                  fontSize: '0.9rem',
                  outline: 'none',
                  textAlign: 'center',
                }}
                min="1"
                max="8"
              />
              <button
                onClick={addTransferCourse}
                disabled={!transferCourseInput.trim()}
                style={{
                  padding: '10px 16px',
                  borderRadius: theme.radii.md,
                  border: 'none',
                  backgroundColor: transferCourseInput.trim() ? theme.colors.primary : theme.colors.gray[200],
                  color: transferCourseInput.trim() ? theme.colors.white : theme.colors.gray[400],
                  fontWeight: '600',
                  cursor: transferCourseInput.trim() ? 'pointer' : 'default',
                }}
              >
                Add
              </button>
            </div>

            {transferCompleted.length > 0 && (
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: `1px solid ${theme.colors.gray[200]}`,
                borderRadius: theme.radii.lg,
                padding: '8px',
                marginBottom: '16px',
              }}>
                {transferCompleted.map((c, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: theme.colors.gray[50],
                    marginBottom: i < transferCompleted.length - 1 ? '4px' : 0,
                  }}>
                    <span style={{ fontWeight: '600', color: theme.colors.gray[700], fontSize: '0.9rem' }}>{c.course}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: theme.colors.successText, fontWeight: '600', fontSize: '0.85rem' }}>{c.grade}</span>
                      <span style={{ color: theme.colors.gray[500], fontSize: '0.8rem' }}>{c.units}u</span>
                      <button
                        onClick={() => setTransferCompleted(prev => prev.filter((_, idx) => idx !== i))}
                        style={{
                          border: 'none',
                          background: 'none',
                          color: theme.colors.danger,
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '1rem',
                          padding: '0 4px',
                        }}
                      >
                        x
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {backBtn}
              <button
                onClick={() => setStep(4)}
                style={btnStyle(true)}
              >
                {transferCompleted.length > 0 ? 'Continue' : 'Skip for now'}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Step 4: Current Quarter (UCSB path) */}
      {step === 4 && studentType === 'ucsb' && (() => {
        const alreadyDoneIds = new Set([
          ...(transcript?.completed || []).map(c => extractCourseId(c.course)),
          ...(manualCourses || []).map(c => extractCourseId(c.course)),
        ]);
        const wizardKnown = major ? buildKnownCourses((MAJOR_CONFIGS[major.id] ?? MAJOR_CONFIGS.econ_ba).requirements, []) : [];
        const qtrSuggestions = wizardKnown.filter(c =>
          !alreadyDoneIds.has(c.id) &&
          !currentQtrCourses.includes(c.id) &&
          c.id.toLowerCase().includes(currentQtrInput.toLowerCase())
        );
        return (
          <div style={{ ...cardStyle, maxWidth: '580px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: theme.colors.primary, fontWeight: '700' }}>
              What are you taking this quarter?
            </h2>
            <p style={{ margin: '0 0 28px 0', color: theme.colors.gray[500] }}>
              Add courses you're currently enrolled in so your Roadmap and Dashboard stay up to date.
            </p>

            {/* Quarter name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: theme.colors.gray[700] }}>
                Current Quarter
              </label>
              <input
                type="text"
                value={currentQuarterName}
                onChange={e => setCurrentQuarterName(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: theme.radii.md,
                  border: `2px solid ${theme.colors.gray[200]}`, fontSize: '0.95rem',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Course search */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: theme.colors.gray[700] }}>
                Add Courses
              </label>
              <div style={{ position: 'relative' }} ref={qtrInputRef}>
                <input
                  type="text"
                  value={currentQtrInput}
                  onChange={e => {
                    setCurrentQtrInput(e.target.value.toUpperCase());
                    setShowQtrSuggestions(true);
                    setQtrSuggestionIndex(-1);
                  }}
                  onFocus={() => { setShowQtrSuggestions(true); setQtrSuggestionIndex(-1); }}
                  onBlur={() => setTimeout(() => setShowQtrSuggestions(false), 150)}
                  onKeyDown={e => {
                    if (!showQtrSuggestions || qtrSuggestions.length === 0) return;
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setQtrSuggestionIndex(i => {
                        const next = Math.min(i + 1, qtrSuggestions.length - 1);
                        if (qtrSuggestionsRef.current) {
                          const item = qtrSuggestionsRef.current.children[next];
                          if (item) item.scrollIntoView({ block: 'nearest' });
                        }
                        return next;
                      });
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setQtrSuggestionIndex(i => {
                        const next = Math.max(i - 1, 0);
                        if (qtrSuggestionsRef.current) {
                          const item = qtrSuggestionsRef.current.children[next];
                          if (item) item.scrollIntoView({ block: 'nearest' });
                        }
                        return next;
                      });
                    } else if (e.key === 'Enter' && qtrSuggestionIndex >= 0) {
                      e.preventDefault();
                      const c = qtrSuggestions[qtrSuggestionIndex];
                      if (c) {
                        setCurrentQtrCourses(prev => [...prev, c.id]);
                        setCurrentQtrInput('');
                        setShowQtrSuggestions(false);
                        setQtrSuggestionIndex(-1);
                      }
                    } else if (e.key === 'Escape') {
                      setShowQtrSuggestions(false);
                      setQtrSuggestionIndex(-1);
                    }
                  }}
                  placeholder="Search courses (e.g. ECON 3A)..."
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: `1px solid ${theme.colors.gray[300]}`, fontSize: '0.9rem',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {showQtrSuggestions && currentQtrInput.trim() && qtrSuggestions.length > 0 && (
                  <div ref={qtrSuggestionsRef} style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    backgroundColor: 'white', border: `1px solid ${theme.colors.gray[300]}`,
                    borderRadius: theme.radii.md, boxShadow: theme.shadows.md,
                    maxHeight: '200px', overflowY: 'auto', marginTop: '4px',
                  }}>
                    {qtrSuggestions.map((c, idx) => (
                      <div
                        key={c.id}
                        onMouseDown={() => {
                          setCurrentQtrCourses(prev => [...prev, c.id]);
                          setCurrentQtrInput('');
                          setShowQtrSuggestions(false);
                          setQtrSuggestionIndex(-1);
                        }}
                        onMouseEnter={() => setQtrSuggestionIndex(idx)}
                        style={{
                          padding: '8px 12px', cursor: 'pointer',
                          borderBottom: `1px solid ${theme.colors.gray[100]}`, fontSize: '0.85rem',
                          backgroundColor: idx === qtrSuggestionIndex ? theme.colors.gray[100] : 'white',
                        }}
                      >
                        <span style={{ fontWeight: '600', color: theme.colors.primary }}>{c.id}</span>
                        <span style={{ color: theme.colors.gray[500], marginLeft: '8px' }}>{c.name}</span>
                        <span style={{ color: theme.colors.gray[400], marginLeft: '8px', fontSize: '0.75rem' }}>{c.units} units</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected courses */}
            {currentQtrCourses.length > 0 && (
              <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {currentQtrCourses.map(id => {
                  const known = (major ? buildKnownCourses((MAJOR_CONFIGS[major.id] ?? MAJOR_CONFIGS.econ_ba).requirements, []) : []).find(k => k.id === id);
                  return (
                    <div key={id} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      backgroundColor: theme.colors.warningSurfaceLight, border: `2px solid ${theme.colors.warningActive}`,
                      borderRadius: theme.radii.md, padding: '6px 10px',
                    }}>
                      <span style={{ fontWeight: '600', fontSize: '0.85rem', color: theme.colors.warningTextDark }}>{id}</span>
                      {known && <span style={{ fontSize: '0.75rem', color: theme.colors.warningText, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{known.name}</span>}
                      <button
                        onClick={() => setCurrentQtrCourses(prev => prev.filter(c => c !== id))}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: theme.colors.warningActive, fontWeight: '700', fontSize: '0.9rem', padding: '0 2px', lineHeight: 1 }}
                      >&times;</button>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {backBtn}
              <div style={{ display: 'flex', gap: '8px' }}>
                {currentQtrCourses.length === 0 && (
                  <button onClick={handleComplete} style={{ padding: '14px 24px', borderRadius: '12px', border: 'none', backgroundColor: 'transparent', color: theme.colors.gray[500], fontSize: '1rem', cursor: 'pointer' }}>
                    Skip for now
                  </button>
                )}
                <button onClick={handleComplete} style={btnStyle(true)}>
                  Create Profile
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Step 4: Current Quarter CC courses (transfer path) */}
      {step === 4 && studentType === 'transfer' && (() => {
        const transferCurrentFilteredSugs = articulations.filter(a =>
          (a.source_course_code?.toLowerCase().includes(transferCurrentInput.toLowerCase()) ||
           a.source_course_title?.toLowerCase().includes(transferCurrentInput.toLowerCase())) &&
          !transferInProgress.some(c => c.course === a.source_course_code)
        );
        const addTransferCurrentCourse = () => {
          if (!transferCurrentInput.trim()) return;
          setTransferInProgress(prev => [...prev, {
            course: transferCurrentInput.trim(),
            units: Number(transferCurrentUnits) || 3,
          }]);
          setTransferCurrentInput('');
          setShowTransferCurrentSuggestions(false);
          setTransferCurrentSuggestionIndex(-1);
        };
        return (
          <div style={{ ...cardStyle, maxWidth: '640px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: theme.colors.primary, fontWeight: '700' }}>
              Current CC Courses
            </h2>
            <p style={{ margin: '0 0 24px 0', color: theme.colors.gray[500] }}>
              Add courses you are currently taking at your community college
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  value={transferCurrentInput}
                  onChange={e => {
                    setTransferCurrentInput(e.target.value);
                    setShowTransferCurrentSuggestions(true);
                    setTransferCurrentSuggestionIndex(-1);
                  }}
                  onFocus={() => { setShowTransferCurrentSuggestions(true); setTransferCurrentSuggestionIndex(-1); }}
                  onBlur={() => setTimeout(() => setShowTransferCurrentSuggestions(false), 150)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (transferCurrentSuggestionIndex >= 0 && transferCurrentFilteredSugs.length > 0) {
                        e.preventDefault();
                        const a = transferCurrentFilteredSugs[transferCurrentSuggestionIndex];
                        if (a) {
                          setTransferCurrentInput(a.source_course_code);
                          setTransferCurrentUnits(a.source_units || 3);
                          setShowTransferCurrentSuggestions(false);
                          setTransferCurrentSuggestionIndex(-1);
                        }
                      } else {
                        addTransferCurrentCourse();
                      }
                      return;
                    }
                    if (!showTransferCurrentSuggestions || transferCurrentFilteredSugs.length === 0) return;
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setTransferCurrentSuggestionIndex(i => {
                        const next = Math.min(i + 1, transferCurrentFilteredSugs.length - 1);
                        if (transferCurrentSuggestionsRef.current) {
                          const item = transferCurrentSuggestionsRef.current.children[next];
                          if (item) item.scrollIntoView({ block: 'nearest' });
                        }
                        return next;
                      });
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setTransferCurrentSuggestionIndex(i => {
                        const next = Math.max(i - 1, 0);
                        if (transferCurrentSuggestionsRef.current) {
                          const item = transferCurrentSuggestionsRef.current.children[next];
                          if (item) item.scrollIntoView({ block: 'nearest' });
                        }
                        return next;
                      });
                    } else if (e.key === 'Escape') {
                      setShowTransferCurrentSuggestions(false);
                      setTransferCurrentSuggestionIndex(-1);
                    }
                  }}
                  placeholder="Search CC courses (e.g. CS 120)..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: theme.radii.md,
                    border: `2px solid ${theme.colors.gray[200]}`,
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {showTransferCurrentSuggestions && transferCurrentInput.trim() && transferCurrentFilteredSugs.length > 0 && (
                  <div ref={transferCurrentSuggestionsRef} style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: theme.colors.white,
                    border: `1px solid ${theme.colors.gray[300]}`,
                    borderRadius: theme.radii.md,
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 10,
                    boxShadow: theme.shadows.md,
                  }}>
                    {transferCurrentFilteredSugs.map((a, idx) => (
                      <div
                        key={a.source_course_code + idx}
                        onMouseDown={() => {
                          setTransferCurrentInput(a.source_course_code);
                          setTransferCurrentUnits(a.source_units || 3);
                          setShowTransferCurrentSuggestions(false);
                          setTransferCurrentSuggestionIndex(-1);
                        }}
                        onMouseEnter={() => setTransferCurrentSuggestionIndex(idx)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: `1px solid ${theme.colors.gray[100]}`,
                          fontSize: '0.85rem',
                          backgroundColor: idx === transferCurrentSuggestionIndex ? theme.colors.gray[100] : theme.colors.white,
                        }}
                      >
                        <span style={{ fontWeight: '600', color: theme.colors.primary }}>{a.source_course_code}</span>
                        {a.source_course_title && (
                          <span style={{ color: theme.colors.gray[500], marginLeft: '8px' }}>{a.source_course_title}</span>
                        )}
                        {a.source_units && (
                          <span style={{ color: theme.colors.gray[400], marginLeft: '8px', fontSize: '0.75rem' }}>{a.source_units} units</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="number"
                value={transferCurrentUnits}
                onChange={e => setTransferCurrentUnits(e.target.value)}
                style={{
                  width: '60px',
                  padding: '10px 8px',
                  borderRadius: theme.radii.md,
                  border: `2px solid ${theme.colors.gray[200]}`,
                  fontSize: '0.9rem',
                  outline: 'none',
                  textAlign: 'center',
                }}
                min="1"
                max="8"
              />
              <button
                onClick={addTransferCurrentCourse}
                disabled={!transferCurrentInput.trim()}
                style={{
                  padding: '10px 16px',
                  borderRadius: theme.radii.md,
                  border: 'none',
                  backgroundColor: transferCurrentInput.trim() ? theme.colors.primary : theme.colors.gray[200],
                  color: transferCurrentInput.trim() ? theme.colors.white : theme.colors.gray[400],
                  fontWeight: '600',
                  cursor: transferCurrentInput.trim() ? 'pointer' : 'default',
                }}
              >
                Add
              </button>
            </div>

            {transferInProgress.length > 0 && (
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: `1px solid ${theme.colors.gray[200]}`,
                borderRadius: theme.radii.lg,
                padding: '8px',
                marginBottom: '16px',
              }}>
                {transferInProgress.map((c, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: theme.colors.gray[50],
                    marginBottom: i < transferInProgress.length - 1 ? '4px' : 0,
                  }}>
                    <span style={{ fontWeight: '600', color: theme.colors.gray[700], fontSize: '0.9rem' }}>{c.course}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: theme.colors.gray[500], fontSize: '0.8rem' }}>{c.units}u</span>
                      <button
                        onClick={() => setTransferInProgress(prev => prev.filter((_, idx) => idx !== i))}
                        style={{
                          border: 'none',
                          background: 'none',
                          color: theme.colors.danger,
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '1rem',
                          padding: '0 4px',
                        }}
                      >
                        x
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {backBtn}
              <div style={{ display: 'flex', gap: '8px' }}>
                {transferInProgress.length === 0 && (
                  <button
                    onClick={handleTransferComplete}
                    style={{ padding: '14px 24px', borderRadius: '12px', border: 'none', backgroundColor: 'transparent', color: theme.colors.gray[500], fontSize: '1rem', cursor: 'pointer' }}
                  >
                    Skip for now
                  </button>
                )}
                <button onClick={handleTransferComplete} style={btnStyle(true)}>
                  Create Profile
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
