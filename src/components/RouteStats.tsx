import React from 'react';
import { Activity, Flame, Navigation } from 'lucide-react';
import { calculateCalories } from '../utils/geo';

interface RouteStatsProps {
  distanceKm: number;
  userWeightKg?: number;
  defaultPaceSeconds?: number;
}

export const RouteStats: React.FC<RouteStatsProps> = ({
  distanceKm,
  userWeightKg = 70,
}) => {
  const calories = calculateCalories(distanceKm, userWeightKg);

  return (
    <div className="glass-panel" style={{ padding: '20px', width: '100%', maxWidth: '400px' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity size={20} color="var(--primary)" />
        Route Overview
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        <div style={{
          background: 'var(--inner-bg)',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--inner-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>
            <Navigation size={16} /> Distance
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
            {distanceKm.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 400 }}>km</span>
          </div>
        </div>

        <div style={{
          background: 'var(--inner-bg)',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--inner-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>
            <Flame size={16} color="var(--accent)" /> Calories
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
            {calories} <span style={{ fontSize: '1rem', fontWeight: 400 }}>kcal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
