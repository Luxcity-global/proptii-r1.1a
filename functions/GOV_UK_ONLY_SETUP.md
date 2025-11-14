# GOV.UK Only Setup (No ONS API Required)

Since ONS API setup is challenging, this guide focuses on getting GOV.UK regulatory data working first. ONS can be added later.

## ✅ What You'll Get

From GOV.UK RSS Feed (no API key needed):
- **EPC Requirements** - Energy performance certificate updates
- **Landlord Regulations** - New housing policy changes
- **Regulatory Changes** - Compliance and legislation updates

## 🚀 Quick Setup (2 minutes)

### Step 1: Install Dependencies
```bash
cd functions
npm install
```

### Step 2: Build
```bash
npm run build
```

### Step 3: Deploy
```bash
cd ..
firebase deploy --only functions
```

That's it! No API keys needed. GOV.UK RSS feed is publicly accessible.

## 🧪 Test It

After deployment, you'll see a URL like:
```
https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/fetchUKMarketDataManual
```

Visit this URL in your browser to trigger the function manually.

### Expected Output:
```json
{
  "success": true,
  "insightsCreated": 3,
  "insights": [
    {
      "type": "epc-requirements",
      "title": "New EPC requirements..."
    },
    {
      "type": "regulatory-change",
      "title": "Landlord regulations updated..."
    }
  ]
}
```

## 📊 Verify in Firestore

1. Go to Firebase Console → Firestore
2. Check `marketInsights` collection
3. You should see documents with:
   - `source: "GOV.UK"`
   - `type: "epc-requirements"` or `"regulatory-change"`
   - Real titles and descriptions from GOV.UK

## 📋 Check Function Logs

```bash
firebase functions:log
```

Look for:
- ✅ `📰 Fetching GOV.UK announcements from: ...`
- ✅ `📋 Found X relevant announcements...`
- ✅ `Created Y new regulatory insights from GOV.UK`

## 🔄 Scheduled Runs

The function runs automatically:
- **Every Monday at 9 AM (UK time)**
- Fetches latest GOV.UK announcements
- Creates insights for relevant landlord/property content

## 🎯 What Gets Filtered

The function looks for announcements containing:
- EPC, energy performance, energy efficiency
- Landlord, private rented, rental, rent
- Housing, property, tenancy, tenant
- Regulation, legislation, compliance
- Deposit, eviction, right to rent

## ⚠️ Troubleshooting

### No insights created?
- Check logs: `firebase functions:log`
- Verify RSS feed is accessible: https://www.gov.uk/government/announcements.atom
- Check if there are any relevant announcements (function filters for landlord/property content)

### Function errors?
- Check internet connectivity
- Verify Firestore rules allow writes to `marketInsights` collection
- Check function logs for detailed error messages

### Want to add ONS later?
- Just get an API key from https://developer.ons.gov.uk/
- Run: `firebase functions:config:set ons.api_key="YOUR_KEY"`
- Redeploy: `firebase deploy --only functions`
- Function will automatically use ONS data when available

## ✅ Success Indicators

1. ✅ Function deploys without errors
2. ✅ Manual trigger returns `success: true`
3. ✅ Firestore `marketInsights` collection has documents
4. ✅ Dashboard shows real GOV.UK insights
5. ✅ Scheduled runs happen weekly (check logs)

---

**That's it!** You now have real UK regulatory data from GOV.UK without needing any API keys.










