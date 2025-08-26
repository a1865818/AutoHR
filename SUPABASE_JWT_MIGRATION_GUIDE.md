# Supabase JWT Signing Keys Migration Guide

## Overview

This guide helps you migrate your AI-HR platform from Supabase's legacy JWT secrets to the new JWT Signing Keys system, which provides enhanced security through asymmetric encryption.

## What Changed?

### Legacy System (Current)
- **Symmetric JWT**: Single JWT secret for signing and verification
- **Keys**: `anon` and `service_role` keys
- **Security**: Shared secret approach

### New System (Target)
- **Asymmetric JWT**: Private key for signing, public key for verification  
- **Keys**: `publishable` key and `secret` keys
- **Security**: Public key cryptography with enhanced security

## Migration Steps

### 1. Update Environment Variables

**Before (Legacy):**
```bash
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
```

**After (New System):**
```bash
SUPABASE_URL=your-supabase-url

# NEW: JWT Signing Keys (recommended for new projects)
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SECRET_KEY=your-supabase-secret-key

# LEGACY: Keep for backward compatibility during transition
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
```

### 2. Backend Changes (Already Implemented)

The backend has been updated to support both systems:

#### Program.cs Changes:
- ✅ Dynamic key resolution for both legacy and new systems
- ✅ JWKS endpoint integration for public key validation
- ✅ Backward compatibility with existing JWT secrets
- ✅ Enhanced logging for debugging

#### Key Features:
- **Hybrid Support**: Works with both old and new token formats
- **Automatic Detection**: Detects token type and uses appropriate validation
- **Graceful Migration**: No service interruption during transition

### 3. Frontend Changes (Already Implemented)

The frontend has been updated to include the new `apikey` header:

#### API Service Changes:
- ✅ Added `apikey` header for new Supabase auth system
- ✅ Maintains backward compatibility with existing tokens
- ✅ Uses publishable key when available, falls back to anon key

### 4. Supabase Dashboard Configuration

To get your new keys, go to your Supabase dashboard:

1. **Navigate to Settings → API**
2. **Find the new sections:**
   - **Publishable Key**: Use for client-side operations
   - **Secret Key**: Use for server-side operations (keep secure!)

3. **Migration Timeline:**
   - **Now - October 2025**: Both systems work (hybrid mode)
   - **October 2025**: Automatic migration for existing projects
   - **Late 2026**: Legacy system deprecated

### 5. Testing the Migration

#### Step 1: Add New Environment Variables
```bash
# Add to your .env file
SUPABASE_PUBLISHABLE_KEY=sb-your-project-ref.supabase.co
SUPABASE_SECRET_KEY=your-secret-key
```

#### Step 2: Test Authentication
```bash
# Start your backend
cd dotnet-backend/ai-hr
dotnet run

# Start your frontend  
cd react-frontEnd/ai-hr
npm run dev
```

#### Step 3: Verify Logs
Look for these log messages:
- `🔍 Configuring Supabase client with key type: Publishable Key`
- `🔍 Using Supabase public key infrastructure for validation`

### 6. Benefits of New System

#### Enhanced Security
- **Public Key Cryptography**: More secure than shared secrets
- **Key Rotation**: Easier to rotate keys without service interruption
- **Reduced Attack Surface**: Public keys can be safely exposed

#### Improved Performance  
- **Edge Validation**: Tokens can be validated at the edge
- **No Auth Server Dependency**: Validation doesn't require calls to auth server
- **Web Crypto API**: Modern browser support for cryptographic operations

#### Better Scalability
- **Distributed Validation**: Multiple services can validate independently
- **Caching**: Public keys can be cached for better performance

## Troubleshooting

### Common Issues

#### 1. Token Validation Errors
```
Error: JWT signature verification failed
```
**Solution:** Ensure you have the correct SUPABASE_JWT_SECRET or new keys configured.

#### 2. Missing Keys Error
```
Error: Supabase key not configured
```
**Solution:** Set either `SUPABASE_PUBLISHABLE_KEY` or `SUPABASE_ANON_KEY` in your environment.

#### 3. CORS Issues
```
Error: CORS policy blocked the request
```
**Solution:** Verify your `ALLOWED_ORIGINS` includes your frontend URL.

### Debug Commands

#### Check Environment Variables
```bash
# Backend
echo $SUPABASE_URL
echo $SUPABASE_PUBLISHABLE_KEY
echo $SUPABASE_JWT_SECRET

# Frontend
echo $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

#### Test JWT Token
```bash
# Decode JWT to check claims and key ID
# Use jwt.io or a JWT decoder tool
```

### Rollback Plan

If you encounter issues, you can rollback by:

1. **Remove New Keys**: Comment out new environment variables
2. **Use Legacy Only**: Ensure legacy keys are still configured
3. **Restart Services**: Both backend and frontend

## Timeline and Actions

### Immediate Actions (Now)
- ✅ Code updated to support both systems
- ✅ Environment variables documented
- ⏳ **Set up new environment variables in your .env file**
- ⏳ **Test the hybrid authentication system**

### Before October 2025
- ⏳ **Migrate to new publishable/secret keys**
- ⏳ **Test thoroughly in development**
- ⏳ **Deploy to production with hybrid support**

### After October 2025  
- ⏳ **Remove legacy JWT_SECRET configuration**
- ⏳ **Clean up old environment variables**
- ⏳ **Update documentation**

## Additional Resources

- [Supabase JWT Signing Keys Blog Post](https://supabase.com/blog/jwt-signing-keys)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [JWT.io Token Decoder](https://jwt.io/)

## Support

If you encounter issues during migration:

1. **Check Logs**: Both backend and frontend logs contain detailed debugging info
2. **Environment**: Verify all environment variables are set correctly  
3. **Test**: Use the troubleshooting commands above
4. **Rollback**: Use the rollback plan if needed

---

**Note**: This migration maintains backward compatibility, so your existing users won't be affected during the transition period.