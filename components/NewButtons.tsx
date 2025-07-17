import React from "react";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

interface NewButtonsProps {
  onFlashCards: () => void;
  onMCQ: () => void;
  onTheory: () => void;
  disabled?: boolean;
  isLoadingFlashCards?: boolean;
  isLoadingMCQ?: boolean;
  isLoadingTheory?: boolean;
}

const NewButtons: React.FC<NewButtonsProps> = ({
  onFlashCards,
  onMCQ,
  onTheory,
  disabled = false,
  isLoadingFlashCards = false,
  isLoadingMCQ = false,
  isLoadingTheory = false,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Button
        type="button"
        onClick={onFlashCards}
        className="bg-pink-500 hover:bg-pink-600 text-white h-14 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        disabled={disabled}
      >
        {isLoadingFlashCards ? (
          <span className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Generating...</span>
          </span>
        ) : (
          <span className="flex items-center space-x-2">
            <span>📚</span>
            <span>Flash Cards</span>
          </span>
        )}
      </Button>

      <Button
        type="button"
        onClick={onMCQ}
        className="bg-pink-500 hover:bg-pink-600 text-white h-14 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        disabled={disabled}
      >
        {isLoadingMCQ ? (
          <span className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Generating...</span>
          </span>
        ) : (
          <span className="flex items-center space-x-2">
            <span>✅</span>
            <span>MCQ Questions</span>
          </span>
        )}
      </Button>
    </div>
  );
};

export default NewButtons;

{
  /* <Button
        type="button"
        onClick={onTheory}
        className="w-full bg-purple-500 hover:bg-purple-600 text-white"
        disabled={disabled}
      >
        {isLoadingTheory ? (
          <span className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating Theory...</span>
          </span>
        ) : (
          "Generate Theory Questions"
        )}
      </Button> */
}
