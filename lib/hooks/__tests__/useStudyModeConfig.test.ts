import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useStudyModeConfig } from "../useStudyModeConfig";
import { StudyMode, StudyModeConfig } from "@/lib/types";

// Mock the constants
vi.mock("@/lib/enhanced-theory-constants", () => ({
  DEFAULT_STUDY_MODES: [
    {
      id: "standard",
      name: "Standard Mode",
      description: "Traditional question-answer format",
      benefits: ["Quick assessment"],
      icon: "BookOpen",
      color: "blue",
    },
    {
      id: "spaced_repetition",
      name: "Spaced Repetition",
      description: "Optimized review schedule",
      benefits: ["Long-term retention"],
      icon: "Clock",
      color: "green",
    },
  ] as StudyModeConfig[],
}));

describe("useStudyModeConfig", () => {
  it("initializes with no mode selected by default", () => {
    const { result } = renderHook(() => useStudyModeConfig());

    expect(result.current.currentMode).toBeUndefined();
    expect(result.current.selectedModeConfig).toBeUndefined();
  });

  it("initializes with provided initial mode", () => {
    const { result } = renderHook(() =>
      useStudyModeConfig({ initialMode: "standard" })
    );

    expect(result.current.currentMode).toBe("standard");
    expect(result.current.selectedModeConfig?.id).toBe("standard");
  });

  it("sets current mode correctly", () => {
    const { result } = renderHook(() => useStudyModeConfig());

    act(() => {
      result.current.setCurrentMode("spaced_repetition");
    });

    expect(result.current.currentMode).toBe("spaced_repetition");
    expect(result.current.selectedModeConfig?.id).toBe("spaced_repetition");
  });

  it("calls onModeChange callback when mode is set", () => {
    const onModeChange = vi.fn();
    const { result } = renderHook(() => useStudyModeConfig({ onModeChange }));

    act(() => {
      result.current.setCurrentMode("active_recall");
    });

    expect(onModeChange).toHaveBeenCalledWith("active_recall");
  });

  it("resets mode correctly", () => {
    const { result } = renderHook(() =>
      useStudyModeConfig({ initialMode: "standard" })
    );

    expect(result.current.currentMode).toBe("standard");

    act(() => {
      result.current.resetMode();
    });

    expect(result.current.currentMode).toBeUndefined();
    expect(result.current.selectedModeConfig).toBeUndefined();
  });

  it("checks if mode is selected correctly", () => {
    const { result } = renderHook(() =>
      useStudyModeConfig({ initialMode: "standard" })
    );

    expect(result.current.isModeSelected("standard")).toBe(true);
    expect(result.current.isModeSelected("spaced_repetition")).toBe(false);
  });

  it("gets mode configuration correctly", () => {
    const { result } = renderHook(() => useStudyModeConfig());

    const standardConfig = result.current.getModeConfig("standard");
    expect(standardConfig?.id).toBe("standard");
    expect(standardConfig?.name).toBe("Standard Mode");

    const nonExistentConfig = result.current.getModeConfig(
      "non_existent" as StudyMode
    );
    expect(nonExistentConfig).toBeUndefined();
  });

  it("uses custom available modes when provided", () => {
    const customModes: StudyModeConfig[] = [
      {
        id: "custom_mode" as StudyMode,
        name: "Custom Mode",
        description: "Custom description",
        benefits: ["Custom benefit"],
        icon: "Custom",
        color: "red",
      },
    ];

    const { result } = renderHook(() =>
      useStudyModeConfig({ availableModes: customModes })
    );

    expect(result.current.availableModes).toEqual(customModes);
    expect(result.current.availableModes).toHaveLength(1);
  });

  it("updates selectedModeConfig when currentMode changes", () => {
    const { result } = renderHook(() => useStudyModeConfig());

    // Initially no mode selected
    expect(result.current.selectedModeConfig).toBeUndefined();

    // Set mode to standard
    act(() => {
      result.current.setCurrentMode("standard");
    });

    expect(result.current.selectedModeConfig?.id).toBe("standard");
    expect(result.current.selectedModeConfig?.name).toBe("Standard Mode");

    // Change mode to spaced_repetition
    act(() => {
      result.current.setCurrentMode("spaced_repetition");
    });

    expect(result.current.selectedModeConfig?.id).toBe("spaced_repetition");
    expect(result.current.selectedModeConfig?.name).toBe("Spaced Repetition");
  });

  it("maintains stable references for callback functions", () => {
    const { result, rerender } = renderHook(() => useStudyModeConfig());

    const initialSetCurrentMode = result.current.setCurrentMode;
    const initialResetMode = result.current.resetMode;
    const initialIsModeSelected = result.current.isModeSelected;
    const initialGetModeConfig = result.current.getModeConfig;

    // Re-render the hook
    rerender();

    // Functions should maintain stable references
    expect(result.current.setCurrentMode).toBe(initialSetCurrentMode);
    expect(result.current.resetMode).toBe(initialResetMode);
    expect(result.current.isModeSelected).toBe(initialIsModeSelected);
    expect(result.current.getModeConfig).toBe(initialGetModeConfig);
  });
});
