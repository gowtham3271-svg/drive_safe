import React from 'react';
import { X, Smartphone, Cpu, Eye, Server, ArrowRight, CheckCircle2, Copy } from 'lucide-react';

interface HardwareGuideModalProps {
  onClose: () => void;
}

export const HardwareGuideModal: React.FC<HardwareGuideModalProps> = ({ onClose }) => {
  const [copied, setCopied] = React.useState(false);

  const scriptCommand = `python backend/scripts/raspberry_pi_yolo11_client.py --camera-id CAM001 --stream "http://192.168.1.100:8080/video" --backend "http://YOUR_SERVER_IP:8000"`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scriptCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Raspberry Pi 4 & Phone Camera Hardware Setup Guide
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              End-to-end edge pipeline architecture connecting physical camera, YOLO11, and FastAPI backend.
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Data Flow Diagram */}
        <div
          style={{
            backgroundColor: 'var(--bg-primary)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            System Data Flow:
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              flexWrap: 'wrap',
              fontSize: '0.8rem',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', textAlign: 'center' }}>
              <div style={{ padding: '0.6rem', backgroundColor: '#1e293b', borderRadius: '50%', color: '#38bdf8' }}>
                <Smartphone size={20} />
              </div>
              <strong>Android Phone</strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>IP Camera App</span>
            </div>

            <ArrowRight size={16} color="var(--text-muted)" />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', textAlign: 'center' }}>
              <div style={{ padding: '0.6rem', backgroundColor: '#1e293b', borderRadius: '50%', color: '#f43f5e' }}>
                <Cpu size={20} />
              </div>
              <strong>Raspberry Pi 4</strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Edge Device</span>
            </div>

            <ArrowRight size={16} color="var(--text-muted)" />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', textAlign: 'center' }}>
              <div style={{ padding: '0.6rem', backgroundColor: '#1e293b', borderRadius: '50%', color: '#a855f7' }}>
                <Eye size={20} />
              </div>
              <strong>YOLO11 Model</strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Object Detection</span>
            </div>

            <ArrowRight size={16} color="var(--text-muted)" />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', textAlign: 'center' }}>
              <div style={{ padding: '0.6rem', backgroundColor: '#1e293b', borderRadius: '50%', color: '#10b981' }}>
                <Server size={20} />
              </div>
              <strong>FastAPI + Supabase</strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Hazard Assessment</span>
            </div>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Step 1 */}
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ fontSize: '0.85rem', color: '#60a5fa' }}>Step 1: Set Up Android Phone Camera</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              1. Install any standard IP camera app (e.g. <em>IP Webcam</em> from Google Play).<br />
              2. Connect phone to the local WiFi or Pi's WiFi hotspot.<br />
              3. Tap "Start Server". Note down the video stream URL (e.g., <code>http://192.168.1.100:8080/video</code>).
            </p>
          </div>

          {/* Step 2 */}
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ fontSize: '0.85rem', color: '#f59e0b' }}>Step 2: Prepare Raspberry Pi 4</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Install Python dependencies on the Raspberry Pi:
            </p>
            <pre style={{ backgroundColor: '#070b13', padding: '0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace', color: '#38bdf8', marginTop: '0.35rem' }}>
              pip install opencv-python ultralytics requests
            </pre>
          </div>

          {/* Step 3 */}
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.85rem', color: '#10b981' }}>Step 3: Run YOLO11 Edge Ingestion Script</strong>
              <button className="btn btn-secondary btn-sm" onClick={copyToClipboard}>
                {copied ? <CheckCircle2 size={13} color="#10b981" /> : <Copy size={13} />}
                <span>{copied ? 'Copied!' : 'Copy Command'}</span>
              </button>
            </div>
            <pre style={{ backgroundColor: '#070b13', padding: '0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace', color: '#86efac', marginTop: '0.45rem', overflowX: 'auto' }}>
              {scriptCommand}
            </pre>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              The script captures frames, runs YOLO11 inference, filters vehicles/pedestrians, and POSTs bounding boxes to <code>POST /api/detections</code>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
