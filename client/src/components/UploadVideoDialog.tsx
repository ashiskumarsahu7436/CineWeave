import { useState, useRef } from "react";
import { Upload, Video, X, ChevronRight, ChevronLeft, Check } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UploadVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UploadStep = "upload" | "details" | "elements" | "checks" | "visibility";

export default function UploadVideoDialog({ open, onOpenChange }: UploadVideoDialogProps) {
  const [currentStep, setCurrentStep] = useState<UploadStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Video details
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [audienceType, setAudienceType] = useState("no");
  
  // Visibility settings
  const [visibility, setVisibility] = useState<"private" | "unlisted" | "public">("private");
  const [scheduleDate, setScheduleDate] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const steps: { id: UploadStep; label: string; completed: boolean }[] = [
    { id: "details", label: "Details", completed: currentStep !== "upload" && currentStep !== "details" },
    { id: "elements", label: "Video elements", completed: currentStep === "checks" || currentStep === "visibility" },
    { id: "checks", label: "Checks", completed: currentStep === "visibility" },
    { id: "visibility", label: "Visibility", completed: false },
  ];

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
        handleFileSelect(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep("details");
    }, 1500);
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setThumbnail(files[0]);
    }
  };

  const handleNext = () => {
    if (currentStep === "details") setCurrentStep("elements");
    else if (currentStep === "elements") setCurrentStep("checks");
    else if (currentStep === "checks") setCurrentStep("visibility");
  };

  const handleBack = () => {
    if (currentStep === "elements") setCurrentStep("details");
    else if (currentStep === "checks") setCurrentStep("elements");
    else if (currentStep === "visibility") setCurrentStep("checks");
  };

  const handleSave = () => {
    console.log("Saving video:", {
      file: selectedFile,
      title: videoTitle,
      description: videoDescription,
      thumbnail,
      visibility,
      scheduleDate,
    });
    handleClose();
  };

  const handleClose = () => {
    setSelectedFile(null);
    setCurrentStep("upload");
    setVideoTitle("");
    setVideoDescription("");
    setThumbnail(null);
    setVisibility("private");
    setIsProcessing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">
            {currentStep === "upload" ? "Upload video" : selectedFile?.name || "video"}
          </DialogTitle>
          {currentStep === "upload" && (
            <DialogDescription>
              Select or drag a video file to upload to your channel
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {currentStep === "upload" ? (
            <div className="p-6">
              <div
                className={`border-2 border-dashed rounded-lg p-16 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-6">
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="w-16 h-16 text-muted-foreground" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold">
                      Drag and drop video files to upload
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your videos will be private until you publish them.
                    </p>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="lg"
                    className="mt-2"
                  >
                    Select files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[500px]">
              {/* Progress Stepper */}
              <div className="w-64 bg-muted/30 p-6 border-r">
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.completed 
                          ? "bg-primary text-primary-foreground" 
                          : currentStep === step.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {step.completed ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className={`text-sm font-medium ${
                          currentStep === step.id ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-6">
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-lg font-medium">Processing video...</p>
                    <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                  </div>
                ) : currentStep === "details" ? (
                  <div className="space-y-6 max-w-2xl">
                    <h2 className="text-2xl font-bold">Details</h2>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="video-title">Title (required)</Label>
                        <Input
                          id="video-title"
                          placeholder="Add a title that describes your video"
                          value={videoTitle}
                          onChange={(e) => setVideoTitle(e.target.value)}
                          className="text-base"
                        />
                        <p className="text-xs text-muted-foreground">{videoTitle.length}/100</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="video-description">Description</Label>
                        <Textarea
                          id="video-description"
                          placeholder="Tell viewers about your video (type @ to mention a channel)"
                          value={videoDescription}
                          onChange={(e) => setVideoDescription(e.target.value)}
                          rows={6}
                          className="text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Thumbnail</Label>
                        <div className="flex gap-4">
                          {thumbnail ? (
                            <div className="relative w-40 h-24 bg-muted rounded border overflow-hidden">
                              <img 
                                src={URL.createObjectURL(thumbnail)} 
                                alt="Thumbnail" 
                                className="w-full h-full object-cover"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 w-6 h-6"
                                onClick={() => setThumbnail(null)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => thumbnailInputRef.current?.click()}
                              className="w-40 h-24 border-2 border-dashed rounded hover:border-primary transition-colors flex items-center justify-center"
                            >
                              <Upload className="w-6 h-6 text-muted-foreground" />
                            </button>
                          )}
                          <input
                            ref={thumbnailInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailSelect}
                            className="hidden"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          You can change the thumbnail on the YouTube mobile app
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Playlists</Label>
                        <Select value={selectedPlaylist} onValueChange={setSelectedPlaylist}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No playlist</SelectItem>
                            <SelectItem value="tutorials">Tutorials</SelectItem>
                            <SelectItem value="vlogs">Vlogs</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3 pt-4">
                        <Label>Audience</Label>
                        <p className="text-sm text-muted-foreground">
                          This video is set to not made for kids
                        </p>
                        <RadioGroup value={audienceType} onValueChange={setAudienceType}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="kids-yes" />
                            <Label htmlFor="kids-yes" className="font-normal">
                              Yes, it's made for kids
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="kids-no" />
                            <Label htmlFor="kids-no" className="font-normal">
                              No, it's not made for kids
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                ) : currentStep === "elements" ? (
                  <div className="space-y-6 max-w-2xl">
                    <h2 className="text-2xl font-bold">Video elements</h2>
                    <p className="text-muted-foreground">
                      Use cards and an end screen to show viewers related videos, websites, and calls to action.
                    </p>
                    
                    <div className="space-y-4 pt-4">
                      <div className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold">Add related video</h3>
                            <p className="text-sm text-muted-foreground">
                              Connect another of your videos to your video
                            </p>
                          </div>
                          <Button variant="outline">Add</Button>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold">Add subtitles</h3>
                            <p className="text-sm text-muted-foreground">
                              Reach a broader audience by adding subtitles to your video
                            </p>
                          </div>
                          <Button variant="outline">Add</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : currentStep === "checks" ? (
                  <div className="space-y-6 max-w-2xl">
                    <h2 className="text-2xl font-bold">Checks</h2>
                    <p className="text-muted-foreground">
                      We'll check your video for issues that may restrict its visibility and then you will have the opportunity to fix issues before publishing your video.
                    </p>
                    
                    <div className="space-y-4 pt-4">
                      <div className="p-6 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                            <Check className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Copyright</h3>
                            <p className="text-sm text-muted-foreground">No issues found</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground ml-13">
                          Remember: These check results aren't final. Issues may come up in the future that impact your video.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : currentStep === "visibility" ? (
                  <div className="space-y-6 max-w-2xl">
                    <h2 className="text-2xl font-bold">Visibility</h2>
                    <p className="text-muted-foreground">
                      Choose when to publish and who can see your video
                    </p>
                    
                    <div className="space-y-4 pt-4">
                      <div className="space-y-3">
                        <Label>Save or publish</Label>
                        <p className="text-sm text-muted-foreground mb-4">
                          Make your video public, unlisted, or private
                        </p>
                        <RadioGroup value={visibility} onValueChange={(val) => setVisibility(val as any)}>
                          <div className="space-y-3">
                            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50">
                              <RadioGroupItem value="private" id="private" className="mt-1" />
                              <div className="flex-1">
                                <Label htmlFor="private" className="font-normal cursor-pointer">
                                  <div className="font-semibold">Private</div>
                                  <div className="text-sm text-muted-foreground">
                                    Only you and people you choose can watch your video
                                  </div>
                                </Label>
                              </div>
                            </div>
                            
                            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50">
                              <RadioGroupItem value="unlisted" id="unlisted" className="mt-1" />
                              <div className="flex-1">
                                <Label htmlFor="unlisted" className="font-normal cursor-pointer">
                                  <div className="font-semibold">Unlisted</div>
                                  <div className="text-sm text-muted-foreground">
                                    Anyone with the video link can watch your video
                                  </div>
                                </Label>
                              </div>
                            </div>
                            
                            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50">
                              <RadioGroupItem value="public" id="public" className="mt-1" />
                              <div className="flex-1">
                                <Label htmlFor="public" className="font-normal cursor-pointer">
                                  <div className="font-semibold">Public</div>
                                  <div className="text-sm text-muted-foreground">
                                    Everyone can watch your video
                                  </div>
                                </Label>
                              </div>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2 pt-4">
                        <Label htmlFor="schedule">Schedule</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Select a date to make your video public
                        </p>
                        <Input
                          id="schedule"
                          type="datetime-local"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {currentStep !== "upload" && !isProcessing && (
          <div className="border-t px-6 py-4 flex items-center justify-between bg-background">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === "details"}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <div className="flex gap-3">
              {currentStep === "visibility" ? (
                <Button onClick={handleSave} className="gap-2">
                  Save
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  disabled={currentStep === "details" && !videoTitle.trim()}
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
