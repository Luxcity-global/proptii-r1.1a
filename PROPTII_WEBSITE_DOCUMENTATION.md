# Proptii Website Documentation
## Comprehensive Guide to Features and User Types

---

## Table of Contents
1. [Website Overview](#website-overview)
2. [User Types](#user-types)
3. [Tenant Features](#tenant-features)
4. [Agent/Landlord Features](#agentlandlord-features)
5. [Homeowner Features](#homeowner-features)
6. [Core Services](#core-services)
7. [Technical Architecture](#technical-architecture)

---

## Website Overview

**Proptii** is a comprehensive property management platform designed to streamline the entire property rental and management lifecycle. The platform serves three distinct user types, each with tailored features and capabilities to meet their specific needs in the property market.

### Primary Purpose
Proptii facilitates the complete property journey from search to management, offering:
- **Property Search & Discovery**: Advanced search capabilities across multiple property websites
- **Viewing Management**: AI-powered booking system for property viewings
- **Referencing Services**: Comprehensive tenant verification and referencing
- **Contract Management**: Digital contract creation, signing, and tracking via DocuSign integration
- **Property Management**: Complete portfolio management for landlords and agents
- **Home Management**: Maintenance and document tracking for homeowners

### Key Differentiators
- Multi-platform property search aggregation
- Integrated referencing and contract signing workflow
- Role-based dashboards with specialized features
- Real-time synchronization across all user types
- Azure AD B2C authentication for secure access
- Firebase/Firestore integration for real-time data

---

## User Types

Proptii supports three distinct user types, each with unique access levels and feature sets:

### 1. **Tenant**
Users seeking rental properties who need to search, view, apply, and manage their rental journey.

### 2. **Agent/Landlord**
Property professionals managing rental properties, including:
- **Landlords**: Individual property owners managing their own properties
- **Agents**: Property management companies managing multiple client properties

### 3. **Homeowner**
Property owners managing their own homes (not for rental purposes), focusing on maintenance, documents, and home value tracking.

---

## Tenant Features

### Dashboard Overview
Tenants have access to a comprehensive dashboard with the following sections:

#### 1. **Property Search & Discovery**
- **Multi-Source Search**: Search across multiple property websites including:
  - OnTheMarket.com
  - Rightmove
  - OpenRent
  - Internet-wide search via Brave Search API
- **Advanced Filtering**: Filter by:
  - Location (with map integration)
  - Price range
  - Property type (apartment, house, commercial, land)
  - Number of bedrooms/bathrooms
  - Amenities (parking, garden, etc.)
- **Saved Searches**: Save search criteria for quick access
- **Property Details**: View comprehensive property information including:
  - High-quality images
  - Virtual tours
  - Property specifications
  - Location maps
  - Nearby amenities

#### 2. **Viewing Management**
- **Book Viewings**: AI-powered booking system that:
  - Automatically schedules property viewings
  - Sends confirmation emails
  - Manages viewing calendar
  - Provides viewing reminders
- **Viewing History**: Track all booked and completed viewings
- **Viewing Status**: Monitor viewing status (pending, confirmed, completed, cancelled)

#### 3. **Referencing Services**
- **Tenant Referencing Application**: Complete referencing process including:
  - Personal information collection
  - Employment verification
  - Financial assessment
  - Previous landlord references
  - Credit checks
- **Referee/Guarantor Management**:
  - Invite referees and guarantors
  - Track response status
  - View completed references
- **Reference Status Tracking**: Monitor the progress of your referencing application
- **Document Upload**: Upload required documents (ID, payslips, bank statements)

#### 4. **Contract Management**
- **Digital Contract Signing**: 
  - Receive contracts from landlords/agents
  - Review contract terms
  - Sign contracts digitally via DocuSign integration
  - Download signed contracts
- **Contract History**: View all contracts (pending, signed, expired)
- **Contract Status**: Track contract status in real-time
- **Document Storage**: Access all contract-related documents

#### 5. **File Management**
- **Your Files Section**: Centralized document storage including:
  - Referencing documents
  - Contract documents
  - Identity documents
  - Financial documents
- **File Organization**: Organize files by category and date
- **File Preview**: Preview documents without downloading
- **Secure Storage**: All files stored securely in Firebase Storage

#### 6. **Saved Properties**
- **Property Bookmarks**: Save favorite properties for later review
- **Property Comparison**: Compare saved properties side-by-side
- **Price Alerts**: Receive notifications when saved properties change price
- **Property Status Updates**: Get notified when saved properties become available/unavailable

### Tenant Dashboard Navigation
- **Dashboard Home**: Overview of all tenant activities
- **Saved Searches**: Access to saved property searches
- **Viewings**: Manage all viewing appointments
- **Contracts**: View and manage rental contracts
- **Tenant Referencing**: Track referencing application progress
- **Your Files**: Access all uploaded documents

---

## Agent/Landlord Features

### Dashboard Overview
Agents and Landlords have access to a comprehensive property management dashboard with the following capabilities:

#### 1. **Property Management**
- **Property Portfolio**: 
  - Add new properties with detailed information
  - Edit existing property details
  - Upload property photos and virtual tours
  - Manage property status (available, under contract, rented, inactive)
- **Property Details Management**:
  - Property specifications (bedrooms, bathrooms, square footage)
  - Pricing information (rental/sale price)
  - Property features and amenities
  - Location and address details
  - Property type classification
- **Property Photos**: 
  - Upload multiple high-quality images
  - Set primary image
  - Organize photo galleries
  - Virtual tour integration
- **Property Listing**: 
  - Publish properties to multiple platforms
  - Manage listing visibility
  - Track listing performance

#### 2. **Tenant Management**
- **Tenant Onboarding**:
  - **Manual Input**: Add tenant details directly
  - **Email Invitation**: Send invitation emails for tenants to complete their profile
  - **Select Existing**: Assign existing tenants from database
- **Tenant Profiles**: 
  - Complete tenant information management
  - Contact details and communication history
  - Property assignment
  - Lease information
- **Tenant Lifecycle Management**:
  - Track tenant status (prospect → applicant → tenant → former tenant)
  - Manage tenant transitions
  - Historical tenant data
- **Tenant Communication**:
  - Tenant inbox for incoming messages
  - Communication history
  - Automated communication templates

#### 3. **Contract Management**
- **Contract Creation**:
  - Create rental contracts
  - Upload contract documents (PDF, Word)
  - Set contract terms and conditions
  - Assign contracts to tenants
- **DocuSign Integration**:
  - Send contracts for digital signing
  - Track signing status in real-time
  - Receive signed contracts automatically
  - Contract synchronization between tenant and landlord dashboards
- **Contract Tracking**:
  - View all contracts (sent, unsigned, signed)
  - Filter by status, tenant, or property
  - Contract expiry tracking
  - Renewal alerts and reminders
- **Contract Storage**: 
  - Secure storage of all contract documents
  - Version history
  - Download and share contracts

#### 4. **Referencing Management**
- **Reference Requests**:
  - Initiate referencing for prospective tenants
  - Send reference requests to previous landlords
  - Request guarantor information
- **Reference Tracking**:
  - Monitor reference completion status
  - View completed references
  - Track referee and guarantor responses
- **Reference Results**:
  - Review reference outcomes
  - Make tenancy decisions based on references
  - Store reference documents

#### 5. **Document Management**
- **Property Documents**:
  - Store property-related documents (certificates, warranties, inspections)
  - Document expiry tracking
  - Document categorization
- **Tenant Documents**:
  - Access tenant-uploaded documents
  - Organize documents by tenant
  - Secure document sharing
- **Compliance Documents**:
  - Track required compliance documents
  - Set expiry reminders
  - Maintain compliance records

#### 6. **Viewing Management**
- **Viewing Requests**:
  - Receive viewing requests from tenants
  - Approve or decline viewings
  - Schedule viewing appointments
- **Viewing Calendar**:
  - Manage viewing schedule
  - View all upcoming viewings
  - Track viewing history
- **Viewing Confirmation**:
  - Send confirmation emails
  - Provide viewing instructions
  - Track viewing attendance

#### 7. **Portfolio Insights & Analytics**
- **Property Analytics**:
  - Property performance metrics
  - Occupancy rates
  - Rental income tracking
- **Portfolio Overview**:
  - Total properties managed
  - Vacancy rates
  - Financial summaries
- **Market Insights**:
  - Property value trends
  - Market comparisons
  - Rental yield analysis

#### 8. **Alerts & Notifications**
- **Priority Alerts**:
  - Vacancy prevention alerts
  - Arrears management alerts
  - Document expiry reminders
  - Contract renewal alerts
- **Automated Reminders**:
  - Lease renewal reminders (30/60/90 days before expiry)
  - Maintenance reminders
  - Compliance deadline alerts

#### 9. **Role-Specific Features**

##### For Landlords:
- Personal property portfolio management
- Direct tenant management
- Individual compliance tracking
- Simple financial reporting
- Landlord profile setup

##### For Agents:
- Multi-client property management
- Advanced reporting tools
- Team collaboration features
- White-label options
- Company profile setup
- Client management

### Agent/Landlord Dashboard Navigation
- **Dashboard**: Overview of portfolio and activities
- **Properties**: Manage property portfolio
- **Tenants**: Manage tenant relationships
- **Contracts**: Handle all contract operations
- **Documents**: Access all property and tenant documents
- **Tenant Inbox**: Communication hub
- **Property Insights**: Analytics and market data

---

## Homeowner Features

### Dashboard Overview
Homeowners have access to a specialized dashboard focused on managing their own home, not rental properties.

#### 1. **Maintenance Management**
- **Maintenance Tasks**:
  - Create and schedule maintenance tasks
  - Set task priorities (high, medium, low)
  - Assign due dates
  - Track task status (pending, in progress, completed)
- **Maintenance Categories**:
  - HVAC service
  - Plumbing
  - Electrical
  - Exterior maintenance
  - Interior maintenance
  - Seasonal tasks
- **Maintenance History**:
  - View completed maintenance tasks
  - Track maintenance costs
  - Maintenance scheduling patterns
- **Maintenance Reminders**:
  - Automated reminders for recurring tasks
  - Seasonal maintenance alerts
  - Service provider contact management

#### 2. **Documentation Hub**
- **Home Documents**:
  - Store warranties and guarantees
  - Home improvement receipts
  - Appliance manuals
  - Insurance documents
  - Property certificates (EPC, gas safety, etc.)
- **Document Organization**:
  - Categorize documents by type
  - Tag documents for easy search
  - Document expiry tracking
  - Expiry reminders
- **Document Access**:
  - Quick document search
  - Document preview
  - Download and share documents
  - Secure cloud storage

#### 3. **Project Management**
- **Home Improvement Projects**:
  - Track home improvement projects
  - Set project budgets
  - Monitor project progress
  - Store project-related documents
- **Project Planning**:
  - Create project timelines
  - Set project milestones
  - Track project expenses
  - Before/after photo storage

#### 4. **Home Value Tracking**
- **Property Valuation**:
  - Track estimated home value
  - View value trends over time
  - Market comparison data
  - Value change notifications
- **Market Insights**:
  - Local market trends
  - Comparable property data
  - Investment tracking

#### 5. **Communication Hub**
- **Service Provider Communication**:
  - Contact management for contractors, plumbers, electricians, etc.
  - Communication history
  - Service request tracking
- **Message Management**:
  - Send and receive messages
  - Message threading
  - Communication archive

#### 6. **Energy Efficiency**
- **Utility Tracking**:
  - Monitor utility consumption
  - Track energy costs
  - Optimize consumption patterns
- **Efficiency Metrics**:
  - Energy efficiency ratings
  - Cost savings tracking
  - Efficiency improvement suggestions

#### 7. **Insurance & Protection**
- **Insurance Management**:
  - Store insurance policies
  - Track policy expiry dates
  - Renewal reminders
  - Claims management

#### 8. **Property Tax & Finance**
- **Tax Tracking**:
  - Property tax records
  - Tax payment reminders
  - Tax document storage
- **Financial Planning**:
  - Home-related expense tracking
  - Budget planning
  - Financial summaries

### Homeowner Dashboard Navigation
- **Dashboard**: Overview of home management activities
- **Maintenance**: Manage all maintenance tasks
- **Documents**: Access home documentation hub
- **Projects**: Track home improvement projects
- **Home Value**: Monitor property value and market trends
- **Communication**: Manage service provider communications
- **Settings**: Configure homeowner preferences

---

## Core Services

### 1. **Property Search Service**
- **Multi-Platform Integration**: Aggregates listings from:
  - OnTheMarket.com
  - Rightmove
  - OpenRent
  - Internet-wide search capabilities
- **Search Types**:
  - API-based search (fast, demo mode)
  - Direct website scraping (OnTheMarket)
  - Internet-wide search (Brave Search API)
- **Search Features**:
  - Location-based search
  - Advanced filtering
  - Map integration
  - Saved searches
  - Search history

### 2. **Viewing Booking Service**
- **AI-Powered Booking**: Automated viewing scheduling
- **Calendar Integration**: Manage viewing schedules
- **Email Notifications**: Automated confirmations and reminders
- **Status Tracking**: Real-time viewing status updates

### 3. **Referencing Service**
- **Comprehensive Verification**:
  - Identity verification
  - Employment verification
  - Financial assessment
  - Previous landlord references
  - Credit checks
- **Referee/Guarantor System**:
  - Invite referees and guarantors via email
  - Response tracking
  - Automated follow-ups
- **Document Collection**: Secure document upload and storage

### 4. **Contract Service**
- **DocuSign Integration**: 
  - Digital contract creation
  - Electronic signatures
  - Real-time signing status
  - Contract synchronization
- **Contract Workflow**:
  - Contract creation and upload
  - Sending contracts to tenants
  - Signing process management
  - Signed contract storage
- **Contract Management**:
  - Contract versioning
  - Expiry tracking
  - Renewal alerts

### 5. **Document Storage Service**
- **Firebase Storage Integration**: Secure cloud storage
- **File Management**:
  - Upload and organize files
  - File preview capabilities
  - Secure file sharing
  - Document expiry tracking

---

## Technical Architecture

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: HeroUI v3, Material-UI, Custom components
- **Routing**: React Router DOM
- **State Management**: React Context API

### Backend Services
- **API Server**: NestJS (Node.js)
- **Database**: 
  - Firebase Firestore (primary)
  - Azure Cosmos DB (migration in progress)
- **Storage**: 
  - Firebase Storage
  - Azure Blob Storage
- **Authentication**: Azure AD B2C

### Third-Party Integrations
- **DocuSign**: Contract signing
- **Azure Services**: 
  - Azure Static Web Apps (hosting)
  - Azure CDN (content delivery)
  - Azure AD B2C (authentication)
- **Firebase**: 
  - Firestore (database)
  - Storage (file storage)
  - Authentication (alternative)
- **Email Service**: Nodemailer with SMTP

### Deployment
- **Hosting**: Azure Static Web Apps
- **CDN**: Azure CDN
- **Environment Management**: 
  - Development
  - Staging
  - Production

---

## Summary

Proptii is a comprehensive property management platform that serves three distinct user types:

1. **Tenants** can search for properties, book viewings, complete referencing, sign contracts, and manage their rental journey through an intuitive dashboard.

2. **Agents/Landlords** can manage their property portfolios, handle tenant relationships, create and track contracts, manage referencing, and access portfolio analytics through a powerful property management dashboard.

3. **Homeowners** can manage home maintenance, organize documents, track home value, manage projects, and communicate with service providers through a specialized home management dashboard.

All user types benefit from:
- Secure authentication via Azure AD B2C
- Real-time data synchronization
- Mobile-responsive design
- Comprehensive document management
- Integrated third-party services (DocuSign, property search platforms)

The platform is built with modern technologies and follows best practices for security, scalability, and user experience.

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Platform**: Proptii Property Management System

