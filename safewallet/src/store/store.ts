
import { configureStore } from '@reduxjs/toolkit';
import expensesReducer from './expensesSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    expenses: expensesReducer,
    auth: authReducer,
  },
});

// Tipos para usar en useSelector y useDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
