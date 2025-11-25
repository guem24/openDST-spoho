# Digital Stress Test

React-based stress assessment application with Supabase backend for study management.

## Overview

Digital Stress Test implements a standardized stress assessment protocol. Built with React 16, Material-UI, and Supabase for data persistence. This version has been modified from the original JATOS-based implementation.

Reference: https://dx.doi.org/10.2196/32280

## Project Structure

```
src/
├── Main.js              # Central state management and study orchestration
├── pages/               # Study pages (StartPage, MathTask, SpeechTask, etc.)
├── components/          # Reusable UI components
├── services/            # API services (Supabase integration)
├── locales/             # Internationalization files (i18n)
└── img/                 # Images and logos
```

## Key Components

### Main.js
Central component managing:
- Study state and navigation
- Data collection
- Page sequencing via `studyPagesSequence` array
- Slide navigation via `slideSequences` object

### Study Flow
Eight states define the study progression:
1. startPage
2. introduction
3. mathTaskTutorial
4. mathTask
5. mathTaskResult
6. speechTaskTutorial
7. speechTask
8. endPage

Navigation controlled by `pageIndex` and `slideIndex` state variables.

## Configuration

### Environment Variables (.env)
```bash
REACT_APP_LOGGING=true                    # Enable data collection
REACT_APP_MOBILE_ONLY=true                # Restrict to mobile devices
REACT_APP_SUPABASE_URL=your-url           # Supabase project URL
REACT_APP_SUPABASE_ANON_KEY=your-key      # Supabase anonymous key
```

Note: Mobile-only mode is default. Desktop layout not yet implemented.

## Development

### Prerequisites
- Node.js 14+
- npm or yarn

### Installation
```bash
npm install
```

### Run Development Server
```bash
npm start
```
Access at http://localhost:3000

### Run with HTTPS
```bash
npm run start:https
```
Access at https://localhost:3000

### Build for Production
```bash
npm run build
```
Outputs to `/build` directory.

## Database

### Supabase Setup
1. Create Supabase project
2. Run `supabase-schema.sql` to create tables
3. Run `enable-rls-final.sql` to configure Row Level Security
4. Add credentials to `.env`

### Tables
- participants
- vas_scores
- panas_scores
- math_task_performance
- speech_task_feedback
- speech_task_analysis

## Admin Dashboard

Access `admin-dashboard.html` directly in browser to:
- View participant statistics
- Export data as CSV
- Visualize data insights with charts

## Data Privacy

Default configuration: logging disabled. Video recording capability exists but requires dedicated security implementation. Contact project maintainers before enabling data collection in production.

## Deployment

See `HTTPS_SETUP.md` for deployment options:
- Netlify (recommended)
- Vercel
- AWS S3 + CloudFront
- Self-hosted

## Internationalization

Managed via i18next. Supported languages:
- German (de)
- English (en)

Language files located in `/src/locales/`

## Browser Compatibility

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Mobile browsers recommended for optimal experience.

## License

Contact maintainers for usage permissions: https://www.uni-bielefeld.de/fakultaeten/technische-fakultaet/arbeitsgruppen/multimodal-behavior-processing/

## Technical Stack

- React 16.14
- Material-UI 4.11
- Supabase (PostgreSQL)
- Chart.js
- i18next
- React Router
