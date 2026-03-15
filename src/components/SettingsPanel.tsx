import React, { useState, useEffect } from 'react';
import { X, Weight } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  weightKg: number;
  onWeightChange: (kg: number) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  weightKg,
  onWeightChange,
}) => {
  // Local string state lets the user freely delete/retype without being
  // snapped back by the parent's numeric value.
  const [inputValue, setInputValue] = useState(String(weightKg));

  // Keep local state in sync if the parent value changes externally.
  useEffect(() => {
    setInputValue(String(weightKg));
  }, [weightKg]);

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    const val = parseFloat(raw);
    if (!isNaN(val) && val > 0) {
      onWeightChange(val);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 1999,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Slide-in Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '320px',
          maxWidth: '90vw',
          zIndex: 2000,
          transform: isOpen ? 'translateX(0)' : 'translateX(105%)',
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: '24px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderLeft: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
            Settings
          </h2>
          <button
            className="btn-icon"
            onClick={onClose}
            style={{ padding: '6px' }}
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        {/* Section: Runner Profile */}
        <div>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-secondary)',
            marginBottom: '12px',
          }}>
            Runner Profile
          </div>

          <div className="glass-panel" style={{ padding: '16px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Weight size={14} /> Body Weight
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  className="input"
                  style={{ flex: 1 }}
                  min={30}
                  max={250}
                  value={inputValue}
                  onChange={handleWeightChange}
                />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                  kg
                </span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px' }}>
                Used to calculate calorie estimates
              </div>
            </div>
          </div>
        </div>

        {/* Future settings placeholder */}
        <div style={{
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginTop: 'auto',
          padding: '16px 0',
          borderTop: '1px solid var(--inner-border)',
        }}>
          Run Planner
        </div>
      </div>
    </>
  );
};
