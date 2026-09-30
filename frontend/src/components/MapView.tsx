import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Camera, HazardLevel } from '../types';
import { Eye, Navigation } from 'lucide-react';

interface MapViewProps {
  cameras: Camera[];
  selectedCameraId: string | null;
  onSelectCamera: (camera: Camera) => void;
}

// Helper component to center map smoothly
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

// Create custom colored markers with Leaflet DivIcon
const createCustomMarker = (hazardStatus: HazardLevel, status: string, isSelected: boolean) => {
  let colorClass = 'marker-normal';
  if (status === 'OFFLINE') {
    colorClass = 'marker-offline';
  } else if (hazardStatus === 'ALERT') {
    colorClass = 'marker-alert';
  } else if (hazardStatus === 'CAUTION') {
    colorClass = 'marker-caution';
  }

  const selectedBorder = isSelected ? 'border: 3px solid #60a5fa; transform: scale(1.2);' : '';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="custom-marker-pin ${colorClass}" style="${selectedBorder}">
        <span style="font-size: 11px; font-weight: 700; color: white;">●</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

export const MapView: React.FC<MapViewProps> = ({
  cameras,
  selectedCameraId,
  onSelectCamera,
}) => {
  // Default centered around Western Ghats
  const [mapCenter, setMapCenter] = useState<[number, number]>([14.5, 75.0]);
  const [zoomLevel, setZoomLevel] = useState<number>(6);
  const [filterHazard, setFilterHazard] = useState<string>('ALL');

  // Filter cameras
  const filteredCameras = cameras.filter((cam) => {
    if (filterHazard === 'HAZARDS') return cam.hazard_status === 'ALERT' || cam.hazard_status === 'CAUTION';
    if (filterHazard === 'NORMAL') return cam.hazard_status === 'NORMAL';
    if (filterHazard === 'OFFLINE') return cam.status === 'OFFLINE';
    return true;
  });

  const handleFocusCamera = (cam: Camera) => {
    setMapCenter([cam.latitude, cam.longitude]);
    setZoomLevel(13);
    onSelectCamera(cam);
  };

  // Check if custom Map API key (e.g. Mapbox / Google Maps) is provided in env
  const mapApiKey = import.meta.env.VITE_MAP_API_KEY;
  // Default to reliable dark CartoDB / OpenStreetMap tile layer
  const tileUrl = mapApiKey
    ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${mapApiKey}`
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
      {/* Map Control Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          backgroundColor: 'var(--bg-card)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Filter Markers:
          </span>
          {(['ALL', 'HAZARDS', 'NORMAL', 'OFFLINE'] as const).map((mode) => (
            <button
              key={mode}
              className={`btn btn-sm ${filterHazard === mode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterHazard(mode)}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Quick jump to monitored curves */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Focus Curve:</span>
          {cameras.map((c) => (
            <button
              key={c.camera_id}
              className={`btn btn-sm ${selectedCameraId === c.camera_id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleFocusCamera(c)}
              title={`${c.name} (${c.location})`}
            >
              <Navigation size={12} />
              <span>{c.camera_id}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="map-container" style={{ flex: 1, minHeight: '480px' }}>
        <MapContainer
          center={mapCenter}
          zoom={zoomLevel}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <MapController center={mapCenter} zoom={zoomLevel} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={tileUrl}
          />

          {filteredCameras.map((cam) => {
            const isSelected = selectedCameraId === cam.camera_id;
            return (
              <Marker
                key={cam.camera_id}
                position={[cam.latitude, cam.longitude]}
                icon={createCustomMarker(cam.hazard_status, cam.status, isSelected)}
                eventHandlers={{
                  click: () => onSelectCamera(cam),
                }}
              >
                <Popup className="custom-popup">
                  <div style={{ minWidth: '220px', color: '#0f172a', padding: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{cam.camera_id}</strong>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          backgroundColor:
                            cam.hazard_status === 'ALERT'
                              ? '#fee2e2'
                              : cam.hazard_status === 'CAUTION'
                              ? '#fef3c7'
                              : '#dcfce7',
                          color:
                            cam.hazard_status === 'ALERT'
                              ? '#b91c1c'
                              : cam.hazard_status === 'CAUTION'
                              ? '#b45309'
                              : '#15803d',
                        }}
                      >
                        {cam.hazard_status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                      {cam.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
                      {cam.location}
                    </div>

                    <div
                      style={{
                        backgroundColor: '#f1f5f9',
                        padding: '0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        marginBottom: '0.65rem',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.25rem',
                      }}
                    >
                      <div>Status: <strong>{cam.status}</strong></div>
                      <div>Vehicles: <strong>{cam.vehicle_count}</strong></div>
                      <div>Persons: <strong>{cam.person_count}</strong></div>
                      <div>Visibility: <strong>{cam.visibility}</strong></div>
                    </div>

                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
                      GPS: {cam.latitude.toFixed(4)}, {cam.longitude.toFixed(4)}
                    </div>

                    <button
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', cursor: 'pointer' }}
                      onClick={() => onSelectCamera(cam)}
                    >
                      <Eye size={13} />
                      <span>Inspect Camera & Detections</span>
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Map Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--bg-secondary)',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Hazard Status:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--color-normal)' }} />
          <span>NORMAL (Clear Curve)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--color-caution)' }} />
          <span>CAUTION (Approaching Curve)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--color-alert)' }} />
          <span>ALERT (Blind Turn Obstruction)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--color-offline)' }} />
          <span>OFFLINE (Camera Disconnected)</span>
        </div>
      </div>
    </div>
  );
};
