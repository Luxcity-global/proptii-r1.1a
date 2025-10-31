# Setup Email Environment Variables

To enable email sending, you need to create a `.env` file in the project root with SMTP credentials.

## Quick Setup (5 minutes)

### Step 1: Create the `.env` file

Create a new file called `.env` in the project root directory:
```
C:\Users\lgapr\OneDrive\Documents\GitHub\R Prop\proptii-r1.1a\.env
```

### Step 2: Add SMTP Configuration

Copy and paste the following into your `.env` file, then replace the placeholder values:

```env
# SMTP Server Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Email Account Credentials
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
SMTP_FROM_EMAIL=your-email@gmail.com

# Server Port (optional)
PORT=10000
```

### Step 3: Get Gmail App Password

1. **Enable 2-Factor Authentication** (if not already enabled):
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select your device (or "Other" and name it)
   - Click "Generate"
   - **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

3. **Paste in `.env` file**:
   - Replace `your-app-password-here` with the 16-character password (remove spaces)
   - Replace `your-email@gmail.com` with your actual Gmail address

### Step 4: Example `.env` file

Your `.env` file should look like this (with your actual values):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=john.doe@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM_EMAIL=john.doe@gmail.com
PORT=10000
```

### Step 5: Start the Backend Server

After creating the `.env` file, start the backend server:

```powershell
cd server
$env:PORT=10000
node index.js
```

You should see:
```
Email server is running on port 10000
SMTP connection verified successfully
```

## Other Email Providers

### Outlook/Hotmail:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM_EMAIL=your-email@outlook.com
```

### Yahoo:
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-email@yahoo.com
```

## Troubleshooting

### "Missing required environment variables"
- Make sure the `.env` file is in the project root (same folder as `package.json`)
- Make sure there are no spaces around the `=` signs
- Make sure all 5 required variables are present

### "SMTP connection verification failed"
- Check SMTP credentials are correct
- For Gmail: Make sure you're using an App Password (not your regular password)
- Check if 2-Factor Authentication is enabled (required for Gmail App Passwords)
- Verify SMTP_HOST and SMTP_PORT are correct for your provider

### Email not sending
- Make sure backend server is running: `cd server ; node index.js`
- Check backend terminal for error messages
- Verify recipient email address is correct
- Check spam/junk folder

## Security Note

The `.env` file is automatically ignored by git (listed in `.gitignore`), so your credentials won't be committed to the repository.


