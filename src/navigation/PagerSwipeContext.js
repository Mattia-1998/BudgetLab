import { createContext, useContext } from 'react';

export const PagerSwipeContext = createContext(null);

export function usePagerSwipe() {
  return useContext(PagerSwipeContext);
}