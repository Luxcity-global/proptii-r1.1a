-- Database Schema for Version 2 Social Media Assets Module
-- PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    canvas_settings JSONB NOT NULL DEFAULT '{}',
    default_export_settings JSONB NOT NULL DEFAULT '{}',
    theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Assets table
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    width INTEGER,
    height INTEGER,
    thumbnail_url TEXT,
    tags TEXT[] DEFAULT '{}',
    category VARCHAR(50) NOT NULL CHECK (category IN ('image', 'video', 'audio', 'document', 'template', 'icon', 'font', 'other')),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Templates table
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('social_media', 'marketing', 'real_estate', 'lifestyle', 'business', 'education', 'entertainment', 'other')),
    subcategory VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    thumbnail_url TEXT NOT NULL,
    preview_url TEXT,
    canvas_data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Canvas projects table
CREATE TABLE canvas_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    current_version_id UUID,
    template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Canvas versions table
CREATE TABLE canvas_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES canvas_projects(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    canvas_data JSONB NOT NULL,
    change_description TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN DEFAULT FALSE,
    UNIQUE(project_id, version_number)
);

-- Canvas shares table
CREATE TABLE canvas_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES canvas_projects(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(20) NOT NULL CHECK (permission IN ('view', 'edit', 'admin')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, shared_with)
);

-- Canvas comments table
CREATE TABLE canvas_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES canvas_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    position JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Canvas exports table
CREATE TABLE canvas_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES canvas_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    export_format VARCHAR(10) NOT NULL CHECK (export_format IN ('png', 'jpg', 'pdf', 'svg')),
    export_settings JSONB NOT NULL,
    file_path TEXT,
    file_size BIGINT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Canvas analytics table
CREATE TABLE canvas_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES canvas_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'edit', 'export', 'share', 'comment', 'view')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI generations table
CREATE TABLE ai_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES canvas_projects(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    generation_type VARCHAR(50) NOT NULL CHECK (generation_type IN ('text', 'image', 'layout', 'color_scheme')),
    input_data JSONB,
    output_data JSONB,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- User sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_data JSONB NOT NULL DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_category ON assets(category);
CREATE INDEX idx_assets_tags ON assets USING GIN(tags);
CREATE INDEX idx_assets_created_at ON assets(created_at);
CREATE INDEX idx_assets_is_public ON assets(is_public);

CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_tags ON templates USING GIN(tags);
CREATE INDEX idx_templates_is_public ON templates(is_public);
CREATE INDEX idx_templates_is_featured ON templates(is_featured);
CREATE INDEX idx_templates_rating ON templates(rating);

CREATE INDEX idx_canvas_projects_user_id ON canvas_projects(user_id);
CREATE INDEX idx_canvas_projects_template_id ON canvas_projects(template_id);
CREATE INDEX idx_canvas_projects_is_public ON canvas_projects(is_public);
CREATE INDEX idx_canvas_projects_created_at ON canvas_projects(created_at);

CREATE INDEX idx_canvas_versions_project_id ON canvas_versions(project_id);
CREATE INDEX idx_canvas_versions_is_current ON canvas_versions(is_current);
CREATE INDEX idx_canvas_versions_created_at ON canvas_versions(created_at);

CREATE INDEX idx_canvas_shares_project_id ON canvas_shares(project_id);
CREATE INDEX idx_canvas_shares_shared_with ON canvas_shares(shared_with);

CREATE INDEX idx_canvas_comments_project_id ON canvas_comments(project_id);
CREATE INDEX idx_canvas_comments_user_id ON canvas_comments(user_id);

CREATE INDEX idx_canvas_exports_project_id ON canvas_exports(project_id);
CREATE INDEX idx_canvas_exports_user_id ON canvas_exports(user_id);
CREATE INDEX idx_canvas_exports_status ON canvas_exports(status);

CREATE INDEX idx_canvas_analytics_project_id ON canvas_analytics(project_id);
CREATE INDEX idx_canvas_analytics_user_id ON canvas_analytics(user_id);
CREATE INDEX idx_canvas_analytics_action ON canvas_analytics(action);
CREATE INDEX idx_canvas_analytics_created_at ON canvas_analytics(created_at);

CREATE INDEX idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX idx_ai_generations_project_id ON ai_generations(project_id);
CREATE INDEX idx_ai_generations_status ON ai_generations(status);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_canvas_projects_updated_at BEFORE UPDATE ON canvas_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_canvas_comments_updated_at BEFORE UPDATE ON canvas_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to set current version
CREATE OR REPLACE FUNCTION set_current_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Unset current flag for all other versions of this project
    UPDATE canvas_versions 
    SET is_current = FALSE 
    WHERE project_id = NEW.project_id AND id != NEW.id;
    
    -- Set current flag for the new version
    NEW.is_current = TRUE;
    
    -- Update the project's current_version_id
    UPDATE canvas_projects 
    SET current_version_id = NEW.id 
    WHERE id = NEW.project_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_current_version_trigger 
    BEFORE INSERT ON canvas_versions 
    FOR EACH ROW EXECUTE FUNCTION set_current_version();

-- Function to increment template usage count
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE templates 
    SET usage_count = usage_count + 1 
    WHERE id = NEW.template_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER increment_template_usage_trigger 
    AFTER INSERT ON canvas_projects 
    FOR EACH ROW 
    WHEN (NEW.template_id IS NOT NULL) 
    EXECUTE FUNCTION increment_template_usage();

-- Views for common queries
CREATE VIEW public_templates AS
SELECT 
    t.*,
    u.name as author_name,
    u.avatar_url as author_avatar
FROM templates t
JOIN users u ON t.user_id = u.id
WHERE t.is_public = TRUE;

CREATE VIEW featured_templates AS
SELECT 
    t.*,
    u.name as author_name,
    u.avatar_url as author_avatar
FROM templates t
JOIN users u ON t.user_id = u.id
WHERE t.is_public = TRUE AND t.is_featured = TRUE;

CREATE VIEW public_assets AS
SELECT 
    a.*,
    u.name as author_name,
    u.avatar_url as author_avatar
FROM assets a
JOIN users u ON a.user_id = u.id
WHERE a.is_public = TRUE;

-- Sample data for development
INSERT INTO users (id, email, name, avatar_url) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'admin@proptii.com', 'Admin User', 'https://github.com/shadcn.png'),
    ('550e8400-e29b-41d4-a716-446655440001', 'user@proptii.com', 'Test User', 'https://github.com/shadcn.png');

INSERT INTO user_preferences (user_id, canvas_settings, default_export_settings) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 
     '{"default_width": 800, "default_height": 600, "default_zoom": 1, "show_grid": true, "snap_to_grid": false, "grid_size": 20, "auto_save_interval": 30, "max_undo_history": 50}',
     '{"default_format": "png", "default_quality": 90, "default_dpi": 300, "include_metadata": true}'),
    ('550e8400-e29b-41d4-a716-446655440001',
     '{"default_width": 1080, "default_height": 1080, "default_zoom": 1, "show_grid": false, "snap_to_grid": true, "grid_size": 10, "auto_save_interval": 60, "max_undo_history": 30}',
     '{"default_format": "jpg", "default_quality": 85, "default_dpi": 150, "include_metadata": false}');

