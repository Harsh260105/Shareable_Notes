import { createSlice, nanoid } from '@reduxjs/toolkit';

// Define a robust initial state with all required fields
const initialState = {
    notes: [],
    pinnedNotes: [],
    trashedNotes: [],
    filter: '',
    sortBy: 'lastModified', // 'lastModified', 'created', 'title'
    sortDirection: 'desc',
};

// Initialize slice with proper default values
export const notesSlice = createSlice({
    name: 'notes',
    initialState: {
        ...initialState,
        // Ensure pinnedNotes is always an array
        pinnedNotes: initialState.pinnedNotes || [],
    },
    reducers: {
        createNote: {
            reducer: (state, action) => {
                const { id, title, content, created, lastModified, isPinned, isEncrypted, versions } = action.payload;

                // Handle pinned notes limit (max 5)
                if (isPinned && state.pinnedNotes && state.pinnedNotes.length >= 5) {
                    return;
                }

                const newNote = {
                    id,
                    title,
                    content,
                    created,
                    lastModified,
                    isPinned,
                    isEncrypted: isEncrypted || false,
                    isTrashed: false,
                    versions: versions || [],
                };

                state.notes.push(newNote);

                if (isPinned) {
                    // Ensure pinnedNotes is initialized
                    if (!state.pinnedNotes) {
                        state.pinnedNotes = [];
                    }
                    state.pinnedNotes.push(id);
                }
            },
            prepare: (title, content, isPinned = false, isEncrypted = false) => {
                const id = nanoid();
                const timestamp = new Date().toISOString();
                return {
                    payload: {
                        id,
                        title,
                        content,
                        created: timestamp,
                        lastModified: timestamp,
                        isPinned,
                        isEncrypted,
                        versions: [],
                    },
                };
            },
        },

        updateNote: {
            reducer: (state, action) => {
                const { id, title, content, isPinned, isEncrypted } = action.payload;
                const note = state.notes.find((note) => note.id === id);

                if (!note) return;

                // Create a new version before updating
                const newVersion = {
                    timestamp: new Date().toISOString(),
                    title: note.title,
                    content: note.content,
                };

                // Keep only the last 5 versions
                if (note.versions.length >= 5) {
                    note.versions.shift(); // Remove the oldest version
                }

                note.versions.push(newVersion);

                // Update note
                note.title = title ?? note.title;
                note.content = content ?? note.content;
                note.lastModified = new Date().toISOString();                // Handle encryption status if provided
                if (isEncrypted !== undefined) {
                    note.isEncrypted = isEncrypted;
                }

                // Handle pin status - only if it was explicitly included in the update
                if (isPinned !== undefined && isPinned !== note.isPinned) {
                    console.log("Updating pin status:", {
                        noteId: id,
                        oldPinState: note.isPinned,
                        newPinState: isPinned,
                        currentPinnedNotes: state.pinnedNotes
                    });

                    // Check max pinned notes limit only when trying to pin
                    if (isPinned && state.pinnedNotes.length >= 5) {
                        console.log("Max pinned notes reached (5)");
                        return; // Exit early without updating
                    }

                    note.isPinned = isPinned;

                    if (isPinned) {
                        // Initialize pinnedNotes if needed
                        if (!state.pinnedNotes) {
                            state.pinnedNotes = [];
                        }

                        // Only add to pinnedNotes if not already there
                        if (!state.pinnedNotes.includes(id)) {
                            state.pinnedNotes.push(id);
                            console.log("Added to pinnedNotes:", id);
                        }
                    } else {
                        // Remove from pinnedNotes when unpinning
                        if (state.pinnedNotes) {
                            state.pinnedNotes = state.pinnedNotes.filter((pinnedId) => pinnedId !== id);
                            console.log("Removed from pinnedNotes:", id);
                        }
                    }

                    console.log("Updated pinnedNotes:", state.pinnedNotes);
                }
            }, prepare: (id, updates) => {
                return {
                    payload: {
                        id,
                        ...updates,
                    },
                };
            },
        },

        deleteNote: {
            reducer: (state, action) => {
                const { id } = action.payload;
                const note = state.notes.find((note) => note.id === id);

                if (!note) {
                    return;
                }

                // Check if the note is encrypted
                if (note.isEncrypted) {
                    return;
                }

                // Mark note as trashed
                note.isTrashed = true;

                // Add to trashedNotes array
                if (!state.trashedNotes) {
                    state.trashedNotes = [];
                }
                if (!state.trashedNotes.includes(id)) {
                    state.trashedNotes.push(id);
                }

                // If note was pinned, remove from pinnedNotes
                if (note.isPinned) {
                    note.isPinned = false;

                    // Ensure pinnedNotes is initialized
                    if (state.pinnedNotes) {
                        state.pinnedNotes = state.pinnedNotes.filter((pinnedId) => pinnedId !== id);
                    }
                }
            },
            prepare: (payload) => {
                return { payload };
            },
        },

        restoreNote: (state, action) => {
            const { id } = action.payload;
            const note = state.notes.find((note) => note.id === id);

            if (!note) return;

            note.isTrashed = false;

            // Remove from trashedNotes array
            if (state.trashedNotes) {
                state.trashedNotes = state.trashedNotes.filter(noteId => noteId !== id);
            }
        },

        permanentlyDeleteNote: (state, action) => {
            const { id } = action.payload;

            // Check if the note is encrypted before permanently deleting
            const noteToDelete = state.notes.find(note => note.id === id);
            if (noteToDelete && noteToDelete.isEncrypted) {
                return; // Prevent deletion of encrypted notes
            }

            state.notes = state.notes.filter((note) => note.id !== id);

            // If note was pinned, remove from pinnedNotes
            if (state.pinnedNotes) {
                state.pinnedNotes = state.pinnedNotes.filter((pinnedId) => pinnedId !== id);
            }

            // Remove from trashedNotes array
            if (state.trashedNotes) {
                state.trashedNotes = state.trashedNotes.filter(noteId => noteId !== id);
            }
        },

        encryptNote: (state, action) => {
            const { id, encryptedContent } = action.payload;
            const note = state.notes.find((note) => note.id === id);

            if (!note) return;

            note.content = encryptedContent;
            note.isEncrypted = true;
            note.lastModified = new Date().toISOString();
        },

        decryptNote: (state, action) => {
            const { id, decryptedContent } = action.payload;
            const note = state.notes.find((note) => note.id === id);

            if (!note) return;

            note.content = decryptedContent;
            note.isEncrypted = false;
            note.lastModified = new Date().toISOString();
        },

        setFilter: (state, action) => {
            state.filter = action.payload;
        },

        setSortBy: (state, action) => {
            state.sortBy = action.payload;
        },

        setSortDirection: (state, action) => {
            state.sortDirection = action.payload;
        },

        fixStateIntegrity: (state) => {
            console.log("Running fixStateIntegrity");

            // Fix pinnedNotes array
            if (!state.pinnedNotes || !Array.isArray(state.pinnedNotes)) {
                console.warn('Fixing corrupted pinnedNotes state - was:', state.pinnedNotes);
                state.pinnedNotes = [];
            }

            // Fix trashedNotes array
            if (!state.trashedNotes || !Array.isArray(state.trashedNotes)) {
                state.trashedNotes = [];
            }

            // Update pinnedNotes based on note state
            state.notes.forEach(note => {
                if (note.isPinned && !note.isTrashed && !state.pinnedNotes.includes(note.id)) {
                    state.pinnedNotes.push(note.id);
                } else if ((!note.isPinned || note.isTrashed) && state.pinnedNotes.includes(note.id)) {
                    state.pinnedNotes = state.pinnedNotes.filter(id => id !== note.id);
                }

                // Update trashedNotes based on note state
                if (note.isTrashed && !state.trashedNotes.includes(note.id)) {
                    state.trashedNotes.push(note.id);
                } else if (!note.isTrashed && state.trashedNotes.includes(note.id)) {
                    state.trashedNotes = state.trashedNotes.filter(id => id !== note.id);
                }
            });

            const validNoteIds = state.notes
                .filter(note => !note.isTrashed)
                .map(note => note.id);

            const invalidPinnedIds = state.pinnedNotes.filter(id => !validNoteIds.includes(id));

            if (invalidPinnedIds.length > 0) {
                state.pinnedNotes = state.pinnedNotes.filter(id => validNoteIds.includes(id));
            }

            // Remove any IDs from trashedNotes that don't exist in notes
            const allNoteIds = state.notes.map(note => note.id);
            const invalidTrashedIds = state.trashedNotes.filter(id => !allNoteIds.includes(id));

            if (invalidTrashedIds.length > 0) {
                state.trashedNotes = state.trashedNotes.filter(id => allNoteIds.includes(id));
            }

        },
    },
});

export const {
    createNote,
    updateNote,
    deleteNote,
    restoreNote,
    permanentlyDeleteNote,
    encryptNote,
    decryptNote,
    setFilter,
    setSortBy,
    setSortDirection,
    fixStateIntegrity,
} = notesSlice.actions;

// Selectors
export const selectAllNotes = (state) => {
    return state.notes.notes;
};

export const selectActiveNotes = (state) => {
    const activeNotes = state.notes.notes.filter((note) => !note.isTrashed);
    return activeNotes;
};

export const selectPinnedNotes = (state) => {
    // Get the pinnedNotes array from state (contains note IDs)
    const pinnedNoteIds = state.notes.pinnedNotes || [];

    if (!Array.isArray(pinnedNoteIds)) {
        console.error("pinnedNotes is not an array:", pinnedNoteIds);
        return [];
    }

    // Find all notes that are both marked as pinned and are in the pinnedNotes array
    const pinnedNotes = state.notes.notes.filter((note) =>
        note.isPinned && !note.isTrashed && pinnedNoteIds.includes(note.id)
    );

    // Debug inconsistencies
    if (process.env.NODE_ENV !== 'production') {
        // Find notes marked as pinned but not in pinnedNotes array
        const notesWithIsPinnedTrue = state.notes.notes.filter(n => n.isPinned && !n.isTrashed);
        const idsNotInPinnedArray = notesWithIsPinnedTrue
            .filter(n => !pinnedNoteIds.includes(n.id))
            .map(n => n.id);

        // Find IDs in pinnedNotes that don't have a corresponding note with isPinned=true
        const idsWithoutPinnedNote = pinnedNoteIds.filter(id => {
            const note = state.notes.notes.find(n => n.id === id);
            return !note || !note.isPinned || note.isTrashed;
        });

        if (idsNotInPinnedArray.length > 0) {
            console.warn('Notes with isPinned=true but not in pinnedNotes array:', idsNotInPinnedArray);
        }

        if (idsWithoutPinnedNote.length > 0) {
            console.warn('IDs in pinnedNotes without corresponding note marked as pinned:', idsWithoutPinnedNote);
        }
    }

    return pinnedNotes;
};

export const selectUnpinnedNotes = (state) => {
    const pinnedNoteIds = state.notes.pinnedNotes || [];
    const unpinnedNotes = state.notes.notes.filter(
        (note) => !note.isPinned && !note.isTrashed && !pinnedNoteIds.includes(note.id)
    );
    return unpinnedNotes;
};

export const selectTrashedNotes = (state) => {
    const trashedNoteIds = state.notes.trashedNotes || [];

    if (!Array.isArray(trashedNoteIds)) {
        console.error("trashedNotes is not an array:", trashedNoteIds);
        return state.notes.notes.filter((note) => note.isTrashed);
    }

    // Return notes that are either marked as trashed or are in the trashedNotes array
    return state.notes.notes.filter((note) =>
        note.isTrashed && trashedNoteIds.includes(note.id)
    );
};

export const selectFilteredNotes = (state) => {
    const { filter, sortBy, sortDirection } = state.notes;

    // First, get active notes
    let filteredNotes = state.notes.notes.filter((note) => !note.isTrashed);

    // Apply text search filter if any
    if (filter) {
        const filterLower = filter.toLowerCase();
        filteredNotes = filteredNotes.filter(
            (note) =>
                note.title.toLowerCase().includes(filterLower) ||
                (!note.isEncrypted && note.content.toLowerCase().includes(filterLower))
        );
    }

    // Sort notes
    return filteredNotes.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case 'lastModified':
                comparison = new Date(b.lastModified) - new Date(a.lastModified);
                break;
            case 'created':
                comparison = new Date(b.created) - new Date(a.created);
                break;
            case 'title':
                comparison = a.title.localeCompare(b.title);
                break;
            default:
                comparison = new Date(b.lastModified) - new Date(a.lastModified);
        }

        return sortDirection === 'asc' ? -comparison : comparison;
    });
};

export const selectNoteById = (state, noteId) =>
    state.notes.notes.find((note) => note.id === noteId);

export const selectMostRecentNote = (state) => {
    // Get active (non-trashed) notes
    const activeNotes = state.notes.notes.filter((note) => !note.isTrashed);

    // If there are no notes, return null
    if (activeNotes.length === 0) return null;

    // Sort by created date (newest first) and return the first one
    return [...activeNotes].sort(
        (a, b) => new Date(b.created) - new Date(a.created)
    )[0];
};

export default notesSlice.reducer;
