import { configureStore } from '@reduxjs/toolkit';

/**
 * Client/UI state only (ADR-011). Server entities must not be mirrored here
 * without an explicit offline reason.
 */
export const store = configureStore({
  reducer: {
    // Intentionally empty until UI-only slices are needed.
  },
});

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
