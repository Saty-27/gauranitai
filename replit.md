# Divine Naturals Dairy Delivery App

## Overview
Divine Naturals is a minimalist, eco-friendly dairy delivery application designed for scheduling milk deliveries and purchasing dairy products. It offers a streamlined, efficient platform with a mobile-first design and role-based access for customers, vendors, delivery partners, and administrators. The app's purpose is to provide a superior user experience and reliable service, operating under the tagline "Pure. Fresh. Daily." The project aims to capture a significant share of the local dairy delivery market, emphasizing ease of use and environmental consciousness.

## User Preferences
- Preferred communication style: Simple, everyday language.
- Design preference: Simple, clean designs over complex styling (no neumorphism, glassmorphism, or premium visual effects)
- User feedback: Complex themes consistently rejected as looking "worst"

## System Architecture
The application utilizes a modern full-stack architecture with a mobile-first and responsive design approach.

### UI/UX Decisions
The design emphasizes a clean, minimalist aesthetic with a custom eco-friendly color scheme, inspired by HARIBOL's professional, clean, and minimal style. It uses `shadcn/ui` components built on Radix UI, featuring inline login forms, professional gradient backgrounds, and enhanced visual feedback. The public-facing landing page and key sections like the shop page have been redesigned for a professional, responsive user experience with card-based layouts and hover effects.

### Technical Implementations
- **Frontend**: Built with React and TypeScript, using Vite for bundling, Tailwind CSS for styling, Wouter for routing, and TanStack React Query for state management.
- **Backend**: Developed with Node.js and TypeScript, using Express.js for RESTful APIs.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Custom email/password system with `bcryptjs` for hashing and `express-session` for session management, stored in PostgreSQL.
- **Key Features**:
    - **Multi-role Management**: Supports customer, admin, vendor, and delivery partner roles with distinct interfaces and access controls.
    - **Product & Order Management**: Comprehensive catalog, order system, milk subscriptions, and stock tracking.
    - **Shopping & Checkout**: Includes product browsing, category filtering, cart management with optimistic updates, delivery address CRUD, and multiple payment options (COD, UPI, Card, Net Banking).
    - **Delivery Partner System**: Dedicated login and dashboard for partners to manage assignments, track earnings, and update delivery statuses. Admin panel for managing partners, assigning orders, and viewing statistics.
    - **CMS**: Admin-managed content system for About Us, Contact, Terms of Service, and Privacy Policy pages, including image uploads and content editing.
    - **Homepage Content**: Dynamic hero carousel and featured product sections managed via CMS.
    - **Contact Form**: Integrated contact submission system with admin management.
    - **Routing**: Customer home as the default, admin dashboard accessible at `/admin`.

## External Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity.
- **drizzle-orm**: Type-safe ORM.
- **@tanstack/react-query**: Server state management.
- **express**: Backend web framework.
- **bcryptjs**: Password hashing.
- **express-session**: Session management middleware.
- **@radix-ui/***: Accessible UI primitives.
- **tailwindcss**: Utility-first CSS framework.
- **lucide-react**: Icon system.
- **wouter**: Lightweight client-side router.
- **vite**: Frontend build tool.
- **typescript**: Type-safe language.
- **drizzle-kit**: Database migration tool.
- **date-fns**: Date manipulation library.
- **express-fileupload**: Middleware for handling file uploads.