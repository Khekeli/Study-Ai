import React from 'react'
import { Button } from './ui/button'
import { Loader2 } from 'lucide-react'

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
  isLoadingTheory = false
}) => {
  return (
    <div className="space-y-2 border-2 border-pink-500/40 bg-pink-300/10 rounded-md  gap-4 mt-10">
      <div className='p-4 flex flex-row gap-4'>

          <Button
            type="button"
            onClick={onFlashCards}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white h-14"
            disabled={disabled}
          >
            {isLoadingFlashCards ? (
              <span className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Flash Cards...</span>
              </span>
            ) : (
              "Flash Cards"
            )}
          </Button>
          
          <Button
            type="button"
            onClick={onMCQ}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white h-14"
            disabled={disabled}
          >
            {isLoadingMCQ ? (
              <span className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span> MCQ...</span>
              </span>
            ) : (
              "MCQ Questions"
            )}
          </Button>
      </div>
      
     
    </div>
  )
}

export default NewButtons



 {/* <Button
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
      </Button> */}