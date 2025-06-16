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
                const { id, title, content, created, lastModified, isPinned, isEncrypted, versions } = action.payload;                // Handle pinned notes limit (max 5)
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
        }, updateNote: {
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
                if (isPinned !== undefined && isPinned !== note.isPinned) {                    // Check max pinned notes limit only when trying to pin
                    if (isPinned && state.pinnedNotes.length >= 5) {
                        return; // Exit early without updating
                    }

                    note.isPinned = isPinned;

                    if (isPinned) {

                        if (!state.pinnedNotes) {
                            state.pinnedNotes = [];
                        }
                        if (!state.pinnedNotes.includes(id)) {
                            state.pinnedNotes.push(id);
                        }

                    } else {
                        if (state.pinnedNotes) {
                            state.pinnedNotes = state.pinnedNotes.filter((pinnedId) => pinnedId !== id);
                        }
                    }
                }
            }, prepare: (id, updates) => {
                return {
                    payload: {
                        id,
                        ...updates,
                    },
                };
            },
        }, deleteNote: {
            reducer: (state, action) => {
                const { id } = action.payload;
                const note = state.notes.find((note) => note.id === id);

                if (!note) {
                    return;
                }

                // Check if the note is encrypted
                if (note.isEncrypted) {
                    return; // Silently fail - the UI will have already shown an error
                }

                note.isTrashed = true;
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
        }, permanentlyDeleteNote: (state, action) => {
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

            if (!state.pinnedNotes || !Array.isArray(state.pinnedNotes)) {
                console.warn('Fixing corrupted pinnedNotes state - was:', state.pinnedNotes);
                state.pinnedNotes = [];
            }

            // Ensure all notes with isPinned=true are in the pinnedNotes array
            const pinnedNoteIds = [...state.pinnedNotes];

            state.notes.forEach(note => {
                if (note.isPinned && !state.pinnedNotes.includes(note.id)) {
                    state.pinnedNotes.push(note.id);
                } else if (!note.isPinned && state.pinnedNotes.includes(note.id)) {
                    state.pinnedNotes = state.pinnedNotes.filter(id => id !== note.id);
                }
            });

            // Remove any IDs from pinnedNotes that don't exist in notes
            const validNoteIds = state.notes.map(note => note.id);
            const invalidPinnedIds = state.pinnedNotes.filter(id => !validNoteIds.includes(id));

            if (invalidPinnedIds.length > 0) {
                state.pinnedNotes = state.pinnedNotes.filter(id => validNoteIds.includes(id));
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
    // Use both the isPinned property and the pinnedNotes array to identify pinned notes
    // This ensures we catch any potential sync issues between the two
    const pinnedNoteIds = state.notes.pinnedNotes || [];
    const pinnedNotes = state.notes.notes.filter((note) =>
        note.isPinned && !note.isTrashed && pinnedNoteIds.includes(note.id)
    );

    // Verify that all notes with isPinned=true are in the pinnedNotes array
    const notesWithIsPinnedTrue = state.notes.notes.filter(n => n.isPinned && !n.isTrashed);

    // Only check if pinnedNoteIds exists
    let idsNotInPinnedArray = [];
    if (pinnedNoteIds) {
        idsNotInPinnedArray = notesWithIsPinnedTrue
            .filter(n => !pinnedNoteIds.includes(n.id))
            .map(n => n.id);
    }

    if (idsNotInPinnedArray.length > 0) {
        console.warn('Found notes with isPinned=true but not in pinnedNotes array:', idsNotInPinnedArray);
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

export const selectTrashedNotes = (state) =>
    state.notes.notes.filter((note) => note.isTrashed);

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
