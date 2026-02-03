# Repository Cleanup Guide

## Files/Folders to Remove

### 1. instant-rail folder (Old Vite Frontend)
The `instant-rail` folder contains the old Vite + React frontend. This has been successfully migrated to Next.js in the `frontend` folder.

**To remove from local and git:**
```bash
# Remove from filesystem
rm -rf instant-rail

# Remove from git history (if already committed)
git rm -rf instant-rail
git commit -m "Remove old Vite frontend (migrated to Next.js)"
```

### 2. Root package-lock.json
The root `package-lock.json` is not needed as each project (contracts, frontend) has its own.

**To remove:**
```bash
rm package-lock.json
git rm package-lock.json
git commit -m "Remove unnecessary root package-lock.json"
```

## Current Project Structure

```
SwiftPay/
├── contracts/          # Hardhat smart contracts
│   ├── src/
│   ├── scripts/
│   └── package.json
├── frontend/           # Next.js frontend (NEW)
│   ├── app/
│   ├── components/
│   └── package.json
└── .gitignore
```

## Ready for Git Push

After cleanup, the repository will be clean and ready for pushing:

```bash
git add .
git commit -m "Clean up repository and fix Next.js migration"
git push origin main
```
