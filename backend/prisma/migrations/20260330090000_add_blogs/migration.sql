-- Add blogs feature
CREATE TABLE "Blog" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "excerpt" TEXT,
  "content" TEXT NOT NULL,
  "coverImageUrl" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "authorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Blog_slug_key" ON "Blog"("slug");

ALTER TABLE "Blog"
ADD CONSTRAINT "Blog_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
