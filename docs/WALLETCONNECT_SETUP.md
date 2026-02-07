# WalletConnect Setup Guide

To enable full wallet connection functionality in SwiftPay, you need a WalletConnect Project ID.

## Quick Setup (5 minutes)

### 1. Create WalletConnect Account

1. Go to https://cloud.walletconnect.com
2. Click **"Get Started"** or **"Sign Up"**
3. Sign up with GitHub, Google, or Email

### 2. Create New Project

1. Click **"Create New Project"**
2. Enter project name: **SwiftPay**
3. Click **"Create"**

### 3. Get Project ID

1. On your project dashboard, find **"Project ID"**
2. Copy the project ID (looks like: `a1b2c3d4e5f6g7h8...`)

### 4. Update Environment File

1. Open `frontend/.env.local`
2. Replace this line:
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
   ```
   
   With your actual project ID:
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=a1b2c3d4e5f6g7h8...
   ```

3. Save the file
4. Restart the frontend dev server

### 5. Verify

1. Refresh your browser
2. Click **"Connect Wallet"**
3. You should see the wallet connection modal without errors

## Free Plan Limits

WalletConnect's **Free Plan** includes:
- ✅ Unlimited wallet connections
- ✅ Unlimited monthly requests
- ✅ Perfect for development and production

## Troubleshooting

### Still seeing 403 errors?

1. Check that you copied the entire Project ID
2. Ensure no extra spaces in `.env.local`
3. Restart the dev server: `Ctrl+C` then `npm run dev`
4. Clear browser cache and reload

### Want to skip WalletConnect?

If you prefer to skip this step for now:
- The app will work with basic wallet connections
- Some advanced features may be limited
- Recommended to set up before production deployment

---

**Next Steps:** Once WalletConnect is configured, your wallet connection will be fully functional and the Avail Nexus integration (if you re-enable the UI) will initialize properly.
