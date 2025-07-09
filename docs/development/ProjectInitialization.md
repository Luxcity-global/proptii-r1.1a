# Project Initialization and Update Scripts

## Overview

This guide covers the usage of the Proptii project initialization and update scripts. These scripts help maintain project consistency and ensure all settings are properly configured.

## Available Scripts

1. `scripts/init-project.sh`: Initializes the project for new developers
2. `scripts/update-settings.sh`: Updates project settings and documentation
3. `.git/hooks/post-commit`: Automatically updates settings after commits

## Installation

### 1. Make Scripts Executable

```bash
# Make all scripts executable
chmod +x scripts/init-project.sh
chmod +x scripts/update-settings.sh
chmod +x .git/hooks/post-commit
```

### 2. Install Required Tools

The scripts require the following tools to be installed:
- Node.js and npm
- Git
- Docker (optional, for database setup)
- inotify-tools (for file watching)

```bash
# Install inotify-tools (Linux)
sudo apt-get install inotify-tools

# Install inotify-tools (macOS)
brew install inotify-tools
```

## Usage

### Initializing a New Project

```bash
# Run the initialization script
./scripts/init-project.sh init
```

This will:
1. Check for required tools
2. Clone the repository (if not already cloned)
3. Install dependencies
4. Set up environment files
5. Configure the database
6. Run initial tests
7. Create documentation index

### Updating Project Settings

#### Manual Update
```bash
# Update settings manually
./scripts/update-settings.sh update
```

#### Watch Mode
```bash
# Watch for changes and update automatically
./scripts/update-settings.sh watch
```

### Checking for Updates
```bash
# Check for and apply updates
./scripts/init-project.sh update
```

## Script Details

### init-project.sh

#### Commands
- `init`: Initializes a new project
- `update`: Checks for and applies updates

#### Features
- Tool verification
- Repository cloning
- Dependency installation
- Environment setup
- Database configuration
- Test execution
- Documentation generation

### update-settings.sh

#### Commands
- `update`: Updates settings file
- `watch`: Watches for changes and updates automatically

#### Features
- Environment variable extraction
- API endpoint detection
- Documentation updates
- Settings file generation
- File change monitoring

### post-commit Hook

#### Features
- Automatic settings updates
- Documentation index updates
- Git commit amendments

## Settings File Structure

The scripts generate a `.proptii-settings` file with the following structure:

```bash
# Proptii Project Settings
# Last updated: [timestamp]

# Environment Variables
ENV_VARS=(
    "VITE_API_URL"
    "VITE_AZURE_OPENAI_API_KEY"
    # ... other variables
)

# Required Tools
REQUIRED_TOOLS=(
    "node"
    "npm"
    "git"
    "docker"
)

# Project Structure
PROJECT_STRUCTURE=(
    "src/components"
    "src/hooks"
    # ... other directories
)

# Database Configuration
DB_CONFIG=(
    "host=localhost"
    "port=5432"
    # ... other config
)

# API Endpoints
API_ENDPOINTS=(
    "/api/listings"
    "/api/search"
    # ... other endpoints
)

# Documentation Files
DOCS_FILES=(
    "docs/best-practices/maintenance.md"
    # ... other docs
)
```

## Troubleshooting

### Common Issues

1. **Script Permission Errors**
   ```bash
   # Solution: Make scripts executable
   chmod +x scripts/*.sh
   chmod +x .git/hooks/post-commit
   ```

2. **Missing Tools**
   ```bash
   # Solution: Install required tools
   # Check script output for specific missing tools
   ```

3. **Database Connection Issues**
   ```bash
   # Solution: Check docker-compose.yml
   # Ensure Docker is running
   docker-compose ps
   ```

4. **Environment File Issues**
   ```bash
   # Solution: Check .env.example
   # Copy to .env.local and update values
   cp .env.example .env.local
   ```

### Debug Mode

Run scripts with debug output:
```bash
# Add -x flag for debug output
bash -x scripts/init-project.sh init
```

## Best Practices

1. **Regular Updates**
   - Run update script before starting work
   - Check for updates after pulling changes
   - Monitor watch mode for real-time updates

2. **Environment Management**
   - Keep `.env.example` up to date
   - Document all environment variables
   - Use different files for different environments

3. **Documentation**
   - Update documentation when adding features
   - Keep settings file current
   - Document API changes

4. **Version Control**
   - Commit settings file changes
   - Keep hooks up to date
   - Document major changes

## Maintenance

### Regular Tasks

1. **Weekly**
   - Check for script updates
   - Verify environment variables
   - Update documentation

2. **Monthly**
   - Review API endpoints
   - Update project structure
   - Check tool requirements

3. **Quarterly**
   - Review all settings
   - Update best practices
   - Check security settings

### Update Process

1. **Script Updates**
   ```bash
   # Pull latest changes
   git pull origin main
   
   # Update scripts
   ./scripts/init-project.sh update
   ```

2. **Settings Updates**
   ```bash
   # Update settings
   ./scripts/update-settings.sh update
   
   # Verify changes
   git status
   ```

3. **Documentation Updates**
   ```bash
   # Check documentation
   cat docs/README.md
   
   # Update if needed
   ./scripts/update-settings.sh update
   ```

## Security Considerations

1. **Environment Variables**
   - Never commit sensitive values
   - Use environment-specific files
   - Document required variables

2. **Database Configuration**
   - Use secure passwords
   - Limit database access
   - Regular backup checks

3. **API Security**
   - Document authentication
   - Update security headers
   - Monitor endpoint changes

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review project documentation
3. Contact the development team 