import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, X, GripVertical, Image, ArrowRight } from 'lucide-react';
import { Property, PropertyPhoto } from '../types';

interface PhotoUploadProps {
  property: Property | null;
  onPhotosComplete: (photos: PropertyPhoto[]) => void;
  onSkip: () => void;
}

export function PhotoUpload({ property, onPhotosComplete, onSkip }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<PropertyPhoto[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roomTypes = [
    'Living Room',
    'Kitchen',
    'Bedroom',
    'Bathroom',
    'Dining Room',
    'Exterior',
    'Garden',
    'Parking',
    'Other'
  ];

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newPhoto: PropertyPhoto = {
            id: Date.now().toString() + index,
            url: e.target?.result as string,
            filename: file.name,
            isCover: photos.length === 0 && index === 0,
            room: undefined
          };
          setPhotos(prev => [...prev, newPhoto]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prev => {
      const updatedPhotos = prev.filter(p => p.id !== photoId);
      // If we removed the cover photo, make the first remaining photo the cover
      if (updatedPhotos.length > 0 && !updatedPhotos.some(p => p.isCover)) {
        updatedPhotos[0].isCover = true;
      }
      return updatedPhotos;
    });
  };

  const updatePhotoRoom = (photoId: string, room: string) => {
    setPhotos(prev => 
      prev.map(p => p.id === photoId ? { ...p, room: room === 'none' ? undefined : room } : p)
    );
  };

  const setCoverPhoto = (photoId: string) => {
    setPhotos(prev => 
      prev.map(p => ({ ...p, isCover: p.id === photoId }))
    );
  };

  const reorderPhotos = (fromIndex: number, toIndex: number) => {
    const newPhotos = [...photos];
    const [movedPhoto] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, movedPhoto);
    setPhotos(newPhotos);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderPhotos(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="mb-4">Add Property Photos</h1>
          <p className="text-muted-foreground">
            High-quality photos help attract tenants and showcase your property
          </p>
          {property && (
            <Badge variant="outline" className="mt-2">
              {property.address}
            </Badge>
          )}
        </div>

        <Card className="p-8">
          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center mb-8 transition-colors hover:border-primary/50 hover:bg-muted/25"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="mb-2">Drag and drop photos here</h3>
            <p className="text-muted-foreground mb-4">
              Or click to browse and select multiple files
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            <p className="text-xs text-muted-foreground mt-4">
              Supports JPG, PNG, GIF up to 10MB each
            </p>
          </div>

          {/* Photo Gallery */}
          {photos.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3>Uploaded Photos ({photos.length})</h3>
                <p className="text-sm text-muted-foreground">
                  Drag photos to reorder
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="relative group bg-muted rounded-lg overflow-hidden cursor-move"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragEnd={() => setDraggedIndex(null)}
                  >
                    <div className="aspect-video relative">
                      <img
                        src={photo.url}
                        alt={photo.filename}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Drag Handle */}
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4 text-white drop-shadow-lg" />
                      </div>

                      {/* Cover Badge */}
                      {photo.isCover && (
                        <Badge className="absolute top-2 right-2 bg-primary">
                          Cover Photo
                        </Badge>
                      )}

                      {/* Remove Button */}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(photo.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="p-3 space-y-3">
                      <div className="text-sm truncate">{photo.filename}</div>
                      
                      <div className="space-y-2">
                        <Select
                          value={photo.room || 'none'}
                          onValueChange={(value) => updatePhotoRoom(photo.id, value)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Tag room" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No tag</SelectItem>
                            {roomTypes.map(room => (
                              <SelectItem key={room} value={room}>{room}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {!photo.isCover && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={() => setCoverPhoto(photo.id)}
                          >
                            Set as Cover
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-8 border-t mt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              className="flex items-center space-x-2"
            >
              <span>Skip photos for now</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={() => onPhotosComplete(photos)}
              size="lg"
              disabled={photos.length === 0}
            >
              {photos.length === 0 ? 'Add Photos First' : `Continue with ${photos.length} photo${photos.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </Card>

        {photos.length === 0 && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Image className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm">
                  <strong>Pro tip:</strong> Properties with photos get 3x more tenant inquiries. 
                  You can always add photos later from your dashboard.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}