import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useRichTextEditor } from "./useRichTextEditor";
import { useTheme } from "../../shared/hooks/useTheme";
import "./style.css";

const RichTextEditor = ({
  initialContent,
  content,
  onChange = () => {},
  onBlur = () => {},
  placeholder = "Start typing here...",
  className = "",
  style = {},
  showHtmlView = true,
  showAdvancedOptions = false,
  disabled = false,
}) => {
  
  const effectiveContent = content !== undefined ? content : initialContent;

  const fontSizes = useMemo(
    () => [
      { value: "12", label: "12px" },
      { value: "14", label: "14px" },
      { value: "16", label: "16px" },
      { value: "18", label: "18px" },
      { value: "20", label: "20px" },
      { value: "24", label: "24px" },
      { value: "28", label: "28px" },
      { value: "32", label: "32px" },
      { value: "36", label: "36px" },
      { value: "48", label: "48px" },
    ],
    []
  );

  const {
    editorRef,
    content: editorContent,
    activeFormats,
    formatText,
    handleKeyDown,
    handleInput,
    handleClick,
    handleCompositionStart,
    handleCompositionEnd,
    handlePaste,
    clearContent,
    saveSelection,
    restoreSelection,
    enforceWordWrap,
  } = useRichTextEditor(effectiveContent, onChange);
  
  useEffect(() => {
    if (editorRef.current) {
      enforceWordWrap();
    }
  }, [enforceWordWrap, effectiveContent]);

  const ensureEditorFocus = useCallback(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.focus();
    }
  }, [editorRef]);

  const handleFormatClick = useCallback(
    (command, value = null) => {
      if (disabled) return;

      if (editorRef.current) {
        ensureEditorFocus();

        formatText(command, value);
      }
    },
    [disabled, formatText, ensureEditorFocus]
  ); 
  
  // Handle font size change
  const handleFontSizeChange = useCallback((e) => {
      
    const fontSize = e.target.value;

      if (fontSize && !disabled) {
        if (editorRef.current) {
          editorRef.current.focus();
        }

        // Apply the font size directly
        formatText("fontSize", fontSize);
      }
    },
    [disabled, formatText, editorRef]
  );
  
  // Handle alignment change
  // const handleAlignmentChange = useCallback(
  //   (alignment) => {
  //     if (!disabled && !isHtmlView) {
  //       saveSelection();

  //       handleFormatClick("align", alignment);

  //       setTimeout(() => {
  //         ensureEditorFocus();
  //         restoreSelection();
  //       }, 10);
  //     }
  //   },
  //   [
  //     disabled,
  //     isHtmlView,
  //     handleFormatClick,
  //     saveSelection,
  //     ensureEditorFocus,
  //     restoreSelection,
  //   ]
  // );

  // const toggleView = useCallback(() => {
  //   if (disabled) return;
  //   if (isHtmlView) {
  //     const htmlContent = htmlTextareaRef.current?.value || editorContent;
  //     if (editorRef.current) {
  //       editorRef.current.innerHTML = htmlContent;
  //       onChange(htmlContent);
  //       enforceWordWrap();
  //     }
  //     setIsHtmlView(false);
  //     setTimeout(() => {
  //       if (editorRef.current) {
  //         editorRef.current.focus();
  //       }
  //     }, 0);
  //   } else {
  //     setIsHtmlView(true);
  //     setTimeout(() => {
  //       if (htmlTextareaRef.current) {
  //         htmlTextareaRef.current.focus();
  //       }
  //     }, 0);
  //   }
  // }, [disabled, isHtmlView, editorContent, onChange, enforceWordWrap]);

  // Handle HTML textarea change
  // const handleHtmlChange = useCallback(
  //   (e) => {
  //     const newContent = e.target.value;
  //     onChange(newContent);
  //   },
  //   [onChange]
  // );

  const handleClearContent = useCallback(() => {
    clearContent();
  }, [clearContent]);

  const FormatButton = ({
    command,
    value,
    icon,
    title,
    isActive = false,
    children,
  }) => (
    <button
      type="button"
      className={`rte-btn ${isActive ? "active" : ""} ${
        disabled ? "disabled" : ""
      }`}
      onClick={() => handleFormatClick(command, value)}
      onMouseDown={(e) => {
        e.preventDefault();
      }}
      title={title}
      disabled={disabled}
      aria-pressed={isActive}
    >
      {icon || children}
    </button>
  );

  return (
    <div
      className={`rte-container ${className} ${disabled ? "disabled" : ""}`}
      style={style}
    >
      {/* Toolbar */}
      <div className="rte-toolbar">
        {/* Basic formatting group */}
        <div className="rte-toolbar-group">
          <FormatButton
            command="bold"
            icon="B"
            title="Bold (Ctrl+B)"
            isActive={activeFormats.bold}
          />
          <FormatButton
            command="italic"
            icon="I"
            title="Italic (Ctrl+I)"
            isActive={activeFormats.italic}
          />
          <FormatButton
            command="underline"
            icon="U"
            title="Underline (Ctrl+U)"
            isActive={activeFormats.underline}
          />
        </div>
        {/* Font size group */}{" "}
        <div className="rte-toolbar-group z-0">
          <select
            className="rte-select"
            value={activeFormats.fontSize || ""}
            onChange={handleFontSizeChange}
            disabled={disabled}
          >
            <option value="" disabled>
              Size
            </option>
            {fontSizes.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {/* Alignment group */}
        <div className="rte-toolbar-group">
          <FormatButton
            command="align"
            value="left"
            title="Align Left"
            isActive={activeFormats.align === "left"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,3H21V5H3V3M3,7H15V9H3V7M3,11H21V13H3V11M3,15H15V17H3V15M3,19H21V21H3V19Z" />
            </svg>
          </FormatButton>

          <FormatButton
            command="align"
            value="center"
            title="Align Center"
            isActive={activeFormats.align === "center"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,3H21V5H3V3M7,7H17V9H7V7M3,11H21V13H3V11M7,15H17V17H7V15M3,19H21V21H3V19Z" />
            </svg>
          </FormatButton>

          <FormatButton
            command="align"
            value="right"
            title="Align Right"
            isActive={activeFormats.align === "right"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,3H21V5H3V3M9,7H21V9H9V7M3,11H21V13H3V11M9,15H21V17H9V15M3,19H21V21H3V19Z" />
            </svg>
          </FormatButton>

          <FormatButton
            command="align"
            value="justify"
            title="Justify"
            isActive={activeFormats.align === "justify"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,3H21V5H3V3M3,7H21V9H3V7M3,11H21V13H3V11M3,15H21V17H3V15M3,19H21V21H3V19Z" />
            </svg>
          </FormatButton>
        </div>
        {/* Utility group */}
        <div className="rte-toolbar-group">
          {" "}
          <button
            type="button"
            className={`rte-btn ${disabled ? "disabled" : ""}`}
            onClick={() => handleClearContent()}
            onMouseDown={(e) => e.preventDefault()}
            title="Clear All Content"
            disabled={disabled}
          >
            🗑️
          </button>
        </div>
      </div>
      
      {" "}
      
      {/* Editor container */}
      <div className="rte-editor-container" style={{ overflow: "hidden" }}>
        <div
          ref={editorRef}
          className="rte-editor"
          contentEditable={!disabled}
          suppressContentEditableWarning={true}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onPaste={handlePaste}
          onBlur={() => onBlur(editorContent)}
          data-placeholder={placeholder}
          style={{
            minHeight: "200px",
            ...(disabled && { opacity: 0.6, cursor: "not-allowed" }),
          }}
          role="textbox"
          aria-multiline="true"
          aria-label="Rich text editor"
        />
      </div>

      {/* Status bar */}
      <div className="rte-status-bar">
        <span className="rte-status-info">
          Characters:{" "}
          {editorContent.replace(/<[^>]*>/g, "").length} | Words:{" "}
          {
            editorContent
              .replace(/<[^>]*>/g, "")
              .split(/\s+/)
              .filter((word) => word.length > 0).length
          }
        </span>
      </div>
    </div>
  );
};

export default RichTextEditor;
