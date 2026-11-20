/**
 * Demo Seed Account Constants for RakshaPath.
 *
 * NOTE: These accounts are for client-side demonstration purposes only.
 * They are not secrets, do not represent real users, and do not communicate
 * with a live production authentication service.
 */

export const DEMO_ACCOUNTS = [
  {
    role: 'Traveller',
    label: 'Traveller',
    accessibleName: 'Sign in as demo Traveller',
    name: 'Priya Sharma (Demo)',
    email: 'traveller.demo@rakshapath.local',
    password: 'DemoTravellerPassword123!',
    destination: '/dashboard',
    description: 'Safe routing, hazard monitoring, and emergency SOS tools.',
  },
  {
    role: 'Family',
    label: 'Family',
    accessibleName: 'Sign in as demo Family',
    name: 'Rohan Sharma (Demo)',
    email: 'family.demo@rakshapath.local',
    password: 'DemoFamilyPassword123!',
    destination: '/family',
    description: 'Private trip sharing and family safety check-in view.',
  },
  {
    role: 'Police',
    label: 'Police',
    accessibleName: 'Sign in as demo Police',
    name: 'Inspector Sharma (Demo)',
    email: 'police.demo@rakshapath.local',
    password: 'DemoPolicePassword123!',
    destination: '/police',
    description: 'Incident triage, active SOS feed, and safety operations.',
  },
]

export const DEMO_ROLES = {
  TRAVELLER: DEMO_ACCOUNTS[0],
  FAMILY: DEMO_ACCOUNTS[1],
  POLICE: DEMO_ACCOUNTS[2],
}

export default DEMO_ACCOUNTS
