import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  ArrowLeft, 
  Upload, 
  Image as ImageIcon,
  X,
  GripVertical,
  Search,
  Filter,
  Plus,
  Star,
  Eye,
  Download,
  Edit3,
  Save
} from 'lucide-react';
import { Property, PropertyPhoto } from '../App';
import { Input } from './ui/input';

interface PhotoManagementProps {
  property: Property | null;
  onBack: () => void;
  onPhotoAdd: (propertyId: string, photo: Omit<PropertyPhoto, 'id'>) => void;
  updateProperty: (propertyId: string, updates: Partial<Property>) => void;
}

export function PhotoManagement({ property, onBack, onPhotoAdd, updateProperty }: PhotoManagementProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PropertyPhoto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roomFilter, setRoomFilter] = useState('all');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [localPhotos, setLocalPhotos] = useState<PropertyPhoto[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSyncedPropertyId = useRef<string | null>(null);

  // Initialize and sync local photos with property photos
  useEffect(() => {
    if (property) {
      console.log('🔄 useEffect triggered', {
        propertyId: property.id,
        lastSynced: lastSyncedPropertyId.current,
        photoCount: property.photos.length,
        coverPhoto: property.photos.find(p => p.isCover)?.filename
      });
      
      // Always sync when property changes (new property selected)
      if (lastSyncedPropertyId.current !== property.id) {
        console.log('🔄 Syncing localPhotos with property.photos');
        setLocalPhotos(property.photos);
        setHasUnsavedChanges(false);
        lastSyncedPropertyId.current = property.id;
      } else {
        console.log('🔄 Skipping sync - same property');
      }
    }
  }, [property]);

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4">Property not found</h2>
          <Button onClick={onBack}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

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
    if (!files || !property) return;

    Array.from(files).forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newPhoto: PropertyPhoto = {
            id: `temp-${Date.now()}-${index}`,
            url: e.target?.result as string,
            filename: file.name,
            isCover: localPhotos.length === 0 && index === 0,
            room: undefined
          };
          setLocalPhotos(prev => [...prev, newPhoto]);
          setHasUnsavedChanges(true);
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
    const updatedPhotos = localPhotos.filter(p => p.id !== photoId);
    // If we removed the cover photo, make the first remaining photo the cover
    if (updatedPhotos.length > 0 && !updatedPhotos.some(p => p.isCover)) {
      updatedPhotos[0].isCover = true;
    }
    setLocalPhotos(updatedPhotos);
    setHasUnsavedChanges(true);
  };

  const updatePhotoRoom = (photoId: string, room: string) => {
    const updatedPhotos = localPhotos.map(p => 
      p.id === photoId ? { ...p, room: room === 'none' ? undefined : room } : p
    );
    setLocalPhotos(updatedPhotos);
    setHasUnsavedChanges(true);
  };

  const setCoverPhoto = (photoId: string) => {
    console.log('🌟 Setting cover photo:', photoId);
    const updatedPhotos = localPhotos.map(p => 
      ({ ...p, isCover: p.id === photoId })
    );
    console.log('🌟 Updated photos:', updatedPhotos.map(p => ({ 
      id: p.id, 
      filename: p.filename, 
      isCover: p.isCover 
    })));
    setLocalPhotos(updatedPhotos);
    setHasUnsavedChanges(true);
  };

  const reorderPhotos = (fromIndex: number, toIndex: number) => {
    const newPhotos = [...localPhotos];
    const [movedPhoto] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, movedPhoto);
    setLocalPhotos(newPhotos);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (!property) return;
    
    console.log('💾 Saving photos...', {
      propertyId: property.id,
      totalPhotos: localPhotos.length,
      coverPhoto: localPhotos.find(p => p.isCover)?.filename || 'none'
    });
    
    // Process photos: replace temp IDs with proper IDs for new photos
    let timestamp = Date.now();
    const photosToSave = localPhotos.map(photo => {
      if (photo.id.startsWith('temp-')) {
        // For new photos, generate a proper ID (matching the parent's pattern)
        // Use timestamp and increment to ensure uniqueness
        return {
          ...photo,
          id: (timestamp++).toString()
        };
      }
      return photo;
    });
    
    console.log('💾 Photos to save:', photosToSave.map(p => ({ 
      id: p.id, 
      filename: p.filename, 
      isCover: p.isCover 
    })));
    
    // Update all photos at once (including new photos, updates, and reordering)
    updateProperty(property.id, { photos: photosToSave });
    
    // Update local state with the new IDs and mark as saved
    setLocalPhotos(photosToSave);
    setHasUnsavedChanges(false);
    
    console.log('✅ Save complete');
  };

  const handleDragStart = (e: React.DragEvent, photoId: string) => {
    const index = localPhotos.findIndex(p => p.id === photoId);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, photoId: string) => {
    e.preventDefault();
    const targetIndex = localPhotos.findIndex(p => p.id === photoId);
    if (draggedIndex !== null && draggedIndex !== targetIndex && draggedIndex >= 0 && targetIndex >= 0) {
      reorderPhotos(draggedIndex, targetIndex);
      setDraggedIndex(targetIndex);
    }
  };

  const filteredPhotos = localPhotos.filter(photo => {
    const matchesSearch = photo.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (photo.room && photo.room.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRoom = roomFilter === 'all' || 
                       (roomFilter === 'untagged' && !photo.room) ||
                       photo.room === roomFilter;
    
    return matchesSearch && matchesRoom;
  });

  const getRoomCounts = () => {
    const counts: Record<string, number> = { untagged: 0 };
    roomTypes.forEach(room => counts[room] = 0);
    
    localPhotos.forEach(photo => {
      if (photo.room) {
        counts[photo.room] = (counts[photo.room] || 0) + 1;
      } else {
        counts.untagged += 1;
      }
    });
    
    return counts;
  };

  const roomCounts = getRoomCounts();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="mb-1">Photo Management</h1>
                <p className="text-muted-foreground">{property.address}</p>
              </div>
            </div>

            <Button onClick={() => fileInputRef.current?.click()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Photos
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1">Total Photos</p>
                <p className="text-2xl font-semibold">{localPhotos.length}</p>
              </div>
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1">Tagged</p>
                <p className="text-2xl font-semibold text-green-600">
                  {localPhotos.filter(p => p.room).length}
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">Organized</Badge>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1">Untagged</p>
                <p className="text-2xl font-semibold text-orange-600">
                  {roomCounts.untagged}
                </p>
              </div>
              <Badge className="bg-orange-100 text-orange-800">Need Tags</Badge>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1">Cover Photo</p>
                <p className="text-2xl font-semibold">
                  {localPhotos.some(p => p.isCover) ? '1' : '0'}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
        </div>

        {/* Upload Area */}
        <Card className="p-8 mb-8">
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center transition-colors hover:border-primary/50 hover:bg-muted/25"
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
        </Card>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search photos by filename or room..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Select value={roomFilter} onValueChange={setRoomFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Photos ({localPhotos.length})</SelectItem>
                  <SelectItem value="untagged">Untagged ({roomCounts.untagged})</SelectItem>
                  {roomTypes.map(room => (
                    roomCounts[room] > 0 && (
                      <SelectItem key={room} value={room}>
                        {room} ({roomCounts[room]})
                      </SelectItem>
                    )
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Photos Gallery */}
        {filteredPhotos.length === 0 ? (
          <Card className="p-12 text-center">
            <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="mb-2">
              {localPhotos.length === 0 
                ? 'No photos uploaded' 
                : 'No photos match your filters'
              }
            </h3>
            <p className="text-muted-foreground mb-6">
              {localPhotos.length === 0
                ? 'Add photos to showcase your property and attract more tenants'
                : 'Try adjusting your search or filters'
              }
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Photos
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPhotos.map((photo) => (
              <Card
                key={photo.id}
                className="overflow-hidden group cursor-move"
                draggable
                onDragStart={(e) => handleDragStart(e, photo.id)}
                onDragEnter={(e) => handleDragEnter(e, photo.id)}
                onDragEnd={() => setDraggedIndex(null)}
              >
                <div className="aspect-video relative">
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removePhoto(photo.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Drag Handle */}
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-4 h-4 text-white drop-shadow-lg" />
                  </div>

                  {/* Cover Badge */}
                  {photo.isCover && (
                    <Badge className="absolute top-2 right-2 bg-primary">
                      <Star className="w-3 h-3 mr-1" />
                      Cover
                    </Badge>
                  )}
                </div>

                <div className="p-4 space-y-3">
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
                        <Star className="w-3 h-3 mr-1" />
                        Set as Cover
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Photo View Dialog */}
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedPhoto?.filename}</DialogTitle>
            </DialogHeader>
            {selectedPhoto && (
              <div className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden">
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.filename}
                    className="w-full h-full object-contain bg-muted"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {selectedPhoto.room && (
                      <Badge variant="secondary">{selectedPhoto.room}</Badge>
                    )}
                    {selectedPhoto.isCover && (
                      <Badge className="bg-primary">
                        <Star className="w-3 h-3 mr-1" />
                        Cover Photo
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Save Changes Section */}
        {hasUnsavedChanges && (
          <Card className="p-6 mt-8 border-orange-200 bg-orange-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                  Unsaved changes
                </Badge>
                <p className="text-sm text-muted-foreground">
                  You have unsaved changes to your photos. Click "Save Changes" to apply them.
                </p>
              </div>
              <Button 
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </Card>
        )}

        {/* Tips */}
        <Card className="p-6 mt-8 bg-muted/50">
          <h3 className="mb-4 flex items-center">
            <ImageIcon className="w-5 h-5 text-primary mr-2" />
            Photo Tips
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Best Practices</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Use natural lighting when possible</li>
                <li>• Take photos from multiple angles</li>
                <li>• Ensure rooms are clean and uncluttered</li>
                <li>• Include exterior and common areas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Organization</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Tag photos by room for easy browsing</li>
                <li>• Set your best photo as the cover image</li>
                <li>• Order photos to tell a story</li>
                <li>• Include key selling points in photos</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}