# Supabase Auth Migration Setup Guide

## Step 1: Supabase Project Setup

### 1.1 Create/Configure Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project or use existing one
3. Go to Settings > API to get your credentials

### 1.2 Get Required Credentials
You need these 4 values from your Supabase project:

```bash
# From Settings > API
SUPABASE_URL=https://[your-project-id].supabase.co
SUPABASE_KEY=[anon-public-key]
SUPABASE_SERVICE_KEY=[service_role-secret-key] # ⚠️ Keep this secret!
SUPABASE_JWT_SECRET=[JWT-Secret-from-API-settings]
```

### 1.3 Update Database Schema
Add the SupabaseAuthId column to your existing tables:

```sql
-- Add SupabaseAuthId to ApplicationUser table
ALTER TABLE "ApplicationUser" 
ADD COLUMN "SupabaseAuthId" TEXT;

-- Add SupabaseAuthId to hiring_user_profiles table  
ALTER TABLE "hiring_user_profiles" 
ADD COLUMN "SupabaseAuthId" TEXT;

-- Add indexes for better performance
CREATE INDEX idx_applicationuser_supabase_auth_id ON "ApplicationUser"("SupabaseAuthId");
CREATE INDEX idx_hiringuserprofile_supabase_auth_id ON "hiring_user_profiles"("SupabaseAuthId");
```

### 1.4 Enable Email Auth in Supabase
1. Go to Authentication > Settings
2. Enable "Enable email confirmations" (optional for testing)
3. Configure SMTP settings (optional for production)

## Step 2: Environment Configuration

### 2.1 Update .env File
Copy the example and add your credentials:

```bash
# Copy example
cp .env.example .env
```

Edit `.env` with your actual values:

```bash
# ================================
# AI-HR Platform Environment Variables
# ================================

# ✅ HYBRID AUTHENTICATION CONFIGURATION
# Legacy JWT Configuration (keep your existing secret)
JWT_SECRET_KEY=your-existing-jwt-secret-key

# Supabase Auth Configuration
SUPABASE_URL=https://[your-project-id].supabase.co
SUPABASE_KEY=[your-anon-key]
SUPABASE_SERVICE_KEY=[your-service-role-key]
SUPABASE_JWT_SECRET=[your-jwt-secret]

# ✅ CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://localhost:3000

# ✅ Google API Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ✅ Application URLs
ASPNETCORE_URLS=http://localhost:5189
```

## Step 3: Switch to Hybrid Authentication

### 3.1 Backup Current Program.cs
```bash
cp Program.cs Program.Legacy.cs
```

### 3.2 Use Hybrid Program.cs
```bash
cp Program.Hybrid.cs Program.cs
```

### 3.3 Install Required Packages (if missing)
```bash
dotnet add package Supabase.Gotrue
```

## Step 4: Run Migration

### 4.1 Build the Project
```bash
dotnet build
```

### 4.2 Option A: Run Migration via Console App
```bash
# Run the migration console application
dotnet run --project MigrationRunner.csproj
```

### 4.2 Option B: Run Migration via API Endpoints
Start the API and use these endpoints:

```bash
# Start the API
dotnet run

# In another terminal, run migration commands:

# Migrate ApplicationUsers
curl -X POST http://localhost:5189/api/migration/application-users

# Migrate HiringUsers  
curl -X POST http://localhost:5189/api/migration/hiring-users

# Verify migration
curl -X GET http://localhost:5189/api/migration/verify
```

## Step 5: Post-Migration Steps

### 5.1 Send Password Reset Emails
After migration, users need to reset their passwords:
- Use Supabase Dashboard > Authentication > Users
- Select users and send password reset emails
- Or implement bulk email sending in your app

### 5.2 Test Authentication
1. Test legacy users (not migrated) - should use legacy auth
2. Test new user registration - should use Supabase Auth  
3. Test migrated users - should use Supabase Auth after password reset

### 5.3 Monitor Logs
Check application logs for:
- Successful migrations
- Authentication method selection
- Any errors or issues

## Troubleshooting

### Common Issues:

1. **"Supabase URL not configured"**
   - Check your .env file has correct SUPABASE_URL
   - Make sure .env is in the correct directory

2. **"JWT SecretKey not configured"**
   - Verify both JWT_SECRET_KEY and SUPABASE_JWT_SECRET are set
   - Check for typos in environment variable names

3. **Database connection issues**
   - Verify your Supabase project is active
   - Check SUPABASE_KEY is the anon key, not service key

4. **Migration fails**
   - Check SUPABASE_SERVICE_KEY is correct and has admin permissions
   - Ensure your database tables exist and have the new SupabaseAuthId columns

5. **Authentication not working**
   - Clear browser cookies/localStorage
   - Check which authentication method is being used in logs
   - Verify token format and claims

## Security Notes

⚠️ **IMPORTANT:**
- Never commit actual secrets to version control
- SUPABASE_SERVICE_KEY has admin privileges - keep it secure
- Test the migration in development first
- Have a rollback plan (Program.Legacy.cs backup)
- Monitor authentication logs after deployment