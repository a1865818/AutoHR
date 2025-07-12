# Gmail OAuth Troubleshooting Guide

## Common Error: "AutoHR Email System has not completed the Google verification process"

This error occurs when your Google OAuth app is in "testing" mode and can only be accessed by explicitly approved test users.

## Quick Solutions

### Solution 1: Add Test Users (Immediate Fix)

1. **Go to Google Cloud Console:**

   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project

2. **Navigate to OAuth Consent Screen:**

   - Go to **APIs & Services** → **OAuth consent screen**

3. **Add Test Users:**

   - Scroll down to the **Test users** section
   - Click **+ ADD USERS**
   - Enter the email addresses that need access
   - Click **SAVE**

4. **Test the Authorization:**
   - The added users can now authorize the app
   - They should be able to complete the Gmail authorization flow

### Solution 2: Publish Your App (Recommended)

1. **Complete App Information:**

   - Go to **APIs & Services** → **OAuth consent screen**
   - Fill in all required fields:
     - App name: "AutoHR Email System"
     - User support email
     - App logo (optional but recommended)
     - App domain
     - Privacy policy URL (if required)
     - Terms of service URL (if required)

2. **Publish the App:**

   - Click **PUBLISH APP** button
   - Review the warning message
   - Click **CONFIRM**

3. **App Status:**
   - Your app will now be available to all users
   - No need to add individual test users

## Detailed Setup Instructions

### Step 1: Google Cloud Console Setup

1. **Create/Select Project:**

   ```
   Project Name: AutoHR Email System
   Project ID: autohr-email-system (or similar)
   ```

2. **Enable Gmail API:**
   - Go to **APIs & Services** → **Library**
   - Search for "Gmail API"
   - Click **ENABLE**

### Step 2: OAuth Consent Screen Configuration

1. **Basic Information:**

   ```
   User Type: External
   App name: AutoHR Email System
   User support email: your-email@domain.com
   App logo: [Upload 120x120px logo]
   App domain: yourdomain.com
   ```

2. **App Domain (Optional but Recommended):**

   ```
   Application home page: https://yourdomain.com
   Application privacy policy: https://yourdomain.com/privacy
   Application terms of service: https://yourdomain.com/terms
   ```

3. **Authorized Domains:**

   ```
   yourdomain.com
   localhost (for development)
   ```

4. **Developer Contact:**
   ```
   Email addresses: your-email@domain.com
   ```

### Step 3: OAuth Credentials

1. **Create OAuth Client:**

   - Go to **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client IDs**
   - Application type: **Web application**
   - Name: "AutoHR Web Client"

2. **Authorized Redirect URIs:**

   ```
   Development:
   http://localhost:3000/gmail/callback

   Production:
   https://yourdomain.com/gmail/callback
   ```

3. **Download Credentials:**
   - Download the JSON file
   - Extract `client_id` and `client_secret`

### Step 4: Environment Configuration

1. **Create .env file in `dotnet-backend/ai-hr/`:**

   ```bash
   # Gmail OAuth Configuration
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here

   # Other required variables
   JWT_SECRET_KEY=your_jwt_secret_key_here
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_KEY=your_supabase_key_here
   ALLOWED_ORIGINS=http://localhost:3000,https://localhost:3000
   ```

2. **Restart Backend Server:**
   ```bash
   cd dotnet-backend/ai-hr
   dotnet run
   ```

## Testing the Fix

1. **Start the Application:**

   ```bash
   ./start-dev.sh
   ```

2. **Test Gmail Authorization:**

   - Navigate to candidates page
   - Try to send an email to rejected candidates
   - The Gmail authorization modal should appear
   - Click "Authorize Gmail Access"
   - Complete the OAuth flow

3. **Verify Success:**
   - You should see "Gmail Authorized Successfully"
   - You can now send emails through the system

## Common Issues and Solutions

### Issue: "Error 403: access_denied"

**Solution:** Add your email as a test user or publish the app

### Issue: "Error 400: redirect_uri_mismatch"

**Solution:** Ensure redirect URIs match exactly:

- Development: `http://localhost:3000/gmail/callback`
- Production: `https://yourdomain.com/gmail/callback`

### Issue: "GOOGLE_CLIENT_ID environment variable not configured"

**Solution:**

1. Create `.env` file in `dotnet-backend/ai-hr/`
2. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
3. Restart backend server

### Issue: "Gmail authorization required" (recurring)

**Solution:** OAuth token expired, user needs to re-authorize

## Security Considerations

1. **Never expose Client Secret in frontend code**
2. **Use HTTPS in production**
3. **Store tokens securely**
4. **Implement token refresh logic**
5. **Monitor API usage and quotas**

## Production Deployment Checklist

- [ ] OAuth consent screen completed
- [ ] App published (or test users added)
- [ ] Production redirect URIs configured
- [ ] Environment variables set
- [ ] HTTPS enabled
- [ ] Domain verification completed
- [ ] Privacy policy and terms of service published
- [ ] Monitoring and logging configured

## Support

If you continue to experience issues:

1. Check the Gmail setup documentation: `dotnet-backend/ai-hr/GMAIL_SETUP.md`
2. Review Google Cloud Console logs
3. Verify all environment variables are correctly set
4. Test with a different Gmail account
5. Contact the development team with specific error messages

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth Consent Screen Help](https://support.google.com/cloud/answer/6158849)
