import React, { useState } from 'react';
import { Clock, Timer } from 'lucide-react';
import { formatSecondsToTime, parsePaceToSeconds } from '../utils/geo';

interface PaceCalculatorProps {
  distanceKm: number;
}

export const PaceCalculator: React.FC<PaceCalculatorProps> = ({ distanceKm }) => {
  const [mode, setMode] = useState<'TIME_TO_PACE' | 'PACE_TO_TIME'>('TIME_TO_PACE');

  // State for calculations
  const [targetTimeStr, setTargetTimeStr] = useState<string>('00:30:00');
  const [targetPaceStr, setTargetPaceStr] = useState<string>('06:00');

  // Time -> Pace calculation
  const calculatedPaceFromTime = distanceKm > 0
    ? formatSecondsToTime(parsePaceToSeconds(targetTimeStr) / distanceKm)
    : '00:00';

  // Pace -> Time calculation
  const calculatedTimeFromPace = distanceKm > 0
    ? formatSecondsToTime(parsePaceToSeconds(targetPaceStr) * distanceKm)
    : '00:00';

  return (
    <div className="glass-panel" style={{ padding: '20px', width: '100%', maxWidth: '400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Timer size={20} color="var(--primary)" />
          Calculator
        </h2>
        <div style={{ display: 'flex', background: 'var(--inner-bg)', borderRadius: 'var(--radius-full)', padding: '4px', border: '1px solid var(--inner-border)' }}>
          <button
            onClick={() => setMode('TIME_TO_PACE')}
            style={{
              padding: '4px 12px', border: 'none', borderRadius: 'var(--radius-full)',
              background: mode === 'TIME_TO_PACE' ? 'var(--secondary)' : 'transparent',
              color: mode === 'TIME_TO_PACE' ? '#fff' : 'inherit',
              cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s'
            }}>Target Time</button>
          <button
            onClick={() => setMode('PACE_TO_TIME')}
            style={{
              padding: '4px 12px', border: 'none', borderRadius: 'var(--radius-full)',
              background: mode === 'PACE_TO_TIME' ? 'var(--secondary)' : 'transparent',
              color: mode === 'PACE_TO_TIME' ? '#fff' : 'inherit',
              cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s'
            }}>Target Pace</button>
        </div>
      </div>

      {mode === 'TIME_TO_PACE' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <label>Target Finish Time (HH:MM:SS)</label>
            <input
              type="text"
              className="input"
              value={targetTimeStr}
              onChange={(e) => setTargetTimeStr(e.target.value)}
              placeholder="01:30:00"
            />
          </div>
          <div style={{
            background: 'var(--inner-bg)',
            border: '1px solid var(--inner-border)',
            padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center'
          }}>
            <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>Required Pace</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, margin: '8px 0' }}>{calculatedPaceFromTime}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>per kilometer</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <label>Target Pace (MM:SS)</label>
            <input
              type="text"
              className="input"
              value={targetPaceStr}
              onChange={(e) => setTargetPaceStr(e.target.value)}
              placeholder="05:30"
            />
          </div>
          <div style={{
            background: 'var(--inner-bg)',
            border: '1px solid var(--inner-border)',
            padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center'
          }}>
            <div style={{ color: 'var(--secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Estimated Finish</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, margin: '8px 0' }}>
              <Clock size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              {calculatedTimeFromPace}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>total time</div>
          </div>
        </div>
      )}
    </div>
  );
};
