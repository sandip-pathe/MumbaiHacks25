# ReguPulse - Vite Frontend

This is the new Vite-based frontend for ReguPulse AI Compliance Engine.

## Quick Start

### Development
```bash
npm install
npm run dev
```

The app will be available at http://localhost:3000

### Build for Production
```bash
npm run build
npm run preview
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
VITE_API_URL=http://localhost:8000
GEMINI_API_KEY=your_gemini_api_key_here
```

## API Integration

The frontend connects to the FastAPI backend running on port 8000. The Vite dev server is configured with a proxy to handle API requests:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

API calls can be made using the `apiClient` from `lib/api-client.ts`:

```typescript
import { apiClient } from './lib/api-client';

// Example: Get dashboard stats
const response = await apiClient.getDashboardStats();
```

## Project Structure

```
frontend-main/
├── components/        # Reusable UI components
│   └── ui/           # Base UI components (Button, Card, etc.)
├── views/            # Page-level components
├── lib/              # Utilities and API client
├── types.ts          # TypeScript type definitions
├── constants.ts      # Mock data and constants
├── App.tsx           # Main application component
└── index.tsx         # Application entry point
```

## Technologies

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling (via CDN)
- **Lucide React** - Icons
- **Recharts** - Data visualization

## Features

- Modern, responsive UI with glassmorphism design
- Client-side routing (view-based navigation)
- API integration with FastAPI backend
- Real-time compliance scanning visualization
- Jira integration UI
- Agent execution logs
- Compliance dashboard with metrics
