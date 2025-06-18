# PDF Data Extractor

## Overview

This is a full-stack PDF data extraction application designed to process Form 16 documents and extract employee information. The application uses a React frontend with shadcn/ui components and an Express.js/Node.js backend with PostgreSQL database integration via Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components based on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack React Query for server state management
- **Routing**: React Router for client-side navigation
- **File Handling**: React Dropzone for drag-and-drop file uploads

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API endpoints
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Development**: tsx for TypeScript execution in development
- **Production**: ESBuild for bundling server code

### Data Storage Architecture
- **Primary Database**: PostgreSQL (configured via Drizzle)
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **ORM**: Drizzle ORM with Zod schema validation
- **In-Memory Storage**: Fallback memory storage implementation for development

## Key Components

### Database Schema
- **Users Table**: Basic user management with username/password authentication
- **Schema Location**: `/shared/schema.ts`
- **Migration Management**: Drizzle Kit for database migrations

### Frontend Components
- **FileUpload**: Drag-and-drop interface for PDF file uploads with folder structure support
- **ExtractedData**: Display component for processed PDF information
- **FailedPanList**: Error handling for failed PAN number extractions
- **UI Components**: Complete shadcn/ui component library implementation

### Backend Services
- **Storage Interface**: Abstracted storage layer supporting both PostgreSQL and in-memory implementations
- **Route Registration**: Modular route handling system
- **Vite Integration**: Development server with HMR support

### PDF Processing Features
- **PAN Number Extraction**: Intelligent parsing of Indian PAN numbers from Form 16 documents
- **Employee Data Extraction**: Extraction of employee names, financial years, assessment years
- **Folder Structure Processing**: Support for organized folder uploads (MainFolder/SubFolder structure)
- **Error Handling**: Comprehensive error tracking for failed extractions

## Data Flow

1. **File Upload**: Users drag-and-drop PDF files or folder structures
2. **PDF Processing**: Client-side PDF text extraction using PDF.js
3. **Data Extraction**: Pattern matching for PAN numbers and employee information
4. **API Communication**: RESTful API calls to backend services
5. **Storage**: Processed data stored in PostgreSQL via Drizzle ORM
6. **Export Options**: JSON and Excel export capabilities for processed data

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React, React DOM, React Router
- **UI Framework**: Complete Radix UI component suite
- **Database**: Drizzle ORM with PostgreSQL driver
- **Build Tools**: Vite, ESBuild, TypeScript

### PDF Processing
- **PDF.js**: Client-side PDF text extraction
- **File Handling**: react-dropzone for enhanced upload experience

### Export Features
- **Excel Export**: XLSX library for spreadsheet generation
- **Date Handling**: date-fns for date manipulation

### Development Tools
- **Replit Integration**: Custom Replit plugins for development environment
- **Error Handling**: Runtime error overlay for development

## Deployment Strategy

### Development Environment
- **Local Development**: npm run dev with tsx for TypeScript execution
- **Hot Reload**: Vite HMR for frontend, tsx watch mode for backend
- **Database**: PostgreSQL development instance

### Production Build
- **Frontend**: Vite build targeting modern browsers
- **Backend**: ESBuild bundling with Node.js ESM format
- **Database**: PostgreSQL production instance via environment variables

### Replit Configuration
- **Modules**: Node.js 20, Web server, PostgreSQL 16
- **Deployment**: Autoscale deployment target
- **Port Configuration**: Internal port 5000, external port 80

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 18, 2025. Initial setup
- June 18, 2025. Implemented DSC (Digital Signature Certificate) signing functionality for HYP 2003 USB tokens
- June 18, 2025. Created comprehensive Windows Certificate Store integration to address browser security limitations
- June 18, 2025. Replaced mock certificate data with authentic Windows Certificate Store API detection
- June 18, 2025. Added browser limitations guidance component for proper DSC setup instructions