# Hackathon 2026 - Next.js App with Supabase Auth

A production-ready Next.js 15 application with Supabase authentication, featuring a modern login page and protected dashboard.

## Features

- 🔐 **Supabase Authentication** - Email/password and OAuth (Google, GitHub)
- 🛡️ **Protected Routes** - Middleware-based route protection
- 🎨 **Modern UI** - Beautiful gradient login page with Tailwind CSS
- 📱 **Responsive Design** - Works on all device sizes
- ⚡ **Next.js 15** - App Router, Server Components, and TypeScript
- 🔒 **Security** - HTTP-only cookies, secure session management

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### 1. Clone and Install

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Go to **Project Settings** → **API**
3. Copy your `Project URL` and `anon public` key

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Update the values:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Configure Supabase Auth

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider
3. (Optional) Enable OAuth providers (Google, GitHub) and add your credentials
4. Add your redirect URL: `http://localhost:3000/auth/callback`

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── callback/       # OAuth callback handler
│   │   └── signout/        # Sign out endpoint
│   ├── dashboard/          # Protected dashboard page
│   ├── login/              # Login/Sign up page
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page (redirects)
├── components/             # Reusable components
├── lib/
│   └── supabase/
│       ├── client.ts       # Browser client
│       ├── middleware.ts   # Middleware utilities
│       └── server.ts       # Server client
├── middleware.ts           # Route protection middleware
└── types/
    └── index.ts            # TypeScript types
```

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Add your environment variables in Vercel settings
4. Deploy!

### Environment Variables for Production

Make sure to add these to your hosting platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Security Considerations

1. **Row Level Security (RLS)**: Enable RLS policies in Supabase for all tables
2. **Environment Variables**: Never commit `.env.local` to version control
3. **OAuth Redirect URLs**: Configure production URLs in Supabase dashboard

## Customization

### Adding More Protected Routes

The middleware automatically protects all routes except:
- `/login`
- `/auth/*`
- Static files

To add custom protection logic, edit `src/lib/supabase/middleware.ts`.

### Styling

Modify `tailwind.config.js` to customize colors, fonts, and more.

## Troubleshooting

### "Could not authenticate user" error

- Check your Supabase URL and anon key
- Verify the OAuth redirect URL is configured correctly
- Check browser console for errors

### Session not persisting

- Ensure middleware is running (check `src/middleware.ts`)
- Verify cookies are being set correctly
- Clear browser cookies and try again

## License

MIT
