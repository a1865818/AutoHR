
# React Front-end Application Summary

This document provides a summary of the React front-end application for the AI-powered HR platform.

## Project Overview

The front-end is a Next.js application, bootstrapped with `create-next-app`. It uses TypeScript for static typing and Tailwind CSS for styling. The application is designed to interact with a .NET backend, as indicated by the `aspnetcore-https.js` and `aspnetcore-react.js` files and the API proxy configuration in `next.config.js`.

## Key Technologies

- **Framework:** [Next.js](https://nextjs.org/) (v15)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (v5)
- **UI Library:** [React](https://reactjs.org/) (v19)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4)
- **Linting:** [ESLint](https://eslint.org/) (v9)
- **Package Manager:** [npm](https://www.npmjs.com/)

## Project Structure

The project follows a standard Next.js `src` directory structure.

```
/
├── public/ # Static assets
├── src/
│   ├── app/ # Next.js App Router
│   │   ├── (authorize)/ # Authorization-related pages (login, signup)
│   │   ├── (main)/ # Main application pages after login
│   │   ├── applicant/ # Applicant-facing pages
│   │   └── public/ # Publicly accessible pages
│   ├── components/ # Reusable React components
│   ├── contexts/ # React contexts for state management
│   ├── hooks/ # Custom React hooks
│   ├── interfaces/ # TypeScript interfaces for data structures
│   ├── services/ # Services for interacting with the backend API
│   └── utils/ # Utility functions
├── next.config.js # Next.js configuration
├── tailwind.config.ts # Tailwind CSS configuration
└── package.json # Project dependencies and scripts
```

### `src/app`

This directory uses the Next.js App Router for routing. It's organized into several route groups:

- **`(authorize)`:** Contains pages related to user authentication, such as login, sign-up, and forgot password.
- **`(main)`:**  The core of the application for authenticated hiring managers, including the dashboard, job management, candidate tracking, and settings.
- **`applicant`:**  Pages for job applicants to manage their applications, profile, and saved jobs.
- **`public`:**  Publicly accessible pages, such as job boards and company profiles.

### `src/components`

This directory contains a rich set of reusable components, organized by feature. This modular approach promotes code reuse and maintainability. Key component groups include:

- **`auth`:** Authentication-related components like login forms and user dropdowns.
- **`candidates`:** Components for displaying and managing job candidates.
- **`interview_pipeline`:** Components for the drag-and-drop interview pipeline.
- **`jobs`:** Components for creating, managing, and viewing jobs.
- **`profile`:** Components for user profile management.
- **`public`:** Components for the public-facing job boards.
- **`settings`:** Components for various application and user settings.

### `src/contexts`

This directory manages global state using React's Context API.

- **`AuthContext.tsx`:** Manages user authentication state.
- **`SavedJobsContext.tsx`:** Manages the list of jobs saved by applicants.

### `src/hooks`

Custom React hooks are located here, abstracting complex logic into reusable functions.

- **`useHiringAuth.ts`:**  A hook for handling authorization logic for the hiring side of the platform.
- **`useJobs.ts`:** A hook for fetching and managing job data.
- **`useJobViewTracking.ts`:** A hook for tracking job views.
- **`useRoundConfiguration.ts`:** A hook for managing interview round configurations.

### `src/interfaces`

This directory defines the TypeScript interfaces for the data models used throughout the application, ensuring type safety and consistency.

### `src/services`

The services layer encapsulates the logic for making API calls to the .NET backend. Each service is responsible for a specific domain (e.g., jobs, candidates, applications). This separation of concerns makes the code cleaner and easier to test.

### `src/utils`

This directory contains utility functions that can be used across the application.

## Backend Integration

The front-end is configured to proxy API requests from `/api/:path*` to a backend server defined by the `NEXT_PUBLIC_API_URL` environment variable (defaulting to `http://localhost:5189`). This is a common pattern for developing with a separate backend API, avoiding CORS issues during development.

## Getting Started

To run the application in a development environment, you would typically use the following command:

```bash
npm run dev
```

This will start the Next.js development server.

## Summary

This front-end application is a well-structured and modern React application. It leverages the power of Next.js for server-side rendering and routing, TypeScript for type safety, and Tailwind CSS for a utility-first approach to styling. The clear separation of concerns between components, services, and contexts makes the codebase maintainable and scalable. The project is set up to seamlessly integrate with a .NET backend, making it a robust foundation for the AI-powered HR platform.
