import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createPatient,
  deletePatient,
  fetchPatientById,
  fetchPatientHistory,
  fetchPatients,
  updatePatient,
} from "../api/patient";

const initialState = {
  list: [],
  selectedPatient: null,
  history: null,
  pagination: null,
  isLoading: false,
  isHistoryLoading: false,
  isSubmitting: false,
  error: null,
};

const patientsSlice = createSlice({
  name: "patients",
  initialState,
  reducers: {
    clearSelectedPatient: (state) => {
      state.selectedPatient = null;
    },
    clearHistory: (state) => {
      state.history = null;
    },
    // بيتنادى بعد ما نعمل create/update لكونسلتيشن أو فولو أب لو الـ
    // response رجّع chronicConditions محدّثة — بنحط النسخة الجديدة على
    // طول في patient.chronicConditions اللي في state.history (لو صفحة
    // Patient History فاتحة/متحمّلة) من غير ما نستنى refetch كامل
    setPatientChronicConditions: (state, action) => {
      const { patientId, chronicConditions } = action.payload || {};
      if (!chronicConditions) return;
      if (
        state.history?.patient &&
        String(state.history.patient._id) === String(patientId)
      ) {
        state.history.patient.chronicConditions = chronicConditions;
      }
      if (
        state.selectedPatient &&
        String(state.selectedPatient._id) === String(patientId)
      ) {
        state.selectedPatient.chronicConditions = chronicConditions;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })

      .addCase(fetchPatientById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPatientById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedPatient = action.payload;
      })
      .addCase(fetchPatientById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })

      .addCase(fetchPatientHistory.pending, (state) => {
        state.isHistoryLoading = true;
        state.error = null;
      })
      .addCase(fetchPatientHistory.fulfilled, (state, action) => {
        state.isHistoryLoading = false;
        state.history = action.payload;
      })
      .addCase(fetchPatientHistory.rejected, (state, action) => {
        state.isHistoryLoading = false;
        state.error = action.error.message;
      })

      .addCase(createPatient.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(createPatient.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.list.unshift(action.payload);
      })
      .addCase(createPatient.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(updatePatient.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(updatePatient.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const index = state.list.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) state.list[index] = action.payload;
      })
      .addCase(updatePatient.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(deletePatient.fulfilled, (state, action) => {
        state.list = state.list.filter((p) => p._id !== action.payload);
      });
  },
});

export const {
  clearSelectedPatient,
  clearHistory,
  setPatientChronicConditions,
} = patientsSlice.actions;
export default patientsSlice.reducer;
