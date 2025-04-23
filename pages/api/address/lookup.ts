import { NextApiRequest, NextApiResponse } from 'next';

const GETADDRESS_API_KEY = process.env.GETADDRESS_API_KEY;
const GETADDRESS_API_URL = 'https://api.getaddress.io/find';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { postcode, house_number } = req.query;

  if (!postcode) {
    return res.status(400).json({ message: 'Postcode is required' });
  }

  try {
    // If both postcode and house number are provided, search for a specific address
    if (house_number) {
      const response = await fetch(
        `${GETADDRESS_API_URL}/${postcode}/${house_number}?api-key=${GETADDRESS_API_KEY}&expand=true`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.Message || 'Failed to fetch address');
      }

      return res.status(200).json(data);
    }

    // If only postcode is provided, get all addresses for that postcode
    const response = await fetch(
      `${GETADDRESS_API_URL}/${postcode}?api-key=${GETADDRESS_API_KEY}&expand=true`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.Message || 'Failed to fetch addresses');
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Address lookup error:', error);
    return res.status(500).json({ 
      message: 'Error looking up address',
      error: (error as Error).message 
    });
  }
} 