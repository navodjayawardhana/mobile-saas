import { combineReducers, configureStore } from '@reduxjs/toolkit';
import themeConfigSlice from './themeConfigSlice';
import authSlice from './slices/authSlice';
import { baseApi } from './api/baseApi';

const rootReducer = combineReducers({
    themeConfig: themeConfigSlice,
    auth: authSlice,
    [baseApi.reducerPath]: baseApi.reducer,
});

const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
});

export default store;

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

// Re-export IRootState for backward compatibility
export type IRootState = RootState;
