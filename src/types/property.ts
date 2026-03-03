export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  images: string[];
  description: string;
  propertyType: 'single-family' | 'multi-family' | 'condo' | 'townhouse';
  yearBuilt: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize: number;
  
  // Financials
  totalValue: number;
  pricePerShare: number;
  totalShares: number;
  availableShares: number;
  expectedYield: number; // Annual percentage
  projectedReturn: number; // 5-year projected return percentage
  monthlyRent: number;
  
  // Investment progress
  sharesSold: number;
  investmentDeadline: string;
  
  // Additional info
  amenities: string[];
  neighborhoodRating: number; // 1-10
  schoolRating: number; // 1-10
  crimeIndex: 'low' | 'moderate' | 'high';
  
  // Status
  status: 'available' | 'funding' | 'funded' | 'closed';
}

export interface Investment {
  id?: string;
  propertyId: string;
  userId: string;
  shares: number;
  amount: number;
  date: string;
}

export interface PropertyFilters {
  minPrice?: number;
  maxPrice?: number;
  minYield?: number;
  propertyType?: string;
  state?: string;
}
