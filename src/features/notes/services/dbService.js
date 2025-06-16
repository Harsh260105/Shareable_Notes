import { openDB } from 'idb';

const DB_NAME = 'notes-app-db';
const DB_VERSION = 1;
const NOTES_STORE = 'notes';

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Create a store of objects
            if (!db.objectStoreNames.contains(NOTES_STORE)) {
                const notesStore = db.createObjectStore(NOTES_STORE, {
                    keyPath: 'id',
                    autoIncrement: false,
                });

                // Create indexes
                notesStore.createIndex('lastModified', 'lastModified', { unique: false });
                notesStore.createIndex('created', 'created', { unique: false });
                notesStore.createIndex('isPinned', 'isPinned', { unique: false });
                notesStore.createIndex('isTrashed', 'isTrashed', { unique: false });
            }
        },
    });
};

export const getAllNotes = async () => {
    const db = await initDB();
    return db.getAll(NOTES_STORE);
};

export const getNoteById = async (id) => {
    const db = await initDB();
    return db.get(NOTES_STORE, id);
};

export const saveNote = async (note) => {
    const db = await initDB();
    return db.put(NOTES_STORE, note);
};

export const deleteNote = async (id) => {
    const db = await initDB();
    return db.delete(NOTES_STORE, id);
};

export const getTrashedNotes = async () => {
    const db = await initDB();
    const tx = db.transaction(NOTES_STORE, 'readonly');
    const index = tx.store.index('isTrashed');
    return index.getAll(true);
};

export const getPinnedNotes = async () => {
    const db = await initDB();
    const tx = db.transaction(NOTES_STORE, 'readonly');
    const index = tx.store.index('isPinned');
    return index.getAll(true);
};
