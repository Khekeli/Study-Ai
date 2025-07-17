import React, { useState } from "react";
import StudyModeSelector from "./StudyModeSelector";
import { StudyMode } from "@/lib/types";
import { useStudyModeConfig } from "@/lib/hooks/useStudyModeConfig";

/**
 * Example component demonstrating StudyModeSelector usage
 * This shows how to integrate the StudyModeSelector with state management
 */
const StudyModeSelectorExample: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<StudyMode | undefined>();

  // Using the custom hook for advanced state management
  const {
    currentMode,
    selectedModeConfig,
    setCurrentMode,
    resetMode,
    isModeSelected,
  } = useStudyModeConfig({
    initialMode: selectedMode,
    onModeChange: (mode) => {
      console.log("Mode changed to:", mode);
      setSelectedMode(mode);
    },
  });

  const handleModeSelect = (mode: StudyMode) => {
    setCurrentMode(mode);
  };

  const handleReset = () => {
    resetMode();
    setSelectedMode(undefined);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Study Mode Selector Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          This demonstrates the StudyModeSelector component with state
          management
        </p>
      </div>

      {/* Study Mode Selector */}
      <StudyModeSelector
        onModeSelect={handleModeSelect}
        currentMode={currentMode}
        className="mb-8"
      />

      {/* Current State Display */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Current State
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Selected Mode:</strong> {currentMode || "None"}
          </div>
          <div>
            <strong>Mode Name:</strong> {selectedModeConfig?.name || "N/A"}
          </div>
          <div className="md:col-span-2">
            <strong>Description:</strong>{" "}
            {selectedModeConfig?.description || "N/A"}
          </div>
          <div className="md:col-span-2">
            <strong>Benefits:</strong>
            <ul className="list-disc list-inside mt-1 ml-4">
              {selectedModeConfig?.benefits.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              )) || <li>No benefits available</li>}
            </ul>
          </div>
        </div>

        {currentMode && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Reset Selection
            </button>
          </div>
        )}
      </div>

      {/* Mode Checking Examples */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">
          Mode Checking Examples
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <strong>Standard:</strong>{" "}
            {isModeSelected("standard") ? "✅" : "❌"}
          </div>
          <div>
            <strong>Spaced Rep:</strong>{" "}
            {isModeSelected("spaced_repetition") ? "✅" : "❌"}
          </div>
          <div>
            <strong>Active Recall:</strong>{" "}
            {isModeSelected("active_recall") ? "✅" : "❌"}
          </div>
          <div>
            <strong>Concept Map:</strong>{" "}
            {isModeSelected("concept_mapping") ? "✅" : "❌"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyModeSelectorExample;
