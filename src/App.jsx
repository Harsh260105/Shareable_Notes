import { useState, useEffect } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./app/store";
import NoteList from "./features/notes/components/NoteList";
import NoteEditor from "./features/notes/components/NoteEditor";
import Sidebar from "./shared/ui/Sidebar";
import { useTheme } from "./shared/hooks/useTheme";
import {
  updateNote,
  selectAllNotes,
  fixStateIntegrity,
} from "./features/notes/slices/notesSlice";
import "./App.css";

// This component will sync pinnedNotes with note.isPinned on startup
const NotesSync = () => {
  const dispatch = useDispatch();
  const allNotes = useSelector(selectAllNotes);

  // Ensure we have a valid array, handling all edge cases
  const pinnedNotes = useSelector((state) => {
    // If pinnedNotes doesn't exist or isn't an array, return empty array
    const pinnedIds = state.notes.pinnedNotes;
    return Array.isArray(pinnedIds) ? pinnedIds : [];
  });

  // Run once on component mount to ensure data consistency
  useEffect(() => {
    try {
      console.log("Running pinnedNotes sync check...");

      // First, fix any state integrity issues
      dispatch(fixStateIntegrity());
      console.log("State integrity check complete");

      // Now we can safely run the normal sync logic
      console.log("Current pinnedNotes:", pinnedNotes);

      // Check for notes where isPinned doesn't match their presence in pinnedNotes array
      allNotes.forEach((note) => {
        // Safely check if the note ID is in the pinnedNotes array
        const isInPinnedArray = pinnedNotes.includes(note.id);

        // If there's a mismatch, update the note
        if (note.isPinned !== isInPinnedArray) {
          console.log(
            `Fixing note ${note.id} - isPinned=${note.isPinned}, inPinnedArray=${isInPinnedArray}`
          );
          dispatch(updateNote(note.id, { isPinned: isInPinnedArray }));
        }
      });
    } catch (error) {
      console.error("Error in NotesSync:", error);
    }
  }, [dispatch, allNotes, pinnedNotes]);

  return null; // This component doesn't render anything
};

function App() {
  const [activeFolder, setActiveFolder] = useState("notes");
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(!isMobileView);
  const [showNoteList, setShowNoteList] = useState(!isMobileView);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { toggleTheme } = useTheme();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);

      // On desktop, always show sidebar and note list
      if (!mobile) {
        setShowSidebar(true);
        setShowNoteList(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle folder selection
  const handleSelectFolder = (folderId) => {
    setActiveFolder(folderId);
    setSelectedNoteId(null);

    // On mobile, close sidebar and show note list
    if (isMobileView) {
      setShowSidebar(false);
      setShowNoteList(true);
    }
  };

  // Handle note selection
  const handleSelectNote = (noteId) => {
    console.log("Selecting note with ID:", noteId);
    setSelectedNoteId(noteId);

    // On mobile, hide note list and show editor
    if (isMobileView) {
      setShowNoteList(false);
    }
  };

  // Handle back navigation on mobile
  const handleBackToList = () => {
    setSelectedNoteId(null);
    setShowNoteList(true);
  };

  // Force refresh when active folder changes (especially for trash)
  useEffect(() => {
    console.log("Active folder changed to:", activeFolder);
  }, [activeFolder]);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all">
          {/* Mobile menu button */}
          {isMobileView && !showSidebar && (
            <button
              type="button"
              onClick={() => setShowSidebar(true)}
              className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md"
            >
              ☰
            </button>
          )}

          {/* Sidebar */}
          {showSidebar && (
            <aside
              className={`${
                isMobileView
                  ? "fixed inset-y-0 left-0 z-40"
                  : isSidebarCollapsed
                  ? "w-16"
                  : "w-64"
              }`}
            >
              <Sidebar
                activeFolder={activeFolder}
                onSelectFolder={handleSelectFolder}
                onToggleTheme={toggleTheme}
                onCollapse={setIsSidebarCollapsed}
              />

              {/* Close button for mobile */}
              {isMobileView && (
                <button
                  type="button"
                  onClick={() => setShowSidebar(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  ✕
                </button>
              )}
            </aside>
          )}

          {/* Main content */}
          <main className="flex-1 flex overflow-hidden">
            {/* Note list */}
            {showNoteList && (
              <div
                className={`${
                  isMobileView ? "w-full" : showSidebar ? "w-1/3" : "w-2/5"
                } h-full`}
              >
                <NoteList
                  activeFolder={activeFolder}
                  onSelectNote={handleSelectNote}
                />
              </div>
            )}

            {/* Note editor */}
            {selectedNoteId ? (
              <div
                className={`${
                  isMobileView && showNoteList ? "hidden" : "flex-1"
                } h-full transition-all`}
              >
                <NoteEditor
                  noteId={selectedNoteId}
                  onClose={
                    isMobileView
                      ? handleBackToList
                      : () => setSelectedNoteId(null)
                  }
                />
              </div>
            ) : (
              <div
                className={`${
                  isMobileView && showNoteList ? "hidden" : "flex-1"
                } flex items-center justify-center h-full bg-white dark:bg-gray-900`}
              >
                <div className="text-center p-8">
                  <h2 className="text-2xl font-semibold mb-4">
                    No Note Selected
                  </h2>
                  <p className="text-gray-500">
                    Select a note from the list or create a new one.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
        <NotesSync />
      </PersistGate>
    </Provider>
  );
}

export default App;
