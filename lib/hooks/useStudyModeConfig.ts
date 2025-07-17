import { useState, useCallback, useMemo } from "react";
import { StudyMode, StudyModeConfig } from "@/lib/types";
import { DEFAULT_STUDY_MODES } from "@/lib/enhanced-theory-constants";

interface UseStudyModeConfigReturn {
  currentMode: StudyMode | undefined;
  availableModes: StudyModeConfig[];
  selectedModeConfig: StudyModeConfig | undefined;
  setCurrentMode: (mode: StudyMode) => void;
  resetMode: () => void;
  isModeSelected: (mode: StudyMode) => boolean;
  getModeConfig: (mode: StudyMode) => StudyModeConfig | undefined;
}

interface UseStudyModeConfigOptions {
  initialMode?: StudyMode;
  availableModes?: StudyModeConfig[];
  onModeChange?: (mode: StudyMode) => void;
}

/**
 * Custom hook for managing study mode configuration and state
 */
export const useStudyModeConfig = (
  options: UseStudyModeConfigOptions = {}
): UseStudyModeConfigReturn => {
  const {
    initialMode,
    availableModes = DEFAULT_STUDY_MODES,
    onModeChange,
  } = options;

  const [currentMode, setCurrentModeState] = useState<StudyMode | undefined>(
    initialMode
  );

  // Get the configuration for the currently selected mode
  const selectedModeConfig = useMemo(() => {
    if (!currentMode) return undefined;
    return availableModes.find((mode) => mode.id === currentMode);
  }, [currentMode, availableModes]);

  // Set the current mode with optional callback
  const setCurrentMode = useCallback(
    (mode: StudyMode) => {
      setCurrentModeState(mode);
      onModeChange?.(mode);
    },
    [onModeChange]
  );

  // Reset the current mode
  const resetMode = useCallback(() => {
    setCurrentModeState(undefined);
  }, []);

  // Check if a specific mode is currently selected
  const isModeSelected = useCallback(
    (mode: StudyMode) => {
      return currentMode === mode;
    },
    [currentMode]
  );

  // Get configuration for a specific mode
  const getModeConfig = useCallback(
    (mode: StudyMode) => {
      return availableModes.find((config) => config.id === mode);
    },
    [availableModes]
  );

  return {
    currentMode,
    availableModes,
    selectedModeConfig,
    setCurrentMode,
    resetMode,
    isModeSelected,
    getModeConfig,
  };
};
