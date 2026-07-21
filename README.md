# Med Agents – Doctor Frontend

The doctor-facing web application for the Med Agents platform. Doctors use this app to manage
their patients, run consultations, generate prescriptions, chat with the medical AI assistant,
check drug safety, track follow-ups, and manage their subscription.

Built with **React 19**, **Vite**, **Redux Toolkit**, **React Router**, and **Tailwind CSS**.

## Tech Stack

- **Framework:** React 19 + Vite
- **Routing:** React Router v7
- **State management:** Redux Toolkit
- **Forms & validation:** React Hook Form + Zod
- **Styling:** Tailwind CSS v4
- **i18n:** i18next / react-i18next (multi-language support)
- **HTTP client:** Axios
- **UI helpers:** SweetAlert2, react-icons

## Project Structure

```
src/
├── api/            # Axios request functions grouped by domain (Auth, patients, subscription, ...)
├── components/      # Shared UI components (Navbar, Footer, Layout, ProtectedRoute, ...)
├── config/          # apiInstance (Axios instance + interceptors)
├── context/         # React contexts (AuthContext, ThemeContext)
├── hooks/            # Custom hooks
├── i18n/             # Translation setup
├── pages/            # Route-level pages (Login, patients, consultations, prescriptions,
│                     #   follow-ups, ai-chat, drug-safety, reports, profile, settings,
│                     #   subscriptions, public pages)
├── routes/           # AppRoutes definition
├── schemas/          # Zod validation schemas
├── slices/           # Redux slices
├── store/            # Redux store setup
└── utils/            # Helper utilities
```

## Getting Started

### Prerequisites

- Node.js 18+
- The [backend API](../backend) running and reachable

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root (never commit this file):

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API, e.g. `http://localhost:5000/api` |

### Running

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview a production build locally
npm run preview

# Lint
npm run lint
```

## Key Features

- **Auth** — login, JWT stored client-side, session persisted across reloads
- **Patients** — search, create, edit patients, view patient history
- **Consultations** — create/list/view consultation records per patient
- **Prescriptions** — generate and view prescriptions linked to a consultation
- **Follow-ups** — start and track patient follow-ups
- **AI Chat** — chat interface backed by the medical AI agent
- **Drug Safety** — quick drug interaction/safety check tool
- **Reports** — AI-generated patient/medical reports
- **Subscriptions & Payments** — view subscription status, upgrade/renew via Paymob checkout
- **Multi-language** — Arabic/English support via i18next

## Access Control

- `ProtectedRoute` — redirects unauthenticated users to `/login`
- `Layout` — wraps all authenticated pages; checks the doctor's subscription status on
  navigation and redirects to `/subscriptions?expired=1` when it has expired, so pages can't
  be browsed with an expired subscription even if they don't call a protected API on mount
- `apiInstance` interceptor — as a second line of defense, redirects to the subscription page
  whenever any API call returns a `SUBSCRIPTION_EXPIRED` error

## Notes

- Do not commit `.env` or any file containing API keys/tokens.
- Remove any leftover debug/text files before committing (e.g. `testPayment.txt`).

## License

Internal project — license TBD.
