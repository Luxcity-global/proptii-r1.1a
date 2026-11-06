# "I am Sorry !!!!!" image stamp: incident report

**Date:** 21 October 2026
**Branch:** `feature/document-vault`
**Status:** Fixed in the working tree, not yet committed

## Issue

Many photos across the site showed small black text in the bottom-left corner: "I am Sorry !!!!!". It appeared on the home page hero, the Contracts and Referencing heroes, the property listing cards, and several feature images.

## Cause

The text was saved into the image files themselves. The app code was not drawing it.

- Only JPEG files were affected. The PNG, SVG and other image files were clean.
- Git history shows that clean versions of these JPEGs were later re-saved with the text added. The oldest stamped copies date from around September 2025. Stamped copies were then committed on many branches.
- The text sits about 25px above the bottom edge, and its size scales with the image width.
- The text does not appear anywhere in the source code, CSS or HTML. Something outside the project modified the files on disk, probably software on a contributor's machine.

## Resolution

27 JPEG files were fixed. No code, CSS, file names, paths or image dimensions changed, so no feature is affected.

### Restored from git (21 files)

Each file was replaced with its most recent clean version from git history. Each restored version was checked to be identical to the stamped file apart from the text.

- `public/images/`: `01_Lady_Child_Family_BG.jpg`, `British-home-w2974.jpg`, `contracts-couple-agent.jpg`, `contracts-couple.jpg`, `detached-house.jpg`, `gpt-4o-Azure-OpenAI-05-25-2025_06_34_AM.jpg`, `hero-agent-happy-couple.jpg`, `hero-book-viewing.jpg`, `house-placeholder.jpg`, `modern-building.jpg`, `nav-image.jpg`, `nav-image-01.jpg`, `pexels-pixabay-w640.jpg`, `referencing-person.jpg`, `text-embeddings-Azure-OpenAI-05-26-2025.jpg`, `viewing-room.jpg`
- `public/images/listings/`: `property-bedroom.jpg`, `property-dining.jpg`, `property-exterior.jpg`, `property-garden.jpg`, `property-kitchen.jpg`

### Repaired by filling in the background (6 files)

No clean copy exists anywhere in git history for these files. The text was removed by filling its area to match the surrounding background, and each result was checked visually.

- `public/images/01_Man_Woman_Office_BG.jpg` (Contracts page hero)
- `public/images/pablo-merchan-montes-wYOPqmtDD0w-unsplash.jpg` (Referencing page hero)
- `public/images/listings/property-main.jpg`, `property-living.jpg`, `property-bathroom.jpg` (`ListingCard.tsx`)
- `public/images/UK-semiDetached-home-01.jpg` (same picture as `property-main.jpg`)

### Verification

- The bottom-left corner of every changed file was inspected before and after the fix.
- The home page was reloaded in a clean browser and the hero image no longer shows the text.

## Follow-up

1. **Commit the 27 image files.** Other branches still contain stamped copies and will need the same files merged in.
2. **Find the source.** Run a malware scan, such as a Microsoft Defender Offline scan, on any machine that has edited or committed these images. Also review recently installed software and browser extensions on those machines.
3. **Prefer original assets.** If the original stock photos for the six repaired images can be found, replace the repaired files with them for the best quality.
4. **Watch for recurrence.** If the text appears on new images, the stamping tool is still active somewhere.
