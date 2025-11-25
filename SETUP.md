# Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```bash
REACT_APP_LOGGING=true
REACT_APP_MOBILE_ONLY=true
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Setup Supabase Database

Create a Supabase project at https://supabase.com

Run database setup scripts in order:
```bash
# 1. Create tables and views
psql -f supabase-schema.sql

# 2. Configure Row Level Security
psql -f enable-rls-final.sql
```

Or use Supabase SQL Editor to run the scripts directly.

### 4. Start Development Server
```bash
npm start
```

Access at http://localhost:3000

For HTTPS:
```bash
npm run start:https
```

## Database Tables

The application uses 6 main tables:

1. **participants** - Participant metadata
2. **vas_scores** - Visual Analogue Scale measurements
3. **panas_scores** - PANAS emotional state assessments
4. **math_task_performance** - Math task detailed results
5. **speech_task_feedback** - Speech task audio metrics
6. **speech_task_analysis** - Aggregated speech analysis

Plus 1 view:
- **participant_complete_data** - Flattened data for export

## Configuration Options

### Environment Variables

**REACT_APP_LOGGING**
- `true`: Enable data collection
- `false`: Disable (presentation mode)

**REACT_APP_MOBILE_ONLY**
- `true`: Restrict to mobile devices only
- `false`: Allow desktop (experimental)

**REACT_APP_SUPABASE_URL**
- Your Supabase project URL

**REACT_APP_SUPABASE_ANON_KEY**
- Your Supabase anonymous/public key

## Admin Dashboard

Open `admin-dashboard.html` directly in your browser. No server required.

Update Supabase credentials in the file if different from main app:
```javascript
const SUPABASE_URL = 'your-url';
const SUPABASE_ANON_KEY = 'your-key';
```

Features:
- Real-time participant statistics
- Data visualization with charts
- CSV export functionality

## Troubleshooting

### Database Connection Issues
- Verify Supabase URL and key in `.env`
- Check RLS policies are enabled
- Ensure anonymous role has permissions

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### HTTPS Certificate Warnings
Normal for local development with self-signed certificates. Click "Advanced" and proceed.

## Production Deployment

See `HTTPS_SETUP.md` for detailed deployment instructions.

Recommended platforms:
- **Netlify**: Automatic HTTPS, free tier
- **Vercel**: Automatic HTTPS, edge network
- **AWS CloudFront**: Full control, scalable

## Data Privacy

Default: logging disabled in `.env.example`

Before enabling production data collection:
1. Review data privacy compliance requirements
2. Update privacy policy
3. Configure appropriate RLS policies
4. Implement data retention policies
5. Setup secure backup procedures

## Support

For questions or issues, contact project maintainers:
https://www.uni-bielefeld.de/fakultaeten/technische-fakultaet/arbeitsgruppen/multimodal-behavior-processing/
