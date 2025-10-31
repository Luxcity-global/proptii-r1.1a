# Start Backend Server with Visible Logs

## Quick Start (Copy & Paste in PowerShell)

```powershell
# Navigate to server directory
cd "C:\Users\lgapr\OneDrive\Documents\GitHub\R Prop\proptii-r1.1a\server"

# Stop any existing server
taskkill /F /IM node.exe /FI "WINDOWTITLE eq*" 2>$null
Start-Sleep -Seconds 1

# Start the server (you'll see all logs)
node index.js
```

## What You'll See

Once running, you'll see:

```
[DEBUG] Creating transport: nodemailer...
[INFO] Secure connection established...
SMTP connection verified successfully
Server running on port 10000
```

**When an email is sent, you'll see:**
```
Received email request: { to: '...', subject: '...', filesCount: 1 }
Files received: [{ originalname: '...', mimetype: 'application/pdf', size: ... }]
Attempting to send email with options: { from: '...', to: '...', ... }
Email sent successfully: { messageId: '<...@gmail.com>' }
```

## Alternative: One-Line Command

```powershell
cd "C:\Users\lgapr\OneDrive\Documents\GitHub\R Prop\proptii-r1.1a\server" ; taskkill /F /IM node.exe 2>$null ; Start-Sleep -Seconds 1 ; node index.js
```

## Keep Terminal Open

- Keep the PowerShell window open
- Watch for incoming email requests
- Press `Ctrl+C` to stop the server


