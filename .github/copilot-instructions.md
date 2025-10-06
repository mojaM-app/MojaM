# MojaM Project - Copilot Instructions

## Project Overview

MojaM is a full-stack web application for church/parish community management, consisting of a TypeScript-based backend API and an Angular frontend.

## Architecture

### Technology Stack
- **Backend**: Node.js with TypeScript, Express.js framework
- **Frontend**: Angular 19 with TypeScript, Angular Material 19, Bootstrap 5
- **Database**: MySQL with TypeORM as ORM
- **Authentication**: JWT-based authentication system
- **Testing**: Jest (backend), Jasmine/Karma (frontend)
- **Build Tools**: SWC Compiler (backend), Angular CLI (frontend)
- **Internationalization**: i18n support with JSON translation file (frontend\public\i18n\pl.json)

## Backend Application (`/backend`)

### Framework & Structure
- **Framework**: Express.js with TypeScript
- **Architecture**: Modular architecture with dependency injection (TypeDI)
- **Module Isolation**: Modules are strictly separated with dependency-cruiser enforcing boundaries
- **Database**: TypeORM with MySQL, migration-based schema management
- **Security**: Comprehensive security middleware stack

### Key Directories
```
backend/src/
├── app.ts                    # Main application entry point
├── server.ts                 # Server configuration
├── config/                   # Configuration management
├── core/                     # Core utilities, DTOs, interfaces
├── dataBase/                 # Database entities, migrations, connections
├── exceptions/               # Custom exception classes
├── middlewares/              # Express middleware
├── modules/                  # Feature modules (modular architecture)
├── utils/                    # Utility functions
└── validators/               # Input validation schemas
```

### Database Schema

#### Core Entities
- **Users**: User management with system permissions
- **Announcements**: Parish announcements with items
- **Bulletins**: Weekly parish bulletins with daily sections
- **Logs**: Comprehensive application logging

#### Entity Naming Convention
- Entity files: `*.entity.ts`
- View entities: `v*.entity.ts` (database views)
- Properties use PascalCase for database columns
- TypeScript properties use camelCase

### Modules Registry
Located in `src/modules/modules-registry.ts`, contains 11 registered modules:
1. Notifications Module
2. Auth Module
3. Users Module  
4. Permissions Module
5. Announcements Module
6. Bulletin Module
7. Community Module
8. News Module
9. Calendar Module
10. Security Module
11. Log Module

### Security Implementation

#### Middleware Stack
- **Helmet**: Security headers configuration
- **CORS**: Cross-origin resource sharing with strict production settings
- **CSP**: Content Security Policy with violation reporting
- **Request ID**: Unique request tracking
- **Security Logger**: 12 types of security events logged

#### Security Features
- JWT Authentication with audience/issuer validation
- Authorization middleware with permission checking
- Input sanitization and validation
- SQL injection prevention via TypeORM
- XSS protection through headers and CSP

### Database Connection
- Connection pooling configured
- Migration system for schema management
- Custom naming strategy (TitleCaseNamingStrategy)
- Comprehensive error handling and logging

### Testing
- **Coverage**: 95.27% code coverage
- **Framework**: Jest with TypeScript support
- **Types**: Unit tests, integration tests, security tests
- **Patterns**: Repository pattern testing, service layer testing
- **Test Status**: 1026 tests pass, all tests passing



### Environment Configuration
- Development/Production environment separation
- Environment validation with joi
- Database connection management
- Logging level configuration

## Frontend Application (`/frontend`)

### Framework & Structure
- **Framework**: Angular 19 with TypeScript
- **Styling**: SCSS with custom design system
- **Architecture**: Feature-based modular architecture
- **State Management**: Angular services and RxJS
- **UI Components**: Custom component library

### Key Directories
```
frontend/src/
├── app/                     # Main Angular application
│   ├── components/          # Reusable UI components
│   ├── core/               # Core services and guards
│   ├── modules/            # Feature modules
│   └── shared/             # Shared utilities
├── core/                   # Core application logic
├── environments/           # Environment configurations
├── interfaces/             # TypeScript interfaces
├── services/              # Application services
├── styles/                # Global SCSS styles
└── utils/                 # Utility functions
```

### Feature Modules
- **Announcements**: Parish announcements management
- **Bulletin**: Weekly bulletin calendar and management
- **Calendar**: Calendar functionality
- **Community**: Community information display
- **Management**: Administrative functions
- **News**: News display functionality
- **Settings**: Application settings
- **Static**: Static pages and content

### Component Architecture

#### Bulletin System
- **Calendar View**: Interactive calendar for bulletin management
- **Daily Sections**: Structured daily content management
- **Date Handling**: Comprehensive date utilities and formatting

#### UI Components
- Responsive design for mobile and desktop
- Custom SCSS mixins and utilities
- Consistent design system implementation

### Build Configuration
- **Angular CLI**: Project management and build system
- **TypeScript**: Strict type checking enabled
- **Service Worker**: PWA support with `ngsw-config.json`
- **Assets**: Icons, images, and i18n resources

### Development Tools
- **ESLint**: Code quality and style enforcement for both backend and frontend
- **Dependency Cruiser**: Module dependency validation and boundary enforcement (backend)
- **SWC**: Fast TypeScript/JavaScript compiler for backend builds
- **Angular DevKit**: Development server and hot reload
- **Source Maps**: Debug support for development
- **npm-check-updates**: Dependency update management

## Development Workflow

### Development Environment
- **Operating System**: Windows
- **Shell**: PowerShell (all commands should be PowerShell-compatible)
- **Path Separators**: Use backslashes `\` for Windows paths

### Setup & Installation
```bash
# Backend setup
cd backend
npm install
npm run migration:run

# Frontend setup  
cd frontend
npm install
```

### Running the Application
```bash
# Start both applications (from root)
# Backend: http://localhost:5100
# Frontend: http://localhost:4200

# Backend only
cd backend; if ($?) { npm run dev }

# Frontend only
cd frontend; if ($?) { ng serve }
```

### Environment Configuration
```bash
# Backend environment variables (.env files)
PORT=5100                    # Server port
BASE_PATH=/api              # API base path
DATABASE_HOST=localhost     # Database connection
DATABASE_PORT=3306          # MySQL port
DATABASE_USERNAME=admin     # Database user
DATABASE_PASSWORD=admin     # Database password
DATABASE_NAME=dev           # Database name
ACCESS_TOKEN_SECRET=...     # JWT secret
REFRESH_TOKEN_SECRET=...    # Refresh token secret
```

### Database Management
- Migrations are located in `backend/src/dataBase/migrations/`
- Entity definitions in `backend/src/dataBase/entities/`
- Use TypeORM CLI for migration generation and execution

#### Creating SQL Migrations
```bash
# Generate migration from entity changes (automatic)
.\migration-generate.bat migration-name

# Create empty migration (manual SQL)
.\migration-create.bat migration-name

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Key Backend Scripts
```bash
npm run dev                     # Development server with hot reload
npm run build                   # Production build with SWC
npm run test                    # Run Jest tests
npm run test:coverage          # Test coverage report
npm run lint                   # ESLint code checking
npm run check-dependencies     # Validate module dependencies
npm run migration:run          # Execute database migrations
npm run migration:generate     # Generate new migration
npm run migration:revert       # Revert last migration

# Migration helper scripts (Windows)
.\migration-generate.bat name   # Generate migration from entity changes
.\migration-create.bat name     # Create empty migration for manual SQL
```

## Code Style & Conventions

### Backend Conventions
- **File Naming**: kebab-case for files, PascalCase for classes
- **Database**: PascalCase column names, snake_case table names
- **Imports**: Absolute imports using `@core`, `@modules` aliases
- **Error Handling**: Comprehensive try-catch blocks with logging
- **Logging**: Database-based logging with structured metadata
- **Module Dependencies**: Enforced separation via dependency-cruiser rules
- **Code Quality**: All code must pass ESLint validation before commit

### Frontend Conventions

### Building Forms in Frontend (AI Instructions)
- Always use Angular's `FormBuilder`, `FormGroup`, `FormArray`, and `FormControl` for reactive forms.
- Define TypeScript interfaces for form structure and use them for strong typing (e.g. `FormGroup<MyFormType>`).
- Group related fields into nested `FormGroup` and use `FormArray` for dynamic lists (e.g. days, sections).
- Validators must be set using Angular's `Validators` and custom validators (see `conditionalValidator`).
- Use dependency injection for `FormBuilder` and provide form builder services as `@Injectable({ providedIn: 'root' })`.
- Expose the main form as a public getter in the builder class (e.g. `get form(): FormGroup<...>`).
- All form logic (creation, patching, adding/removing items) should be encapsulated in a builder/service class (see `BulletinFormBuilder`).
- Use OnPush change detection in all form components.
- Always use standalone components and the new Angular flow for form components.
- Use signals and effects for state management in Angular 19+.
- Prefer using mixins (e.g. `WithForm<T>`) for form handling in components.
- All form controls should be strictly typed and validated.
- For dynamic forms, use helper methods to create new groups/arrays and patch values.
- Use i18n for all labels, validation messages, and dialog texts.

## Security Considerations

### Backend Security
- All endpoints require authentication (except login/public endpoints)
- Permission-based authorization system
- Comprehensive security headers (HSTS, CSP, X-Frame-Options)
- SQL injection prevention via TypeORM parameterized queries
- Input validation and sanitization
- Security event logging and monitoring

### Frontend Security
- JWT token management
- Route guards for protected pages
- Sanitized HTML output
- HTTPS enforcement in production
- Content Security Policy compliance

## Testing Strategy

### Backend Testing
- 95.27% code coverage with Jest
- **Integration tests for API endpoints** (highest priority)
- Unit tests for utilities and helpers
- Security tests for authentication and authorization
- **Test Coverage Requirement**: Minimum 90% coverage for all new code

### Frontend Testing
- Component unit tests with Angular Testing Utilities
- Service testing with dependency injection mocking

## Performance & Deployment

### Key Performance Features
- Database query optimization (no N+1 queries detected)
- Connection pooling and efficient TypeORM relations
- OnPush change detection strategy in Angular
- Service Worker for caching (PWA support)
- Lazy loading for feature modules

### Deployment Notes
- Environment-specific configurations (dev/prod)
- Database migration system with TypeORM
- PWA support with service worker
- Production build optimization

## Troubleshooting

### Common Issues
- **Database Connection**: Check environment variables and MySQL service
- **Migration Failures**: Ensure proper database permissions and schema
- **Authentication Issues**: Verify JWT configuration and token expiry
- **CORS Errors**: Check CORS configuration in backend middleware

### Debug Information
- Backend logs stored in database (`logs` table)
- Frontend errors logged to browser console
- Database queries logged in development mode

## Important Guidelines for AI

### Code Quality Requirements
- **ESLint Validation**: ALL generated code must be compatible with project's ESLint configuration
- **Module Boundaries**: Respect dependency-cruiser rules for backend module separation  
- **Angular Components**: All new frontend components must use standalone=true
- **Angular Flow**: Always use the new Angular flow patterns, syntax, and best practices
- **Windows Environment**: All terminal commands must be PowerShell-compatible (Windows)
- **Testing Coverage**: All new code must have minimum 90% test coverage
- **Integration Tests Priority**: Write integration tests for API endpoints instead of unit tests for services/repositories
- **Unit Tests Scope**: Use unit tests primarily for utilities, helpers, and pure functions
- **Type Safety**: Maintain strict TypeScript typing throughout both applications

### Before Submitting Code
1. Ensure ESLint rules are followed for both backend and frontend
2. Verify module dependencies don't violate architectural boundaries
3. Write integration tests for all new API endpoints (minimum 90% coverage)
4. Include proper error handling and logging where applicable
5. Follow established naming conventions and file structures
