#!/bin/bash

echo "🚀 AI-HR Platform - Supabase Auth Migration Setup"
echo "================================================="
echo

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your Supabase credentials."
    echo
    echo "Required credentials:"
    echo "- SUPABASE_URL (from Supabase Dashboard > Settings > API)"
    echo "- SUPABASE_KEY (anon key)"
    echo "- SUPABASE_SERVICE_KEY (service_role key)"
    echo "- SUPABASE_JWT_SECRET (JWT Secret)"
    echo
    echo "❌ Please edit .env file and run this script again."
    exit 1
fi

# Check if required environment variables are set
echo "🔍 Checking environment configuration..."
source .env

REQUIRED_VARS=("SUPABASE_URL" "SUPABASE_KEY" "SUPABASE_SERVICE_KEY" "SUPABASE_JWT_SECRET" "JWT_SECRET_KEY")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ] || [[ "${!var}" == *"your-"* ]]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Missing or incomplete environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo
    echo "Please update your .env file with real values and run this script again."
    exit 1
fi

echo "✅ Environment configuration looks good!"
echo

# Backup current Program.cs if it exists
if [ -f "Program.cs" ]; then
    echo "💾 Backing up current Program.cs..."
    cp Program.cs Program.Legacy.cs
    echo "✅ Backup saved as Program.Legacy.cs"
fi

# Use hybrid Program.cs
echo "🔄 Switching to hybrid authentication system..."
cp Program.Hybrid.cs Program.cs
echo "✅ Hybrid authentication enabled"
echo

# Build the project
echo "🔨 Building the project..."
if dotnet build; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please fix build errors and try again."
    exit 1
fi

echo
echo "🎉 Setup complete! You can now:"
echo
echo "1. Run the application:"
echo "   dotnet run"
echo
echo "2. Open Swagger UI:"
echo "   http://localhost:5189/swagger"
echo
echo "3. Run migration via API endpoints:"
echo "   POST http://localhost:5189/api/migration/all"
echo "   GET http://localhost:5189/api/migration/verify"
echo
echo "4. Or use the console migration runner:"
echo "   dotnet run --project MigrationRunner.csproj"
echo
echo "📚 See MIGRATION_SETUP.md for detailed instructions."
echo
echo "⚠️  IMPORTANT: Test in development first!"
echo "⚠️  Make sure to add SupabaseAuthId column to your database tables."
echo