# 2800-202610-DTC06-PlantSafe

PlantSafe is a web app that consolidates Falling Fruit data into one interactive map with plant profiles, data source labels, and community-verified reviews and photos — helping Vancouver residents find and trust local foraging information.

---

## Technologies Used

| Category | Technology |
|----------|------------|
| **Frontend** | EJS, Tailwind CSS|
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB|
| **Authentication** | Passport.js (local + Google OAuth 2.0), QRCode (TOTP 2FA) |
| **APIs** | Falling Fruit API, Google Gemini API, Google Vision API|

---

## File Structure

```
2800-202610-DTC06/
├── config/          # Passport.js and other configuration files
├── models/          # MongoDB schemas (plant, user, review, viewHistory, etc.)
├── public/          # Static files served to the browser
│   ├── css/         # Stylesheets
│   └── js/          # Client-side JavaScript
├── routes/          # Express route handlers
│   ├── auth.js      # Login, signup, Google OAuth, 2FA
│   ├── plantRoutes.js
│   └── reviewRoutes.js
├── views/           # EJS HTML templates
│   └── partials/    # Reusable EJS components (nav, head, etc.)
├── helpers/         # Utility/helper functions
├── server.js        # App entry point
├── .env             # Environment variables (not in repo)
└── package.json
```

To generate a full file tree on macOS:
```bash
brew install tree
tree -I node_modules
```

On Windows:
```bash
tree /f
```

---

## Prerequisites

Before you begin, install the following:

- [Node.js](https://nodejs.org/) v18 or higher
- [Git](https://git-scm.com/)
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free tier is fine)
- A code editor — we recommend [VS Code](https://code.visualstudio.com/)

---

## How to Run This Project

### 1. Clone the repository

```bash
git clone https://github.com/ausc09/2800-202610-DTC06.git
cd 2800-202610-DTC06
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory with the following keys:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
SESSION_SECRET=your_session_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
FALLING_FRUIT_API_KEY=your_falling_fruit_api_key
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_VISION_API_KEY=your_google_vision_api_key
```

**Where to get API keys:**

| Key | Where to get it |
|-----|----------------|
| `MONGODB_URI` | MongoDB Atlas → your cluster → Connect |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/) |
| `GOOGLE_VISION_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/) |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/) |
| `FALLING_FRUIT_API_KEY` | Register at [fallingfruit.org](https://fallingfruit.org) to obtain an API key |

### 4. Seed the database (first time only)

Once the server is running, visit these URLs once to populate the database:

```
http://localhost:3000/api/seed-categories
http://localhost:3000/api/seed-locations
```

### 5. Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

---

## Test Login
 
To explore the app without creating an account, use the following test credentials:
 
| Role | Email | Password |
|------|-------|----------|
| Regular User | will add later | later |
| Admin | later | later |
 
> Or sign in with Google OAuth on the login page.
 
---

## Features

- **Interactive Map** — Browse edible plants near you on a Leaflet map, filtered by type, season, and safety status
- **Plant Profiles** — Detailed pages with name, location, season, and safety badge
- **AI Foraging Tip** — Upload a photo of a plant and get a Gemini-powered safety and identification tip (1 per user per day)
- **Community Reviews** — Leave reviews and photos on plant profiles
- **User Accounts** — Sign up with email or Google OAuth
- **Two-Factor Authentication (2FA)** — TOTP-based 2FA via Google Authenticator or Authy
- **View History** — See recently viewed plants on your profile
- **Admin Panel** — Manage users and content (admin role required)
- **Search & Filter** — Filter plants by name, season and verified status

---

## How We Used AI and APIs

**Google Gemini API (`gemini-3.1-flash-lite`)**
Used for the AI Foraging Tip feature. When a user uploads a photo on a plant profile page, we send the image (base64) along with plant metadata (name, scientific name, season, location) to the Gemini Vision model. The model identifies whether the photo matches the plant, provides foraging tips, safe preparation methods, and warns about toxic lookalikes. Rate-limited to 1 request per user per day, stored in MongoDB.

**Google Vision API**
Used for image label detection to identify whether an uploaded image contains a plant before passing it to Gemini.

**Falling Fruit API**
Used to seed the database with edible plant location data for Vancouver. We fetch location and type data, enrich it with plant category info, and store it in MongoDB for fast querying and filtering.

**Claude & ChatGPT**
Used during development for debugging assistance, code generation, and general development guidance.

---

## Credits & Attributions

- Leaflet.js map implementation — [leafletjs.com](https://leafletjs.com/examples/quick-start/)
- CartoDB basemap tiles — [carto.com/basemaps](https://carto.com/basemaps/)
- Plant data — [Falling Fruit](https://fallingfruit.org/)
- Icons — [Lucide](https://lucide.dev/)
- CSS framework — [Tailwind CSS](https://tailwindcss.com/)

---
 
## Troubleshooting
 
**`MongoDB connection failed`**
Check that your `MONGODB_URI` in `.env` is correct and that your IP address is whitelisted in MongoDB Atlas (Network Access → Add IP Address).
 
**`Cannot find module '...'`**
Run `npm install` again. A dependency may be missing.
 
**`AI Foraging Tip not working`**
Check that your `GEMINI_API_KEY` is valid and has not exceeded its daily quota in Google AI Studio.
 
---

## Limitations

- Plant safety status is community-sourced and may not be accurate — users can submit incorrect or misleading information.
- AI Foraging Tip is limited to 1 use per user per day.

---

## Team

| Name | BCIT SET |
|------|---------|
| Austyn Chan | 2F |
| Meiqi Zhao | 2E |
| Mittapap Bootphet | 2E |
| Robert Si | 1E |
| Sebastian Abarca | 1E |

---

## Contact

For questions, reach out via GitHub Issues or contact any team member through BCIT.
