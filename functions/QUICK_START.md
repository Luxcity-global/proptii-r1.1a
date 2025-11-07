# Quick Start: Real UK Market Data

## 🎯 Goal
Integrate real UK regulatory data from GOV.UK (and optionally ONS) into your Market Insights cards.

---

## ⚡ 2-Minute Setup (GOV.UK Only - No API Key Needed!)

### Step 1: Install Dependencies
```bash
cd functions
npm install
```

### Step 2: Deploy
```bash
npm run build
cd ..
firebase deploy --only functions
```

### Step 3: Test
Visit the manual trigger URL (shown after deployment) or wait for scheduled run (Monday 9 AM).

**That's it!** GOV.UK RSS feed is publicly accessible - no API key needed.

---

## 📊 What You'll Get

### From GOV.UK (Always Available):
- **EPC requirements** (automatically detected)
- **Landlord regulations** (automatically detected)
- **Housing policy changes** (automatically detected)

### From ONS (Optional - Add Later):
- **Rental price trends** (year-over-year % changes)
- **Example**: "Rental prices increased 5.2% year-over-year"
- Requires API key from https://developer.ons.gov.uk/

---

## ✅ Verification

1. **Check Firestore**: `marketInsights` collection should have documents
2. **Check Dashboard**: Cards should show real data (not mock)
3. **Check Logs**: `firebase functions:log` should show successful fetches

---

## 🔧 Troubleshooting

**No insights created?**
- Check Cloud Function logs: `firebase functions:log`
- Verify GOV.UK RSS is accessible: https://www.gov.uk/government/announcements.atom
- Check if there are relevant announcements (function filters for landlord/property content)

**ONS API errors? (Optional)**
- ONS is optional - function works without it
- If you want to add ONS later: `firebase functions:config:set ons.api_key="YOUR_KEY"`
- Verify API key is correct
- Check dataset ID matches ONS API explorer

---

## 📚 Full Documentation

- **GOV.UK Only Setup**: `functions/GOV_UK_ONLY_SETUP.md` ⭐ **Start Here!**
- **Full Setup Guide**: `functions/SETUP_GUIDE.md`
- **Integration Guide**: `src/landlord_agent/docs/UK_MARKET_DATA_INTEGRATION_GUIDE.md`
- **Implementation Summary**: `src/landlord_agent/docs/IMPLEMENTATION_SUMMARY.md`

