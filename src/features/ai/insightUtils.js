import { extractKeyTerms, checkGrammar, generateSummary, generateWordCloud, findRelatedNotes, analyzeSentiment } from './nlpUtils';

export const processTextWithTermHighlighting = async (html) => {
    if (!html) return html;

    if (html.includes('class="term-highlight"')) {
        return html;
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText;

    if (text.length < 20) {
        return html;
    }

    try {
        const keyTerms = await extractKeyTerms(text);

        if (!keyTerms || keyTerms.length === 0) {
            return html;
        }

        const commonWords = ['the', 'and', 'for', 'with', 'this', 'that', 'they', 'have', 'not', 'from', 'was', 'were', 'are', 'will', 'been'];
        const filteredTerms = keyTerms.filter(term => {

            if (term.term.length <= 3) return false;
            if (commonWords.includes(term.term.toLowerCase())) return false;


            if (term.definition.includes('"') || term.definition.includes("'")) {

                term.definition = term.definition.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
            }

            return true;
        });

        let processedHtml = html;

        filteredTerms.forEach((term) => {

            const safeTermPattern = term.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${safeTermPattern}\\b`, 'gi');

            if (term.term.length > 3) {

                processedHtml = processedHtml.replace(regex, (match) => {

                    const safeDefinition = term.definition.replace(/"/g, '&quot;');
                    const safeType = term.type.replace(/"/g, '&quot;');

                    return `<span class="term-highlight" data-term-type="${safeType}" data-term-definition="${safeDefinition}">${match}</span>`;
                });
            }
        });

        return processedHtml;
    } catch (error) {
        return html;
    }
};

export const processTextWithGrammarCheck = async (html) => {
    if (!html) return html;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText;

    try {
        const grammarErrors = await checkGrammar(text);

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
        return html;
    }
};

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


    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const text = tempDiv.textContent || tempDiv.innerText;

    try {
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
            relatedNotes: [],
        };
    } catch (error) {
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
