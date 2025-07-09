export const mockProperty = {
  id: '1',
  status: 'To Rent',
  availableNow: true,
  title: 'Modern 2 Bed Apartment',
  price: 2500,
  priceUnit: '/month',
  address: '123 Main St, Swiss Cottage',
  beds: 2,
  baths: 1,
  area: 800,
  areaUnit: 'sq ft',
  images: [
    {
      src: '/images/listings/property-main.jpg',
      alt: 'Main View',
      label: 'Main View',
    },
    {
      src: '/images/listings/property-living.jpg',
      alt: 'Living Room',
      label: 'Living Room',
    },
    {
      src: '/images/listings/property-kitchen.jpg',
      alt: 'Kitchen',
      label: 'Kitchen',
    },
    {
      src: '/images/listings/property-bedroom.jpg',
      alt: 'Bedroom',
      label: 'Bedroom',
    },
    {
      src: '/images/listings/property-bathroom.jpg',
      alt: 'Bathroom',
      label: 'Bathroom',
    },
    {
      src: '/images/listings/property-garden.jpg',
      alt: 'Garden',
      label: 'Garden',
    },
  ],
  isFavorited: false,
  agent: {
    company: 'Proptii Agents',
    name: 'John Smith',
  },
  actions: [
    { type: 'chat', label: 'Chat' },
    { type: 'call', label: 'Call' },
    { type: 'email', label: 'Email' },
  ],
};

export const mockProperties = [
  // Diverse properties for demo
  {
    ...mockProperty,
    id: '101',
    title: '2-bedroom flat in Orpington',
    address: '45 High St, Orpington',
  },
  {
    ...mockProperty,
    id: '102',
    title: 'Luxury Flat in Bromley',
    address: '12 Market Square, Bromley',
  },
  {
    ...mockProperty,
    id: '103',
    title: 'Spacious 3 Bed House',
    address: '99 Elm Road, Orpington',
  },
  {
    ...mockProperty,
    id: '104',
    title: 'Modern Studio Apartment',
    address: '1 Central Ave, London',
  },
  // Existing mock properties (randomized)
  ...Array.from({ length: 30 }, (_, i) => ({
    ...mockProperty,
    id: String(i + 1),
    title: `Modern 2 Bed Apartment #${i + 1}`,
  })),
]; 