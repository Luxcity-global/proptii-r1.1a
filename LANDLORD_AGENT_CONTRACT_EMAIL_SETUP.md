# Contract Email & Database Integration - Complete Setup

## 🚨 **CRITICAL: YOU MUST REBUILD AFTER THESE CHANGES**

**These changes require a rebuild before they will work!**

### **Quick Build Steps:**
```bash
cd src/landlord_agent
npm install
npm run build
cd ../..
copy src\landlord_agent\build\assets\index-*.js public\assets\
copy src\landlord_agent\build\assets\index-*.css public\assets\
```

**Then update `public/landlord/index.html`** with new asset file names from `build/assets/`

**See `docs/development/BUILD_PROCESS_GUIDE.md` for full details.**

---

## ✅ What Has Been Implemented

### 1. **Contract Email Service**
- **File**: `src/landlord_agent/src/services/contractEmailService.ts`
- **Features**:
  - Generates professional HTML email template
  - Fetches contract file from Firebase Storage
  - Sends email via backend API with attachment
  - Handles errors gracefully

### 2. **Updated Contract Service**
- **File**: `src/landlord_agent/src/services/contractService.ts`
- **Enhanced Features**:
  - ✅ Uploads file to Firebase Storage
  - ✅ Saves contract data to Firestore database
  - ✅ Sends email with contract attachment
  - ✅ Updates contract with email status
  - ✅ Handles errors (contract still saved if email fails)

### 3. **Updated SendContractModal**
- **File**: `src/landlord_agent/src/components/SendContractModal.tsx`
- **New Features**:
  - ✅ Contract type selector (Tenancy Agreement, Deposit Certificate, etc.)
  - ✅ Recipient selection (manual or existing tenant)
  - ✅ Form validation
  - ✅ Upload progress indicator

### 4. **Updated ContractsPage**
- **File**: `src/landlord_agent/src/components/ContractsPage.tsx`
- **New Features**:
  - ✅ Integrates email sending with contract creation
  - ✅ Shows loading states
  - ✅ Error handling
  - ✅ Real-time contract updates

### 5. **Firebase Configuration**
- **File**: `src/landlord_agent/src/config/firebase.ts`
- **Status**: ✅ Configured with your credentials

### 6. **Package Dependencies**
- **File**: `src/landlord_agent/package.json`
- **Added**: Firebase and Axios dependencies

---

## ⚠️ **CRITICAL: BUILD PROCESS REQUIRED**

### **Why Rebuild is Necessary**

The landlord app uses a **static build process** where:
- Source code is compiled and bundled into static files
- These files are served from the `public/landlord/` directory
- **Changes to source code don't automatically reflect without rebuilding**

### **Build Process Steps**

**After making ANY changes to the landlord_agent code:**

```bash
# Step 1: Navigate to landlord_agent directory
cd src/landlord_agent

# Step 2: Install dependencies (if needed)
npm install

# Step 3: Build the application
npm run build

# Step 4: Copy build assets to public directory
cd ../..
copy src\landlord_agent\build\assets\index-*.js public\assets\
copy src\landlord_agent\build\assets\index-*.css public\assets\

# Step 5: Update public/landlord/index.html with new asset file names
# (Check build/assets/ for the new hash file names)
```

### **What the Build Process Does**

1. **Compiles TypeScript** → JavaScript
2. **Bundles components** → Single JavaScript file (`index-[hash].js`)
3. **Compiles CSS** → Single CSS file (`index-[hash].css`)
4. **Generates HTML** → `build/index.html`
5. **Optimizes assets** → Code minification and compression

### **After Building**

1. **Update `public/landlord/index.html`**:
   - Find the new asset file names in `build/assets/`
   - Update the script and link tags in `index.html` to reference new files
   - Example: `index-DAx7rM2b.js` → `index-NewHash.js`

2. **Clear Browser Cache**:
   - Press `Ctrl+F5` (or `Cmd+Shift+R` on Mac)
   - Or open DevTools → Network tab → Check "Disable cache"

3. **Test the Changes**:
   - Navigate to `http://localhost:5176/landlord/index.html`
   - Verify all functionality works

---

## 📊 **Complete Flow**

### **When User Sends a Contract:**

1. **User Fills Form** (SendContractModal)
   - Selects contract file (PDF/DOC/DOCX)
   - Enters recipient name & email (or selects existing tenant)
   - Selects contract type
   - Adds optional additional info

2. **File Upload** (Firebase Storage)
   - Contract file uploaded to `contracts/{timestamp}_{filename}`
   - File URL generated for email attachment

3. **Database Save** (Firestore)
   - Contract document created in `contracts` collection
   - Includes all metadata:
     - Title, type, recipient info
     - File URL and path
     - Dates (created, sent, expiry)
     - Status: 'sent'
     - Email tracking fields

4. **Email Sending** (Backend API)
   - Fetches contract file from Firebase Storage
   - Creates HTML email with contract details
   - Sends email via `/api/email/send` endpoint
   - Email includes:
     - Professional HTML template
     - Contract file as attachment
     - Recipient name and details
     - Expiry date information
     - Additional instructions

5. **Status Update** (Firestore)
   - Contract updated with email status:
     - `notificationSent: true`
     - `emailMessageId: [message-id]`

6. **UI Update** (ContractsPage)
   - Contract list reloaded
   - New contract appears in "Sent" tab
   - Success message shown

---

## 🗄️ **Database Structure**

### **Firestore Collection: `contracts`**

```typescript
{
  id: string,                    // Auto-generated document ID
  title: string,
  propertyAddress: string,
  tenantName: string,
  tenantEmail: string,
  contractType: 'tenancy-agreement' | 'deposit-certificate' | 'right-to-rent' | 'other',
  
  // File information
  fileName: string,
  fileUrl: string,               // Firebase Storage URL
  filePath: string,              // Storage path (for deletion)
  
  // Dates
  createdAt: Timestamp,
  sentDate: Timestamp,
  signedDate?: Timestamp,
  expiryDate?: Timestamp,
  
  // Status
  status: 'sent' | 'unsigned' | 'signed',
  
  // Email tracking
  notificationSent: boolean,
  emailMessageId?: string,
  reminderCount: number,
  
  // Additional info
  additionalInfo?: string
}
```

---

## 📧 **Email Template**

### **Email Content Includes:**
- ✅ Professional HTML template
- ✅ Recipient name personalization
- ✅ Contract title and details
- ✅ Expiry date (if set)
- ✅ Additional information
- ✅ Contract file attached as PDF
- ✅ Branded footer

### **Email Subject:**
`Contract for Review: [Contract Title]`

---

## ⚙️ **Required Configuration**

### **1. Backend Email Server**
Ensure your backend server is running:
- **Local**: `http://localhost:10000/api/email/send`
- **Production**: `https://proptii-r1-1a.onrender.com/api/email/send`

### **2. Environment Variables**
Add to your backend `.env`:
```env
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
SMTP_FROM_EMAIL=noreply@proptii.com
```

### **3. Firebase Setup**
- ✅ Firestore Database enabled
- ✅ Firebase Storage enabled
- ✅ Security rules configured

### **4. Frontend Environment Variables**
Create `src/landlord_agent/.env`:
```env
VITE_FIREBASE_API_KEY=AIzaSyC0UZxzkhsebn-gSuo7HDRGVid30URQVvA
VITE_FIREBASE_AUTH_DOMAIN=proptii-16946.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=proptii-16946
VITE_FIREBASE_STORAGE_BUCKET=proptii-16946.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=423487822587
VITE_FIREBASE_APP_ID=1:423487822587:web:9fd069dd01ec5e8267ae5e
VITE_FIREBASE_MEASUREMENT_ID=G-88HC0TG6JJ
```

---

## 🧪 **Testing the Integration**

### **Test Steps:**

1. **Install Dependencies**
   ```bash
   cd src/landlord_agent
   npm install  # Install Firebase and Axios
   ```

2. **Create Environment File**
   - Create `src/landlord_agent/.env` with Firebase credentials (see above)

3. **⚡ BUILD THE APPLICATION** ⚠️ **CRITICAL STEP - REQUIRED**
   ```bash
   cd src/landlord_agent
   npm run build
   ```

4. **Copy Assets to Public Directory**
   ```bash
   cd ../..
   copy src\landlord_agent\build\assets\index-*.js public\assets\
   copy src\landlord_agent\build\assets\index-*.css public\assets\
   ```

5. **Update Asset References in index.html** ⚠️ **REQUIRED**
   - Open `public/landlord/index.html`
   - Check `src/landlord_agent/build/assets/` for new hash filenames
   - Update script and link tags:
     ```html
     <!-- OLD -->
     <script type="module" crossorigin src="/assets/index-DazPO7cj.js"></script>
     <link rel="stylesheet" crossorigin href="/assets/index-BikFH20E.css">
     
     <!-- NEW (update with actual filenames from build/assets/) -->
     <script type="module" crossorigin src="/assets/index-[NEW-HASH].js"></script>
     <link rel="stylesheet" crossorigin href="/assets/index-[NEW-HASH].css">
     ```

6. **Clear Browser Cache**
   - Press `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
   - Or DevTools → Network tab → "Disable cache"

7. **Start Backend Server**
   ```bash
   cd server
   npm start
   # Should run on http://localhost:10000
   ```

8. **Test Contract Sending**
   - Navigate to Contracts page
   - Click "Send Contract"
   - Fill out the form:
     - Upload a PDF file
     - Enter recipient email
     - Select contract type
     - Add optional notes
   - Click "Send Contract"

9. **Verify Results**
   - ✅ Check Firebase Console → Firestore → `contracts` collection
   - ✅ Check Firebase Console → Storage → `contracts` folder
   - ✅ Check recipient email inbox
   - ✅ Verify contract appears in "Sent" tab
   - ✅ Check browser console for any errors

---

## 🔍 **What Gets Stored in Database**

### **Firestore Document Example:**
```json
{
  "title": "Tenancy Agreement - Regent Street",
  "propertyAddress": "123 Regent Street, London W1B 4EA",
  "tenantName": "Sarah Johnson",
  "tenantEmail": "sarah.johnson@email.com",
  "contractType": "tenancy-agreement",
  "fileName": "tenancy_agreement.pdf",
  "fileUrl": "https://firebasestorage.googleapis.com/...",
  "filePath": "contracts/1234567890_tenancy_agreement.pdf",
  "status": "sent",
  "createdAt": "2024-12-15T10:30:00Z",
  "sentDate": "2024-12-15T10:30:00Z",
  "expiryDate": "2024-12-29T10:30:00Z",
  "notificationSent": true,
  "emailMessageId": "abc123@mail.example.com",
  "reminderCount": 0,
  "additionalInfo": "Please review and sign within 14 days"
}
```

---

## 📧 **Email Delivery**

### **Email Recipient Receives:**
- Subject: "Contract for Review: [Contract Title]"
- HTML Email with:
  - Professional styling
  - Contract details
  - Expiry date reminder
  - Additional instructions
- Attachment: Original contract PDF file

### **Email Tracking:**
- Email status saved in Firestore
- Message ID stored for tracking
- Can track if email was sent successfully

---

## 🎯 **Key Features**

✅ **Automatic Email Sending**
- Email sent automatically when contract is created
- Contract file attached to email
- Professional HTML template

✅ **Database Storage**
- All contract data saved to Firestore
- File metadata stored with contract
- Email tracking included

✅ **Error Handling**
- Contract saved even if email fails
- Error messages shown to user
- Graceful degradation

✅ **File Management**
- Files stored in Firebase Storage
- Secure file URLs generated
- Files can be downloaded/viewed

---

## 🚀 **Complete Setup Checklist**

### **Before Testing:**

- [ ] Install dependencies: `cd src/landlord_agent && npm install`
- [ ] Create `.env` file with Firebase credentials
- [ ] Build the application: `npm run build`
- [ ] Copy assets to public directory
- [ ] Update `public/landlord/index.html` with new asset names
- [ ] Start backend server: `cd server && npm start`
- [ ] Configure Firebase (Firestore + Storage)
- [ ] Test contract sending

---

## 📝 **Quick Reference - Build Process**

### **Every Time You Make Changes:**

```bash
# 1. Build the app
cd src/landlord_agent
npm run build

# 2. Copy assets
cd ../..
copy src\landlord_agent\build\assets\index-*.js public\assets\
copy src\landlord_agent\build\assets\index-*.css public\assets\

# 3. Update index.html with new file names
# Check build/assets/ for hash filenames
# Update public/landlord/index.html references

# 4. Clear browser cache and test
# Navigate to http://localhost:5176/landlord/index.html
```

---

## ⚠️ **Important Notes**

1. **Build Process is CRITICAL**
   - Changes don't appear without rebuilding
   - Always rebuild after code changes
   - Assets must be copied to public directory

2. **Asset File Names Change**
   - Each build generates new hash file names
   - Must update `index.html` references
   - Old files can be removed or kept

3. **Browser Caching**
   - Clear cache after rebuild
   - Use Ctrl+F5 to force refresh
   - Check DevTools Network tab

4. **Backend Server Required**
   - Email sending needs backend running
   - Configure SMTP credentials
   - Test email sending separately

---

## 📋 **Summary**

**You Now Have:**
- ✅ Contract upload → Firebase Storage
- ✅ Contract metadata → Firestore Database
- ✅ Email sending → Backend API
- ✅ Full integration → Complete workflow

**The contract flow now:**
1. Uploads file to Firebase Storage
2. Saves contract data to Firestore
3. Sends email with contract attachment
4. Tracks email status in database

**Remember:**
- ⚠️ **Rebuild after every code change**
- ⚠️ **Copy assets to public directory**
- ⚠️ **Update index.html references**
- ⚠️ **Clear browser cache**

**Everything is connected and ready!** 🎉

---

*Last Updated: [Current Date]*
*Status: Ready for Testing*
*Build Required: YES - After every code change*