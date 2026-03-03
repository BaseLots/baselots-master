export interface Lot {
  _id?: string;
  name: string;
  location: string;
  image: string;
  aiValuation: number;
  price: number;
  size: number;
  description: string;
}

export interface Investment {
  _id?: string;
  lotId: string;
  userId: string;
  amount: number;
  shares: number;
  date: Date;
}
