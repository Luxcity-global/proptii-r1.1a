# Proptii Backend

## Setup Instructions

1. **Prerequisites**
   - Node.js (v20 LTS recommended)
   - npm (latest version)
   - SQL Server access (Azure SQL Database)

2. **Environment Setup**
   ```bash
   # Clone the repository
   git clone https://github.com/Luxcity-global/proptii-r1.1a.git
   cd proptii-r1.1a/proptii-backend

   # Install dependencies
   npm install
   ```

3. **Configuration**
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_HOST=proptii-sql-server.database.windows.net
   DATABASE_USER=your_username
   DATABASE_PASSWORD=your_password
   DATABASE_NAME=proptii-db
   PORT=3000
   ```

4. **Database Migration**
   ```bash
   # Run migrations
   npm run migration:run
   ```

5. **Running the Application**
   ```bash
   # Development mode
   npm run start:dev

   # Production mode
   npm run start:prod
   ```

## Project Structure
```
proptii-backend/
├── src/
│   ├── entities/        # Database entities
│   ├── migrations/      # Database migrations
│   ├── controllers/     # API Controllers
│   ├── services/        # Business logic
│   └── main.ts         # Application entry point
├── typeorm.config.ts   # Database configuration
└── package.json       # Project dependencies
```

## Available Scripts
- `npm run start:dev` - Start the application in development mode
- `npm run build` - Build the application
- `npm run start:prod` - Start the application in production mode
- `npm run migration:generate` - Generate new migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration

## Current Status
- Database connection configured
- Initial migration setup complete
- Entity creation in progress

## Azure OpenAI Configuration

The backend uses Azure OpenAI for property search functionality. The following environment variables are required:

```