import { useState, useRef } from "react";
import { Upload, Video, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface UploadVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UploadVideoDialog({ open, onOpenChange }: UploadVideoDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("video/")) {
        setSelectedFile(file);
        setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    
    console.log("Uploading video:", {
      file: selectedFile,
      title: videoTitle,
      description: videoDescription,
    });
  };

  const handleClose = () => {
    setSelectedFile(null);
    setVideoTitle("");
    setVideoDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload video</DialogTitle>
          <DialogDescription>
            Select or drag a video file to upload to your channel
          </DialogDescription>
        </DialogHeader>

        {!selectedFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-12 h-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  Drag and drop video files to upload
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your videos will be private until you publish them.
                </p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4"
              >
                Select files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
              <div className="w-16 h-16 bg-background rounded flex items-center justify-center flex-shrink-0">
                <Video className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{selectedFile.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedFile(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="video-title">Title (required)</Label>
                <Input
                  id="video-title"
                  placeholder="Add a title that describes your video"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-description">Description</Label>
                <Textarea
                  id="video-description"
                  placeholder="Tell viewers about your video"
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!videoTitle.trim()}
              >
                Upload video
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
