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
  MdOutlineMenuBook,
} from "react-icons/md";
import RichTextEditor from "../../editor/RichTextEditor";
import { updateNote, deleteNote } from "../slices/notesSlice";
import { extractKeyTerms, checkGrammar } from "../../ai/nlpUtils";
import { processTextWithTermHighlighting } from "../../ai/insightUtils";
import {
  encryptContent,
  decryptContent,
  calculatePasswordStrength,
} from "../../../shared/utils/cryptoUtils";
import InsightsPanel from "../../ai/InsightsPanel";
import { store } from "../../../app/store";
import "./encryption-modal.css";

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
  const [isGlossaryEnabled, setIsGlossaryEnabled] = useState(true);

  // Load note data
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setIsPinned(note.isPinned);
      setIsEncrypted(note.isEncrypted);
    }
  }, [note]);

  // Track encryption state changes to ensure UI syncs correctly
  useEffect(() => {
    if (note && note.isEncrypted !== isEncrypted) {
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
    const processTimeout = setTimeout(async () => {
      try {
        // Extract key terms asynchronously
        const terms = await extractKeyTerms(textContent);
        setKeyTerms(terms);

        // Check grammar asynchronously
        const errors = await checkGrammar(textContent);
        setGrammarErrors(errors);
      } catch (error) {
        console.error("Error processing content with NLP:", error);
      }
    }, 1000);

    return () => clearTimeout(processTimeout);
  }, [content, isEncrypted]); // Auto-highlight key terms in content
  useEffect(() => {
    if (!content || isEncrypted || keyTerms.length === 0) return;

    // If glossary is disabled, don't process highlighting
    if (!isGlossaryEnabled) return;

    // Skip if content already contains term highlights to prevent infinite loops
    if (content.includes('class="term-highlight"')) return;

    const processContentWithHighlights = async () => {
      try {
        const highlightedContent = await processTextWithTermHighlighting(
          content
        );

        if (highlightedContent !== content) {
          setContent(highlightedContent);

          dispatch(
            updateNote(noteId, {
              content: highlightedContent,
            })
          );
        }
      } catch (error) {
        console.error("Error highlighting terms:", error);
      }
    };

    const debounceTimeout = setTimeout(() => {
      processContentWithHighlights();
    }, 1500);

    return () => clearTimeout(debounceTimeout);
  }, [keyTerms, isEncrypted, isGlossaryEnabled, content, noteId, dispatch]);
  // Auto-save
  useEffect(() => {
    if (!note) return;

    const autoSaveTimeout = setTimeout(() => {
      if (
        title !== note.title ||
        content !== note.content ||
        isPinned !== note.isPinned
      ) {
        dispatch(updateNote(noteId, { title, content, isPinned }));
      }
    }, 2000); // Auto-save every 2 seconds

    return () => clearTimeout(autoSaveTimeout);
  }, [title, content, isPinned, note, noteId, dispatch]); // Save on blur
  const handleBlur = () => {
    if (note) {
      if (
        title !== note.title ||
        content !== note.content ||
        isPinned !== note.isPinned
      ) {
        dispatch(updateNote(noteId, { title, content, isPinned }));
      }
    }
  };

  const handleDelete = () => {
    if (isEncrypted) {
      alert(
        "Security protection: Cannot delete an encrypted note. Please decrypt the note first."
      );
      return;
    }

    if (noteId) {
      try {
        dispatch(deleteNote({ id: noteId }));

        setTimeout(() => {
          onClose();
        }, 100);
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    } else {
      console.error("Cannot delete note: No noteId provided");
    }
  };
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
      const encryptedContent = encryptContent(content, password);

      dispatch(
        updateNote(noteId, {
          content: encryptedContent,
          isEncrypted: true,
        })
      );

      setContent(encryptedContent);
      setIsEncrypted(true);
      setShowEncryptModal(false);

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        const updatedNote = store
          .getState()
          .notes.notes.find((n) => n.id === noteId);
        if (updatedNote) {
          setIsEncrypted(updatedNote.isEncrypted);
          setContent(updatedNote.content);
        }
      }, 300);
    } catch (error) {
      console.error("Error encrypting note:", error);
      alert("There was an error encrypting your note. Please try again.");
    }
  };

  const handleDecrypt = () => {
    try {
      let decryptedContent;
      try {
        decryptedContent = decryptContent(content, password);
      } catch (decryptError) {
        console.error("Decryption operation failed:", decryptError);
        alert(`Decryption failed: ${decryptError.message}`);
        return;
      }

      if (!decryptedContent || decryptedContent.trim() === "") {
        console.error("Decryption produced empty content");
        alert(
          "Decryption failed: The decrypted content is empty. This might be due to an incorrect password."
        );
        return;
      }

      dispatch(
        updateNote(noteId, {
          content: decryptedContent,
          isEncrypted: false,
        })
      );

      setContent(decryptedContent);
      setIsEncrypted(false);
      setShowEncryptModal(false);
      setPassword("");

      setTimeout(() => {
        const updatedNote = store
          .getState()
          .notes.notes.find((n) => n.id === noteId);
        if (updatedNote) {
          setIsEncrypted(updatedNote.isEncrypted);
          setContent(updatedNote.content);
        }
      }, 300);
    } catch (error) {
      console.error("Decryption process failed:", error);
      alert(`Decryption failed: ${error.message}`);
    }
  };

  useEffect(() => {
    if (password) {
      const strength = calculatePasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [password]);

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

  const handleExportNote = () => {
    try {
      const filename = `${
        title.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "note"
      }.txt`;

      const textContent = isEncrypted
        ? "[This note is encrypted and cannot be exported in readable format]"
        : content.replace(/<[^>]*>/g, "");

      const metadata = `Title: ${title}\nDate: ${new Date().toLocaleString()}\n\n`;
      const fullContent = metadata + textContent;

      const blob = new Blob([fullContent], {
        type: "text/plain;charset=utf-8",
      });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting note:", error);
      alert("There was an error exporting your note. Please try again.");
    }
  };

  const handleTermMouseEnter = (event) => {
    if (!isGlossaryEnabled) return;

    const target = event.currentTarget;
    const termType = target.getAttribute("data-term-type");
    const termDefinition = target.getAttribute("data-term-definition");
    const termText = target.textContent;

    const rect = target.getBoundingClientRect();

    if (isHoveringTerm && isHoveringTerm.term === termText) return;

    setIsHoveringTerm({
      term: termText,
      type: termType,
      definition: termDefinition,
      position: {
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX + rect.width / 2,
      },
    });
  };

  const handleTermMouseLeave = () => {
    setIsHoveringTerm(null);
  };

  useEffect(() => {
    if (isEncrypted || !isGlossaryEnabled) {
      setIsHoveringTerm(null);
      return;
    }

    const attachTimeout = setTimeout(() => {
      const termElements = document.querySelectorAll(".term-highlight");

      termElements.forEach((element) => {
        element.addEventListener("mouseenter", handleTermMouseEnter);
        element.addEventListener("mouseleave", handleTermMouseLeave);
      });
    }, 200);

    return () => {
      clearTimeout(attachTimeout);

      const termElements = document.querySelectorAll(".term-highlight");
      termElements.forEach((element) => {
        element.removeEventListener("mouseenter", handleTermMouseEnter);
        element.removeEventListener("mouseleave", handleTermMouseLeave);
      });
    };
  }, [
    content,
    isEncrypted,
    isGlossaryEnabled,
    handleTermMouseEnter,
    handleTermMouseLeave,
  ]);

  const TermTooltip = () => {
    if (!isHoveringTerm) return null;

    return (
      <div
        className="term-tooltip"
        style={{
          position: "absolute",
          top: `${isHoveringTerm.position.top}px`,
          left: `${isHoveringTerm.position.left}px`,
          transform: "translateX(-50%)",
          zIndex: 1000,
        }}
      >
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
          <div className="font-medium text-blue-600 dark:text-blue-400 mb-1 flex items-center">
            {isHoveringTerm.term}
            <span className="ml-2 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">
              {isHoveringTerm.type}
            </span>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {isHoveringTerm.definition}
          </div>
        </div>
        <div
          className="tooltip-arrow"
          style={{
            position: "absolute",
            top: "-8px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "16px",
            height: "8px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "4px",
              left: "0",
              width: "16px",
              height: "16px",
              transform: "rotate(45deg)",
              backgroundColor: "white",
              borderLeft: "1px solid #e5e7eb",
              borderTop: "1px solid #e5e7eb",
            }}
            className="dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!isGlossaryEnabled && content && !isEncrypted) {
      if (!content.includes('class="term-highlight"')) return;

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;

      const highlightSpans = tempDiv.querySelectorAll(".term-highlight");
      highlightSpans.forEach((span) => {
        const textNode = document.createTextNode(span.textContent);
        span.parentNode.replaceChild(textNode, span);
      });

      const cleanContent = tempDiv.innerHTML;

      if (cleanContent !== content) {
        setContent(cleanContent);

        setTimeout(() => {
          dispatch(
            updateNote(noteId, {
              content: cleanContent,
            })
          );
        }, 50);
      }
    }
  }, [isGlossaryEnabled, content, isEncrypted, noteId, dispatch]);

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
              const newPinnedState = !isPinned;

              setIsPinned(newPinnedState);

              dispatch(
                updateNote(noteId, {
                  isPinned: newPinnedState,
                })
              );

              setTimeout(() => {
                setIsPinned((prev) => {
                  return prev;
                });
              }, 100);
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
          {/* Glossary toggle button - only show when not encrypted */}
          {!isEncrypted && (
            <button
              type="button"
              onClick={() => setIsGlossaryEnabled(!isGlossaryEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors duration-200 ${
                isGlossaryEnabled
                  ? "bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                  : "bg-gray-300 text-gray-600 hover:bg-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
              title={
                isGlossaryEnabled ? "Turn off glossary" : "Turn on glossary"
              }
            >
              <MdOutlineMenuBook className="text-lg" />
              <span>Glossary {isGlossaryEnabled ? "On" : "Off"}</span>
            </button>
          )}

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
          <>
            {" "}
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
            {isHoveringTerm && <TermTooltip />}
          </>
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
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96 encryption-modal-content relative z-[1001]">
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
      <TermTooltip />
    </div>
  );
};

export default NoteEditor;
