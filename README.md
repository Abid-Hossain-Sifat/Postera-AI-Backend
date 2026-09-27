# Postera AI — Backend

## Setup

```bash
npm install
```

## Environment Variables (.env)
```
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

## Run

```bash
# Development
npm run dev

# Seed templates (run once)
npm run seed

# Production build
npm run build
npm start
```

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login

### Templates (Public)
- GET /api/templates
- GET /api/templates/:id

### Posters (Auth required)
- POST /api/posters
- GET /api/posters/user/me
- GET /api/posters/:id
- POST /api/posters/:id/regenerate
- DELETE /api/posters/:id

### Upload (Auth required)
- POST /api/upload

### Admin (Admin role required)
- GET /api/admin/stats
- GET /api/admin/templates
- POST /api/admin/templates
- PATCH /api/admin/templates/:id
- DELETE /api/admin/templates/:id
- GET /api/admin/posters
- PATCH /api/admin/posters/:id/flag
