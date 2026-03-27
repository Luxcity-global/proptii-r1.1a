# How to Access Backend Server Terminal & Logs

## Current Status
✅ **Server is RUNNING** (Process ID: 10548, Port: 10000)

## Quick Access Methods

### Method 1: Restart Server to See Logs (Recommended)

1. **Open a NEW PowerShell terminal**
   - Press `Windows Key` → Type "PowerShell" → Open

2. **Stop the current server:**
   ```powershell
   taskkill /PID 10548 /F
   ```

3. **Navigate to server directory:**
   ```powershell
   cd "C:\Users\lgapr\OneDrive\Documents\GitHub\R Prop\proptii-r1.1a\server"
   ```

4. **Start server (you'll see all logs):**
   ```powershell
   node index.js
   ```

### Method 2: Check Server Response (Without Restarting)

Test if server is responding:

```powershell
# Test server is alive
curl http://localhost:10000/

# Should return: {"message":"Email server is running"}
```

### Method 3: Monitor Server Process

Check what the server is doing:

```powershell
# View all Node processes
Get-Process node

# Check port usage
netstat -ano | findstr :10000
```

## What You'll See in Logs

When an email is sent, you'll see:

```
Received email request: {
  to: 'bolu.o@theluxcity.co.uk',
  subject: 'Contract for Review: ...',
  filesCount: 1
}

Files received: [{ originalname: '...', mimetype: 'application/pdf', size: ... }]

Attempting to send email with options: {
  from: 'contactus@theluxcity.co.uk',
  to: 'bolu.o@theluxcity.co.uk',
  ...
}

Email sent successfully: { messageId: '<...@gmail.com>' }
```

## Stop the Server

If you need to stop it:

```powershell
taskkill /PID 10548 /F
```

Or use Ctrl+C if running in foreground.

## Server Location

- **Directory:** `C:\Users\lgapr\OneDrive\Documents\GitHub\R Prop\proptii-r1.1a\server`
- **Main File:** `index.js`
- **Port:** 10000
- **Environment File:** `.env` (in project root)

## Check Email Sending Status

The easiest way to verify emails are being sent:
1. **Check recipient's inbox** (bolu.o@theluxcity.co.uk)
2. **Look for server logs** showing "Email sent successfully"
3. **Check for errors** like "Failed to send email"


