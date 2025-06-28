import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  generateNoteInsights,
  findRelatedNotesForContent,
} from "../ai/insightUtils";
import { getAiContentDisclaimer } from "../ai/nlpUtils";
import {
  MdOutlineZoomOutMap,
  MdOutlineZoomInMap,
  MdSummarize,
  MdOutlineLocalOffer,
  MdOutlineSpellcheck,
  MdOutlineMood,
  MdOutlineLink,
  MdKeyboardArrowRight,
  MdKeyboardArrowDown,
} from "react-icons/md";
import "./insightsPanel.css";

const InsightsPanel = ({ noteContent, isEncrypted }) => {
  const [insights, setInsights] = useState({
    summary: "",
    wordCloud: [],
    keyTerms: [],
    grammarErrors: [],
    relatedNotes: [],
    sentimentData: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [apiError, setApiError] = useState(null);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const allNotes = useSelector((state) => state.notes.notes);

  // Function to generate insights on demand
  const generateInsights = async () => {
    if (!noteContent || isEncrypted || isLoading) return;

    setIsLoading(true);
    setApiError(null);

    try {
      // Call the async insights generation function
      const generatedInsights = await generateNoteInsights(noteContent);

      let relatedNotes = [];
      
      //temporarily disabled related notes generation
      // Uncomment the following lines to enable related notes generation
      // try {
      //   relatedNotes = await findRelatedNotesForContent(noteContent, allNotes);
      // } catch (relatedError) {
      //   console.error("Error finding related notes:", relatedError);
      // }

      setInsights({
        ...generatedInsights,
        relatedNotes,
      });
    } catch (error) {
      console.error("Error generating insights:", error);
      setApiError("Failed to generate insights. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!noteContent || isEncrypted) {
      setInsights({
        summary: "",
        wordCloud: [],
        keyTerms: [],
        grammarErrors: [],
        relatedNotes: [],
        sentimentData: null,
      });
      setApiError(null);
    } else if (autoAnalyze) {
      
      const debounceTimeout = setTimeout(() => {
        generateInsights();
      }, 2000);

      return () => clearTimeout(debounceTimeout);
    }
  }, [noteContent, isEncrypted, autoAnalyze, allNotes]);

  useEffect(() => {
    const container = document.querySelector(".insights-container");
    if (!container) return;

    if (isFullscreen) {
      container.classList.remove("collapsed");
      container.style.overflow = "";
      return;
    }

    if (isPanelCollapsed) {
      
      container.style.overflow = "hidden";

      setTimeout(() => {
        container.classList.add("collapsed");
      }, 10);

    } else {

      container.classList.remove("collapsed");

      setTimeout(() => {
        if (!isPanelCollapsed) {
          container.style.overflow = "";
        }
      }, 300); 
    }
  }, [isPanelCollapsed, isFullscreen]); 
  
  // Effect to handle fullscreen mode with animations
  useEffect(() => {
    const container = document.querySelector(".insights-container");
    if (!container) return;
    if (isFullscreen) {
      
      if (isPanelCollapsed) {
        setIsPanelCollapsed(false);
      }

      document.body.style.overflow = "hidden"; 
      
      requestAnimationFrame(() => {

        container.classList.add("fullscreen");

        // Then trigger animations after a tiny delay for better rendering
        setTimeout(() => {
          container.style.animation =
            "fadeIn 0.35s cubic-bezier(0.21, 1, 0.25, 1) forwards";

          // Find the panel element and add animation
          const panel = container.querySelector(".fullscreen-panel");
          if (panel) {
            panel.style.animation =
              "scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards";
          }
        }, 5);
      });
    } else {
      
      if (container.classList.contains("fullscreen")) {
      
        container.style.animation =
          "fadeOut 0.3s cubic-bezier(0.36, 0, 0.66, -0.56) forwards";

        const panel = container.querySelector(".fullscreen-panel");
        if (panel) {
          panel.style.animation =
            "scaleOut 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards";
        }

        setTimeout(() => {
          container.classList.remove("fullscreen");
          document.body.style.overflow = ""; // Restore scrolling
          container.style.animation = "";

          if (panel) panel.style.animation = "";
        }, 320);
      } else {
        container.classList.remove("fullscreen");
        document.body.style.overflow = ""; // Restore scrolling
      }
    }

    return () => {
      document.body.style.overflow = "";
      if (container) container.classList.remove("fullscreen");
    };
  }, [isFullscreen]);

  if (isEncrypted) {
    return (
      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
        <h3 className="text-md font-semibold mb-1">Insights</h3>
        <p className="text-gray-500 text-xs">
          Insights are not available for encrypted notes.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border-2 border-gray-200 dark:border-none dark:bg-gray-800 rounded-lg h-full text-sm overflow-hidden ${
        isFullscreen ? "fullscreen-panel transition-all duration-200" : ""
      }`}
    >
      <div className="border-b border-gray-400 dark:border-gray-700 px-3 py-2 flex justify-between items-center">
        <div className="flex items-center">
          {" "}
          <button
            onClick={() =>
              !isFullscreen && setIsPanelCollapsed(!isPanelCollapsed)
            }
            onMouseDown={(e) => e.preventDefault()}
            tabIndex="-1"
            className={`mr-2 font-medium ${
              isFullscreen
                ? "text-gray-500 dark:text-gray-500 cursor-default"
                : "text-gray-700 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
            }`}
            disabled={isFullscreen}
            title={
              isFullscreen
                ? "Collapse not available in fullscreen mode"
                : "Toggle insights panel"
            }
          >
            {isPanelCollapsed && !isFullscreen ? (
              <span className="flex items-center">
                <MdKeyboardArrowRight className="mr-1 text-lg" /> Insights
              </span>
            ) : (
              <span className="flex items-center">
                <MdKeyboardArrowDown className="mr-1 text-lg" /> Insights
              </span>
            )}
          </button>
          {isLoading && (
            <span className="ml-2 text-xs text-blue-500">Analyzing...</span>
          )}
        </div>

        {!isPanelCollapsed && (
          <div className="flex items-center space-x-2">
            {" "}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              onMouseDown={(e) => e.preventDefault()}
              tabIndex="-1"
              className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-150"
              title={isFullscreen ? "Exit fullscreen" : "Expand to fullscreen"}
            >
              {isFullscreen ? (
                <MdOutlineZoomInMap
                  size={18}
                  className="transition-transform duration-300"
                />
              ) : (
                <MdOutlineZoomOutMap
                  size={18}
                  className="transition-transform duration-300"
                />
              )}
            </button>
            <label className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={autoAnalyze}
                onChange={() => setAutoAnalyze(!autoAnalyze)}
                className="mr-1 h-3 w-3"
              />
              Auto
            </label>
            <button
              onClick={generateInsights}
              onMouseDown={(e) => e.preventDefault()}
              tabIndex="-1"
              disabled={isLoading || !noteContent || isEncrypted}
              className={`px-2 py-0.5 text-xs rounded ${
                isLoading || !noteContent || isEncrypted
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {isLoading ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        )}
      </div>

      {!isPanelCollapsed && (
        <>
          {/* <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs px-3 py-1 rounded m-2">
            {getAiContentDisclaimer().general}
          </div> */}
          {apiError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded m-2 text-xs">
              {apiError}
            </div>
          )}
          {/* Tabs */}
          <div className="flex border-b border-gray-400 dark:border-gray-700 overflow-x-auto px-2">
            <button
              type="button"
              onClick={() => setActiveTab("summary")}
              onMouseDown={(e) =>
                e.preventDefault()
              } 
              tabIndex="-1" 
              className={`px-3 py-2 text-sm whitespace-nowrap flex items-center gap-1 tab-button ${
                activeTab === "summary"
                  ? "active font-medium text-blue-600 dark:text-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <MdSummarize className="text-lg" />
              <span>Summary</span>
            </button>
            
            {" "}
            
            <button
              type="button"
              onClick={() => setActiveTab("keywords")}
              onMouseDown={(e) => e.preventDefault()}
              tabIndex="-1"
              className={`px-3 py-2 text-sm whitespace-nowrap flex items-center gap-1 tab-button ${
                activeTab === "keywords"
                  ? "active font-medium text-blue-600 dark:text-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <MdOutlineLocalOffer className="text-lg" />
              <span>Keywords</span>
            </button>
            
            {" "}
            
            <button
              type="button"
              onClick={() => setActiveTab("grammar")}
              onMouseDown={(e) => e.preventDefault()}
              tabIndex="-1"
              className={`px-3 py-2 text-sm whitespace-nowrap flex items-center gap-1 tab-button ${
                activeTab === "grammar"
                  ? "active font-medium text-blue-600 dark:text-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <MdOutlineSpellcheck className="text-lg" />
              <span>Grammar</span>
            </button>
            
            {" "}
            
            <button
              type="button"
              onClick={() => setActiveTab("sentiment")}
              onMouseDown={(e) => e.preventDefault()}
              tabIndex="-1"
              className={`px-3 py-2 text-sm whitespace-nowrap flex items-center gap-1 tab-button ${
                activeTab === "sentiment"
                  ? "active font-medium text-blue-600 dark:text-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <MdOutlineMood className="text-lg" />
              <span>Sentiment</span>
            </button>
            
            {" "}
            
            <button
              type="button"
              onClick={() => setActiveTab("related")}
              onMouseDown={(e) => e.preventDefault()}
              tabIndex="-1"
              className={`px-3 py-2 text-sm whitespace-nowrap flex items-center gap-1 tab-button ${
                activeTab === "related"
                  ? "active font-medium text-blue-600 dark:text-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <MdOutlineLink className="text-lg" />
              <span>Related</span>
            </button>
          </div>
          
          {" "}
          
          {/* Tab content */}
          <div className="min-h-[180px] h-full overflow-y-auto px-3 py-2 flex-1 tab-content-container">
            {" "}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="relative">
                  <div className="h-10 w-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="mt-4 text-sm text-blue-500 font-medium">
                    Analyzing content...
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  This may take a moment
                </div>
              </div>
            ) : (
              <>
                {" "}
                {activeTab === "summary" && (
                  <div>
                    {insights.summary ? (
                      <div className="insights-section">
                        <h4 className="insights-section-title text-sm mb-2">
                          <MdSummarize className="text-blue-500" /> Note Summary
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {insights.summary}
                        </p>
                        <p className="text-xs text-gray-500 mt-3 italic">
                          This summary is AI-generated and may not capture all
                          important details.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-gray-500 mb-2">
                          Click "Analyze" to generate a summary.
                        </p>
                        {!noteContent && (
                          <p className="text-xs text-gray-400">
                            Add some content to your note first.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}{" "}
                {activeTab === "keywords" && (
                  <div>
                    {insights.wordCloud && insights.wordCloud.length > 0 ? (
                      <div className="flex flex-wrap gap-1 justify-center p-2">
                        {insights.wordCloud.map((word, index) => (
                          <div
                            key={index}
                            className="px-2.5 py-1 rounded-full text-xs word-cloud-item transition-all"
                            style={{
                              fontSize: `${Math.max(
                                0.6,
                                Math.min(0.9, 0.6 + word.value / 40)
                              )}rem`,
                              backgroundColor: word.color || "#e2e8f0",
                              color: getContrastColor(word.color || "#e2e8f0"),
                              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                            }}
                            title={`Frequency: ${word.value}`}
                          >
                            {word.text}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-gray-500 mb-2">
                          Click "Analyze" to generate keywords.
                        </p>
                        {!noteContent && (
                          <p className="text-xs text-gray-400">
                            Add some content to your note first.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}{" "}
                {activeTab === "grammar" && (
                  <div>
                    {insights.grammarErrors &&
                    insights.grammarErrors.length > 0 ? (
                      <div className="insights-section">
                        <h4 className="insights-section-title text-sm mb-2">
                          <MdOutlineSpellcheck className="text-blue-500" />
                          Found {insights.grammarErrors.length} potential
                          issues:
                        </h4>
                        <ul className="list-disc pl-4 text-sm space-y-2">
                          {insights.grammarErrors.map((error, index) => (
                            <li key={index} className="mb-2">
                              <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded-md">
                                <span className="text-red-500 font-medium">
                                  {error.text}
                                </span>
                                <div className="mt-1 text-sm">
                                  <span className="font-medium">
                                    Suggestion:{" "}
                                  </span>
                                  {error.suggestions &&
                                  error.suggestions.length > 0
                                    ? error.suggestions[0]
                                    : "Consider revising"}
                                </div>
                                <span className="text-xs text-gray-500 mt-1 inline-block">
                                  ({error.severity || "suggestion"})
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-gray-500 mt-3 italic">
                          AI-generated grammar suggestions may not always be
                          correct. Use your judgment.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-gray-500 mb-2">
                          Click "Analyze" to check for grammar issues.
                        </p>
                        {!noteContent && (
                          <p className="text-xs text-gray-400">
                            Add some content to your note first.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}{" "}
                {activeTab === "sentiment" && (
                  <div>
                    {insights.sentimentData ? (
                      <div className="insights-section">
                        <h4 className="insights-section-title text-sm mb-3">
                          <MdOutlineMood className="text-blue-500" /> Sentiment
                          Analysis
                        </h4>
                        <div className="mb-2">
                          <div className="flex items-center mb-1">
                            <div
                              className={`h-2 w-2 rounded-full mr-2 ${
                                insights.sentimentData.sentiment === "positive"
                                  ? "bg-green-500"
                                  : insights.sentimentData.sentiment ===
                                    "negative"
                                  ? "bg-red-500"
                                  : insights.sentimentData.sentiment === "mixed"
                                  ? "bg-purple-500"
                                  : "bg-gray-500"
                              }`}
                            ></div>
                            <span className="font-medium capitalize text-xs">
                              {insights.sentimentData.sentiment} Sentiment
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              (Score:{" "}
                              {Math.round(insights.sentimentData.score * 100) /
                                100}
                              )
                            </span>
                          </div>
                          <p className="text-xs">
                            {insights.sentimentData.analysis}
                          </p>
                        </div>

                        {insights.sentimentData.emotions &&
                          insights.sentimentData.emotions.length > 0 && (
                            <div>
                              <p className="text-xs font-medium mb-1">
                                Detected emotions:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {insights.sentimentData.emotions.map(
                                  (emotion, index) => (
                                    <span
                                      key={index}
                                      className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs"
                                    >
                                      {emotion}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        <p className="text-xs text-gray-500 mt-2 italic">
                          Sentiment analysis is AI-generated and may not capture
                          all emotional nuances.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-gray-500 mb-2">
                          Click "Analyze" to generate sentiment analysis.
                        </p>
                        {!noteContent && (
                          <p className="text-xs text-gray-400">
                            Add some content to your note first.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {" "}
                
                {activeTab === "related" && (
                  <div>
                    {insights.relatedNotes &&
                    insights.relatedNotes.length > 0 ? (
                      <div className="insights-section">
                        <h4 className="insights-section-title text-sm mb-3">
                          <MdOutlineLink className="text-blue-500" />
                          Notes with similar content
                        </h4>
                        <ul className="space-y-2">
                          {insights.relatedNotes.map((note) => (
                            <li
                              key={note.id}
                              className="bg-gray-50 dark:bg-gray-700/30 p-2 rounded-md"
                            >
                              <span className="font-medium text-sm block">
                                {note.title}
                              </span>
                              <div className="flex items-center mt-1">
                                <div className="bg-blue-100 dark:bg-blue-900/30 h-2 rounded-full flex-grow mr-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{
                                      width: `${Math.round(
                                        note.similarity * 100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {Math.round(note.similarity * 100)}% match
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-gray-500 mt-3 italic">
                          Related notes are detected by AI and based on content
                          similarity.
                        </p>
                      </div>
                    ) : (

                      <div className="text-center py-4">
                        <p className="text-xs text-gray-500 mb-2">
                          Sorry, This Feature is temporarily disabled. 
                        </p>
                        <p className="text-xs text-gray-400">
                          It will be back soon :)
                        </p>
                      </div>

                      // temporarily disabled related notes generation
                      // Uncomment the following lines to enable related notes generation
                      // <div className="text-center py-4">
                      //   <p className="text-xs text-gray-500 mb-2">
                      //     Click "Analyze" to find related notes.
                      //   </p>
                      //   {!noteContent && (
                      //     <p className="text-xs text-gray-400">
                      //       Add some content to your note first.
                      //     </p>
                      //   )}
                      // </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Helper function to get contrasting text color for a background
const getContrastColor = (hexColor) => {
  // Convert hex to RGB
  let r = 0,
    g = 0,
    b = 0;

  // Default to dark text for invalid colors
  if (!hexColor || hexColor.length < 7) return "#333333";

  // Remove the # if present
  hexColor = hexColor.replace("#", "");

  // Parse the hex color
  r = parseInt(hexColor.substr(0, 2), 16);
  g = parseInt(hexColor.substr(2, 2), 16);
  b = parseInt(hexColor.substr(4, 2), 16);

  // Calculate brightness using the HSP color model
  const brightness = Math.sqrt(
    0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b)
  );
  // Return white or black based on brightness
  return brightness > 140 ? "#333333" : "#ffffff";
};

export default InsightsPanel;
