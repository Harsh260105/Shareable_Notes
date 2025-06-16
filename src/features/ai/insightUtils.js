import { extractKeyTerms, checkGrammar, generateSummary, generateWordCloud, findRelatedNotes, analyzeSentiment } from './nlpUtils';

// Process text to highlight key terms
export const processTextWithTermHighlighting = async (html) => {
    if (!html) return html;

    // Extract plain text from HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText;

    try {
        // Extract key terms (now async)
        const keyTerms = await extractKeyTerms(text);

        // Replace terms with highlighted versions
        let processedHtml = html;
        keyTerms.forEach((term) => {
            const regex = new RegExp(`\\b${term.term}\\b`, 'gi');
            processedHtml = processedHtml.replace(
                regex,
                `<span class="term-highlight" data-term-type="${term.type}" data-term-definition="${term.definition}">${term.term}</span>`
            );
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
