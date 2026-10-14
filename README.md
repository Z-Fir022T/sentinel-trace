# SentinelTrace

Defensive cybersecurity suite for generating tracking canary spreadsheets, inspecting document beacons, auditing compromised emails, and analyzing IP intelligence.

## Features

- 🐦 **Canary Token Generator**: Create honeytoken Excel spreadsheets with embedded beacons
- 📊 **Live Map**: Real-time visualization of attacker locations via IP geolocation
- ⚠️ **Email Breach Audit**: Check if emails/domains appear in known breach databases
- 🔍 **File Inspector**: Analyze Excel files for tracking formulas and beacons
- 🌍 **IP Intelligence**: Lookup IP details (geolocation, ISP, datacenter detection)

## Local Development

```bash
npm install
npm run dev
```

Server runs on `http://localhost:3000`

## Production Deployment

### Deploy to Railway

1. Create Railway account at [railway.app](https://railway.app)
2. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```
3. Login and deploy:
   ```bash
   railway login
   cd sentinel-trace
   railway up
   ```

Or use Railway dashboard:
1. Create new project
2. Connect GitHub repository (fork this repo)
3. Set environment variable `APP_URL` to your Railway domain
4. Deploy automatically

### Environment Variables

```env
NODE_ENV=production
PORT=3000
APP_URL=https://your-domain.railway.app
```

## API Endpoints

- `GET /api/system/config` - System configuration
- `GET /api/canary/tokens` - List all canary tokens
- `POST /api/canary/create` - Create new token
- `GET/POST /api/canary/ping/:tokenId` - Register token access
- `GET /api/canary/logs` - Access logs
- `POST /api/canary/simulate-attacker` - Simulate attacker scenario
- `POST /api/breach/check` - Check email breach status
- `GET /api/ip/lookup/:ip` - Lookup IP details

## Architecture

- **Backend**: Express.js + TypeScript
- **Frontend**: React 19 + Vite + TailwindCSS
- **Maps**: Leaflet + OpenStreetMap
- **Excel**: XLSX library
- **IP Lookup**: ip-api.com

## Build

```bash
npm run build
```

Outputs to `dist/` directory.

## License

Defensive security use only.
