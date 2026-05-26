import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { MealDto } from '@cimeat/types'

type EditContextValue = {
  editing: MealDto | null
  setEditing: (m: MealDto | null) => void
}

const EditContext = createContext<EditContextValue | null>(null)

export function EditMealProvider({ children }: { children: ReactNode }) {
  const [editing, setEditing] = useState<MealDto | null>(null)
  const value = useMemo(() => ({ editing, setEditing }), [editing])
  return <EditContext.Provider value={value}>{children}</EditContext.Provider>
}

export function useEditMeal(): EditContextValue {
  const ctx = useContext(EditContext)
  if (!ctx) throw new Error('useEditMeal harus dipanggil di dalam EditMealProvider')
  return ctx
}
