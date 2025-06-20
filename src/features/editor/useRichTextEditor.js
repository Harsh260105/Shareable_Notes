import { useRef, useEffect, useState, useCallback } from 'react';

export const useRichTextEditor = (initialContent = '', onContentChange) => {
    const editorRef = useRef(null);
    const [content, setContent] = useState(initialContent);
    const contentChangeCallbackRef = useRef(onContentChange);    // Simple persistent formatting state
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        align: 'left',
        fontSize: ''
    });

    // Functions to save and restore selection state
    const savedSelectionRef = useRef(null); 
    
    const saveSelection = useCallback(() => {
        if (!editorRef.current) return;

        if (window.getSelection) {
            const sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                const range = sel.getRangeAt(0);
                // Only save if selection is within our editor
                if (editorRef.current.contains(range.commonAncestorContainer)) {
                    savedSelectionRef.current = range.cloneRange();
                }
            }
        }
    }, []);

    const restoreSelection = useCallback(() => {
        if (savedSelectionRef.current) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedSelectionRef.current);
        }
    }, []);

    // Helper function to enforce word wrap on elements
    const enforceWordWrap = useCallback(() => {
        if (!editorRef.current) return;

        // Add word-wrap styles to the editor itself
        editorRef.current.style.wordWrap = 'break-word';
        editorRef.current.style.wordBreak = 'break-word';
        editorRef.current.style.whiteSpace = 'pre-wrap';
        editorRef.current.style.overflowWrap = 'break-word';

        // Apply to all child elements that might contain text
        const allTextNodes = editorRef.current.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6, pre, code');
        allTextNodes.forEach(node => {
            node.style.wordWrap = 'break-word';
            node.style.wordBreak = 'break-word';
            node.style.whiteSpace = 'pre-wrap';
            node.style.overflowWrap = 'break-word';
            node.style.maxWidth = '100%';
        });
    }, []);
    
    // Check current formatting state at cursor position
    const updateFormatState = useCallback(() => {
        if (!editorRef.current) return;

        // Get the current selection
        const selection = window.getSelection();
        let currentFontSize = '';

        // Try to detect font size
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (range.commonAncestorContainer.nodeType === 3) { 
                // Text node
                // Get the parent element of the text node
                const parentElement = range.commonAncestorContainer.parentElement;
                if (parentElement) {
                    // Get computed font size
                    const computedStyle = window.getComputedStyle(parentElement);
                    const fontSizeWithPx = computedStyle.fontSize;
                    // Extract the numeric value from "16px" format
                    currentFontSize = fontSizeWithPx ? parseInt(fontSizeWithPx, 10).toString() : '';
                }
            }
        }

        setActiveFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            align: document.queryCommandState('justifyCenter') ? 'center' :
                document.queryCommandState('justifyRight') ? 'right' :
                    document.queryCommandState('justifyFull') ? 'justify' :
                        document.queryCommandState('justifyLeft') ? 'left' : 'left',
            fontSize: currentFontSize
        });
    }, []);    
    
    // Helper function to apply inline styles at cursor or selection
    const applyInlineStyle = useCallback((styleName, styleValue) => {
        if (!editorRef.current) return;

        try {
            // Ensure editor has focus
            if (document.activeElement !== editorRef.current) {
                editorRef.current.focus();
            }

            // Get current selection
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);

            // Create a span with the desired style
            const span = document.createElement('span');
            span.style[styleName] = styleValue;

            // If text is selected, wrap it in the styled span
            if (!range.collapsed) {
                // Use a different method that works better with existing content
                const fragment = range.extractContents();
                span.appendChild(fragment);
                range.insertNode(span);
            } else {
                // No selection - create a temporary space character
                span.innerHTML = '&nbsp;';
                range.insertNode(span);

                // Place cursor inside the span
                range.setStart(span.firstChild, 0);
                range.setEnd(span.firstChild, 1);
            }

            // Update selection
            selection.removeAllRanges();
            selection.addRange(range);

            // Update content state
            const newContent = editorRef.current.innerHTML;
            setContent(newContent);
            if (contentChangeCallbackRef.current) {
                contentChangeCallbackRef.current(newContent);
            }
        } catch (error) {
            console.error(`Error applying ${styleName}:`, error);
        }
    }, [editorRef]);    
    
    // Simple format function using document.execCommand (like the guide)
    const formatText = useCallback((command, value = null) => {
        if (!editorRef.current) return;

        // Make sure we don't lose selection
        if (!document.activeElement || document.activeElement !== editorRef.current) {
            editorRef.current.focus();
        }

        // Use document.execCommand exactly like the guide shows
        switch (command) {
            case 'bold':
                document.execCommand('bold', false, null);
                break;
            case 'italic':
                document.execCommand('italic', false, null);
                break;
            case 'underline':
                document.execCommand('underline', false, null);
                break;
            case 'align':
                if (value === 'left') document.execCommand('justifyLeft', false, null);
                if (value === 'center') document.execCommand('justifyCenter', false, null);
                if (value === 'right') document.execCommand('justifyRight', false, null);
                if (value === 'justify') document.execCommand('justifyFull', false, null);
                break; case 'fontSize':
                if (value) {
                    // Use our direct styling method
                    applyInlineStyle('fontSize', `${value}px`);

                    // Update format state
                    setActiveFormats(prev => ({
                        ...prev,
                        fontSize: value
                    }));

                    // Skip the default formatting update
                    return;
                }
                break;
        }

        // Update format state and content after formatting
        setTimeout(() => {
            updateFormatState();
            if (editorRef.current) {
                const newContent = editorRef.current.innerHTML;
                setContent(newContent);
                if (contentChangeCallbackRef.current) {
                    contentChangeCallbackRef.current(newContent);
                }
            }
        }, 0);
    }, [updateFormatState, editorRef, setContent, setActiveFormats, applyInlineStyle]);

    // Simple input handler - track content changes and format state

    const handleInput = useCallback(() => {
        if (editorRef.current) {
            // Apply word wrapping
            enforceWordWrap();

            const newContent = editorRef.current.innerHTML;
            setContent(newContent);
            if (contentChangeCallbackRef.current) {
                contentChangeCallbackRef.current(newContent);
            }
        }
        // Update format state as user types/moves cursor
        updateFormatState();
    }, [updateFormatState, enforceWordWrap]);

    // Handle key events and cursor movement
    const handleKeyDown = useCallback((e) => {
        // Update format state on cursor movement
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
            setTimeout(updateFormatState, 0);
        }
    }, [updateFormatState]);    
    
    // Handle mouse clicks to update format state
    const handleClick = useCallback(() => {
        setTimeout(updateFormatState, 0);
    }, [updateFormatState]);

    // Handle selection changes
    const handleSelectionChange = useCallback(() => {
        // Only update if the selection is within our editor
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
                updateFormatState();
            }
        }
    }, [updateFormatState]);    
    
    // Set up selection change listener
    useEffect(() => {
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, [handleSelectionChange]);    
    
    // Composition handlers for IME support
    const handleCompositionStart = useCallback(() => { }, []);
    
    const handleCompositionEnd = useCallback(() => {
        if (editorRef.current) {
            const newContent = editorRef.current.innerHTML;
            setContent(newContent);
            if (contentChangeCallbackRef.current) {
                contentChangeCallbackRef.current(newContent);
            }
        }
    }, []);    
    
    // Handle paste events
    const handlePaste = useCallback((e) => {
        // Get pasted text
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');

        // Insert the text with execCommand to maintain undo history
        document.execCommand('insertText', false, text);

        // After pasting, ensure content is properly wrapped
        if (editorRef.current) {
            // Enforce word wrap on all content by adding word-break CSS
            const allNodes = editorRef.current.querySelectorAll('*');
            allNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    // Only add style if it's not a container element like div, p, etc.
                    if (node.nodeName !== 'DIV' && node.nodeName !== 'P' && node.nodeName !== 'SPAN') {
                        node.style.wordWrap = 'break-word';
                        node.style.wordBreak = 'break-word';
                        node.style.maxWidth = '100%';
                    }
                }
            });

            // Update content
            const newContent = editorRef.current.innerHTML;
            setContent(newContent); 
            if (contentChangeCallbackRef.current) {
                contentChangeCallbackRef.current(newContent);
            }
        }
    }, []);

    // Handle blur event for content saving
    const handleBlur = useCallback(() => {
        if (editorRef.current) {
            const newContent = editorRef.current.innerHTML;
            setContent(newContent);
            if (contentChangeCallbackRef.current) {
                contentChangeCallbackRef.current(newContent);
            }
        }
    }, []);

    // Update callback ref
    useEffect(() => {
        contentChangeCallbackRef.current = onContentChange;
    }, [onContentChange]);    
    
    // Set initial content and update on content changes
    useEffect(() => {
        if (editorRef.current && initialContent !== undefined) {
            // Only update if the content has actually changed to avoid cursor issues
            if (editorRef.current.innerHTML !== initialContent) {
                editorRef.current.innerHTML = initialContent;
                setContent(initialContent);

                // Apply word wrapping to all content
                enforceWordWrap();

                // Initial format state check
                setTimeout(updateFormatState, 0);
            }
        }
    }, [initialContent, updateFormatState, enforceWordWrap]);

    // Function to clear all content
    const clearContent = useCallback(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = '';
            setContent('');
            if (contentChangeCallbackRef.current) {
                contentChangeCallbackRef.current('');
            }
        }
    }, []);

    // Helper to ensure the editor remains focused
    const ensureEditorFocus = useCallback(() => {
        if (editorRef.current && document.activeElement !== editorRef.current) {
            editorRef.current.focus();
        }
    }, []); 
    
    return {
        editorRef,
        content,
        activeFormats,
        saveSelection,
        restoreSelection,
        clearContent,
        ensureEditorFocus,
        setContent: (newContent) => {
            if (editorRef.current) {
                editorRef.current.innerHTML = newContent;
            }
            setContent(newContent);
            if (contentChangeCallbackRef.current) {
                contentChangeCallbackRef.current(newContent);
            }
        },
        formatText,
        handleKeyDown,
        handleInput,
        handleClick,
        handleCompositionStart,
        handleCompositionEnd,
        handlePaste,
        handleBlur,
        enforceWordWrap,
        applyInlineStyle
    };
};
