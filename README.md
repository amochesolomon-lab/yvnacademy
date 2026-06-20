# YVN Academy - React & Node.js Express Migration

This project has been migrated from a Python (Flask) codebase to a **React (Vite) frontend** and a **JavaScript (Express) backend**, using **SQLite (`database.db`)** for data persistence.

All original functionalities, user data, password compatibility, assets, and styling remain fully preserved.

---

## Folder Structure

- `/server.js` - Backend Express API server.
- `/package.json` - Backend configuration, packages, and startup scripts.
- `/static/` - Uploaded and static assets (thumbnails, PDFs, receipts). Reused directly from the original structure.
- `/database.db` - The SQLite database file (preserved containing all original data).
- `/client/` - React frontend application (initialized with Vite).
  - `/client/src/App.jsx` - Routing, Route Shields (`ProtectedRoute`, `AdminRoute`), and all frontend views.
  - `/client/src/context/AuthContext.jsx` - Global User Session context and Toast notifications.
  - `/client/src/components/Layout.jsx` - Main header navbar, Categories, search autocompleter, and footer.
  - `/client/src/index.css` - Complete styling imported directly from the original `style.css` (retaining full aesthetics).

---

## Requirements

- **Node.js** (v22.x or later recommended)
- **npm** (v10.x or later)

---

## Installation

Install dependencies for both the backend (root directory) and frontend (`/client` directory):

1. **Root (Backend) Installation**:
   ```bash
   npm install
   ```

2. **Client (Frontend) Installation**:
   ```bash
   cd client
   npm install
   ```

---

## Running the Application

There are two ways to run the project depending on whether you are developing or running a compiled version.

### 1. Development Mode (Hot Reloading)

Run the backend and frontend simultaneously. The frontend Vite dev server will proxy API and asset requests automatically to the backend on `http://localhost:5000`.

- **Terminal 1: Start Backend Server** (from root directory):
  ```bash
  npm run dev
  ```
  *(Runs backend on `http://localhost:5000` with nodemon)*

- **Terminal 2: Start Frontend Dev Server** (from `/client` directory):
  ```bash
  npm run dev
  ```
  *(Runs Vite dev server on `http://localhost:5173`)*

---

### 2. Production Mode (Single Process)

To run the application from a single port (like in a production environment), compile the React client, and Express will serve it automatically.

1. **Build the React frontend**:
   ```bash
   cd client
   npm run build
   ```

2. **Start the backend server**:
   ```bash
   cd ..
   npm start
   ```

3. Open **`http://localhost:5000`** in your browser. Express will host both the React frontend and all API endpoints.

---

## Features Migrated

1. **Database & password compatibility**: Existing Werkzeug scrypt passwords can log in seamlessly. New passwords are generated in the matching format.
2. **Search Autocomplete**: The search bar dynamically suggests matches from course listings.
3. **Receipt Submission**: Users can purchase courses by transferring money and uploading receipts.
4. **Ratings & reviews**: Approved enrolled students can submit conflict-handled ratings and reviews.
5. **Admin Controls**:
   - Approve / reject receipts (with custom reasoning).
   - Add/edit courses with dynamic file uploads (thumbnails, PDFs).
   - Toggle visibility and delete courses.
   - Student directories and details.
6. **PDF secure streaming**: Approved students can view and download PDF course materials streamed securely from Node.js (preventing hotlinking).
