import { combineReducers } from '@reduxjs/toolkit';
import notesReducer from '../features/notes/slices/notesSlice';

export const rootReducer = combineReducers({
    notes: notesReducer,
});
