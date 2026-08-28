import { Request, Response, NextFunction, RequestHandler } from 'express';
import axios from 'axios';
import { GeocodingService } from '../../core/services/GeocodingService';

const geocoder = new GeocodingService();

function normalizePostcode(postcode: string): string {
  return postcode.replace(/\s+/g, ' ').trim().toUpperCase();
}

async function nominatimGeocode(address: string) {
  const query = address.trim();
  if (!query) return null;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'gb');

  const { data } = await axios.get<Array<{ lat: string; lon: string; display_name?: string }>>(
    url.toString(),
    {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en',
        'User-Agent': 'Proptii/1.0 (property intelligence report)',
      },
      timeout: 8000,
    },
  );

  const hit = data[0];
  if (!hit) return null;

  const latitude = Number.parseFloat(hit.lat);
  const longitude = Number.parseFloat(hit.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    latitude,
    longitude,
    label: hit.display_name ?? query,
    source: 'nominatim' as const,
  };
}

export const geocodeAddress: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const address = String(req.query.address || '').trim();
    if (!address) {
      return res.status(400).json({ status: 'fail', message: 'address query param is required' });
    }

    if (geocoder.isConfigured()) {
      const coords = await geocoder.geocodeAddress(address);
      if (coords) {
        return res.json({
          latitude: coords.latitude,
          longitude: coords.longitude,
          label: address,
          source: 'google',
        });
      }
    }

    const nominatim = await nominatimGeocode(address);
    if (nominatim) {
      return res.json(nominatim);
    }

    return res.status(404).json({ status: 'fail', message: 'Address not found' });
  } catch (error) {
    next(error);
  }
};

export const geocodePostcode: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const postcode = normalizePostcode(String(req.query.postcode || ''));
    if (!postcode) {
      return res.status(400).json({ status: 'fail', message: 'postcode query param is required' });
    }

    const compact = postcode.replace(/\s/g, '');
    const { data } = await axios.get<{
      status?: number;
      result?: { postcode: string; latitude: number; longitude: number };
    }>(`https://api.postcodes.io/postcodes/${encodeURIComponent(compact)}`, { timeout: 8000 });

    if (data.status !== 200 || !data.result) {
      return res.status(404).json({ status: 'fail', message: 'Postcode not found' });
    }

    return res.json({
      postcode: data.result.postcode,
      latitude: data.result.latitude,
      longitude: data.result.longitude,
      source: 'postcodes.io',
    });
  } catch (error) {
    next(error);
  }
};
