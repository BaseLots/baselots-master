import { Property } from '@/types/property';

export const mockProperties: Property[] = [
  {
    id: 'prop-001',
    name: 'Sunset Heights Villa',
    address: '2847 Sunset Boulevard',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90028',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    ],
    description: 'Stunning modern villa in the heart of Hollywood Hills. This beautifully renovated property features panoramic city views, an infinity pool, and smart home technology throughout. Perfect for short-term rental income with strong appreciation potential.',
    propertyType: 'single-family',
    yearBuilt: 2015,
    bedrooms: 4,
    bathrooms: 3.5,
    squareFeet: 3200,
    lotSize: 0.25,
    
    totalValue: 2450000,
    pricePerShare: 100,
    totalShares: 24500,
    availableShares: 18400,
    expectedYield: 8.5,
    projectedReturn: 42,
    monthlyRent: 18500,
    
    sharesSold: 6100,
    investmentDeadline: '2026-06-15',
    
    amenities: [
      'Infinity Pool',
      'Smart Home System',
      'Rooftop Terrace',
      'Wine Cellar',
      'Home Theater',
      'EV Charging',
    ],
    neighborhoodRating: 9,
    schoolRating: 8,
    crimeIndex: 'low',
    status: 'available',
  },
  {
    id: 'prop-002',
    name: 'Austin Urban Lofts',
    address: '422 E 6th Street',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    ],
    description: 'Premium downtown Austin loft in the vibrant 6th Street District. Walkable to tech hubs, restaurants, and entertainment. High demand from young professionals makes this a cash-flow powerhouse with excellent occupancy rates.',
    propertyType: 'condo',
    yearBuilt: 2019,
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1450,
    lotSize: 0,
    
    totalValue: 875000,
    pricePerShare: 50,
    totalShares: 17500,
    availableShares: 4200,
    expectedYield: 7.8,
    projectedReturn: 38,
    monthlyRent: 6800,
    
    sharesSold: 13300,
    investmentDeadline: '2026-04-30',
    
    amenities: [
      'Rooftop Pool',
      'Fitness Center',
      'Co-working Space',
      'Dog Park',
      'Package Lockers',
      'Bike Storage',
    ],
    neighborhoodRating: 9,
    schoolRating: 7,
    crimeIndex: 'low',
    status: 'funding',
  },
  {
    id: 'prop-003',
    name: 'Phoenix Desert Oasis',
    address: '7812 N Central Avenue',
    city: 'Phoenix',
    state: 'AZ',
    zipCode: '85020',
    images: [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
    ],
    description: 'Beautiful Southwest-style home in the sought-after North Central Phoenix corridor. Recently updated with energy-efficient features perfect for the desert climate. Strong rental market with snowbird seasonal demand.',
    propertyType: 'single-family',
    yearBuilt: 2008,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 2100,
    lotSize: 0.35,
    
    totalValue: 685000,
    pricePerShare: 50,
    totalShares: 13700,
    availableShares: 8900,
    expectedYield: 9.2,
    projectedReturn: 45,
    monthlyRent: 6200,
    
    sharesSold: 4800,
    investmentDeadline: '2026-05-20',
    
    amenities: [
      'Swimming Pool',
      'Covered Patio',
      'Solar Panels',
      'Desert Landscaping',
      'Two-Car Garage',
      'Security System',
    ],
    neighborhoodRating: 8,
    schoolRating: 9,
    crimeIndex: 'low',
    status: 'available',
  },
  {
    id: 'prop-004',
    name: 'Miami Beachfront Condo',
    address: '1500 Ocean Drive',
    city: 'Miami Beach',
    state: 'FL',
    zipCode: '33139',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80',
    ],
    description: 'Luxury oceanfront condo on iconic Ocean Drive. Direct beach access with stunning Atlantic views. Premium finishes and resort-style amenities. High appreciation potential in Miami\'s booming luxury market.',
    propertyType: 'condo',
    yearBuilt: 2021,
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1280,
    lotSize: 0,
    
    totalValue: 1650000,
    pricePerShare: 100,
    totalShares: 16500,
    availableShares: 15200,
    expectedYield: 6.8,
    projectedReturn: 55,
    monthlyRent: 12500,
    
    sharesSold: 1300,
    investmentDeadline: '2026-07-01',
    
    amenities: [
      'Private Beach Access',
      'Infinity Pool',
      'Spa & Wellness Center',
      '24/7 Concierge',
      'Valet Parking',
      'Private Balcony',
    ],
    neighborhoodRating: 10,
    schoolRating: 7,
    crimeIndex: 'low',
    status: 'available',
  },
];

// Helper function to get a property by ID
export function getPropertyById(id: string): Property | undefined {
  return mockProperties.find(p => p.id === id);
}

// Helper function to calculate investment progress percentage
export function getInvestmentProgress(property: Property): number {
  return Math.round((property.sharesSold / property.totalShares) * 100);
}

// Helper function to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper function to format percentage
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Helper function to calculate days remaining
export function getDaysRemaining(deadline: string): number {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
