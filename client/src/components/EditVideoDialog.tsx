import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, X } from "lucide-react";

interface EditVideoDialogProps {
  video: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  "Gaming",
  "Music",
  "Education",
  "Entertainment",
  "News",
  "Sports",
  "Technology",
  "Cooking",
  "Travel",
  "Fashion",
  "Comedy",
  "Science",
  "Health",
  "Lifestyle",
  "Vlog",
  "Tutorial",
  "Other",
];

const visibilityOptions = [
  { value: "public", label: "Public" },
  { value: "unlisted", label: "Unlisted" },
  { value: "private", label: "Private" },
];

export default function EditVideoDialog({ video, open, onOpenChange }: EditVideoDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState(video?.title || "");
  const [description, setDescription] = useState(video?.description || "");
  const [category, setCategory] = useState(video?.category || "");
  const [visibility, setVisibility] = useState(video?.visibility || "public");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(video?.thumbnail || "");
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  useEffect(() => {
    if (video) {
      setTitle(video.title || "");
      setDescription(video.description || "");
      setCategory(video.category || "");
      setVisibility(video.visibility || "public");
      setThumbnailPreview(video.thumbnail || "");
    }
  }, [video]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateVideoMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update video");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Success!",
        description: "Video updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update video",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async () => {
    let thumbnailUrl = video?.thumbnail;

    // Upload new thumbnail if selected
    if (thumbnailFile) {
      setUploadingThumbnail(true);
      try {
        const formData = new FormData();
        formData.append("thumbnail", thumbnailFile);

        const response = await fetch("/api/upload/thumbnail", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to upload thumbnail");
        }

        const data = await response.json();
        thumbnailUrl = data.thumbnailUrl;
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to upload thumbnail",
          variant: "destructive",
        });
        setUploadingThumbnail(false);
        return;
      }
      setUploadingThumbnail(false);
    }

    updateVideoMutation.mutate({
      title,
      description,
      category,
      visibility,
      thumbnail: thumbnailUrl,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Video</DialogTitle>
          <DialogDescription>
            Update your video details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Thumbnail */}
          <div className="space-y-2">
            <Label>Thumbnail</Label>
            <div className="flex flex-col gap-3">
              {thumbnailPreview && (
                <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setThumbnailFile(null);
                      setThumbnailPreview(video?.thumbnail || "");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById("thumbnail-upload")?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {thumbnailPreview ? "Change Thumbnail" : "Upload Thumbnail"}
              </Button>
              <input
                id="thumbnail-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailChange}
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">{title.length}/100</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground">{description.length}/5000</p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateVideoMutation.isPending || uploadingThumbnail || !title.trim()}
          >
            {(updateVideoMutation.isPending || uploadingThumbnail) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {uploadingThumbnail ? "Uploading..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
