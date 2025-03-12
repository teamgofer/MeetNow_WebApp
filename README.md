# MeetNow Web Application

A modern web application built with Next.js and TypeScript for location-based social networking and meetups.

## Features

- 👥 User authentication and profile management
- 📍 Location-based post creation and discovery
- 👥 Group creation and management
- 💰 Store credit system
- 🔒 Multiple content restriction levels (public, private, group, premium)

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Maps:** [MapLibre GL](https://maplibre.org/)
- **Authentication:** JWT with [jose](https://github.com/panva/jose)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **Icons:** [React Icons](https://react-icons.github.io/react-icons/)

## Project Structure

```
src/
├── types/          # TypeScript interfaces and type definitions
├── services/       # API service functions
│   ├── api.ts      # Base API configuration and methods
│   ├── users.ts    # User-related API calls
│   ├── posts.ts    # Post-related API calls
│   └── groups.ts   # Group-related API calls
├── components/     # React components
└── app/           # Next.js app directory
```

## Getting Started

### Prerequisites

- Node.js 18.x or later
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/teamgofer/animateo.git
   cd animateo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   ```bash
   cp .env.example .env.local
   ```
   - Update the values in `.env.local` with your actual configuration:
     - Database credentials
     - JWT secret for authentication
     - API keys for external services (MapTiler, TimezoneDB)

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Environment Variables

The following environment variables are required to run the application:

### API Configuration
- `NEXT_PUBLIC_API_URL`: Base URL for API endpoints (default: http://localhost:3000/api)

### Database Configuration
- `POSTGRES_USER`: PostgreSQL database user
- `POSTGRES_PASSWORD`: PostgreSQL database password
- `POSTGRES_DB`: PostgreSQL database name
- `POSTGRES_HOST`: Database host (default: localhost)
- `POSTGRES_PORT`: Database port (default: 5432)

### Authentication
- `JWT_SECRET`: Secret key for JWT token generation and verification

### External Services
- `MAPTILER_API_KEY`: API key for MapTiler maps
- `TIMEZONEDB_API_KEY`: API key for TimezoneDB service

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript compiler check

## API Structure

### Users
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/credit` - Get user's store credit

### Posts
- `POST /api/posts` - Create new post
- `GET /api/posts` - Get posts (with optional location and radius)
- `GET /api/posts/:id` - Get specific post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `GET /api/posts/:id/replies` - Get post replies

### Groups
- `POST /api/groups` - Create new group
- `GET /api/groups` - Get all groups
- `GET /api/groups/:id` - Get specific group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `POST /api/groups/:id/join` - Join group
- `POST /api/groups/:id/leave` - Leave group

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Security

- All sensitive information (API keys, database credentials, etc.) should be stored in environment variables
- Never commit `.env` or `.env.local` files
- Use `.env.example` as a template for required environment variables
- JWT is used for secure authentication
- HTTPS is required in production

## License

This project is licensed under the MIT License - see the LICENSE file for details. 