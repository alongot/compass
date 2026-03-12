import React, { useState, useMemo } from 'react';

// Embedded course data
const courseData = [
  {"course":"ECON 1","dept":"ECON","difficultyScore":2.6,"label":"Moderate","color":"yellow","successRate":69.4,"neutralRate":26.9,"failRate":3.7,"avgGPA":3.14,"totalStudents":10549},
  {"course":"ECON 2","dept":"ECON","difficultyScore":3.9,"label":"Moderate","color":"yellow","successRate":55.6,"neutralRate":37.3,"failRate":7.1,"avgGPA":2.82,"totalStudents":6892},
  {"course":"ECON 3A","dept":"ECON","difficultyScore":4.7,"label":"Challenging","color":"orange","successRate":47.4,"neutralRate":42.0,"failRate":10.6,"avgGPA":2.62,"totalStudents":3969},
  {"course":"ECON 3B","dept":"ECON","difficultyScore":3.9,"label":"Moderate","color":"yellow","successRate":57.4,"neutralRate":33.7,"failRate":8.9,"avgGPA":2.79,"totalStudents":2252},
  {"course":"ECON 5","dept":"ECON","difficultyScore":4.5,"label":"Moderate","color":"yellow","successRate":53.9,"neutralRate":30.4,"failRate":15.7,"avgGPA":2.69,"totalStudents":5546},
  {"course":"ECON 9","dept":"ECON","difficultyScore":1.8,"label":"Easy","color":"green","successRate":80.1,"neutralRate":16.4,"failRate":3.4,"avgGPA":3.37,"totalStudents":3509},
  {"course":"ECON 10A","dept":"ECON","difficultyScore":4.2,"label":"Moderate","color":"yellow","successRate":52.9,"neutralRate":37.0,"failRate":10.1,"avgGPA":2.76,"totalStudents":8723},
  {"course":"ECON 100B","dept":"ECON","difficultyScore":3.1,"label":"Moderate","color":"yellow","successRate":63.6,"neutralRate":32.1,"failRate":4.3,"avgGPA":3.0,"totalStudents":5760},
  {"course":"ECON 101","dept":"ECON","difficultyScore":2.1,"label":"Easy","color":"green","successRate":76.9,"neutralRate":20.5,"failRate":2.6,"avgGPA":3.24,"totalStudents":5021},
  {"course":"ECON 106","dept":"ECON","difficultyScore":1.0,"label":"Easy","color":"green","successRate":90.2,"neutralRate":8.3,"failRate":1.5,"avgGPA":3.6,"totalStudents":1415},
  {"course":"ECON 134A","dept":"ECON","difficultyScore":3.0,"label":"Moderate","color":"yellow","successRate":65.1,"neutralRate":30.6,"failRate":4.3,"avgGPA":3.07,"totalStudents":3717},
  {"course":"ECON 136A","dept":"ECON","difficultyScore":2.7,"label":"Moderate","color":"yellow","successRate":67.6,"neutralRate":29.8,"failRate":2.6,"avgGPA":3.1,"totalStudents":2577},
  {"course":"ECON 136B","dept":"ECON","difficultyScore":4.6,"label":"Challenging","color":"orange","successRate":47.9,"neutralRate":40.6,"failRate":11.5,"avgGPA":2.67,"totalStudents":2466},
  {"course":"ECON 136C","dept":"ECON","difficultyScore":4.5,"label":"Moderate","color":"yellow","successRate":48.1,"neutralRate":43.3,"failRate":8.5,"avgGPA":2.73,"totalStudents":2293},
  {"course":"ECON 137A","dept":"ECON","difficultyScore":1.1,"label":"Easy","color":"green","successRate":88.1,"neutralRate":10.9,"failRate":1.0,"avgGPA":3.5,"totalStudents":2563},
  {"course":"ECON 140A","dept":"ECON","difficultyScore":3.0,"label":"Moderate","color":"yellow","successRate":65.3,"neutralRate":30.8,"failRate":3.9,"avgGPA":3.05,"totalStudents":4901},
  {"course":"ECON 145","dept":"ECON","difficultyScore":1.3,"label":"Easy","color":"green","successRate":87.6,"neutralRate":9.5,"failRate":2.9,"avgGPA":3.48,"totalStudents":1003},
  {"course":"ECON 171","dept":"ECON","difficultyScore":2.3,"label":"Easy","color":"green","successRate":76.5,"neutralRate":16.9,"failRate":6.6,"avgGPA":3.23,"totalStudents":1951},
  {"course":"WRIT 1","dept":"WRIT","difficultyScore":1.3,"label":"Easy","color":"green","successRate":87.2,"neutralRate":10.0,"failRate":2.8,"avgGPA":3.45,"totalStudents":3552},
  {"course":"WRIT 2","dept":"WRIT","difficultyScore":1.0,"label":"Easy","color":"green","successRate":91.4,"neutralRate":5.8,"failRate":2.7,"avgGPA":3.54,"totalStudents":18124},
  {"course":"WRIT 2E","dept":"WRIT","difficultyScore":1.0,"label":"Easy","color":"green","successRate":94.0,"neutralRate":4.7,"failRate":1.3,"avgGPA":3.71,"totalStudents":772},
  {"course":"WRIT 50","dept":"WRIT","difficultyScore":1.0,"label":"Easy","color":"green","successRate":92.5,"neutralRate":4.6,"failRate":2.8,"avgGPA":3.63,"totalStudents":737},
  {"course":"WRIT 50E","dept":"WRIT","difficultyScore":1.0,"label":"Easy","color":"green","successRate":97.7,"neutralRate":1.5,"failRate":0.9,"avgGPA":3.77,"totalStudents":1026},
  {"course":"WRIT 105C","dept":"WRIT","difficultyScore":1.0,"label":"Easy","color":"green","successRate":93.9,"neutralRate":3.4,"failRate":2.6,"avgGPA":3.69,"totalStudents":1712},
  {"course":"WRIT 105M","dept":"WRIT","difficultyScore":1.0,"label":"Easy","color":"green","successRate":95.0,"neutralRate":2.9,"failRate":2.2,"avgGPA":3.75,"totalStudents":1669},
  {"course":"WRIT 105PS","dept":"WRIT","difficultyScore":1.0,"label":"Easy","color":"green","successRate":91.4,"neutralRate":6.5,"failRate":2.1,"avgGPA":3.56,"totalStudents":1001},
  {"course":"WRIT 107B","dept":"WRIT","difficultyScore":1.0,"label":"Easy","color":"green","successRate":97.1,"neutralRate":2.1,"failRate":0.8,"avgGPA":3.7,"totalStudents":2771},
  {"course":"WRIT 107G","dept":"WRIT","difficultyScore":1.0,"label":"Easy","color":"green","successRate":92.6,"neutralRate":5.6,"failRate":1.8,"avgGPA":3.62,"totalStudents":886},
  {"course":"WRIT 107J","dept":"WRIT","difficultyScore":1.1,"label":"Easy","color":"green","successRate":89.2,"neutralRate":7.8,"failRate":3.0,"avgGPA":3.54,"totalStudents":964},
  {"course":"WRIT 109F","dept":"WRIT","difficultyScore":1.0,"label":"Easy","color":"green","successRate":94.7,"neutralRate":3.1,"failRate":2.2,"avgGPA":3.63,"totalStudents":1135},
  {"course":"WRIT 109HP","dept":"WRIT","difficultyScore":1.0,"label":"Easy","color":"green","successRate":98.7,"neutralRate":0.7,"failRate":0.6,"avgGPA":3.79,"totalStudents":875},
  {"course":"WRIT 109HU","dept":"WRIT","difficultyScore":1.0,"label":"Easy","color":"green","successRate":94.9,"neutralRate":2.8,"failRate":2.3,"avgGPA":3.71,"totalStudents":705}
];

const getDifficultyColor = (color) => {
  const colors = {
    green: { bg: '#10b981', light: '#d1fae5', text: '#065f46' },
    yellow: { bg: '#f59e0b', light: '#fef3c7', text: '#92400e' },
    orange: { bg: '#f97316', light: '#ffedd5', text: '#9a3412' },
    red: { bg: '#ef4444', light: '#fee2e2', text: '#991b1b' }
  };
  return colors[color] || colors.yellow;
};

const CourseCard = ({ course }) => {
  const colors = getDifficultyColor(course.color);
  
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      border: '1px solid #e5e7eb',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: '#003660',
            margin: '0 0 4px 0',
            fontFamily: "'Georgia', serif"
          }}>
            {course.course}
          </h3>
          <span style={{ 
            fontSize: '0.875rem', 
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {course.dept}
          </span>
        </div>
        
        {/* Difficulty Badge */}
        <div style={{
          background: colors.light,
          borderRadius: '12px',
          padding: '8px 16px',
          textAlign: 'center',
          minWidth: '80px'
        }}>
          <div style={{ 
            fontSize: '1.75rem', 
            fontWeight: '800', 
            color: colors.bg,
            lineHeight: '1'
          }}>
            {course.difficultyScore}
          </div>
          <div style={{ 
            fontSize: '0.7rem', 
            color: colors.text,
            fontWeight: '600',
            textTransform: 'uppercase',
            marginTop: '4px'
          }}>
            {course.label}
          </div>
        </div>
      </div>
      
      {/* Grade Distribution Bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          display: 'flex', 
          borderRadius: '8px', 
          overflow: 'hidden',
          height: '32px',
          background: '#f3f4f6'
        }}>
          <div style={{ 
            width: `${course.successRate}%`, 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            {course.successRate > 15 && `${course.successRate}%`}
          </div>
          <div style={{ 
            width: `${course.neutralRate}%`, 
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            {course.neutralRate > 15 && `${course.neutralRate}%`}
          </div>
          <div style={{ 
            width: `${course.failRate}%`, 
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            {course.failRate > 10 && `${course.failRate}%`}
          </div>
        </div>
        
        {/* Legend */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginTop: '8px',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10b981' }}></div>
            <span style={{ color: '#374151' }}>A/B: {course.successRate}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f59e0b' }}></div>
            <span style={{ color: '#374151' }}>B-/C: {course.neutralRate}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ef4444' }}></div>
            <span style={{ color: '#374151' }}>D/F: {course.failRate}%</span>
          </div>
        </div>
      </div>
      
      {/* Stats Footer */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        paddingTop: '16px',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Avg GPA</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#003660' }}>{course.avgGPA.toFixed(2)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Sample Size</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#003660' }}>{course.totalStudents.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

export default function Compass() {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [sortBy, setSortBy] = useState('course');

  const filteredCourses = useMemo(() => {
    let filtered = courseData.filter(course => {
      const matchesSearch = course.course.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = deptFilter === 'All' || course.dept === deptFilter;
      const matchesDifficulty = difficultyFilter === 'All' || course.label === difficultyFilter;
      return matchesSearch && matchesDept && matchesDifficulty;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'difficulty') return b.difficultyScore - a.difficultyScore;
      if (sortBy === 'gpa') return b.avgGPA - a.avgGPA;
      return a.course.localeCompare(b.course);
    });

    return filtered;
  }, [searchTerm, deptFilter, difficultyFilter, sortBy]);

  const buttonStyle = (isActive) => ({
    padding: '10px 20px',
    borderRadius: '9999px',
    border: 'none',
    background: isActive ? '#003660' : 'white',
    color: isActive ? 'white' : '#374151',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '0.875rem',
    boxShadow: isActive ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
  });

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #003660 0%, #004a86 100%)',
        padding: '32px 24px',
        color: 'white',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: '800',
          margin: '0 0 8px 0',
          fontFamily: "'Georgia', serif",
          letterSpacing: '-0.02em'
        }}>
          🧭 Compass
        </h1>
        <p style={{ 
          fontSize: '1.125rem',
          opacity: '0.9',
          margin: '0',
          fontWeight: '400'
        }}>
          Navigate UCSB courses with interpreted difficulty ratings
        </p>
        <div style={{
          marginTop: '16px',
          display: 'inline-block',
          background: '#FEBC11',
          color: '#003660',
          padding: '6px 16px',
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '700'
        }}>
          {courseData.length} Courses • 2019-2024 Data
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Search & Filters */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Search */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search courses (e.g., ECON 101, WRIT 2)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#003660'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Filter Row */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: '24px',
            alignItems: 'center'
          }}>
            {/* Department Filter */}
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase' }}>
                Department
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['All', 'ECON', 'WRIT'].map(dept => (
                  <button
                    key={dept}
                    onClick={() => setDeptFilter(dept)}
                    style={buttonStyle(deptFilter === dept)}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase' }}>
                Difficulty
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['All', 'Easy', 'Moderate', 'Challenging'].map(diff => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    style={buttonStyle(difficultyFilter === diff)}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase' }}>
                Sort By
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { key: 'course', label: 'Name' },
                  { key: 'difficulty', label: 'Difficulty' },
                  { key: 'gpa', label: 'GPA' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setSortBy(opt.key)}
                    style={buttonStyle(sortBy === opt.key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div style={{ 
          marginBottom: '20px',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          Showing <strong style={{ color: '#003660' }}>{filteredCourses.length}</strong> courses
        </div>

        {/* Course Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '24px'
        }}>
          {filteredCourses.map(course => (
            <CourseCard key={course.course} course={course} />
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '64px 24px',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>No courses found</div>
            <div>Try adjusting your search or filters</div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '32px 24px',
        color: '#6b7280',
        fontSize: '0.875rem'
      }}>
        <p style={{ margin: '0 0 8px 0' }}>
          <strong>Difficulty Formula:</strong> Based on fail rate (D/F), neutral rate (B-/C), and success rate (A/B)
        </p>
        <p style={{ margin: '0' }}>
          Data from Daily Nexus Grade Distribution Database • 2019-2024
        </p>
      </footer>
    </div>
  );
}
