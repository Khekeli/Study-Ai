import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save,  Trash2, FileText, ChevronDown, ChevronUp, Loader2, MoreHorizontal, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface SavedText {
  id: string;
  name: string;
  text: string;
  createdAt: string;
}

interface ExtractedTextStorageProps {
  extractedText: string;
  fileName: string;
  onLoadText: (text: string, name: string) => void;
  onGenerateQuiz: (text: string, name: string) => void;
  onGenerateFlashCards: (text: string, name: string) => void;
  onGenerateMCQ: (text: string, name: string) => void;
  disabled?: boolean;
  isLoadingQuiz?: boolean;
  isLoadingFlashCards?: boolean;
  isLoadingMCQ?: boolean;
}

const ExtractedTextStorage: React.FC<ExtractedTextStorageProps> = ({
  extractedText,
  fileName,
  onLoadText,
  onGenerateQuiz,
  onGenerateFlashCards,
  onGenerateMCQ,
  disabled = false,
  isLoadingQuiz = false,
  isLoadingFlashCards = false,
  isLoadingMCQ = false
}) => {
  const [savedTexts, setSavedTexts] = useState<SavedText[]>([]);
  const [customName, setCustomName] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedOptions, setExpandedOptions] = useState<string | null>(null);

  // Load saved texts from localStorage on component mount
  useEffect(() => {
    loadSavedTexts();
  }, []);

  // Update custom name when fileName changes
  useEffect(() => {
    if (fileName) {
      // Remove file extension and use as default name
      const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
      setCustomName(nameWithoutExtension);
    }
  }, [fileName]);

  const loadSavedTexts = () => {
    try {
      const stored = localStorage.getItem('extractedTexts');
      if (stored) {
        const parsedTexts = JSON.parse(stored);
        setSavedTexts(parsedTexts);
      }
    } catch (error) {
      console.error('Error loading saved texts:', error);
      toast.error('Failed to load saved texts');
    }
  };

  const saveText = () => {
    if (!extractedText.trim()) {
      toast.error('No text to save');
      return;
    }

    if (!customName.trim()) {
      toast.error('Please enter a name for the saved text');
      return;
    }

    try {
      const newSavedText: SavedText = {
        id: Date.now().toString(),
        name: customName.trim(),
        text: extractedText,
        createdAt: new Date().toISOString()
      };

      const updatedTexts = [...savedTexts, newSavedText];
      localStorage.setItem('extractedTexts', JSON.stringify(updatedTexts));
      setSavedTexts(updatedTexts);
      toast.success(`Text saved as "${customName}"`);
      
      // Reset custom name for next save
      setCustomName("");
    } catch (error) {
      console.error('Error saving text:', error);
      toast.error('Failed to save text');
    }
  };

  const handleGenerateQuiz = (savedText: SavedText) => {
    onGenerateQuiz(savedText.text, savedText.name);
    setSelectedId(savedText.id);
    setExpandedOptions(null);
  };

  const handleGenerateFlashCards = (savedText: SavedText) => {
    onGenerateFlashCards(savedText.text, savedText.name);
    setSelectedId(savedText.id);
    setExpandedOptions(null);
  };

  const handleGenerateMCQ = (savedText: SavedText) => {
    onGenerateMCQ(savedText.text, savedText.name);
    setSelectedId(savedText.id);
    setExpandedOptions(null);
  };

  const loadText = (savedText: SavedText) => {
    onLoadText(savedText.text, savedText.name);
    setSelectedId(savedText.id);
    setExpandedOptions(null);
    toast.success(`Loaded "${savedText.name}"`);
  };

  const deleteText = (id: string, name: string) => {
    try {
      const updatedTexts = savedTexts.filter(text => text.id !== id);
      localStorage.setItem('extractedTexts', JSON.stringify(updatedTexts));
      setSavedTexts(updatedTexts);
      
      if (selectedId === id) {
        setSelectedId(null);
      }
      
      if (expandedOptions === id) {
        setExpandedOptions(null);
      }
      
      toast.success(`Deleted "${name}"`);
    } catch (error) {
      console.error('Error deleting text:', error);
      toast.error('Failed to delete text');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <motion.div
        className="w-full space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <motion.div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/50 p-2">
                <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">Text Storage</CardTitle>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          </motion.div>
        </CardHeader>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="space-y-4">
                {/* Save Section */}
                <div className="space-y-3">
                  <Label htmlFor="customName" className="text-sm font-medium">
                    Save Current Text
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id="customName"
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Enter name for saved text"
                      className="flex-1"
                      disabled={disabled}
                    />
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={saveText}
                        disabled={!extractedText || disabled || !customName.trim()}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </motion.div>
                  </div>
                </div>

                {/* Saved Texts Section */}
                {savedTexts.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Saved Texts ({savedTexts.length})
                    </Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
                      {savedTexts.map((savedText) => (
                        <motion.div
                          key={savedText.id}
                          className={`p-3 border rounded-lg transition-colors ${
                            selectedId === savedText.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50'
                              : 'border-gray-200 dark:border-gray-700 '
                          }`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium text-sm truncate">
                                  {savedText.name}
                                </h4>
                                {selectedId === savedText.id && (
                                  <motion.span
                                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    Active
                                  </motion.span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {formatDate(savedText.createdAt)}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                {truncateText(savedText.text)}
                              </p>
                            </div>
                            <div className="flex space-x-1 ml-2">
                              
                              
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Button
                                  onClick={() => setExpandedOptions(expandedOptions === savedText.id ? null : savedText.id)}
                                  size="default"
                                  variant="outline"
                                  className="h-8 w-18 px-2 mx-2"
                                  disabled={disabled}
                                >
                                  <FolderOpen className="h-3 w-3" />  
                                  <p>Use</p>
                                </Button>
                              </motion.div>
                              
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Button
                                  onClick={() => deleteText(savedText.id, savedText.name)}
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-300"
                                  disabled={disabled}
                                >
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </motion.div>
                            </div>
                          </div>
                          
                          {/* Expanded Options */}
                          <AnimatePresence>
                            {expandedOptions === savedText.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                transition={{ duration: 0.3 }}
                                className="border-t pt-3 space-y-2"
                              >
                                <p className="text-xs text-muted-foreground mb-2">
                                  Generate questions from this text:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <Button
                                      onClick={() => handleGenerateQuiz(savedText)}
                                      size="sm"
                                      className="bg-pink-500 hover:bg-pink-600 text-white text-xs h-8"
                                      disabled={disabled || isLoadingQuiz}
                                    >
                                      {isLoadingQuiz ? (
                                        <span className="flex items-center space-x-1">
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                          <span>Quiz...</span>
                                        </span>
                                      ) : (
                                        "Quiz"
                                      )}
                                    </Button>
                                  </motion.div>
                                  
                                  <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <Button
                                      onClick={() => handleGenerateFlashCards(savedText)}
                                      size="sm"
                                      className="bg-pink-500 hover:bg-pink-600 text-white text-xs h-8"
                                      disabled={disabled || isLoadingFlashCards}
                                    >
                                      {isLoadingFlashCards ? (
                                        <span className="flex items-center space-x-1">
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                          <span>Cards...</span>
                                        </span>
                                      ) : (
                                        "Flash Cards"
                                      )}
                                    </Button>
                                  </motion.div>
                                  
                                  <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <Button
                                      onClick={() => handleGenerateMCQ(savedText)}
                                      size="sm"
                                      className="bg-pink-500 hover:bg-pink-600 text-white text-xs h-8"
                                      disabled={disabled || isLoadingMCQ}
                                    >
                                      {isLoadingMCQ ? (
                                        <span className="flex items-center space-x-1">
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                          <span>MCQ...</span>
                                        </span>
                                      ) : (
                                        "MCQ"
                                      )}
                                    </Button>
                                  </motion.div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {savedTexts.length === 0 && (
                  <motion.div
                    className="text-center py-8 text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No saved texts yet</p>
                    <p className="text-xs mt-1">Extract text from a PDF/PPT and save it here</p>
                  </motion.div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
    </>
  );
};

export default ExtractedTextStorage;