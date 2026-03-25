-- Add optional preview image URL for events
ALTER TABLE "Event"
ADD COLUMN "imageUrl" TEXT;
