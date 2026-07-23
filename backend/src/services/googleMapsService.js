// services/googleMapsService.js
// Google Maps Distance Matrix API integration.
// Calculates distance from KTU campus to a given property GPS coordinate.
// UC-L02: caches result in Properties.distance_from_campus_km on creation.

import https from 'https';

const KTU_LAT = parseFloat(process.env.KTU_LAT) || 6.0900;
const KTU_LNG = parseFloat(process.env.KTU_LNG) || -0.2573;

/**
 * Calls the Google Maps Distance Matrix API to get driving distance
 * from a property coordinate to KTU campus.
 *
 * @param {number} propertyLat - Property latitude
 * @param {number} propertyLng - Property longitude
 * @returns {Promise<number|null>} Distance in km, or null on failure
 */
export const getDistanceFromCampus = (propertyLat, propertyLng) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      // Fallback: Haversine straight-line distance estimate
      const dist = haversineKm(KTU_LAT, KTU_LNG, propertyLat, propertyLng);
      console.warn('⚠️  No Google Maps API key — using haversine estimate:', dist.toFixed(2), 'km');
      return resolve(parseFloat(dist.toFixed(2)));
    }

    const origin = `${KTU_LAT},${KTU_LNG}`;
    const destination = `${propertyLat},${propertyLng}`;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=driving&key=${apiKey}`;

    const req = https.get(url, (resp) => {
      let data = '';
      resp.on('data', chunk => { data += chunk; });
      resp.on('end', () => {
        try {
          const json = JSON.parse(data);
          const element = json.rows?.[0]?.elements?.[0];
          if (element?.status === 'OK') {
            const distKm = element.distance.value / 1000; // metres → km
            resolve(parseFloat(distKm.toFixed(2)));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.error('Distance Matrix API error:', err.message);
      resolve(null);
    });
    // 5-second timeout — don't block listing creation
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(null);
    });
  });
};

/**
 * Haversine formula — fallback straight-line distance in km.
 */
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
