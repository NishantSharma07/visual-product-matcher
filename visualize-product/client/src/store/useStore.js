import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      categories: [],
      selectedCategory: null,
      uploadedImage: null,
      searchResults: null,
      sessionId: null,
      loading: false,
      error: null,
      
      setCategories: (categories) => set({ categories }),
      
      setSelectedCategory: (category) => set({ 
        selectedCategory: category,
        uploadedImage: null,
        searchResults: null,
      }),
      
      setUploadedImage: (image) => set({ uploadedImage: image }),
      
      setSearchResults: (results) => set({ searchResults: results }),
      
      setSessionId: (sessionId) => set({ sessionId }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      clearSearch: () => set({ 
        uploadedImage: null,
        searchResults: null,
        sessionId: null,
        error: null,
      }),
      
      resetStore: () => set({
        selectedCategory: null,
        uploadedImage: null,
        searchResults: null,
        sessionId: null,
        loading: false,
        error: null,
      }),
    }),
    {
      name: 'styleforge-storage',
      partialize: (state) => ({
        categories: state.categories,
        selectedCategory: state.selectedCategory,
      }),
    }
  )
);

export default useStore;
