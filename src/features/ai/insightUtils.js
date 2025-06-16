import { extractKeyTerms, checkGrammar, generateSummary, generateWordCloud, findRelatedNotes, analyzeSentiment } from './nlpUtils';

// Process text to highlight key terms
export const processTextWithTermHighlighting = async (html) => {
    if (!html) return html;

    // Don't process if already contains highlights
    if (html.includes('class="term-highlight"')) {
        console.log('Content already contains highlights, skipping');
        return html;
    }

    // Extract plain text from HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText;

    // If text is too short, skip processing
    if (text.length < 20) {
        console.log('Text too short for term highlighting');
        return html;
    }

    try {        // Extract key terms (now async)
        const keyTerms = await extractKeyTerms(text);

        // If no terms found, return original
        if (!keyTerms || keyTerms.length === 0) {
            console.log('No key terms found for highlighting');
            return html;
        }

        // Filter out common words that shouldn't be highlighted
        const commonWords = ['the', 'and', 'for', 'with', 'this', 'that', 'they', 'have', 'not', 'from', 'was', 'were', 'are', 'will', 'been'];
        const filteredTerms = keyTerms.filter(term => {
            // Don't highlight common words or short terms
            if (term.term.length <= 3) return false;
            if (commonWords.includes(term.term.toLowerCase())) return false;

            // Don't highlight terms that might break the HTML
            if (term.definition.includes('"') || term.definition.includes("'")) {
                // Fix the definition by replacing quotes
                term.definition = term.definition.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
            }

            return true;
        });

        // Clone HTML to process safely
        let processedHtml = html;
        // Create a safe version of the regex for each term
        filteredTerms.forEach((term) => {
            // Escape special regex characters
            const safeTermPattern = term.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${safeTermPattern}\\b`, 'gi');

            // Only highlight if it's a substantial term (to avoid highlighting common words)
            if (term.term.length > 3) {
                // Use a replacement function to preserve the original case
                processedHtml = processedHtml.replace(regex, (match) => {
                    // Escape any quotes in the definition and type to prevent HTML attribute issues
                    const safeDefinition = term.definition.replace(/"/g, '&quot;');
                    const safeType = term.type.replace(/"/g, '&quot;');

                    return `<span class="term-highlight" data-term-type="${safeType}" data-term-definition="${safeDefinition}">${match}</span>`;
                });
            }
        });

        return processedHtml;
    } catch (error) {
        console.error('Error highlighting terms:', error);
        return html;
    }
};

// Process text to highlight grammar errors
export const processTextWithGrammarCheck = async (html) => {
    if (!html) return html;

    // Extract plain text from HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText;

    try {
        // Check grammar (now async)
        const grammarErrors = await checkGrammar(text);

        // Replace errors with highlighted versions
        let processedHtml = html;
        grammarErrors.forEach((error) => {
            const regex = new RegExp(`\\b${error.text}\\b`, 'g');
            processedHtml = processedHtml.replace(
                regex,
                `<span class="grammar-error" data-error-type="${error.type}" data-suggestions="${error.suggestions.join('|')}">${error.text}</span>`
            );
        });

        return processedHtml;
    } catch (error) {
        console.error('Error checking grammar:', error);
        return html;
    }
};

// Generate insights for a note
export const generateNoteInsights = async (content) => {
    if (!content) {
        return {
            summary: '',
            wordCloud: [],
            keyTerms: [],
            grammarErrors: [],
            sentimentData: { sentiment: 'neutral', score: 0.5, analysis: 'Not enough text to analyze.' },
            relatedNotes: [],
        };
    }

    // Extract plain text from HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const text = tempDiv.textContent || tempDiv.innerText;

    try {
        // Run all insight generation in parallel
        const [summary, wordCloud, keyTerms, grammarErrors, sentimentData] = await Promise.all([
            generateSummary(text),
            generateWordCloud(text),
            extractKeyTerms(text),
            checkGrammar(text),
            analyzeSentiment(text)
        ]);

        return {
            summary,
            wordCloud,
            keyTerms,
            grammarErrors,
            sentimentData,
            relatedNotes: [], // Related notes will be handled separately
        };
    } catch (error) {
        console.error('Error generating insights:', error);
        return {
            summary: 'Error generating summary.',
            wordCloud: [],
            keyTerms: [],
            grammarErrors: [],
            sentimentData: { sentiment: 'neutral', score: 0.5, analysis: 'Error analyzing sentiment.' },
            relatedNotes: [],
        };
    }
};

// Find related notes based on content similarity
export const findRelatedNotesForContent = async (currentNoteContent, allNotes) => {
    if (!currentNoteContent || !allNotes || allNotes.length === 0) {
        return [];
    }

    // Extract plain text from HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = currentNoteContent;
    const text = tempDiv.textContent || tempDiv.innerText;

    try {
        return await findRelatedNotes(text, allNotes);
    } catch (error) {
        console.error('Error finding related notes:', error);
        return [];
    }
};
