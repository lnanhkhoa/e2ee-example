# e2ee-user-profile

A modern user profile application with end-to-end encryption (E2EE) built using Next.js, React, TypeScript, and local SQLite storage. This project demonstrates secure handling of user data, modern UI/UX patterns, and a robust, full-stack TypeScript setup.

## Features
- End-to-end encrypted user profiles
- Modern UI with Radix UI and Tailwind CSS
- Local SQLite database for development
- Form validation with React Hook Form and Zod
- Secure storage and authentication

## Tech Stack
- **Framework:** Next.js 15 (React 19)
- **Language:** TypeScript
- **UI:** Tailwind CSS, Radix UI
- **Database:** SQLite (via Drizzle ORM)
- **ORM:** Drizzle ORM
- **Other:** bcrypt, JWT, secure storage, PostCSS

## Getting Started

### 1. Install dependencies
```bash
npm install
# or
yarn install
```

### 2. Initialize the database
```bash
npm run init-db
```

### 3. Start the development server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts
- `dev`: Start the dev server (with DB init)
- `seed`: Reseed the database
- `build`: Build the app for production
- `start`: Start the production server
- `lint`: Run ESLint
- `init-db`: Initialize local SQLite DB if missing

## Project Structure
```
/ ├── src/
│   ├── app/         # Next.js app directory (routes, pages)
│   ├── components/  # UI components
│   ├── lib/         # Database, encryption, and utilities
│   └── utils/       # Helper utilities
├── public/          # Static assets
├── local.db         # SQLite database (local)
├── package.json     # Project config
├── tsconfig.json    # TypeScript config
```

## Configuration
- Environment variables may be required for DB, encryption, or authentication. See `.env.example` if present.

## License
[MIT](LICENSE)

---
_Edit this README to add more details about your app’s features, usage, or deployment!_
