# Gmail API Setup Guide

This guide explains how to set up Gmail API OAuth authentication for the AutoHR email system.

## Prerequisites

- Google Cloud Console account
- A Gmail account for testing

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your project ID

## Step 2: Enable Gmail API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Gmail API"
3. Click on "Gmail API" and click **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (unless you have a Google Workspace)
3. Fill in the required information:
   - App name: "AutoHR Email System"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.compose`
5. Add test users (emails that can use the app during development)

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Configure:
   - Name: "AutoHR Web Client"
   - Authorized redirect URIs:
     - `http://localhost:3000/gmail/callback` (for development)
     - `https://yourdomain.com/gmail/callback` (for production)
5. Download the JSON file and note the Client ID and Client Secret

## Step 5: Configure Environment Variables

Create a `.env` file in your backend project root (`dotnet-backend/ai-hr/`) and add these environment variables:

```bash
# Gmail API Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# JWT Configuration (also required)
JWT_SECRET_KEY=your_jwt_secret_key_here

# Supabase Configuration (also required)
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here

# Other Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://localhost:3000
BUCKET_NAME=resume-storage
```

**Important**: Replace the placeholder values with your actual credentials from Google Cloud Console and other services.

## Step 6: Environment Variables Configuration

The application reads Gmail OAuth credentials from environment variables for security. Make sure the following environment variables are set:

- `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret

These can be set in your `.env` file (as mentioned in Step 5) or in your deployment environment.

## Rate Limits

The Gmail API has the following rate limits:

- **Per user per minute**: 15,000 quota units (150 emails max)
- **Per project per minute**: 1,200,000 quota units
- **Each email send**: 100 quota units

Our implementation handles these limits by:

- Processing emails in batches of 50
- Adding 2-second delays between batches
- Adding 100ms delays between individual emails

## Testing the Setup

1. Start your backend server
2. Navigate to the candidates page
3. Select rejected candidates
4. Click "Send Emails"
5. You should be prompted to authorize Gmail access
6. Complete the OAuth flow in the popup window
7. Create or select an email template
8. Send the emails

## Troubleshooting

### "AutoHR Email System has not completed the Google verification process"

This error occurs when your OAuth consent screen is still in "testing" mode. You have two options:

**Option 1: Add Test Users (Quick Fix)**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **OAuth consent screen**
3. Scroll down to **Test users** section
4. Click **Add users** and add the email addresses that need access
5. Save the changes

**Option 2: Publish Your App (Recommended for Production)**

1. Go to **APIs & Services** > **OAuth consent screen**
2. Click **PUBLISH APP** button
3. Review the warning and click **CONFIRM**
4. Your app will be available to all users, but Google may review it if you request sensitive scopes

**Option 3: Submit for Verification (For Sensitive Scopes)**
If you're using sensitive scopes and need verification:

1. Complete all required fields in the OAuth consent screen
2. Add a privacy policy URL
3. Add authorized domains
4. Submit for verification (this can take several days to weeks)

### "GOOGLE_CLIENT_ID environment variable not configured"

- Ensure you have created a `.env` file in `dotnet-backend/ai-hr/`
- Verify that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in your `.env` file
- Restart your backend server after adding environment variables

### "Error 403: access_denied"

- Check that your OAuth consent screen is properly configured
- Ensure the user email is added as a test user (if app is in testing mode)
- Verify the redirect URI matches exactly

### "Error 400: redirect_uri_mismatch"

- Check that the redirect URI in your OAuth client matches the one being used
- Ensure there are no trailing slashes or case mismatches
- Common redirect URIs:
  - Development: `http://localhost:3000/gmail/callback`
  - Production: `https://yourdomain.com/gmail/callback`

### "Gmail authorization required"

- The user's OAuth token may have expired
- Ask the user to re-authorize through the Gmail auth modal

### Rate limit exceeded

- The system automatically handles rate limits with batching
- If you still hit limits, reduce the batch size in `GmailService.cs`

## Publishing Your App for Production

### Step 1: Complete OAuth Consent Screen

1. **App Information:**

   - App name: "AutoHR Email System"
   - User support email: Your support email
   - App logo: Upload your company logo (120x120px)
   - App domain: Your website domain

2. **App Domain:**

   - Application home page: `https://yourdomain.com`
   - Application privacy policy link: `https://yourdomain.com/privacy`
   - Application terms of service link: `https://yourdomain.com/terms`

3. **Authorized Domains:**

   - Add your production domain (e.g., `yourdomain.com`)

4. **Developer Contact Information:**
   - Add your email address

### Step 2: Configure Scopes

Only request the scopes you actually need:

- `https://www.googleapis.com/auth/gmail.send` - Send emails
- `https://www.googleapis.com/auth/gmail.compose` - Compose emails

### Step 3: Publish the App

1. Review all information for accuracy
2. Click **PUBLISH APP**
3. Confirm the publication

### Step 4: Update Production Redirect URIs

1. Go to **APIs & Services** > **Credentials**
2. Edit your OAuth 2.0 Client ID
3. Add production redirect URIs:
   - `https://yourdomain.com/gmail/callback`
   - `https://yourdomain.com/api/gmail/auth/callback` (if needed)

## Security Notes

- Never expose your Client Secret in frontend code
- Store OAuth tokens securely (they're stored in the `GmailAuth` folder by default)
- Consider implementing token refresh logic for production use
- Use HTTPS in production for OAuth callbacks

## Production Deployment

For production deployment:

1. Update OAuth consent screen to "Published" status
2. Add production redirect URIs
3. Use environment variables for sensitive configuration
4. Consider using Google Cloud Secret Manager
5. Implement proper error handling and logging
6. Set up monitoring for email delivery rates
