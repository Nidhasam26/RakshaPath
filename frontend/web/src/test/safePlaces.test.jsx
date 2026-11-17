import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { AuthProvider } from '../context/AuthContext.jsx'
import authService from '../services/authService'
import { safePlacesService } from '../services/safePlacesService'
import { SAFE_PLACE_CATEGORIES } from '../data/safePlacesData'

describe('Module K: Nearby Safe Places (PRD FR-93 - FR-99) & FR-07 Theme Switching', () => {
  const travellerUser = {
    id: 'user_traveller_places',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    role: 'Traveller',
  }

  const policeUser = {
    id: 'user_police_places',
    name: 'Inspector Verma',
    email: 'verma@police.gov.in',
    role: 'Police',
  }

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  describe('1. Safe Places Data & Service Layer (FR-93 - FR-96)', () => {
    it('provides emergency safe places across all PRD categories', () => {
      const places = safePlacesService.getSafePlaces()
      expect(places.length).toBeGreaterThan(0)

      const categories = new Set(places.map((p) => p.category))
      expect(categories.has(SAFE_PLACE_CATEGORIES.HOSPITAL)).toBe(true)
      expect(categories.has(SAFE_PLACE_CATEGORIES.POLICE)).toBe(true)
      expect(categories.has(SAFE_PLACE_CATEGORIES.PHARMACY)).toBe(true)
      expect(categories.has(SAFE_PLACE_CATEGORIES.TRANSIT)).toBe(true)
    })

    it('filters places by category and search query correctly', () => {
      const hospitals = safePlacesService.filterSafePlaces({ category: SAFE_PLACE_CATEGORIES.HOSPITAL })
      expect(hospitals.length).toBeGreaterThan(0)
      hospitals.forEach((h) => expect(h.category).toBe(SAFE_PLACE_CATEGORIES.HOSPITAL))

      const searchResult = safePlacesService.filterSafePlaces({ category: SAFE_PLACE_CATEGORIES.ALL, search: 'Apollo' })
      expect(searchResult.length).toBeGreaterThan(0)
      expect(searchResult[0].name).toContain('Apollo')

      const singlePlace = safePlacesService.getSafePlaceById(searchResult[0].id)
      expect(singlePlace).toBeDefined()
      expect(singlePlace.id).toBe(searchResult[0].id)
    })
  })

  describe('2. Safe Places Page UI & Controls (FR-93 - FR-99)', () => {
    it('renders Safe Places with category tabs, search input, and disclaimer for Traveller', async () => {
      authService.setCurrentUser(travellerUser)
      render(
        <MemoryRouter initialEntries={['/safe-places']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      // Heading and emergency disclaimer (waiting for lazy load)
      const heading = await screen.findByRole('heading', { name: /nearby safe places/i })
      expect(heading).toBeInTheDocument()
      expect(screen.getByText(/demonstration directory of nearby assistance resources/i)).toBeInTheDocument()
      expect(screen.getByText(/community protection network/i)).toBeInTheDocument()

      // Category filter tabs
      expect(screen.getByRole('tab', { name: /all places/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /hospitals/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /police posts/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /24\/7 pharmacies/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /transit hubs/i })).toBeInTheDocument()

      // Search input
      const searchInput = screen.getByRole('searchbox', { name: /search safe places/i })
      expect(searchInput).toBeInTheDocument()

      // Filter by Pharmacy
      fireEvent.click(screen.getByRole('tab', { name: /24\/7 pharmacies/i }))
      expect(screen.getAllByText(/Apollo 24x7 Night Pharmacy/i)[0]).toBeInTheDocument()

      // Dial and Directions actions
      const callButtons = screen.getAllByRole('link', { name: /call/i })
      expect(callButtons[0]).toHaveAttribute('href', expect.stringMatching(/^tel:/))

      const directionsButtons = screen.getAllByRole('link', { name: /open navigation/i })
      expect(directionsButtons[0]).toHaveAttribute('href', expect.stringMatching(/maps\.google\.com|google\.com\/maps/))
    })

    it('restricts Safe Places route from Police users', async () => {
      authService.setCurrentUser(policeUser)
      render(
        <MemoryRouter initialEntries={['/safe-places']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      // Police is redirected to /dashboard
      await screen.findByRole('heading', { name: /operations overview/i }, { timeout: 8000 })
      expect(screen.queryByRole('heading', { name: /nearby safe places/i })).not.toBeInTheDocument()
    }, 12000)
  })

  describe('3. FR-07 Theme Switching (Dark & Light Mode)', () => {
    it('toggles theme between dark and light in Settings and updates documentElement', async () => {
      authService.setCurrentUser(travellerUser)
      render(
        <MemoryRouter initialEntries={['/settings']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(await screen.findByText(/appearance & theme/i)).toBeInTheDocument()
      const lightButton = screen.getByRole('button', { name: /light/i })
      fireEvent.click(lightButton)

      expect(document.documentElement.getAttribute('data-theme')).toBe('light')

      const darkButton = screen.getByRole('button', { name: /dark/i })
      fireEvent.click(darkButton)

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })
  })
})
