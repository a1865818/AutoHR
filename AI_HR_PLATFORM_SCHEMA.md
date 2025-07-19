# AI HR Platform - Comprehensive Database Schema Design

## Overview

This schema is designed for a modern AI-powered HR recruitment platform that supports job posting, candidate management, resume parsing, skill matching, interview scheduling, and advanced analytics.

## Core Design Principles

- **Scalability**: Designed to handle thousands of jobs and candidates
- **AI-Ready**: Structured to support ML/AI features like skill matching and resume parsing
- **Flexible**: Supports various job types, locations, and hiring processes
- **Audit Trail**: Comprehensive tracking of all activities
- **Performance**: Optimized with proper indexing and relationships

---

## Database Tables

### 1. **Users & Authentication**

#### `AspNetUsers` (Identity Framework - Extended)

```sql
-- This extends the default Identity User table
ALTER TABLE AspNetUsers ADD COLUMN first_name VARCHAR(100);
ALTER TABLE AspNetUsers ADD COLUMN last_name VARCHAR(100);
ALTER TABLE AspNetUsers ADD COLUMN profile_picture_url VARCHAR(500);
ALTER TABLE AspNetUsers ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE AspNetUsers ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE AspNetUsers ADD COLUMN last_login_at TIMESTAMP;
ALTER TABLE AspNetUsers ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE AspNetUsers ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE AspNetUsers ADD COLUMN language_preference VARCHAR(10) DEFAULT 'en';
```

#### `user_profiles`

```sql
CREATE TABLE hiring_user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(450) NOT NULL REFERENCES AspNetUsers(Id) ON DELETE CASCADE,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('recruiter', 'candidate', 'admin', 'hiring_manager')),
    company_id UUID REFERENCES companies(id),
    bio TEXT,
    website_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    location JSONB, -- {city, state, country, coordinates}
    preferences JSONB, -- notification, privacy, etc.
    metadata JSONB, -- extensible for future features
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);
```

### 2. **Organizations & Structure**

#### `companies`

```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    website VARCHAR(500),
    logo_url VARCHAR(500),
    industry VARCHAR(100),
    company_size VARCHAR(50), -- '1-10', '11-50', '51-200', etc.
    headquarters JSONB, -- {city, state, country}
    founded_year INTEGER,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- NEW: Track company creator for Admin role assignment
    created_by UUID REFERENCES hiring_user_profiles(id), -- Links to the hiring user who created this company
    creator_email VARCHAR(320) -- Temporary field to store creator email until they register
);
```

#### `departments`

```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    parent_department_id UUID REFERENCES departments(id),
    manager_user_id VARCHAR(450) REFERENCES AspNetUsers(Id),
    budget_allocated DECIMAL(15,2),
    headcount_target INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. **Job Management**

#### `jobs`

```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id),
    created_by UUID NOT NULL REFERENCES hiring_user_profiles(id),

    -- Job Details
    description TEXT NOT NULL,
    responsibilities TEXT[],
    requirements TEXT[],
    qualifications TEXT[],
    benefits TEXT[],

    -- Job Classification
    employment_type VARCHAR(50) NOT NULL ,
    seniority_level VARCHAR(50),
    experience_years_min INTEGER,

    -- Location & Remote
    location_type VARCHAR(20) NOT NULL ,
    locations JSONB[], -- Array of location objects

    -- Compensation
    salary_min DECIMAL(15,2),
    salary_max DECIMAL(15,2),
    salary_currency VARCHAR(3) DEFAULT 'USD',

    -- Application Settings
    application_deadline TIMESTAMP,

    -- Status & Metadata
    status VARCHAR(20) DEFAULT 'draft',
    applicant_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,

    -- AI Features
    ai_generated_description BOOLEAN DEFAULT FALSE,
    skill_match_threshold DECIMAL(3,2) DEFAULT 0.70,

    -- Timestamps
    posted_date TIMESTAMP,
    closed_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for jobs table
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_company_status ON jobs(company_id, status);
CREATE INDEX idx_jobs_posted_date ON jobs(posted_date DESC);
CREATE INDEX idx_jobs_location_type ON jobs(location_type);
CREATE INDEX idx_jobs_employment_type ON jobs(employment_type);
```

#### `job_skills`

```sql
CREATE TABLE job_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id),
    importance_level VARCHAR(20) CHECK (importance_level IN ('required', 'preferred', 'nice_to_have')),
    experience_years_required INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, skill_id)
);
```

#### `job_questions`

```sql
CREATE TABLE job_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) CHECK (question_type IN ('text', 'multiple_choice', 'boolean', 'number', 'file_upload')),
    options JSONB, -- For multiple choice questions
    is_required BOOLEAN DEFAULT FALSE,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. **Skills & Competencies**

#### `skills`

```sql
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL UNIQUE,
    slug VARCHAR(250) UNIQUE NOT NULL,
    category VARCHAR(100), -- 'technical', 'soft', 'language', 'certification'
    subcategory VARCHAR(100),
    description TEXT,
    aliases TEXT[], -- Alternative names for the skill
    parent_skill_id UUID REFERENCES skills(id),
    popularity_score DECIMAL(5,2) DEFAULT 0, -- Based on frequency of use
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_popularity ON skills(popularity_score DESC);
```

### 5. **Applications & Candidates**

#### `ApplicationDetails`

```sql
CREATE TABLE ApplicationDetails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id),
    candidate_user_id uuid NOT NULL REFERENCES "ApplicationUser"(id),

    -- Application Data
    resume_url VARCHAR(500),
    cover_letter_text TEXT,
    expected_salary DECIMAL(15,2),
    availability_date DATE,

    -- Status Tracking
    status VARCHAR(50) DEFAULT 'applied',
    stage VARCHAR(50) DEFAULT 'initial_review',
    job_source VARCHAR(100), -- 'website', 'referral', 'linkedin', etc

    -- AI Scoring
    overall_ai_score DECIMAL(5,2), -- Combined AI score
    ai_analysis JSONB, -- Detailed AI analysis results

    -- Timestamps
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(job_id, candidate_user_id)
);

-- Indexes for applications
CREATE INDEX idx_applications_job_status ON ApplicationDetails(job_id, status);
CREATE INDEX idx_applications_candidate ON ApplicationDetails(candidate_user_id);
CREATE INDEX idx_applications_status ON ApplicationDetails(status);
CREATE INDEX idx_applications_ai_score ON ApplicationDetails(overall_ai_score DESC);
CREATE INDEX idx_applications_applied_at ON ApplicationDetails(applied_at DESC);
```

#### `application_answers`

```sql
CREATE TABLE application_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES job_questions(id),
    answer_text TEXT,
    answer_file_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(application_id, question_id)
);
```

#### `candidate_profiles`

```sql
CREATE TABLE candidate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(450) NOT NULL REFERENCES AspNetUsers(Id) ON DELETE CASCADE,

    -- Personal Information
    current_title VARCHAR(200),
    summary TEXT,
    current_company VARCHAR(200),
    current_salary DECIMAL(15,2),
    desired_salary DECIMAL(15,2),
    notice_period_days INTEGER,

    -- Status
    job_seeking_status VARCHAR(50) CHECK (job_seeking_status IN ('actively_looking', 'open_to_offers', 'not_looking')),
    availability_date DATE,
    preferred_locations JSONB[],
    willing_to_relocate BOOLEAN DEFAULT FALSE,
    remote_work_preference VARCHAR(50) CHECK (remote_work_preference IN ('remote_only', 'hybrid', 'on_site', 'flexible')),

    -- Experience
    total_experience_years DECIMAL(3,1),
    current_level VARCHAR(50) CHECK (current_level IN ('entry', 'mid', 'senior', 'lead', 'principal', 'executive')),

    -- Documents
    resume_url VARCHAR(500),
    portfolio_url VARCHAR(500),

    -- AI Parsed Data
    parsed_skills JSONB, -- Skills extracted from resume/profile
    parsed_experience JSONB, -- Work experience extracted
    parsed_education JSONB, -- Education extracted
    last_ai_analysis_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `candidate_skills`

```sql
CREATE TABLE candidate_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_user_id VARCHAR(450) NOT NULL REFERENCES AspNetUsers(Id),
    skill_id UUID NOT NULL REFERENCES skills(id),
    proficiency_level VARCHAR(20) CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    years_of_experience DECIMAL(3,1),
    is_verified BOOLEAN DEFAULT FALSE,
    source VARCHAR(50) CHECK (source IN ('self_reported', 'ai_extracted', 'assessment', 'certification')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(candidate_user_id, skill_id)
);
```

### 6. **Interview & Assessment Management**

#### `interviews`

```sql
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id),
    interviewer_user_id VARCHAR(450) NOT NULL REFERENCES AspNetUsers(Id),

    -- Interview Details
    title VARCHAR(200) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('phone', 'video', 'in_person', 'technical', 'behavioral', 'panel')),
    round_number INTEGER DEFAULT 1,

    -- Scheduling
    scheduled_start_time TIMESTAMP NOT NULL,
    scheduled_end_time TIMESTAMP NOT NULL,
    timezone VARCHAR(50),
    location VARCHAR(500), -- Physical location or meeting link
    meeting_link VARCHAR(500),

    -- Status
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),

    -- Results
    overall_rating DECIMAL(3,2), -- 1-5 scale
    notes TEXT,
    feedback JSONB,
    recommendation VARCHAR(50) CHECK (recommendation IN ('strong_hire', 'hire', 'no_hire', 'strong_no_hire')),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
```

#### `assessments`

```sql
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(50) CHECK (type IN ('coding', 'cognitive', 'personality', 'skills', 'cultural_fit')),
    duration_minutes INTEGER,
    passing_score DECIMAL(5,2),
    questions JSONB, -- Assessment questions/tasks
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `assessment_results`

```sql
CREATE TABLE assessment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id),
    application_id UUID NOT NULL REFERENCES applications(id),
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    percentage DECIMAL(5,2),
    time_taken_minutes INTEGER,
    answers JSONB,
    ai_analysis JSONB,
    status VARCHAR(50) CHECK (status IN ('in_progress', 'completed', 'expired', 'abandoned')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(assessment_id, application_id)
);
```

### 7. **Communication & Messaging**

#### `messages`

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL,
    sender_user_id VARCHAR(450) NOT NULL REFERENCES AspNetUsers(Id),
    recipient_user_id VARCHAR(450) REFERENCES AspNetUsers(Id),
    application_id UUID REFERENCES applications(id),

    -- Message Content
    subject VARCHAR(500),
    body TEXT NOT NULL,
    message_type VARCHAR(50) CHECK (message_type IN ('email', 'internal', 'sms', 'notification')),

    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    is_automated BOOLEAN DEFAULT FALSE,
    template_used VARCHAR(200),

    -- Attachments
    attachments JSONB, -- Array of file URLs and metadata

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_user_id, is_read);
```

### 8. **Analytics & Reporting**

#### `analytics_events`

```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(450) REFERENCES AspNetUsers(Id),
    session_id VARCHAR(100),
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50),
    event_data JSONB,
    job_id UUID REFERENCES jobs(id),
    application_id UUID REFERENCES applications(id),
    ip_address INET,
    user_agent TEXT,
    referer_url VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partitioning by date for performance
CREATE INDEX idx_analytics_events_type_date ON analytics_events(event_type, created_at);
CREATE INDEX idx_analytics_events_user_date ON analytics_events(user_id, created_at);
```

#### `job_analytics`

```sql
CREATE TABLE job_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id),
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    applications INTEGER DEFAULT 0,
    application_conversion_rate DECIMAL(5,4),
    avg_time_on_page INTEGER, -- seconds
    bounce_rate DECIMAL(5,4),
    top_traffic_sources JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, date)
);
```

### 9. **AI & Machine Learning Data**

#### `ai_models`

```sql
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'resume_parser', 'skill_matcher', 'culture_fit', etc.
    version VARCHAR(50) NOT NULL,
    model_config JSONB,
    training_data_info JSONB,
    accuracy_metrics JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    deployed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `ai_predictions`

```sql
CREATE TABLE ai_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES ai_models(id),
    prediction_type VARCHAR(100) NOT NULL,
    input_data JSONB,
    prediction_result JSONB,
    confidence_score DECIMAL(5,4),
    job_id UUID REFERENCES jobs(id),
    candidate_user_id VARCHAR(450) REFERENCES AspNetUsers(Id),
    application_id UUID REFERENCES applications(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 10. **Notifications & Communication**

#### `notifications`

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(450) NOT NULL REFERENCES AspNetUsers(Id),
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) CHECK (type IN ('application', 'interview', 'message', 'system', 'reminder')),
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    action_url VARCHAR(1000),
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE,
    delivery_method VARCHAR(50)[], -- ['email', 'push', 'sms']
    metadata JSONB,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at);
```

### 11. **Audit & Compliance**

#### `audit_logs`

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(450) REFERENCES AspNetUsers(Id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partitioning and indexing for performance
CREATE INDEX idx_audit_logs_user_date ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
```

---

## Advanced Features Schema

### 12. **Resume Parsing & Document Management**

#### `documents`

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(450) NOT NULL REFERENCES AspNetUsers(Id),
    document_type VARCHAR(50) CHECK (document_type IN ('resume', 'cover_letter', 'portfolio', 'certificate', 'other')),
    original_filename VARCHAR(500) NOT NULL,
    file_url VARCHAR(1000) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),

    -- Parsing Results
    parsed_content TEXT,
    parsed_data JSONB, -- Structured data extracted from document
    parsing_status VARCHAR(50) CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed')),
    parsing_confidence DECIMAL(5,4),

    -- AI Analysis
    ai_extracted_skills TEXT[],
    ai_experience_summary JSONB,
    ai_education_summary JSONB,
    ai_analysis_version VARCHAR(50),

    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 13. **Team Collaboration**

#### `hiring_teams`

```sql
CREATE TABLE hiring_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id),
    user_id VARCHAR(450) NOT NULL REFERENCES AspNetUsers(Id),
    role VARCHAR(50) CHECK (role IN ('hiring_manager', 'recruiter', 'interviewer', 'collaborator')),
    permissions JSONB, -- Specific permissions for this team member
    added_by VARCHAR(450) REFERENCES AspNetUsers(Id),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, user_id)
);
```

---

## Indexes and Performance Optimization

### Critical Indexes

```sql
-- Performance-critical indexes
CREATE INDEX CONCURRENTLY idx_applications_composite ON applications(job_id, status, overall_ai_score DESC);
CREATE INDEX CONCURRENTLY idx_jobs_search ON jobs USING GIN(to_tsvector('english', title || ' ' || description));
CREATE INDEX CONCURRENTLY idx_candidates_skills_search ON candidate_skills(skill_id, proficiency_level);
CREATE INDEX CONCURRENTLY idx_messages_timeline ON messages(recipient_user_id, created_at DESC);

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY idx_jobs_active ON jobs(created_at DESC) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_applications_pending ON applications(applied_at DESC) WHERE status IN ('applied', 'screening', 'interview');
```

### Database Views for Common Queries

#### `view_job_statistics`

```sql
CREATE VIEW view_job_statistics AS
SELECT
    j.id,
    j.title,
    j.company_id,
    j.status,
    COUNT(a.id) as total_applications,
    COUNT(CASE WHEN a.status = 'applied' THEN 1 END) as new_applications,
    COUNT(CASE WHEN a.status = 'interview' THEN 1 END) as interviews_scheduled,
    COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as hires,
    AVG(a.overall_ai_score) as avg_candidate_score,
    j.created_at,
    j.posted_date
FROM jobs j
LEFT JOIN applications a ON j.id = a.job_id
GROUP BY j.id, j.title, j.company_id, j.status, j.created_at, j.posted_date;
```

---

## Data Relationships Summary

### Key Relationships:

1. **Users → UserProfiles** (1:1)
2. **Companies → Departments** (1:N)
3. **Companies → Jobs** (1:N)
4. **Jobs → Applications** (1:N)
5. **Applications → Interviews** (1:N)
6. **Users → CandidateProfiles** (1:1)
7. **Skills → JobSkills** (N:M via job_skills)
8. **Skills → CandidateSkills** (N:M via candidate_skills)
9. **Applications → Messages** (1:N)
10. **Jobs → HiringTeams** (1:N)

---

## Migration Strategy for Supabase

### Supabase-Specific Features to Leverage:

1. **Row Level Security (RLS)**

```sql
-- Enable RLS on sensitive tables
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see their own applications
CREATE POLICY "Users can view own applications" ON applications
    FOR SELECT USING (candidate_user_id = auth.uid()::text);
```

2. **Real-time Subscriptions**

```sql
-- Enable real-time for job applications
ALTER publication supabase_realtime ADD TABLE applications;
ALTER publication supabase_realtime ADD TABLE messages;
```

3. **Storage Integration**

```sql
-- Documents will be stored in Supabase Storage
-- Update file_url references to use Supabase Storage URLs
```

---

## Benefits of This Schema Design

### 🎯 **AI-Ready Architecture**

- Structured data for ML model training
- AI scoring and analysis fields
- Resume parsing and skill extraction support

### 📊 **Analytics & Insights**

- Comprehensive tracking of user actions
- Job performance metrics
- Conversion funnel analysis

### 🔒 **Security & Compliance**

- Complete audit trail
- Role-based access control
- GDPR compliance ready

### ⚡ **Performance Optimized**

- Strategic indexing
- Partitioning for large tables
- Optimized queries with views

### 🔄 **Scalable & Flexible**

- JSONB fields for extensibility
- Support for multiple job types and workflows
- Microservices-ready design

This schema provides a solid foundation for your AI HR platform while maintaining flexibility for future enhancements and AI-powered features!

---

## Database Migrations

### Admin Role Implementation Migration

To implement the admin role logic where only company creators get Admin privileges, run the following SQL migration:

```sql
-- Add new columns to companies table
ALTER TABLE companies
ADD COLUMN created_by UUID REFERENCES hiring_user_profiles(id),
ADD COLUMN creator_email VARCHAR(320),
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for performance
CREATE INDEX idx_companies_created_by ON companies(created_by);
CREATE INDEX idx_companies_creator_email ON companies(creator_email);

-- Update existing companies (optional - for existing data)
-- Note: This would require manual intervention to identify company creators
-- UPDATE companies SET creator_email = email WHERE creator_email IS NULL;

-- Add comment to document the admin role logic
COMMENT ON COLUMN companies.created_by IS 'UUID of the hiring user who created this company and should have Admin role';
COMMENT ON COLUMN companies.creator_email IS 'Temporary field to store creator email during registration flow';
```

### Admin Role Logic Rules

1. **Company Creation**: When a new company is created, the `creator_email` field stores the email of the user who will be the admin.

2. **User Registration**: When a hiring user registers:

   - System checks if their email matches any company's `creator_email`
   - If match found: User gets "Admin" role and company's `created_by` field is updated
   - If no match: User gets "HiringUser" role

3. **Role Restrictions**:

   - Admin roles cannot be manually assigned through API endpoints
   - Admin users cannot change their company association
   - Only one Admin per company (the creator)

4. **Security Measures**:
   - `UpdateHiringUserProfileRequest` does not include role field
   - Profile update endpoints preserve existing roles
   - Admin verification helper methods check both role and company ownership
