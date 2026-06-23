"use client";
import React, { useMemo } from 'react';

interface ContributionGraphProps {
  username: string;
}

export default function ContributionGraph({ username }: ContributionGraphProps) {
  
  const calendarData = useMemo(() => {
    
    const data = [];
    const seed = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    
    for (let i = 0; i < 371; i++) {
      let level = 0;
      const wave = Math.sin(i / 10) * Math.cos(i / 5);
      const randomValue = Math.sin(seed + i) * 10;
      
      if (randomValue > 6) {
        level = randomValue > 8.5 ? 4 : randomValue > 8 ? 3 : 2;
      } else if (wave > 0.2) {
        level = wave > 0.5 ? 2 : 1;
      }
      
      
      if (i % 7 === 0 || i % 7 === 6) {
        level = level > 0 ? level - 1 : 0;
      }
      
      data.push({
        day: i,
        level, 
        count: level === 0 ? 0 : level * 2 + Math.floor(Math.random() * 3),
      });
    }
    return data;
  }, [username]);

  
  const getColor = (level: number) => {
    switch (level) {
      case 0: return 'rgba(128, 128, 128, 0.1)';
      case 1: return '#0e4429'; 
      case 2: return '#006d32'; 
      case 3: return '#26a641'; 
      case 4: return '#39d353'; 
      default: return 'rgba(128, 128, 128, 0.1)';
    }
  };

  
  const weeks = useMemo(() => {
    const w = [];
    for (let i = 0; i < calendarData.length; i += 7) {
      w.push(calendarData.slice(i, i + 7));
    }
    return w;
  }, [calendarData]);

  const totalCommits = useMemo(() => {
    return calendarData.reduce((sum, item) => sum + item.count, 0);
  }, [calendarData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <span>{totalCommits} contributions in the last year</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>Less</span>
          <span style={{ width: '10px', height: '10px', borderRadius: '1.5px', background: 'rgba(128, 128, 128, 0.1)' }}></span>
          <span style={{ width: '10px', height: '10px', borderRadius: '1.5px', background: '#0e4429' }}></span>
          <span style={{ width: '10px', height: '10px', borderRadius: '1.5px', background: '#006d32' }}></span>
          <span style={{ width: '10px', height: '10px', borderRadius: '1.5px', background: '#26a641' }}></span>
          <span style={{ width: '10px', height: '10px', borderRadius: '1.5px', background: '#39d353' }}></span>
          <span>More</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '3px', padding: '4px', overflowX: 'auto', width: '100%' }}>
        {}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingRight: '6px', fontSize: '0.65rem', color: 'var(--text-muted)', height: '88px', paddingTop: '11px', paddingBottom: '11px' }}>
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>

        {}
        <div style={{ display: 'flex', gap: '3px' }}>
          {weeks.map((week, wIdx) => (
            <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {week.map((day, dIdx) => (
                <div
                  key={dIdx}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '1.5px',
                    backgroundColor: getColor(day.level),
                  }}
                  className="tooltip"
                  data-tooltip={`${day.count} commits`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
