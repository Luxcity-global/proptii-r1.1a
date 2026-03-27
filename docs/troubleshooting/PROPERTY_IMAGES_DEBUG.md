# Property Images Debug Guide

## Issue
Images uploaded during "Add Property" flow don't appear when the property is loaded from the database.

## Changes Made

### 1. **Storing File Objects**
- Modified `ImagesAndNotesSelection.tsx` to store both:
  - Blob URLs (for preview)
  - File objects (for upload)

### 2. **Image Upload Function**
- Added `uploadPropertyImages()` in `App.tsx`
- Uploads images to Firebase Storage (`properties/` folder)
- Returns `PropertyPhoto[]` with Firebase Storage URLs

### 3. **Enhanced Logging**
- Added console logs to track:
  - Image upload progress
  - Property creation with photos
  - Property retrieval from Firestore
  - Photo mapping from Firestore documents

### 4. **Property Service Updates**
- Updated `createProperty()` to accept photos array
- Enhanced `mapPhotos()` with logging and safety checks
- Added console logs in `mapPropertyDoc()` to debug photo retrieval

## Debugging Steps

### Step 1: Check Browser Console
When publishing a property, check for these logs:

```
📤 Publishing property...
Uploading images to Firebase Storage...
✅ Image 1 uploaded successfully: [URL]
Creating property with photos: [count]
Property created with ID: [id]
Retrieved property from Firebase: [object]
Property photos count: [count]
```

### Step 2: Check Firestore Console
1. Go to: https://console.firebase.google.com/project/proptii-16946/firestore
2. Open the `properties` collection
3. Find your property document
4. Check if `photos` field exists and contains array of objects:
   ```json
   {
     "photos": [
       {
         "id": "photo-1234567890-0",
         "url": "https://firebasestorage.googleapis.com/...",
         "filename": "image.jpg",
         "isCover": true,
         "room": "Exterior"
       }
     ]
   }
   ```

### Step 3: Check Firebase Storage
1. Go to: https://console.firebase.google.com/project/proptii-16946/storage
2. Check the `properties/` folder
3. Verify images were uploaded

### Step 4: Verify Photo Mapping
Check browser console for:
```
Mapping property document: [id] Raw photos data: [array]
Mapping photos from Firestore: [count] photos
Photo 0: { id: "...", url: "...", ... }
Mapped property photos: [count]
```

## Common Issues

### Issue 1: Photos Array is Empty in Firestore
**Symptoms:** Property saved but `photos` field is empty array `[]`

**Possible Causes:**
- Images failed to upload to Firebase Storage
- `uploadPropertyImages()` returned empty array
- Check console for upload errors

**Solution:**
- Check Firebase Storage rules allow uploads to `properties/` folder
- Verify images are being selected correctly
- Check network tab for upload failures

### Issue 2: Photos Exist in Firestore But Not Displayed
**Symptoms:** Property has photos in Firestore but UI shows no images

**Possible Causes:**
- Photos array structure doesn't match expected format
- URL field is missing or empty
- Photo mapping function not working correctly

**Solution:**
- Check console logs for mapping warnings
- Verify photo URLs are valid Firebase Storage URLs
- Check if `mapPhotos()` is being called

### Issue 3: Images Upload but Property Created Without Photos
**Symptoms:** Upload succeeds but property has no photos

**Possible Causes:**
- `newProperty.photos` not set correctly
- Photos lost during `addProperty()` call
- Firestore doesn't save nested objects

**Solution:**
- Check console for "Creating property with photos: [count]"
- Verify `propertyDoc.photos` before saving
- Ensure photos array is plain objects (no functions, no undefined values)

## Code Structure

### Photo Upload Flow:
1. User selects images → stored as File objects in `propertySetupData.imageFiles`
2. User clicks "Publish Property" → `uploadPropertyImages()` called
3. Images uploaded to Firebase Storage → returns `PropertyPhoto[]`
4. Property created with photos array
5. Property saved to Firestore

### Photo Display Flow:
1. Property loaded from Firestore → `getProperty()` or `getProperties()`
2. Firestore document mapped → `mapPropertyDoc()`
3. Photos array mapped → `mapPhotos()`
4. Property object returned with `photos` array
5. UI components access `property.photos[].url`

## Next Steps

1. **Rebuild the app** (required):
   ```bash
   cd src/landlord_agent
   npm run build
   cd ../..
   copy src\landlord_agent\build\assets\index-*.js public\assets\
   copy src\landlord_agent\build\assets\index-*.css public\assets\
   ```

2. **Test the flow**:
   - Add a property with images
   - Check browser console logs
   - Verify images appear in PropertyPreview
   - Check Firestore console for saved photos

3. **If images still don't appear**:
   - Share browser console logs
   - Share Firestore document structure
   - Check Firebase Storage for uploaded files


