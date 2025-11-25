# HTTPS Setup Guide

## Local Development

### Quick Start
```bash
npm run start:https
```
Access at https://localhost:3000

Browser will show security warning (normal for self-signed certificates). Click "Advanced" and proceed.

### Alternative: Environment Variable
Create `.env.local`:
```bash
HTTPS=true
```

Then run normally:
```bash
npm start
```

### Custom Certificate
If you have your own SSL certificate:

`.env.local`:
```bash
HTTPS=true
SSL_CRT_FILE=path/to/certificate.crt
SSL_KEY_FILE=path/to/private.key
```

## Production Deployment

### Option 1: Netlify (Recommended)

Automatic HTTPS, no configuration needed.

```bash
npm run build
```

Deploy via:
- Web UI: Drag `build` folder to netlify.com
- CLI: `netlify deploy --prod`
- Git: Connect repository for auto-deployment

Free SSL certificates via Let's Encrypt, auto-renewal included.

### Option 2: Vercel

Automatic HTTPS, edge network included.

```bash
npm install -g vercel
npm run build
vercel --prod
```

Free SSL certificates, auto-renewal, global CDN.

### Option 3: GitHub Pages

Automatic HTTPS for GitHub domains.

1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Update `package.json`:
```json
{
  "homepage": "https://username.github.io/repo-name",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

3. Deploy:
```bash
npm run deploy
```

4. Enable HTTPS in repository Settings > Pages > Enforce HTTPS

### Option 4: AWS S3 + CloudFront

Full control, pay-as-you-go pricing.

```bash
# Build
npm run build

# Upload to S3
aws s3 mb s3://bucket-name
aws s3 sync build/ s3://bucket-name

# Configure S3 for static hosting
# Create CloudFront distribution
# Request SSL certificate via AWS Certificate Manager
# Attach certificate to CloudFront
```

CloudFront handles HTTPS termination, redirects HTTP to HTTPS.

### Option 5: Self-Hosted (Nginx)

Full control, requires server management.

1. Build and upload:
```bash
npm run build
scp -r build/* user@server:/var/www/html
```

2. Install Nginx and Certbot:
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

3. Configure Nginx (`/etc/nginx/sites-available/default`):
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

4. Get SSL certificate:
```bash
sudo certbot --nginx -d yourdomain.com
```

Auto-renewal configured automatically.

## Platform Comparison

| Platform | HTTPS Setup | Cost | Ease | Custom Domain |
|----------|-------------|------|------|---------------|
| Netlify | Automatic | Free | Very Easy | Free |
| Vercel | Automatic | Free | Very Easy | Free |
| GitHub Pages | Automatic | Free | Easy | Free |
| AWS CloudFront | Manual | ~$1/mo | Moderate | Via Route53 |
| Self-hosted | Manual | $5+/mo | Difficult | Manual DNS |

## Security Best Practices

### Production Checklist
- Use HTTPS exclusively
- Enable HSTS headers
- Use TLS 1.2 or higher
- Implement Content Security Policy
- Regular certificate renewal (automated)
- Ensure all external resources use HTTPS

### Environment Variables
Verify HTTPS URLs in `.env`:
```bash
REACT_APP_SUPABASE_URL=https://project.supabase.co
```

## Testing

### Local
```bash
npm run start:https
```
Visit https://localhost:3000

### Production
- SSL Labs test: https://www.ssllabs.com/ssltest/
- Check browser DevTools console for mixed content warnings
- Test on multiple devices and browsers

## Troubleshooting

### "Your connection is not private"
Normal with self-signed certificates in development. Click "Advanced" and proceed.

For trusted local certificates:
```bash
# macOS
brew install mkcert
mkcert -install
mkcert localhost
```

### Mixed Content Errors
All external resources must use HTTPS:
- Supabase: Already HTTPS
- Chart.js CDN: Already HTTPS

### Certificate Expired
Let's Encrypt certificates auto-renew every 60 days. Verify:
```bash
sudo certbot renew --dry-run
```

## Recommendation

**Development**: `npm run start:https`

**Production**: Netlify or Vercel for easiest setup with free HTTPS.

**Advanced**: AWS CloudFront or self-hosted Nginx for full control.
