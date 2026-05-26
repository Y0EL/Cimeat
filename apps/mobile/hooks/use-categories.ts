import { categoryList, type CategoryMeta } from '~/lib/categories'

export function useCategories(): CategoryMeta[] {
  return categoryList
}
