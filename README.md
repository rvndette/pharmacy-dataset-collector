# Mobile Pharmacy Dataset Collector

A robust, real-time behavioral biometrics collection platform disguised as a mobile pharmacy application. This project is built using React Native (TypeScript) for the frontend and Node.js/Express with MongoDB for the backend.

## Overview

The primary goal of this application is to simulate a realistic pharmacy workflow—including user registration, drug searching, viewing medication details, prescription uploading, and digital signing—while continuously recording user micro-interactions.

These interactions (keystroke dynamics, touch gestures, scroll velocity, dwell time, and signature trajectories) are captured with high precision and periodically synced to the backend in a batched, throttled manner to ensure smooth UI performance without disrupting the user experience.

## Project Structure

The repository is divided into two main components:

- **`frontend/`**: The React Native mobile application.
- **`backend/`**: The Node.js, Express, and MongoDB backend server.

---

### Frontend

The mobile app simulates a pharmacy where users can perform standard actions while their interaction data is silently logged in the background.

- **Stack**: React Native 0.84, React Navigation, TypeScript
- **Key Features**:
  - Full pharmacy user journey simulation.
  - Custom `InteractionLogger` for capturing gestures, keystrokes, and scroll events.
  - Buffered and batched log sync mechanism using throttling to avoid blocking the main thread.
  - Precise timestamping using `performance.now()` combined with `Date.now()`.

#### Running the Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Metro bundler:
   ```bash
   npm start
   ```
4. Run on a simulator or device:
   ```bash
   npm run android
   # or
   npm run ios
   ```

---

### Backend

The backend receives the batched biometrics data and manages the user state.

- **Stack**: Node.js, Express, TypeScript, MongoDB (Mongoose)
- **Key Features**:
  - Secure API endpoints for user authentication.
  - Specialized endpoints for receiving and storing `InteractionLog` data.
  - Data models designed to handle high-frequency biometric payloads.

#### Running the Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables. Create a `.env` file in the `backend` directory:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/mobile-pharmacy
   JWT_SECRET=your_jwt_secret_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Biometrics Collected

- **Keystroke Dynamics**: Typed keys, flight time, and dwell time.
- **Touch Gestures**: Tap locations (X/Y coordinates) and interaction duration.
- **Scroll Behavior**: Scroll offsets, velocity, and timestamps.
- **Dwell Time**: Time spent observing specific screens or interacting with fields.
- **Signature Trajectory**: X/Y points, continuous paths, and drawing speed during the digital signature phase.

## Data Logging Architecture

The application focuses on non-blocking data collection:
1. **Local Buffering**: Interactions are recorded into a local buffer via an `InteractionLogger` utility.
2. **Throttled Sync**: A throttled sync mechanism flushes the buffer to the backend at regular intervals (e.g., every 5 seconds) or when the buffer reaches a specific size.
3. **Background Processing**: The sync process runs asynchronously to guarantee that UI interactions (like scrolling and typing) remain stutter-free.
