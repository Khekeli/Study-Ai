import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Clock,
  Brain,
  Network,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { StudyModeConfig, StudyMode } from "@/lib/types";
import {
  DEFAULT_STUDY_MODES,
  STUDY_MODE_COLORS,
} from "@/lib/enhanced-theory-constants";

interface StudyModeSelectorProps {
  onModeSelect: (mode: StudyMode) => void;
  currentMode?: StudyMode;
  className?: string;
  availableModes?: StudyModeConfig[];
  disabled?: boolean;
}

// Icon mapping for study modes
const STUDY_MODE_ICONS = {
  standard: BookOpen,
  spaced_repetition: Clock,
  active_recall: Brain,
  concept_mapping: Network,
} as const;

// Benefit icons mapping
const BENEFIT_ICONS = {
  0: Target,
  1: TrendingUp,
  2: Sparkles,
} as const;

const StudyModeSelector: React.FC<StudyModeSelectorProps> = ({
  onModeSelect,
  currentMode,
  className = "",
  availableModes = DEFAULT_STUDY_MODES,
  disabled = false,
}) => {
  const handleModeSelect = (modeId: StudyMode) => {
    if (disabled) return;
    onModeSelect(modeId);
  };

  const getModeColorClasses = (color: string, isSelected: boolean) => {
    const colorMap =
      STUDY_MODE_COLORS[color as keyof typeof STUDY_MODE_COLORS] ||
      STUDY_MODE_COLORS.standard;

    if (isSelected) {
      return {
        card: `border-2 border-${colorMap.primary} bg-${colorMap.accent} shadow-lg`,
        header: `bg-${colorMap.primary} text-white`,
        icon: `bg-white text-${colorMap.primary}`,
        button: `bg-${colorMap.primary} hover:bg-${colorMap.primary}/90 text-white`,
        badge: `bg-${colorMap.secondary} text-${colorMap.text}`,
      };
    }

    return {
      card: `border border-gray-200 dark:border-gray-700 hover:border-${colorMap.primary} hover:shadow-md transition-all duration-200`,
      header: `bg-${colorMap.secondary} text-${colorMap.text}`,
      icon: `bg-${colorMap.primary} text-white`,
      button: `bg-${colorMap.primary} hover:bg-${colorMap.primary}/90 text-white`,
      badge: `bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300`,
    };
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Choose Your Study Method
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Select a study mode that matches your learning goals. Each method is
          designed to optimize different aspects of learning and retention.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {availableModes.map((mode) => {
          const isSelected = currentMode === mode.id;
          const IconComponent = STUDY_MODE_ICONS[mode.id];
          const colorClasses = getModeColorClasses(mode.color, isSelected);

          return (
            <Card
              key={mode.id}
              className={`${colorClasses.card} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} transition-all duration-300 ${!disabled ? "hover:scale-[1.02]" : ""}`}
              onClick={() => handleModeSelect(mode.id)}
            >
              <CardHeader className={`${colorClasses.header} rounded-t-lg`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${colorClasses.icon} flex items-center justify-center`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {mode.name}
                      </CardTitle>
                      {isSelected && (
                        <Badge
                          variant="secondary"
                          className="mt-1 bg-white/20 text-white border-white/30"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Selected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {mode.description}
                </p>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Key Benefits
                  </h4>
                  <ul className="space-y-2">
                    {mode.benefits.map((benefit, index) => {
                      const BenefitIcon =
                        BENEFIT_ICONS[index as keyof typeof BENEFIT_ICONS] ||
                        Target;
                      return (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                        >
                          <BenefitIcon className="h-4 w-4 mt-0.5 text-gray-500 dark:text-gray-500 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModeSelect(mode.id);
                    }}
                    className={`w-full ${colorClasses.button} group`}
                    variant={isSelected ? "default" : "outline"}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Currently Selected
                      </>
                    ) : (
                      <>
                        Start Learning
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {currentMode && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full border border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {availableModes.find((mode) => mode.id === currentMode)?.name}{" "}
              mode selected
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyModeSelector;
