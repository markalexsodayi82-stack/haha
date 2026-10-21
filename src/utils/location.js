export const AQUAFLOW_BRANCH = {
  name: 'AquaFlow Branch',
  address: 'Bulalacao, Oriental Mindoro, Philippines',
  lat: 12.325349,
  lng: 121.343513,
};

export function distanceKm(aLat, aLng, bLat = AQUAFLOW_BRANCH.lat, bLng = AQUAFLOW_BRANCH.lng) {
  if (![aLat, aLng, bLat, bLng].every(Number.isFinite)) return null;
  const rad = n => n * Math.PI / 180;
  const R = 6371;
  const dLat = rad(bLat - aLat), dLng = rad(bLng - aLng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function googleDirectionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${AQUAFLOW_BRANCH.lat},${AQUAFLOW_BRANCH.lng}`)}&destination=${encodeURIComponent(`${lat},${lng}`)}&travelmode=driving`;
}

export function googleBranchMapUrl() {
  return `https://www.google.com/maps?q=${AQUAFLOW_BRANCH.lat},${AQUAFLOW_BRANCH.lng}&z=15&output=embed`;
}
