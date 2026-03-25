-- Add dedicated cover image and multi preview images for events
ALTER TABLE "Event"
ADD COLUMN "coverImageUrl" TEXT,
ADD COLUMN "previewImageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
