import { categoryList, type CategoryMeta } from '~/lib/categories'

// Food categories are a fixed enum (no network call needed).
export function useCategories(): CategoryMeta[] {
  return categoryList
}
