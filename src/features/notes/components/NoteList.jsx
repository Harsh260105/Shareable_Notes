import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectPinnedNotes,
  selectUnpinnedNotes,
  selectTrashedNotes,
  setFilter,
  setSortBy,
  setSortDirection,
  restoreNote,
  permanentlyDeleteNote,
  createNote,
  fixStateIntegrity,
} from "../slices/notesSlice";
import { MdPushPin, MdAddCircle, MdSearch } from "react-icons/md";

const NoteList = ({ activeFolder, onSelectNote }) => {
  const dispatch = useDispatch();
  const pinnedNotes = useSelector(selectPinnedNotes);
  const unpinnedNotes = useSelector(selectUnpinnedNotes);
  const trashedNotes = useSelector(selectTrashedNotes);
  const filter = useSelector((state) => state.notes.filter);
  const sortBy = useSelector((state) => state.notes.sortBy);
  const sortDirection = useSelector((state) => state.notes.sortDirection);
  const allPinnedIds = useSelector((state) => state.notes.pinnedNotes || []);

  const [showSortOptions, setShowSortOptions] = useState(false);

  // Fix state integrity on component mount
  useEffect(() => {
    try {
      // Ensure the state is valid when NoteList mounts
      dispatch(fixStateIntegrity());
    } catch (error) {
      console.error("Error fixing state integrity in NoteList:", error);
    }
  }, [dispatch]);

  const getNotes = () => {
    switch (activeFolder) {
      case "trash":
        return trashedNotes;
      default:
        // Important: we don't combine them here, we'll render them separately
        // to maintain the pinned section at the top
        return activeFolder === "trash" ? trashedNotes : null;
    }
  };

  // Handle sorting
  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      // Toggle direction if clicking the same sort option
      dispatch(setSortDirection(sortDirection === "asc" ? "desc" : "asc"));
    } else {
      dispatch(setSortBy(newSortBy));
      dispatch(setSortDirection("desc")); // Default to descending for new sort
    }

    setShowSortOptions(false);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Truncate content for preview
  const truncateContent = (content) => {
    if (!content) return "";
    // Remove HTML tags and decode entities
    const plainText = content.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
    const maxLength = 45;
    return plainText.length > maxLength
      ? `${plainText.substring(0, maxLength)}...`
      : plainText;
  };
  // Handle creating a new note
  const handleCreateNote = () => {
    // Create a new note and capture the action result
    // We create an empty note so the placeholder text will be shown
    const action = dispatch(createNote("Untitled Note", "", false, false));

    // Extract the new note ID from the action payload
    const newNoteId = action.payload.id;

    // Select the new note automatically
    onSelectNote(newNoteId);
  };

  // Handle note restoration from trash
  const handleRestoreNote = (e, noteId) => {
    e.stopPropagation();
    dispatch(restoreNote({ id: noteId }));
  };
  // Handle permanent deletion
  const handlePermanentDelete = (e, noteId) => {
    e.stopPropagation();

    // Find the note
    const noteToDelete = trashedNotes.find((note) => note.id === noteId);

    // Check if the note is encrypted
    if (noteToDelete && noteToDelete.isEncrypted) {
      alert(
        "Cannot delete an encrypted note. Please decrypt the note first to delete it."
      );
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to permanently delete this note? This action cannot be undone."
      )
    ) {
      dispatch(permanentlyDeleteNote({ id: noteId }));
    }
  };

  // Filter notes based on search term and then sort
  const filterAndSortNotes = (notesArray) => {
    if (!notesArray) return [];

    // Apply text search filter if any
    let filtered = filter
      ? notesArray.filter(
          (note) =>
            note.title.toLowerCase().includes(filter.toLowerCase()) ||
            (!note.isEncrypted &&
              note.content.toLowerCase().includes(filter.toLowerCase()))
        )
      : notesArray;

    // Sort notes
    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "lastModified":
          comparison = new Date(b.lastModified) - new Date(a.lastModified);
          break;
        case "created":
          comparison = new Date(b.created) - new Date(a.created);
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        default:
          comparison = new Date(b.lastModified) - new Date(a.lastModified);
      }

      return sortDirection === "asc" ? -comparison : comparison;
    });
  };

  // Process pinned and unpinned notes separately to maintain the pinned section
  const filteredSortedPinnedNotes = filterAndSortNotes(pinnedNotes);
  const filteredSortedUnpinnedNotes = filterAndSortNotes(unpinnedNotes);
  const filteredSortedTrashedNotes = filterAndSortNotes(trashedNotes);

  // Final notes array for rendering
  const finalNotes =
    activeFolder === "trash"
      ? filteredSortedTrashedNotes
      : [...filteredSortedPinnedNotes, ...filteredSortedUnpinnedNotes];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {activeFolder === "trash" ? "Trash" : "Notes"}
          </h2>

          {activeFolder !== "trash" && (
            <button
              type="button"
              onClick={handleCreateNote}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200 shadow-sm"
              title="Create new note"
            >
              <MdAddCircle size={18} />
              <span className="text-sm font-medium">New</span>
            </button>
          )}
        </div>

        {/* Search and filter */}
        <div className="relative">
          <input
            type="text"
            value={filter}
            onChange={(e) => dispatch(setFilter(e.target.value))}
            placeholder="Search notes..."
            className="w-full p-2 pl-10 border rounded-md bg-gray-100 dark:bg-gray-800"
          />
          <span className="absolute top-2 left-2.5 text-gray-500">
            <MdSearch size={24} />
          </span>
        </div>

        {/* Sort options */}
        <div className="mt-2 flex items-center justify-between">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSortOptions(!showSortOptions)}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <span>Sort by: {sortBy}</span>
              <span className="ml-1">
                {sortDirection === "asc" ? "↑" : "↓"}
              </span>
            </button>

            {showSortOptions && (
              <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md z-10 w-48">
                <button
                  type="button"
                  onClick={() => handleSort("lastModified")}
                  className="w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  Last Modified
                </button>
                <button
                  type="button"
                  onClick={() => handleSort("created")}
                  className="w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  Created
                </button>
                <button
                  type="button"
                  onClick={() => handleSort("title")}
                  className="w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  Title A-Z
                </button>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-500">
            {finalNotes.length} {finalNotes.length === 1 ? "note" : "notes"}
          </div>
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-auto">
        {filteredSortedPinnedNotes.length > 0 && activeFolder !== "trash" && (
          <div className="sticky top-0 bg-gray-100 dark:bg-gray-800 p-2 text-xs font-semibold text-gray-500">
            PINNED ({filteredSortedPinnedNotes.length})
          </div>
        )}

        {finalNotes.length > 0 ? (
          <ul>
            {activeFolder !== "trash" ? (
              <>
                {/* Render pinned notes first */}
                {filteredSortedPinnedNotes.map((note) => (
                  <li
                    key={note.id}
                    onClick={() => onSelectNote(note.id)}
                    className="p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium mb-1 flex items-center">
                          {note.isEncrypted && <span className="mr-1">🔒</span>}
                          {note.title || "Untitled Note"}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {formatDate(note.lastModified)}
                        </p>
                        <p className="text-sm truncate text-gray-700 dark:text-gray-300">
                          {note.isEncrypted
                            ? "[Encrypted content]"
                            : truncateContent(note.content)}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span className="text-yellow-500">
                          <MdPushPin size={20} />
                        </span>
                      </div>
                    </div>
                  </li>
                ))}

                {/* Add unpinned header if we have both pinned and unpinned notes */}
                {filteredSortedPinnedNotes.length > 0 &&
                  filteredSortedUnpinnedNotes.length > 0 && (
                    <div className="sticky top-0 bg-gray-100 dark:bg-gray-800 p-2 text-xs font-semibold text-gray-500">
                      OTHERS ({filteredSortedUnpinnedNotes.length})
                    </div>
                  )}

                {/* Render unpinned notes */}
                {filteredSortedUnpinnedNotes.map((note) => (
                  <li
                    key={note.id}
                    onClick={() => onSelectNote(note.id)}
                    className="p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium mb-1 flex items-center">
                          {note.isEncrypted && <span className="mr-1">🔒</span>}
                          {note.title || "Untitled Note"}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {formatDate(note.lastModified)}
                        </p>
                        <p className="text-sm truncate text-gray-700 dark:text-gray-300">
                          {note.isEncrypted
                            ? "[Encrypted content]"
                            : truncateContent(note.content)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </>
            ) : (
              // Render trashed notes
              filteredSortedTrashedNotes.map((note) => (
                <li
                  key={note.id}
                  onClick={() => onSelectNote(note.id)}
                  className="p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium mb-1 flex items-center">
                        {note.isEncrypted && <span className="mr-1">🔒</span>}
                        {note.title || "Untitled Note"}
                        {note.isPinned && (
                          <span className="ml-1 text-yellow-500">
                            <MdPushPin />
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {formatDate(note.lastModified)}
                      </p>
                      <p className="text-sm truncate text-gray-700 dark:text-gray-300">
                        {note.isEncrypted
                          ? "[Encrypted content]"
                          : truncateContent(note.content)}
                      </p>
                    </div>

                    <div className="flex">
                      <button
                        type="button"
                        onClick={(e) => handleRestoreNote(e, note.id)}
                        className="p-1 text-green-500 hover:text-green-700"
                        title="Restore note"
                      >
                        ↩️
                      </button>{" "}
                      <button
                        type="button"
                        onClick={(e) => handlePermanentDelete(e, note.id)}
                        className={`p-1 ${
                          note.isEncrypted
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-red-500 hover:text-red-700"
                        }`}
                        title={
                          note.isEncrypted
                            ? "Cannot delete encrypted note"
                            : "Delete permanently"
                        }
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500">
            <p className="mb-2">
              {filter
                ? "No notes match your search"
                : activeFolder === "trash"
                ? "Trash is empty"
                : "No notes yet"}
            </p>
            {activeFolder !== "trash" && !filter && (
              <button
                type="button"
                onClick={handleCreateNote}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm transition-colors duration-200"
              >
                <MdAddCircle size={20} />
                <span>Create your first note</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteList;
