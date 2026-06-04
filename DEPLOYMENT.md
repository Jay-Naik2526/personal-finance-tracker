# Deployment Guide for Finance Tracker

This guide covers how to deploy your MERN application to Vercel. Since we have both `client` and `server` in one repository, we will deploy them as **two separate projects** on Vercel.

## Prerequisites

1.  **GitHub Account**: Ensure your code is pushed to a GitHub repository.
2.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com) using your GitHub account.
3.  **MongoDB Atlas**: You should have your connection string ready (from your `.env` file).

---

## Step 1: Push Code to GitHub

If you haven't already, commit your changes and push to GitHub:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

---

## Step 2: Deploy Backend (Server)

1.  Go to your Vercel Dashboard and click **"Add New..."** -> **"Project"**.
2.  Import your **Personal Finance Tracker** repository.
3.  **Configure Project**:
    *   **Project Name**: `finance-tracker-api` (or similar).
    *   **Framework Preset**: Select **Other**.
    *   **Root Directory**: Click "Edit" and select `server`.
4.  **Environment Variables**:
    Expand the "Environment Variables" section and add:
    *   `MONGODB_URI`: Your MongoDB connection string (e.g., `mongodb+srv://...`).
    *   `JWT_SECRET`: Your secret key (e.g., `mysecretkey123`).
5.  Click **Deploy**.

**Wait for deployment to finish.**
Once done, copy the **Domains** URL (e.g., `https://finance-tracker-api.vercel.app`).
**IMPORTANT**: This is your `Back-End URL`.

---

## Step 3: Deploy Frontend (Client)

1.  Go back to Vercel Dashboard and add another **New Project**.
2.  Import the **SAME** repository again.
3.  **Configure Project**:
    *   **Project Name**: `finance-tracker-web` (or similar).
    *   **Framework Preset**: Vercel should auto-detect **Vite**.
    *   **Root Directory**: Click "Edit" and select `client`.
4.  **Environment Variables**:
    Add the following variable so the frontend knows where the backend is:
    *   `VITE_API_URL`: Paste your **Back-End URL** from Step 2 (e.g., `https://finance-tracker-api.vercel.app`).
        *   *Note: Do not add a trailing slash `/`.*
5.  Click **Deploy**.

---

## Step 4: Final Verification

1.  Open your new Frontend URL (e.g., `https://finance-tracker-web.vercel.app`).
2.  Try to **Login** or **Register**.
3.  If it works, congratulations! Your app is live. 🚀

## Troubleshooting

*   **CORS Error?**
    If the frontend fails to talk to the backend, you might need to update the `cors` configuration in `server/index.js` to allow your new frontend domain.
    *   *Quick Fix for now*: The current code allows all origins (`cors()`), so it should work out of the box.
