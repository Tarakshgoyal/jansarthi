This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Features

### Auto-Assignment of Issues to Parshads by Ward

The system now supports automatic assignment of issues to Parshads based on ward numbers:

#### Backend Changes (Implemented)
- **User Model**: Added `ward_id` field to associate Parshads with specific wards
- **Schemas**: Updated to include `ward_id` in Parshad-related endpoints
- **Issue Response**: Added `assigned_parshad_id` and `assignment_message` fields
- **Issue Creation**: Automatic assignment logic:
  - When an issue is created with a `ward_id`, the system finds the Parshad assigned to that ward
  - If found: assigns the issue and sets status to `ASSIGNED`
  - If not found: sets `assignment_message` to indicate no Parshad is assigned to that ward

#### Frontend Changes (Implemented)
- **Type Definitions** ([lib/api.ts](lib/api.ts)):
  - Added `ward_id` to `ParshadInfo` interface
  - Added `assignment_message` to `Issue` interface
- **Parshad Management** ([app/dashboard/parshads/page.tsx](app/dashboard/parshads/page.tsx)):
  - Displays ward assignments for each Parshad
  - Shows statistics for total wards covered and vacant wards
  - Prevents duplicate ward assignments when creating new Parshads
- **Issue Management** ([app/dashboard/issues/page.tsx](app/dashboard/issues/page.tsx)):
  - Displays `assignment_message` in the issues table
  - Shows assignment status in issue detail dialog
  - Color-coded assignment messages (green for successful, orange for no Parshad available)

#### Usage
1. **Create a Parshad with Ward Assignment**:
   - Navigate to Parshads page
   - Click "Add Parshad"
   - Fill in name, phone, and select a ward number
   - The Parshad is now assigned to handle issues from that ward

2. **Automatic Issue Assignment**:
   - When users report issues with a `ward_id` through the mobile app
   - The system automatically assigns the issue to the Parshad responsible for that ward
   - If no Parshad is assigned to the ward, the issue remains unassigned with an explanatory message

3. **View Assignment Status**:
   - In the Issues page, the "Assigned Parshad" column shows:
     - Parshad name (if auto-assigned)
     - Assignment message explaining the status
   - Click "View Details" on any issue to see full assignment information

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
