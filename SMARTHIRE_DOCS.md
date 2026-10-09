# SmartHire – AI Interview Performance Analyzer

## Project Overview
SmartHire is an AI-powered platform designed to revolutionize interview preparation and recruitment.

### Tech Stack
- **Frontend (Mobile):** Flutter (Material 3, Riverpod, GoRouter, Animate)
- **Backend:** Node.js (Express, Mongoose, JWT)
- **AI/ML:** TFLite (integrated in Flutter), OpenCV (for body language)
- **Database:** MongoDB (User data, Reports)
- **Authentication:** Firebase & JWT

## Folder Structure
- `mobile_app/`: Flutter mobile application.
- `backend/`: Node.js Express server.
- `app/`: Original Jetpack Compose Android app (kept for reference).
- `web/`: Next.js web application (previously generated).

## Key Features Implemented
- **Premium Glassmorphism UI:** Modern AI theme with blue/purple gradients.
- **Secure Authentication:** JWT-based login with field validation.
- **AI Performance Dashboard:** Real-time score tracking and confidence meters.
- **Mock Interview Simulator:** Integrated UI for camera feed and AI analysis overlays.

## Setup Instructions

### Backend
1. `cd backend`
2. `npm install`
3. Create a `.env` file with `JWT_SECRET` and `MONGO_URI`.
4. `npm start`

### Mobile App
1. `cd mobile_app`
2. `flutter pub get`
3. Connect an emulator or device.
4. `flutter run`

### Web App (Next.js)
1. `cd web`
2. `npm install`
3. `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Next Steps
- Implement **TFLite models** for real-time facial emotion recognition in `mobile_app/lib/data/services/ai_service.dart`.
- Integrate **Firebase Cloud Storage** for high-quality video interview recordings.
- Expand to **50 screens** following the architecture provided in `lib/ui/screens`.
