# Information Diet - Setup Guide

This guide will help you set up Information Diet for development and deployment.

## Prerequisites

- Node.js 18+ (recommended: v20)
- npm, yarn, or pnpm
- A Clerk account for authentication
- (Optional) A Readwise account for importing highlights

## Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd information-diet
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```bash
   cp .env.example .env.local
   ```

   Then update the values in `.env.local`:

   ```env
   # Clerk Authentication
   # Get these from https://dashboard.clerk.com/
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
   CLERK_SECRET_KEY="sk_test_..."
   
   # App URL
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   
   # Clerk Routes (optional but recommended)
   NEXT_PUBLIC_CLERK_SIGN_IN_URL="/"
   NEXT_PUBLIC_CLERK_SIGN_UP_URL="/"
   ```

4. **Set up the database**

   The app uses SQLite with Prisma for development.

   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   ```

   For production, you'll want to switch to PostgreSQL or MySQL. Update the `DATABASE_URL` in `prisma/schema.prisma`:

   ```prisma
   datasource db {
     provider = "postgresql" // or "mysql"
     url      = env("DATABASE_URL")
   }
   ```

5. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Third-Party Integrations

### Clerk (Authentication)

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Get your publishable and secret keys
4. Add them to your `.env.local`
5. Configure allowed redirect URLs:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

### Readwise (Optional)

1. Sign up at [readwise.io](https://readwise.io)
2. Go to Settings > Developer API
3. Get your access token
4. In the app, connect your Readwise account via Settings

### Goodreads/StoryGraph

These services require CSV export:

1. **Goodreads**: Export your library from [Goodreads Export](https://www.goodreads.com/review/import)
2. **StoryGraph**: Export your data from [StoryGraph Export](https://app.thestorygraph.com/export)
3. Upload the CSV files via the import pages

## Database Schema

The app uses the following main tables:

- `User` - User account information
- `Source` - Content sources (Readwise, RSS feeds)
- `Item` - Reading items (links, books, newsletters)
- `ReadingSession` - Reading session logs

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Development Tips

### Running Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Reset database (development only!)
npx prisma migrate reset

# Open Prisma Studio to view data
npx prisma studio
```

### Debugging

- Enable Prisma query logging in development:
  ```env
  DATABASE_URL="file:./dev.db&connection_limit=1"
  ```

- View database with Prisma Studio:
  ```bash
  npx prisma studio
  ```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

For production, update your DATABASE_URL to a managed PostgreSQL instance.

### Environment Variables for Production

```env
# Required
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Optional (for PostgreSQL)
DATABASE_URL="postgresql://user:password@host:port/database"
```

## Troubleshooting

### Prisma Client Error

If you get a "Prisma Client is not able to run" error:
```bash
npx prisma generate
```

### Auth Issues

Make sure your Clerk keys are correct and the NEXT_PUBLIC_APP_URL matches your current domain.

### Database Lock Issues (SQLite)

If you see database lock errors during development:
```bash
# Stop the dev server
# Delete the dev.db file (it will be recreated)
npx prisma db push
# Restart the dev server
```

## Support

For issues or questions:
- Check the [GitHub Issues](https://github.com/your-repo/issues)
- Review the [User Journey Documentation](USER_JOURNEY.md)

## License

[Your License Here]
