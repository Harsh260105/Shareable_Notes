import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  MdOutlinePushPin,
  MdPushPin,
  MdLockOutline,
  MdLockOpen,
  MdDeleteOutline,
  MdClose,
  MdDownload,
} from "react-icons/md";
import RichTextEditor from "../../editor/RichTextEditor";
import { updateNote, deleteNote } from "../slices/notesSlice";
import { extractKeyTerms, checkGrammar } from "../../ai/nlpUtils";
import {
  encryptContent,
  decryptContent,
  calculatePasswordStrength,
} from "../../../shared/utils/cryptoUtils";
import InsightsPanel from "../../ai/InsightsPanel";
import { store } from "../../../app/store";

const NoteEditor = ({ noteId, onClose }) => {
  const dispatch = useDispatch();
  const note = useSelector((state) =>
    state.notes.notes.find((note) => note.id === noteId)
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [showEncryptModal, setShowEncryptModal] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [keyTerms, setKeyTerms] = useState([]);
  const [grammarErrors, setGrammarErrors] = useState([]);
  const [isHoveringTerm, setIsHoveringTerm] = useState(null);
  // Load note data
  useEffect(() => {
    if (note) {
      console.log("Loading note data:", {
        id: note.id,
        title: note.title,
        isPinned: note.isPinned,
        isEncrypted: note.isEncrypted,
      });
      setTitle(note.title);
      setContent(note.content);
      setIsPinned(note.isPinned);
      setIsEncrypted(note.isEncrypted);
      console.log(
        "Note data loaded, isPinned set to:",
        note.isPinned,
        "isEncrypted set to:",
        note.isEncrypted
      );
    }
  }, [note]);

  // Track encryption state changes to ensure UI syncs correctly
  useEffect(() => {
    if (note && note.isEncrypted !== isEncrypted) {
      console.log("Syncing encryption state from note:", note.isEncrypted);
      setIsEncrypted(note.isEncrypted);
    }
  }, [note, isEncrypted]);

  // Process content with NLP
  useEffect(() => {
    if (!content || isEncrypted) {
      setKeyTerms([]);
      setGrammarErrors([]);
      return;
    }

    // Extract text content (remove HTML tags)
    const textContent = content.replace(/<[^>]*>/g, " ");

    // Process with small delay to avoid excessive processing
    const processTimeout = setTimeout(() => {
      // Extract key terms
      const terms = extractKeyTerms(textContent);
      setKeyTerms(terms);

      // Check grammar
      const errors = checkGrammar(textContent);
      setGrammarErrors(errors);
    }, 1000);

    return () => clearTimeout(processTimeout);
  }, [content, isEncrypted]);

  // Auto-save
  useEffect(() => {
    if (!note) return;

    const autoSaveTimeout = setTimeout(() => {
      if (
        title !== note.title ||
        content !== note.content ||
        isPinned !== note.isPinned
      ) {
        console.log("Auto-saving note with changes:", {
          title,
          content,
          isPinned,
        });
        dispatch(updateNote(noteId, { title, content, isPinned }));
      }
    }, 2000); // Auto-save every 2 seconds

    return () => clearTimeout(autoSaveTimeout);
  }, [title, content, isPinned, note, noteId, dispatch]); // Save on blur
  const handleBlur = () => {
    console.log("Blur event triggered, checking for changes to save");
    console.log("Current state:", { title, content, isPinned });
    if (note) {
      console.log("Note state:", {
        noteTitle: note.title,
        noteContent: note.content,
        noteIsPinned: note.isPinned,
      });

      if (
        title !== note.title ||
        content !== note.content ||
        isPinned !== note.isPinned
      ) {
        console.log("Changes detected, updating note");
        dispatch(updateNote(noteId, { title, content, isPinned }));
      }
    }
  };
  // Handle note deletion
  const handleDelete = () => {
    console.log("Deleting note with ID:", noteId);

    // Double-check that we're not deleting an encrypted note
    if (isEncrypted) {
      console.error("Attempted to delete an encrypted note");
      alert(
        "Security protection: Cannot delete an encrypted note. Please decrypt the note first."
      );
      return;
    }

    if (noteId) {
      try {
        dispatch(deleteNote({ id: noteId }));
        console.log("Note moved to trash");

        // Ensure we navigate away from the deleted note
        setTimeout(() => {
          onClose();
        }, 100);
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    } else {
      console.error("Cannot delete note: No noteId provided");
    }
  }; // Handle encryption
  const handleEncrypt = () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!content || content.trim() === "") {
      alert("Cannot encrypt empty content");
      return;
    }

    try {
      console.log("Encrypting note content...");
      console.log("Original content length:", content?.length || 0);

      // Attempt to encrypt the content
      const encryptedContent = encryptContent(content, password);
      console.log(
        "Encryption successful, encrypted content length:",
        encryptedContent?.length || 0
      );

      console.log("Updating Redux state with encrypted content");

      // Update Redux state
      dispatch(
        updateNote(noteId, {
          content: encryptedContent,
          isEncrypted: true,
        })
      );

      // Update local state for immediate UI feedback
      setContent(encryptedContent);
      setIsEncrypted(true);
      setShowEncryptModal(false);

      // Clear password fields
      setPassword("");
      setConfirmPassword("");

      console.log("Note encryption process completed");

      // Force a refresh after a short delay to ensure everything is in sync
      setTimeout(() => {
        console.log("Refreshing UI after encryption...");
        // Re-fetch the note from Redux to ensure we have the latest state
        const updatedNote = store
          .getState()
          .notes.notes.find((n) => n.id === noteId);
        if (updatedNote) {
          console.log("Updated note state:", {
            isEncrypted: updatedNote.isEncrypted,
            contentLength: updatedNote.content?.length || 0,
          });
          // Force update our local state with the latest from Redux
          setIsEncrypted(updatedNote.isEncrypted);
          setContent(updatedNote.content);
        }
      }, 300);
    } catch (error) {
      console.error("Error encrypting note:", error);
      alert("There was an error encrypting your note. Please try again.");
    }
  };
  // Handle decryption
  const handleDecrypt = () => {
    try {
      console.log("Decrypting note content...");
      console.log("Current encrypted content length:", content?.length || 0);

      // Attempt to decrypt the content
      let decryptedContent;
      try {
        decryptedContent = decryptContent(content, password);
        console.log(
          "Decryption successful, decrypted content length:",
          decryptedContent?.length || 0
        );
      } catch (decryptError) {
        console.error("Decryption operation failed:", decryptError);
        alert(`Decryption failed: ${decryptError.message}`);
        return;
      }

      // Verify the decrypted content is valid
      if (!decryptedContent || decryptedContent.trim() === "") {
        console.error("Decryption produced empty content");
        alert(
          "Decryption failed: The decrypted content is empty. This might be due to an incorrect password."
        );
        return;
      }

      console.log("Updating Redux state with decrypted content");

      // Update Redux state with the decrypted content
      dispatch(
        updateNote(noteId, {
          content: decryptedContent,
          isEncrypted: false,
        })
      );

      // Update local state for immediate UI feedback
      setContent(decryptedContent);
      setIsEncrypted(false);
      setShowEncryptModal(false);
      setPassword("");

      console.log("Note decryption process completed");

      // Force a refresh after a short delay to ensure everything is in sync
      setTimeout(() => {
        console.log("Refreshing UI after decryption...");
        // Re-fetch the note from Redux to ensure we have the latest state
        const updatedNote = store
          .getState()
          .notes.notes.find((n) => n.id === noteId);
        if (updatedNote) {
          console.log("Updated note state:", {
            isEncrypted: updatedNote.isEncrypted,
            contentLength: updatedNote.content?.length || 0,
          });
          // Force update our local state with the latest from Redux
          setIsEncrypted(updatedNote.isEncrypted);
          setContent(updatedNote.content);
        }
      }, 300);
    } catch (error) {
      console.error("Decryption process failed:", error);
      alert(`Decryption failed: ${error.message}`);
    }
  };

  // Update password strength indicator
  useEffect(() => {
    if (password) {
      const strength = calculatePasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [password]);

  // Render the password strength meter
  const renderPasswordStrengthMeter = () => {
    let color = "bg-red-500";
    let label = "Weak";

    if (passwordStrength >= 75) {
      color = "bg-green-500";
      label = "Strong";
    } else if (passwordStrength >= 50) {
      color = "bg-yellow-500";
      label = "Moderate";
    }

    return (
      <div className="mt-2">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${color}`}
            style={{ width: `${passwordStrength}%` }}
          />
        </div>
        <p className="text-xs mt-1">{label}</p>
      </div>
    );
  };

  // Handle exporting/downloading the note
  const handleExportNote = () => {
    try {
      // Create a meaningful filename based on the note title
      const filename = `${
        title.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "note"
      }.txt`;

      // Prepare the content - if it's HTML, strip the tags for a plain text export
      const textContent = isEncrypted
        ? "[This note is encrypted and cannot be exported in readable format]"
        : content.replace(/<[^>]*>/g, "");

      // Create a metadata header
      const metadata = `Title: ${title}\nDate: ${new Date().toLocaleString()}\n\n`;
      const fullContent = metadata + textContent;

      // Create a Blob with the content
      const blob = new Blob([fullContent], {
        type: "text/plain;charset=utf-8",
      });

      // Create a temporary link element to trigger the download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;

      // Append the link to the body, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("Note exported successfully as", filename);
    } catch (error) {
      console.error("Error exporting note:", error);
      alert("There was an error exporting your note. Please try again.");
    }
  };

  if (!note) {
    return <div>Note not found</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlur}
            placeholder="Note Title"
            className="text-xl font-semibold bg-transparent border-none outline-none"
          />{" "}
          <button
            type="button"
            onClick={() => {
              console.log(
                "Pin button clicked, current isPinned state:",
                isPinned
              );
              const newPinnedState = !isPinned;

              // Update local state first for immediate UI feedback
              setIsPinned(newPinnedState);

              // Then dispatch the Redux action with ONLY the isPinned change
              // This ensures we're not accidentally overwriting other fields
              console.log(
                "Dispatching updateNote with isPinned:",
                newPinnedState
              );
              dispatch(
                updateNote(noteId, {
                  isPinned: newPinnedState,
                })
              );

              // Force re-render if needed by touching state again after a slight delay
              setTimeout(() => {
                setIsPinned((prev) => {
                  console.log("Confirming pin state after update:", prev);
                  return prev;
                });
              }, 100);

              console.log("Pin status updated to:", newPinnedState);
            }}
            className={`p-1 rounded-full ${
              isPinned ? "text-yellow-500" : "text-gray-400"
            }`}
            title={isPinned ? "Unpin note" : "Pin note"}
          >
            {isPinned ? (
              <MdPushPin size={18} />
            ) : (
              <MdOutlinePushPin size={18} />
            )}
          </button>
        </div>{" "}
        <div className="flex items-center gap-3">
          {/* Save/Export button */}
          <button
            type="button"
            onClick={handleExportNote}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors duration-200"
            title="Export note as text file"
            disabled={!content || content.trim() === ""}
          >
            <MdDownload className="text-lg" />
            <span>Export</span>
          </button>

          {isEncrypted ? (
            <button
              type="button"
              onClick={() => {
                setPassword("");
                setConfirmPassword("");
                setShowEncryptModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors duration-200"
              title="Decrypt note"
            >
              {" "}
              <MdLockOpen className="text-lg" />
              {/* <span>Decrypt</span> */}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setPassword("");
                setConfirmPassword("");
                setShowEncryptModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-gray-300 text-gray-600 hover:bg-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
              title="Encrypt note"
            >
              {" "}
              <MdLockOutline className="text-lg" />
              {/* <span>Encrypt</span> */}
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (isEncrypted) {
                alert(
                  "Cannot delete an encrypted note. Please decrypt the note first to delete it."
                );
                return;
              }
              handleDelete();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors duration-200 ${
              isEncrypted
                ? "bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed"
                : "bg-gray-300 text-gray-600 hover:bg-red-400/80 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-red-500/80"
            }`}
            title={
              isEncrypted ? "Decrypt note first to delete" : "Move to trash"
            }
            disabled={isEncrypted}
          >
            {" "}
            <MdDeleteOutline className="text-lg" />
            {/* <span>Delete</span> */}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-300 text-gray-600 hover:bg-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
            title="Close"
          >
            {" "}
            <MdClose className="text-lg" />
            {/* <span>Close</span> */}
          </button>
        </div>
      </div>{" "}
      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isEncrypted ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="p-6 bg-zinc-200 dark:bg-gray-800 rounded-lg text-center max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">
                🔒 This note is encrypted
              </h3>
              <p className="mb-4">
                Enter your password to view and edit this note.
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full p-2 mb-4 border rounded"
                // Allow pressing Enter to decrypt
                onKeyDown={(e) => {
                  if (e.key === "Enter" && password) {
                    handleDecrypt();
                  }
                }}
                autoFocus
              />
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDecrypt}
                  className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={!password}
                >
                  Decrypt Note
                </button>
              </div>
            </div>
          </div>
        ) : (
          <RichTextEditor
            initialContent={content}
            onChange={setContent}
            onBlur={handleBlur}
            placeholder={
              !content && note.title === "Untitled Note"
                ? "Write your text here"
                : "Write your note..."
            }
          />
        )}{" "}
      </div>{" "}
      {/* NLP Insights */}
      {!isEncrypted && (
        <div className="border-t border-gray-300 dark:border-gray-700 p-2 bg-gray-100 dark:bg-gray-900 insights-container">
          <InsightsPanel noteContent={content} isEncrypted={isEncrypted} />
        </div>
      )}{" "}
      {/* Encrypt/Decrypt Modal */}
      {showEncryptModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 encryption-modal-container">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-xl font-semibold mb-4">
              {isEncrypted ? "Decrypt Note" : "Encrypt Note"}
            </h3>

            {isEncrypted ? (
              <>
                <p className="mb-4">
                  Enter your password to decrypt this note.
                </p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full p-2 mb-4 border rounded"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && password) {
                      handleDecrypt();
                    }
                  }}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEncryptModal(false)}
                    className="p-2 bg-gray-200 dark:bg-gray-600 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDecrypt}
                    className="p-2 bg-blue-500 text-white rounded"
                    disabled={!password}
                  >
                    Decrypt
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-4">
                  Set a password to encrypt this note. Make sure to remember it,
                  as your note cannot be recovered without the correct password.
                </p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set password"
                  className="w-full p-2 mb-2 border rounded"
                />
                {renderPasswordStrengthMeter()}
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full p-2 my-4 border rounded"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEncryptModal(false)}
                    className="p-2 bg-gray-200 dark:bg-gray-600 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleEncrypt}
                    className="p-2 bg-blue-500 text-white rounded"
                    disabled={
                      !password ||
                      password !== confirmPassword ||
                      passwordStrength < 30
                    }
                  >
                    Encrypt
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteEditor;
