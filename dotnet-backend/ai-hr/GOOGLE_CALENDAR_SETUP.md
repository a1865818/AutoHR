# Google Calendar API Setup Guide

This guide explains how to set up Google Calendar API OAuth authentication for the AutoHR video interview system.

## Prerequisites

- Google Cloud Console account (same project as Gmail API)
- A Google account for testing

## Step 1: Enable Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your existing project (the same one used for Gmail API)
3. Navigate to **APIs & Services** > **Library**
4. Search for "Google Calendar API"
5. Click on "Google Calendar API" and click **Enable**

## Step 2: Update OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Add these additional scopes to your existing scopes:
   - `https://www.googleapis.com/auth/calendar` (Full access to calendars)
   - `https://www.googleapis.com/auth/calendar.events` (View and edit events)
   - `https://www.googleapis.com/auth/calendar.readonly` (View calendar events)

**Note**: If you already have Gmail scopes configured, add these Calendar scopes to the same OAuth consent screen.

## Step 3: Update OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Edit your existing OAuth 2.0 Client ID (the same one used for Gmail)
3. **IMPORTANT**: Add these EXACT authorized redirect URIs to your existing ones:

### For Development (localhost):

```
http://localhost:3000/google-calendar/callback
```

### For Production:

```
https://yourdomain.com/google-calendar/callback
```

**Critical**: The redirect URI must match EXACTLY, including:

- Protocol (http vs https)
- Port number (if any)
- Path (/google-calendar/callback)
- No trailing slashes
- No query parameters

**Important**: Keep your existing Gmail redirect URIs. The final list should include both Gmail and Calendar redirect URIs.

## Step 4: Environment Variables

No additional environment variables are needed. The Google Calendar service uses the same environment variables as Gmail:

```bash
# Google API Configuration (shared with Gmail)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

## Step 5: Testing the Setup

1. Start your backend server
2. Navigate to the interview pipeline page
3. Go to a video interview round configuration
4. Click "Authorize Google Calendar" button
5. A popup window should open for Google OAuth
6. Complete the authorization flow
7. The popup should close automatically
8. You should now be able to generate Google Meet links

## Troubleshooting

### "Error 400: invalid_request" or "redirect_uri_mismatch"

This is the most common error and occurs when the redirect URI doesn't match exactly. Here's how to fix it:

#### 1. Check Your Current Redirect URIs

1. Go to **APIs & Services** > **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Look at the **Authorized redirect URIs** section
4. Make sure you have EXACTLY: `http://localhost:3000/google-calendar/callback`

#### 2. Common Mistakes to Avoid:

- ❌ `http://localhost:3000/google-calendar/callback/` (trailing slash)
- ❌ `http://localhost:3000/google-calendar/callback?param=value` (query params)
- ❌ `https://localhost:3000/google-calendar/callback` (wrong protocol)
- ❌ `http://127.0.0.1:3000/google-calendar/callback` (wrong hostname)
- ❌ `http://localhost/google-calendar/callback` (missing port)

#### 3. Debug the Redirect URI:

The application logs will show you exactly what redirect URI is being used. Check your browser console and backend logs for:

- `Google Calendar authorization - using redirect URI: http://localhost:3000/google-calendar/callback`
- `Creating authorization URL for user {UserId} with redirect URI: http://localhost:3000/google-calendar/callback`

#### 4. Verify the Configuration:

1. Save your OAuth client changes
2. Wait 5-10 minutes for changes to propagate
3. Clear your browser cache and cookies
4. Try the authorization flow again

### "This app doesn't comply with Google's OAuth 2.0 policy"

This error occurs when your OAuth consent screen is not properly configured. Solutions:

**Option 1: Add Test Users (Quick Fix)**

1. Go to **APIs & Services** > **OAuth consent screen**
2. Scroll down to **Test users** section
3. Click **Add users** and add the email addresses that need access
4. Save the changes

**Option 2: Publish Your App (Recommended for Production)**

1. Go to **APIs & Services** > **OAuth consent screen**
2. Click **PUBLISH APP** button
3. Review the warning and click **CONFIRM**

### "Popup blocked by browser"

If the popup window is blocked:

1. Allow popups for your domain in your browser settings
2. The app provides a fallback link to authorize manually
3. Click the manual authorization link if the popup doesn't open

### "Authorization failed"

Common causes:

1. **Invalid State Parameter**: The OAuth state parameter doesn't match
2. **Expired Authorization Code**: The code has expired (try again)
3. **Network Issues**: Check your internet connection

### "User not authorized for Google Calendar access"

This occurs when:

1. The user hasn't completed the OAuth flow
2. The authorization token has expired
3. The user revoked access

**Solution**: Ask the user to re-authorize through the "Authorize Google Calendar" button.

## Production Deployment

For production deployment:

1. **Update OAuth Consent Screen**:

   - Ensure all required scopes are added
   - Add your production domain to authorized domains
   - Publish the app if not already published

2. **Update Redirect URIs**:

   - Add production redirect URIs to your OAuth client
   - Remove development URIs if not needed
   - **Example production URI**: `https://yourdomain.com/google-calendar/callback`

3. **Environment Variables**:

   - Use the same `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as Gmail
   - Ensure these are properly set in your production environment

4. **Security Considerations**:
   - Use HTTPS in production for all OAuth callbacks
   - Store OAuth tokens securely
   - Implement proper error handling and logging

## API Rate Limits

The Google Calendar API has the following rate limits:

- **Per user per 100 seconds**: 1,000 requests
- **Per project per 100 seconds**: 10,000 requests
- **Per user per day**: 1,000,000 requests

Our implementation handles these limits by:

- Creating events only when explicitly requested
- Using efficient API calls
- Implementing proper error handling for rate limit errors

## Integration with Gmail

The Google Calendar integration works alongside the existing Gmail integration:

- **Shared OAuth Client**: Both services use the same OAuth 2.0 client ID
- **Shared Environment Variables**: Same `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- **Separate Scopes**: Each service requests only the scopes it needs
- **Independent Authorization**: Users can authorize Gmail and Calendar separately

## Features

Once properly configured, the Google Calendar integration provides:

1. **Google Meet Link Generation**: Create video interview meetings with Meet links
2. **Calendar Event Creation**: Automatically create calendar events for interviews
3. **Attendee Management**: Add candidates and interviewers to events
4. **Reminder Settings**: Configure email and popup reminders
5. **Timezone Support**: Handle different timezones for global teams

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify all setup steps are completed
3. Ensure your Google Cloud Console project has billing enabled
4. Contact support with specific error messages and steps to reproduce

## Debugging Checklist

When troubleshooting redirect_uri_mismatch errors:

- [ ] Check that the redirect URI in Google Cloud Console matches exactly: `http://localhost:3000/google-calendar/callback`
- [ ] Verify no trailing slashes or query parameters
- [ ] Ensure the protocol (http/https) matches
- [ ] Check that the port number is correct (3000 for development)
- [ ] Wait 5-10 minutes after making changes to Google Cloud Console
- [ ] Clear browser cache and cookies
- [ ] Check application logs for the exact redirect URI being used
- [ ] Verify the OAuth client ID and secret are correct
- [ ] Ensure Google Calendar API is enabled
- [ ] Check that Calendar scopes are added to the OAuth consent screen

## Verification Steps

To verify your Google Calendar setup is working correctly:

### 1. Check Environment Variables

Ensure these are set in your backend:

```bash
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### 2. Test the Authorization Flow

1. Start your backend server
2. Open browser console (F12)
3. Navigate to a video interview configuration
4. Click "Authorize Google Calendar"
5. Check console logs for:
   - `Google Calendar authorization - using redirect URI: http://localhost:3000/google-calendar/callback`
   - `Google Calendar authorization URL received: [URL]`

### 3. Check Backend Logs

Look for these log messages:

```
Creating authorization URL for user {UserId} with redirect URI: http://localhost:3000/google-calendar/callback
Generated authorization URL: [URL]
```

### 4. Verify Google Cloud Console Settings

1. **OAuth 2.0 Client ID**: Should have `http://localhost:3000/google-calendar/callback` in authorized redirect URIs
2. **OAuth Consent Screen**: Should include Calendar scopes
3. **APIs**: Google Calendar API should be enabled

## Common Issues and Solutions

### Issue: "redirect_uri_mismatch" Error

**Solution**:

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Edit your OAuth 2.0 Client ID
3. Add exactly: `http://localhost:3000/google-calendar/callback`
4. Save and wait 5-10 minutes
5. Clear browser cache and try again

### Issue: "This app doesn't comply with Google's OAuth 2.0 policy"

**Solution**:

1. Go to OAuth Consent Screen
2. Add your email as a test user
3. Or publish the app (for production)

### Issue: Authorization popup doesn't open

**Solution**:

1. Allow popups for localhost:3000
2. Check browser console for errors
3. Try refreshing the page

## Debugging Checklist
