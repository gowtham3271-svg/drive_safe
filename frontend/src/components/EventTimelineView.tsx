import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ShieldAlert, AlertTriangle, CheckCircle2, Search, Download } from 'lucide-react';
import type { GhatEvent, HazardLevel } from '../types';

interface EventTimelineViewProps {
  events: GhatEvent[];
}

export const EventTimelineView: React.FC<EventTimelineViewProps> = ({ events }) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | HazardLevel>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = events.filter((evt) => {
    if (filterSeverity !== 'ALL' && evt.severity !== filterSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        evt.message.toLowerCase().includes(q) ||
        evt.source.toLowerCase().includes(q) ||
        evt.event_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportLogsAsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ghatguard_events_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            <Clock size={18} color="#38bdf8" />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              LIVE INCIDENT & AUDIT TIMELINE
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Chain-of-Custody Event Stream • Sensor-to-Warning Propagation Log
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search event logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem 0.25rem 1.6rem', width: '180px' }}
            />
            <Search size={12} color="var(--text-muted)" style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* Severity Filters */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {(['ALL', 'ALERT', 'CAUTION', 'NORMAL'] as const).map((sev) => (
              <button
                key={sev}
                className={`btn btn-sm ${filterSeverity === sev ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterSeverity(sev)}
                style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
              >
                {sev}
              </button>
            ))}
          </div>

          <button
            className="btn btn-sm btn-secondary"
            onClick={exportLogsAsJson}
            title="Download JSON Event Audit Log"
            style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
          >
            <Download size={11} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          maxHeight: '620px',
          overflowY: 'auto',
          paddingRight: '0.35rem',
        }}
      >
        <AnimatePresence>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No matching events found for current filter.
            </div>
          ) : (
            filtered.map((evt) => {
              const isAlert = evt.severity === 'ALERT';
              const isCaution = evt.severity === 'CAUTION';
              const color = isAlert ? '#ef4444' : isCaution ? '#f59e0b' : '#10b981';

              return (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    backgroundColor: 'rgba(6, 12, 24, 0.75)',
                    border: '1px solid',
                    borderColor: isAlert ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    boxShadow: isAlert ? '0 0 16px rgba(239, 68, 68, 0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: `${color}22`,
                        border: `1.5px solid ${color}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isAlert ? (
                        <ShieldAlert size={14} color="#ef4444" />
                      ) : isCaution ? (
                        <AlertTriangle size={14} color="#f59e0b" />
                      ) : (
                        <CheckCircle2 size={14} color="#10b981" />
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {evt.message}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        <span>Source: <strong style={{ color: 'var(--accent-cyan)' }}>{evt.source}</strong></span>
                        <span>•</span>
                        <span>Type: <strong style={{ fontFamily: 'var(--font-mono)' }}>{evt.event_type}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '90px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {evt.timestamp}
                    </span>
                    <div>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          color,
                          textTransform: 'uppercase',
                        }}
                      >
                        {evt.severity}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
