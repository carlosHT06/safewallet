import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  isLoggedIn: boolean;
  email?: string;
}

const initialState: AuthState = {
  isLoggedIn: false,
  email: undefined,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<string>) => {
      state.isLoggedIn = true;
      state.email = action.payload;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.email = undefined;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
