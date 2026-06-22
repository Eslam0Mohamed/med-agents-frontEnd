import { configureStore } from '@reduxjs/toolkit'; 
import patientsReducer from "../slices/patientsSlice"
export const store = configureStore({
  reducer: {
    patients: patientsReducer
  },
});
 