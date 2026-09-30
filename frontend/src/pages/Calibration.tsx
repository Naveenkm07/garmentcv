import React, { useState } from 'react';
import { Camera, UploadCloud, Settings, CheckCircle, Crosshair, AlertTriangle } from 'lucide-react';

const REFERENCE_OPTIONS = [
  { value: 'a4', label: 'A4 Paper (210 x 297 mm)', width: 210, height: 297 },
  { value: 'checkerboard', label: 'Checkerboard (100 x 100 mm)', width: 100, height: 100 },
  { value: 'ruler', label: 'Standard Ruler (300 x 30 mm)', width: 300, height: 30 },
];

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export default function Calibration() {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibrationId, setCalibrationId] = useState<number | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [referenceType, setReferenceType] = useState('a4');
  const [cameraDistance, setCameraDistance] = useState('150');
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImageUrl(url);
      setSelectedFile(file);
      setIsCalibrated(false);
      setCalibrationId(null);
      setError(null);
    }
  };

  const startCalibration = async () => {
    if (!selectedFile) return;
    setIsCalibrating(true);
    setError(null);

    const ref = REFERENCE_OPTIONS.find((o) => o.value === referenceType) ?? REFERENCE_OPTIONS[0];
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('reference_width_mm', String(ref.width));
    formData.append('reference_height_mm', String(ref.height));
    formData.append('reference_type', referenceType);
    formData.append('camera_distance_cm', cameraDistance);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/calibrations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? `Server error ${res.status}`);
      }

      const data = await res.json();
      setCalibrationId(data.id);
      setIsCalibrated(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Calibration failed');
    } finally {
      setIsCalibrating(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h1>Camera Calibration</h1>
        {isCalibrated && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
            <CheckCircle size={16} /> System Calibrated {calibrationId ? `(#${calibrationId})` : ''}
          </span>
        )}
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
        Upload a reference image containing a known object (e.g. an A4 paper or checkerboard) to calibrate pixels to millimeters.
      </p>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '12px', padding: '12px 18px', marginBottom: '24px', color: 'var(--danger)' }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Left Column - Image Upload & Preview */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={20} color="var(--primary-color)" /> Reference Image
          </h3>
          
          {!selectedImageUrl ? (
            <label style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              border: '2px dashed var(--border-color)', 
              borderRadius: '12px',
              padding: '40px',
              cursor: 'pointer',
              background: 'rgba(0,0,0,0.2)',
              minHeight: '300px',
              transition: 'all 0.2s'
            }}>
              <UploadCloud size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Click to Upload</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>PNG, JPG up to 10MB</p>
              <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
            </label>
          ) : (
            <div style={{ position: 'relative', flex: 1, minHeight: '300px', borderRadius: '12px', overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={selectedImageUrl} alt="Calibration Reference" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
              
              {isCalibrating && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <Crosshair size={48} color="var(--primary-color)" style={{ animation: 'spin 2s linear infinite' }} />
                  <p style={{ marginTop: '16px', fontWeight: 'bold', color: 'white' }}>Saving calibration data…</p>
                </div>
              )}
            </div>
          )}

          {selectedImageUrl && (
            <label style={{ marginTop: '12px', textAlign: 'center', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '14px' }}>
              Choose a different image
              <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
            </label>
          )}
        </div>

        {/* Right Column - Settings & Action */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} color="var(--primary-color)" /> Calibration Settings
          </h3>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Reference Object Type</label>
            <select
              className="input-field"
              value={referenceType}
              onChange={(e) => setReferenceType(e.target.value)}
            >
              {REFERENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Camera Distance (approx. cm)</label>
            <input
              type="number"
              className="input-field"
              value={cameraDistance}
              onChange={(e) => setCameraDistance(e.target.value)}
            />
          </div>

          {isCalibrated && calibrationId && (
            <div style={{ marginBottom: '24px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', padding: '14px 18px', fontSize: '14px' }}>
              <p style={{ color: 'var(--success)', fontWeight: 'bold', marginBottom: '4px' }}>Calibration saved (ID #{calibrationId})</p>
              <p style={{ color: 'var(--text-muted)' }}>
                Reference: {REFERENCE_OPTIONS.find(o => o.value === referenceType)?.label}
              </p>
            </div>
          )}

          <div style={{ flex: 1 }}></div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '16px', fontSize: '16px', opacity: (!selectedFile || isCalibrating) ? 0.5 : 1, cursor: (!selectedFile || isCalibrating) ? 'not-allowed' : 'pointer' }}
            onClick={startCalibration}
            disabled={!selectedFile || isCalibrating}
          >
            {isCalibrating ? 'Calibrating…' : isCalibrated ? 'Recalibrate System' : 'Start Calibration'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
