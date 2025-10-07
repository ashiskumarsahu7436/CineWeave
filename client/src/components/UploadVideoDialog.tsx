import { useState, useRef } from "react";
import { Upload, Video, X, ChevronRight, ChevronLeft, Check, AlertCircle, PlayCircle, Film, Tag } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface UploadVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UploadStep = "upload" | "details" | "elements" | "checks" | "visibility";

const VIDEO_CATEGORIES = [
  "Gaming",
  "Music",
  "Education",
  "Entertainment",
  "Sports",
  "News",
  "Movies",
  "Tech",
  "Science",
  "Comedy",
  "Vlog",
  "Tutorial",
  "Review",
  "Travel",
  "Food",
  "Fashion",
  "Other"
];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB limit (matches server-side multer config)
const ACCEPTED_VIDEO_FORMATS = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

export default function UploadVideoDialog({ open, onOpenChange }: UploadVideoDialogProps) {
  const [currentStep, setCurrentStep] = useState<UploadStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Video details
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [audienceType, setAudienceType] = useState("no");
  const [videoDuration, setVideoDuration] = useState<string>("");
  
  // Visibility settings
  const [visibility, setVisibility] = useState<"private" | "unlisted" | "public">("private");
  const [scheduleDate, setScheduleDate] = useState("");
  
  // Error state
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const steps: { id: UploadStep; label: string; completed: boolean }[] = [
    { id: "details", label: "Details", completed: currentStep !== "upload" && currentStep !== "details" },
    { id: "elements", label: "Video elements", completed: currentStep === "checks" || currentStep === "visibility" },
    { id: "checks", label: "Checks", completed: currentStep === "visibility" },
    { id: "visibility", label: "Visibility", completed: false },
  ];

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_VIDEO_FORMATS.includes(file.type)) {
      return "Please upload a valid video file (MP4, WebM, OGG, or MOV)";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }
    return null;
  };

  const extractVideoDuration = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      };
      video.onerror = () => resolve("0:00");
      video.src = URL.createObjectURL(file);
    });
  };

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

  const handleFileSelect = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast({
        title: "Invalid file",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
    setIsProcessing(true);
    
    // Create video preview
    const previewUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(previewUrl);
    
    // Extract duration
    const duration = await extractVideoDuration(file);
    setVideoDuration(duration);
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep("details");
    }, 1500);
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setThumbnail(file);
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && tags.length < 10) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const validateStep = (step: UploadStep): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (step === "details") {
      if (!videoTitle.trim()) {
        newErrors.title = "Title is required";
      } else if (videoTitle.length > 100) {
        newErrors.title = "Title must be 100 characters or less";
      }
      if (!thumbnail) {
        newErrors.thumbnail = "Thumbnail is required";
      }
      if (!selectedCategory) {
        newErrors.category = "Category is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === "details") {
      if (validateStep("details")) {
        setCurrentStep("elements");
      }
    } else if (currentStep === "elements") setCurrentStep("checks");
    else if (currentStep === "checks") setCurrentStep("visibility");
  };

  const handleBack = () => {
    if (currentStep === "elements") setCurrentStep("details");
    else if (currentStep === "checks") setCurrentStep("elements");
    else if (currentStep === "visibility") setCurrentStep("checks");
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSave = async () => {
    if (!selectedFile || !thumbnail) {
      toast({
        title: "Missing required fields",
        description: "Please provide both video and thumbnail",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload video file to iDrive E2
      setUploadProgress(10);
      const videoFormData = new FormData();
      videoFormData.append('video', selectedFile);

      const videoUploadResponse = await fetch('/api/upload/video', {
        method: 'POST',
        body: videoFormData,
      });

      if (!videoUploadResponse.ok) {
        const error = await videoUploadResponse.json();
        if (videoUploadResponse.status === 401) {
          throw new Error('Please login to upload videos');
        } else if (videoUploadResponse.status === 503) {
          throw new Error('Video storage not configured. Please set up iDrive E2 credentials.');
        }
        throw new Error(error.message || 'Failed to upload video file');
      }

      const videoResult = await videoUploadResponse.json();
      setUploadProgress(50);

      // Upload thumbnail to iDrive E2
      const thumbnailFormData = new FormData();
      thumbnailFormData.append('thumbnail', thumbnail);

      const thumbnailUploadResponse = await fetch('/api/upload/thumbnail', {
        method: 'POST',
        body: thumbnailFormData,
      });

      if (!thumbnailUploadResponse.ok) {
        const error = await thumbnailUploadResponse.json();
        throw new Error(error.message || 'Failed to upload thumbnail');
      }

      const thumbnailResult = await thumbnailUploadResponse.json();
      setUploadProgress(75);

      // Create video record in database
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: videoTitle,
          description: videoDescription || undefined,
          thumbnail: thumbnailResult.thumbnailUrl,
          videoUrl: videoResult.videoUrl,
          storageKey: videoResult.storageKey,
          duration: videoDuration,
          category: selectedCategory || undefined,
          tags: tags.length > 0 ? tags : undefined,
          visibility,
          scheduledAt: scheduleDate || undefined,
          madeForKids: audienceType === 'yes',
          playlist: selectedPlaylist || undefined,
        }),
      });

      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Please login to upload videos');
        } else if (response.status === 400) {
          if (error.message?.includes('channel')) {
            throw new Error('Please create a channel before uploading videos. Go to Studio Settings to create one.');
          }
          throw new Error(error.message || 'Invalid video data. Please check all required fields.');
        }
        
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      
      // Invalidate video queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });

      toast({
        title: "Success!",
        description: `Video "${videoTitle}" uploaded successfully`,
      });

      // Close dialog after a short delay
      setTimeout(() => {
        handleClose();
      }, 1000);

    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload video. Please try again.",
        variant: "destructive",
      });
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    
    setSelectedFile(null);
    setVideoPreviewUrl(null);
    setCurrentStep("upload");
    setVideoTitle("");
    setVideoDescription("");
    setThumbnail(null);
    setThumbnailPreview(null);
    setSelectedCategory("");
    setTags([]);
    setTagInput("");
    setVisibility("private");
    setIsProcessing(false);
    setIsUploading(false);
    setUploadProgress(0);
    setErrors({});
    setVideoDuration("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Film className="h-5 w-5" />
            {currentStep === "upload" ? "Upload video" : selectedFile?.name || "video"}
          </DialogTitle>
          {currentStep === "upload" && (
            <DialogDescription>
              Select or drag a video file to upload to your channel
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {currentStep === "upload" ? (
            <div className="p-6">
              <div
                className={`border-2 border-dashed rounded-lg p-16 text-center transition-all ${
                  isDragging
                    ? "border-primary bg-primary/10 scale-[1.02]"
                    : "border-border hover:border-primary/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-6">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Upload className="w-16 h-16 text-primary" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold">
                      Drag and drop video files to upload
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your videos will be private until you publish them.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>Max file size: {Math.floor(MAX_FILE_SIZE / (1024 * 1024))}MB • Supported: MP4, WebM, OGG, MOV</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="lg"
                    className="mt-2"
                  >
                    <Upload className="h-4 w-4 mr-2" />
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
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
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

                {/* Video Preview */}
                {videoPreviewUrl && (
                  <div className="mt-6 space-y-2">
                    <Label className="text-xs text-muted-foreground">Preview</Label>
                    <div className="relative rounded-lg overflow-hidden bg-black group">
                      <video
                        ref={videoRef}
                        src={videoPreviewUrl}
                        className="w-full aspect-video object-cover"
                        controls
                      />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <PlayCircle className="h-12 w-12 text-white" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Duration: {videoDuration}</p>
                  </div>
                )}
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
                        <Label htmlFor="video-title">
                          Title (required) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="video-title"
                          placeholder="Add a title that describes your video"
                          value={videoTitle}
                          onChange={(e) => setVideoTitle(e.target.value)}
                          className={`text-base ${errors.title ? 'border-destructive' : ''}`}
                          maxLength={100}
                        />
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-destructive">{errors.title}</p>
                          <p className="text-xs text-muted-foreground">{videoTitle.length}/100</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="video-description">Description</Label>
                        <Textarea
                          id="video-description"
                          placeholder="Tell viewers about your video"
                          value={videoDescription}
                          onChange={(e) => setVideoDescription(e.target.value)}
                          rows={6}
                          className="text-base"
                          maxLength={5000}
                        />
                        <p className="text-xs text-muted-foreground text-right">{videoDescription.length}/5000</p>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Thumbnail <span className="text-destructive">*</span>
                        </Label>
                        <div className="flex gap-4">
                          {thumbnailPreview ? (
                            <div className="relative w-40 h-24 bg-muted rounded border overflow-hidden group">
                              <img 
                                src={thumbnailPreview} 
                                alt="Thumbnail" 
                                className="w-full h-full object-cover"
                              />
                              <Button
                                variant="secondary"
                                size="icon"
                                className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  setThumbnail(null);
                                  setThumbnailPreview(null);
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => thumbnailInputRef.current?.click()}
                              className={`w-40 h-24 border-2 border-dashed rounded hover:border-primary transition-colors flex items-center justify-center ${errors.thumbnail ? 'border-destructive' : ''}`}
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
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">
                              Upload a custom thumbnail to represent your video
                            </p>
                            {errors.thumbnail && (
                              <p className="text-xs text-destructive mt-1">{errors.thumbnail}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">
                          Category <span className="text-destructive">*</span>
                        </Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {VIDEO_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.category && (
                          <p className="text-xs text-destructive">{errors.category}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags</Label>
                        <div className="flex gap-2">
                          <Input
                            id="tags"
                            placeholder="Add tags (press Enter)"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag();
                              }
                            }}
                            disabled={tags.length >= 10}
                          />
                          <Button onClick={addTag} variant="outline" disabled={tags.length >= 10}>
                            <Tag className="h-4 w-4" />
                          </Button>
                        </div>
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="gap-1">
                                {tag}
                                <button
                                  onClick={() => removeTag(index)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">{tags.length}/10 tags</p>
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

                      <div className="space-y-3 pt-4 border-t">
                        <Label>Audience</Label>
                        <p className="text-sm text-muted-foreground">
                          Is this video made for kids?
                        </p>
                        <RadioGroup value={audienceType} onValueChange={setAudienceType}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="kids-yes" />
                            <Label htmlFor="kids-yes" className="font-normal cursor-pointer">
                              Yes, it's made for kids
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="kids-no" />
                            <Label htmlFor="kids-no" className="font-normal cursor-pointer">
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
                      <div className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors">
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

                      <div className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors">
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

                      <div className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold">End screen</h3>
                            <p className="text-sm text-muted-foreground">
                              Add elements to the last 5-20 seconds of your video
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

                      <div className="p-6 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                            <Check className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Community guidelines</h3>
                            <p className="text-sm text-muted-foreground">No issues found</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Video quality</h3>
                            <p className="text-sm text-muted-foreground">Resolution: Auto-detected</p>
                          </div>
                        </div>
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
                            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
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
                            
                            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
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
                            
                            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
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

                      <div className="space-y-2 pt-4 border-t">
                        <Label htmlFor="schedule">Schedule (Optional)</Label>
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

                      {isUploading && (
                        <div className="space-y-2 pt-4">
                          <Label>Upload Progress</Label>
                          <Progress value={uploadProgress} className="h-2" />
                          <p className="text-sm text-muted-foreground text-center">{uploadProgress}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {currentStep !== "upload" && !isProcessing && (
          <div className="border-t px-6 py-4 flex items-center justify-between bg-background flex-shrink-0">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === "details" || isUploading}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <div className="flex gap-3">
              {currentStep === "visibility" ? (
                <Button 
                  onClick={handleSave} 
                  className="gap-2"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Video
                    </>
                  )}
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
