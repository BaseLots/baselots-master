# BaseLots Dashboard

The BaseLots Dashboard is a comprehensive property browsing and investment interface for fractional real estate investing. It provides a modern, responsive UI for discovering, filtering, and investing in fractional property shares.

## Features

### Property Discovery
- **Grid/List Views**: Toggle between grid and list layouts for browsing properties
- **Advanced Filtering**: Filter by price, yield, property type, and location
- **Real-time Search**: Search by property name, address, city, or state
- **Property Cards**: Rich cards showing key investment metrics at a glance

### Property Details
- **Full-screen Detail View**: Slide-out panel with comprehensive property information
- **Image Gallery**: Browse multiple property photos with navigation
- **Financial Metrics**: View yields, projected returns, and funding progress
- **Investment Calculator**: Real-time calculation of shares and expected returns
- **Neighborhood Data**: School ratings, crime index, and neighborhood scores

### Investment Flow
- **Progress Tracking**: Visual progress bars showing funding status
- **Investment Form**: Simple form to enter investment amount
- **Share Calculation**: Automatic calculation of shares based on investment
- **Success Feedback**: Confirmation after investment submission

## Project Structure

```
src/
├── app/dashboard/
│   └── page.tsx                 # Dashboard page entry point
├── components/dashboard/
│   ├── Dashboard.tsx            # Main dashboard component with filters & layout
│   ├── PropertyCard.tsx         # Individual property card component
│   ├── PropertyDetail.tsx       # Property detail slide-out panel
│   ├── InvestmentCalculator.tsx # Standalone ROI calculator
│   └── PortfolioViz.tsx         # 3D portfolio visualization
├── components/ui/               # shadcn/ui components
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── progress.tsx             # Custom progress bar component
│   ├── select.tsx
│   ├── sheet.tsx
│   └── ...
├── types/
│   └── property.ts              # TypeScript types for properties
└── data/
    └── mockProperties.ts        # Mock data for 4 sample properties
```

## Adding Real Data

### Step 1: Define Your Data Source

Update the data fetching logic in `Dashboard.tsx` to replace mock data:

```typescript
// In Dashboard.tsx, replace:
import { mockProperties } from '@/data/mockProperties';

// With your API call:
const [properties, setProperties] = useState<Property[]>([]);

useEffect(() => {
  fetch('/api/properties')
    .then(res => res.json())
    .then(data => setProperties(data));
}, []);
```

### Step 2: Property Schema

Ensure your API returns data matching the `Property` interface:

```typescript
interface Property {
  id: string;                    // Unique identifier
  name: string;                  // Property name
  address: string;               // Street address
  city: string;
  state: string;
  zipCode: string;
  images: string[];              // Array of image URLs
  description: string;
  propertyType: 'single-family' | 'multi-family' | 'condo' | 'townhouse';
  yearBuilt: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize: number;
  
  // Financials
  totalValue: number;            // Total property value in dollars
  pricePerShare: number;         // Cost per share (e.g., 50, 100)
  totalShares: number;           // Total available shares
  availableShares: number;       // Remaining shares
  expectedYield: number;         // Annual yield percentage
  projectedReturn: number;       // 5-year projected return %
  monthlyRent: number;
  
  // Progress
  sharesSold: number;
  investmentDeadline: string;    // ISO date string
  
  // Meta
  amenities: string[];
  neighborhoodRating: number;    // 1-10
  schoolRating: number;          // 1-10
  crimeIndex: 'low' | 'moderate' | 'high';
  status: 'available' | 'funding' | 'funded' | 'closed';
}
```

### Step 3: Investment Submission

Update the investment handler in `PropertyDetail.tsx`:

```typescript
const handleInvest = async () => {
  const response = await fetch('/api/investments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      propertyId: property.id,
      amount: Number(investmentAmount),
      shares: estimatedShares,
    }),
  });
  
  if (response.ok) {
    setShowSuccess(true);
  }
};
```

### Step 4: Image Storage

Configure your image domains in `next.config.ts`:

```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-cdn.com',
      },
    ],
  },
};
```

## Customization

### Theming

The dashboard uses the existing BaseLots design system with:
- **Primary Color**: `#FF5722` (Orange/Red accent)
- **Secondary Color**: `#00bcd4` (Cyan for financial metrics)
- **Background**: Black with 3D city scene
- **Cards**: Semi-transparent black (`bg-black/60`) with blur

Modify colors in:
- `src/app/globals.css` - CSS variables
- Component files - Tailwind classes

### Adding New Filter Options

1. Update `PropertyFilters` interface in `src/types/property.ts`
2. Add UI controls in `Dashboard.tsx` filter section
3. Update the `filteredProperties` useMemo logic

### Modifying Property Cards

Edit `PropertyCard.tsx` to:
- Change displayed information
- Modify card layout
- Add new badges or indicators
- Adjust animations

## API Endpoints Needed

For full functionality, implement these endpoints:

```
GET  /api/properties           # List all available properties
GET  /api/properties/:id       # Get single property details
POST /api/investments          # Submit new investment
GET  /api/investments          # List user's investments (for portfolio)
GET  /api/user/balance         # Get user's available balance
```

## Environment Variables

Create `.env.local`:

```bash
# API Base URL
NEXT_PUBLIC_API_URL=https://api.baselots.com

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

## Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

## Dependencies

Key dependencies used:
- `next` - React framework
- `react` / `react-dom` - UI library
- `@radix-ui/*` - Headless UI primitives
- `tailwindcss` - Styling
- `lucide-react` - Icons
- `framer-motion` - Animations (via shadcn)
- `@react-three/fiber` - 3D background

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Notes

- Images are optimized using Next.js Image component
- 3D background uses dynamic import with SSR disabled
- Property data can be fetched statically or server-side
- Filtering happens client-side for instant feedback

## License

Proprietary - BaseLabs Inc.
