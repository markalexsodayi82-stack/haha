import { useState } from 'react';
import { AQUAFLOW_BRANCH, distanceKm, googleDirectionsUrl, googleBranchMapUrl } from '../utils/location.js';

export default function LocationCard({ value = {}, onChange, compact = false, title = 'Delivery location' }) {
  const [locating, setLocating] = useState(false);
  const distance = distanceKm(Number(value.latitude), Number(value.longitude));
  const locate = () => {
    if (!navigator.geolocation) return onChange?.({ ...value, locationError: 'Location is not supported by this browser.' });
    setLocating(true);
    navigator.geolocation.getCurrentPosition(pos => {
      const latitude = Number(pos.coords.latitude.toFixed(6));
      const longitude = Number(pos.coords.longitude.toFixed(6));
      onChange?.({ ...value, latitude, longitude, locationError: '' });
      setLocating(false);
    }, () => {
      onChange?.({ ...value, locationError: 'Please allow location access, then try again.' });
      setLocating(false);
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  };
  const mapUrl = Number.isFinite(Number(value.latitude)) && Number.isFinite(Number(value.longitude))
    ? `https://www.google.com/maps?q=${value.latitude},${value.longitude}&z=15&output=embed`
    : googleBranchMapUrl();
  return <section className={`location-card ${compact ? 'location-compact' : ''}`}>
    <div className="location-card-head">
      <div><span className="eyebrow">LOCATION & DISTANCE</span><h4>{title}</h4></div>
      <span className="branch-chip"><i className="bi bi-geo-alt-fill"/> Bulalacao branch</span>
    </div>
    <div className="location-branch"><i className="bi bi-shop"/><div><b>{AQUAFLOW_BRANCH.name}</b><span>{AQUAFLOW_BRANCH.address}</span></div></div>
    <div className="location-controls">
      <textarea value={value.address || ''} onChange={e => onChange?.({ ...value, address: e.target.value })} rows={compact ? 2 : 3} placeholder="Complete delivery address: barangay, street, house/building, landmark" />
      <button type="button" className="btn btn-primary" onClick={locate} disabled={locating}><i className="bi bi-crosshair2"/> {locating ? 'Locating…' : 'Pin my location'}</button>
    </div>
    {value.locationError && <div className="location-error"><i className="bi bi-exclamation-circle"/> {value.locationError}</div>}
    <div className="map-wrap"><iframe title="AquaFlow location map" src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
    <div className="location-bottom">
      <div className="distance-box"><span>Distance from branch</span><strong>{distance == null ? 'Pin location first' : `${distance.toFixed(1)} km`}</strong><small>{distance == null ? 'Uses your browser GPS' : 'Straight-line estimate · route may vary'}</small></div>
      {distance != null && <a className="btn btn-outline-primary" href={googleDirectionsUrl(Number(value.latitude), Number(value.longitude))} target="_blank" rel="noreferrer"><i className="bi bi-map"/> Open Google Maps</a>}
    </div>
  </section>;
}
