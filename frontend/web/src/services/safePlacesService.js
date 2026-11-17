import storageService from './storageService'
import { initialSafePlaces, SAFE_PLACE_CATEGORIES } from '../data/safePlacesData'

export const SAFE_PLACES_STORAGE_KEY = 'rakshapath_safe_places'

export const safePlacesService = {
  /**
   * Retrieves all safe places from local storage with initial fallback.
   */
  getSafePlaces() {
    const places = storageService.get(SAFE_PLACES_STORAGE_KEY, initialSafePlaces)
    return Array.isArray(places) && places.length > 0 ? places : initialSafePlaces
  },

  /**
   * Filter safe places by category and search term.
   */
  filterSafePlaces({ category = SAFE_PLACE_CATEGORIES.ALL, search = '' } = {}) {
    const places = this.getSafePlaces()
    const query = search.trim().toLowerCase()

    return places.filter((place) => {
      const matchCategory =
        category === SAFE_PLACE_CATEGORIES.ALL || place.category === category
      const matchSearch =
        !query ||
        place.name.toLowerCase().includes(query) ||
        place.address.toLowerCase().includes(query) ||
        place.detail.toLowerCase().includes(query)
      return matchCategory && matchSearch
    })
  },

  /**
   * Get safe place by ID.
   */
  getSafePlaceById(id) {
    const places = this.getSafePlaces()
    return places.find((p) => p.id === id) || null
  },
}

export default safePlacesService
