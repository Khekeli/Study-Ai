import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Trash2, FileText, ChevronDown, FolderOpen } from "lucide-react";
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
  disabled?: boolean;
  isExtracting?: boolean;
  hasUploadedFiles?: boolean;
}

const ExtractedTextStorage: React.FC<ExtractedTextStorageProps> = ({
  extractedText,
  fileName,
  onLoadText,
  disabled = false,
  isExtracting = false,
  hasUploadedFiles = false,
}) => {
  const [savedTexts, setSavedTexts] = useState<SavedText[]>([]);
  const [customName, setCustomName] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
      // On desktop, expand by default; on mobile, minimize by default
      setIsExpanded(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  // Clear selected text when files are uploaded
  useEffect(() => {
    if (hasUploadedFiles) {
      setSelectedId(null);
    }
  }, [hasUploadedFiles]);

  const loadSavedTexts = () => {
    try {
      const stored = localStorage.getItem("extractedTexts");
      if (stored) {
        const parsedTexts = JSON.parse(stored);
        setSavedTexts(parsedTexts);
      }
    } catch (error) {
      console.error("Error loading saved texts:", error);
      toast.error("Failed to load saved texts");
    }
  };

  const saveText = () => {
    if (!extractedText.trim()) {
      toast.error("No text to save");
      return;
    }

    if (!customName.trim()) {
      toast.error("Please enter a name for the saved text");
      return;
    }

    try {
      const newSavedText: SavedText = {
        id: Date.now().toString(),
        name: customName.trim(),
        text: extractedText,
        createdAt: new Date().toISOString(),
      };

      const updatedTexts = [...savedTexts, newSavedText];
      localStorage.setItem("extractedTexts", JSON.stringify(updatedTexts));
      setSavedTexts(updatedTexts);
      toast.success(`Text saved as "${customName}"`);

      // Reset custom name for next save
      setCustomName("");
    } catch (error) {
      console.error("Error saving text:", error);
      toast.error("Failed to save text");
    }
  };

  // FIXED: This function now only loads text without triggering generation
  const handleUseText = (savedText: SavedText) => {
    onLoadText(savedText.text, savedText.name);
    setSelectedId(savedText.id);
    toast.success(
      `Text loaded - you can now generate questions using the buttons below`
    );
  };

  const deleteText = (id: string, name: string) => {
    try {
      const updatedTexts = savedTexts.filter((text) => text.id !== id);
      localStorage.setItem("extractedTexts", JSON.stringify(updatedTexts));
      setSavedTexts(updatedTexts);

      if (selectedId === id) {
        setSelectedId(null);
      }

      toast.success(`Deleted "${name}"`);
    } catch (error) {
      console.error("Error deleting text:", error);
      toast.error("Failed to delete text");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTextPreview = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  const [hoveredId, setHoveredId] = useState<string | null>(null);

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
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <motion.div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/50 p-2">
                  <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    Text Storage
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Save and manage your extracted content
                  </p>
                </div>
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
                          disabled={
                            !extractedText || disabled || !customName.trim()
                          }
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
                            className={`relative p-3 border rounded-lg transition-colors ${
                              selectedId === savedText.id
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50"
                                : "border-gray-200 dark:border-gray-700 "
                            }`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            whileHover={{ scale: 1.01 }}
                            onMouseEnter={() => setHoveredId(savedText.id)}
                            onMouseLeave={() => setHoveredId(null)}
                          >
                            {/* Hover Preview Tooltip */}
                            <AnimatePresence>
                              {hoveredId === savedText.id && (
                                <motion.div
                                  className="fixed z-[999999] w-64 max-w-xs p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl pointer-events-none"
                                  style={{
                                    left: "50%",
                                    top: "50%",
                                    transform: "translate(-50%, -50%)",
                                  }}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                    Text Preview:
                                  </div>
                                  <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                                    {getTextPreview(savedText.text)}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium text-sm truncate">
                                    {savedText.name}
                                  </h4>
                                  {selectedId === savedText.id &&
                                    !hasUploadedFiles && (
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
                              </div>
                              <div className="flex space-x-1 ml-2">
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Button
                                    type="button"
                                    onClick={() => handleUseText(savedText)}
                                    size="default"
                                    variant="outline"
                                    className="h-8 w-18 px-2 mx-2"
                                    disabled={
                                      disabled ||
                                      isExtracting ||
                                      hasUploadedFiles
                                    }
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
                                    type="button"
                                    onClick={() =>
                                      deleteText(savedText.id, savedText.name)
                                    }
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
                      <p className="text-xs mt-1">
                        Extract text from a PDF/PPT and save it here
                      </p>
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
