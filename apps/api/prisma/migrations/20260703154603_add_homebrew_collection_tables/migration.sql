-- CreateEnum
CREATE TYPE "HomebrewStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "HomebrewType" AS ENUM ('BACKGROUND', 'FEAT', 'MAGIC_ITEM', 'MONSTER', 'SPELL', 'SUBCLASS');

-- CreateEnum
CREATE TYPE "Source" AS ENUM ('PHB', 'DMG', 'MM', 'XGTE', 'TCOE', 'FTOD', 'VRGR', 'MPMM', 'SCAG', 'ERLW', 'EGW', 'GGR', 'SAiS', 'SatO', 'AAG', 'BGG', 'PAitM', 'BMT', 'PHB2024', 'DMG2024', 'MM2024', 'HOMEBREW');

-- CreateTable
CREATE TABLE "homebrew_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "HomebrewType" NOT NULL,
    "source" "Source" NOT NULL,
    "owner_id" TEXT,
    "status" "HomebrewStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "image_url" TEXT,
    "description" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homebrew_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_items" (
    "user_id" TEXT NOT NULL,
    "homebrew_item_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_items_pkey" PRIMARY KEY ("user_id","homebrew_item_id")
);

-- CreateIndex
CREATE INDEX "homebrew_items_type_status_idx" ON "homebrew_items"("type", "status");

-- CreateIndex
CREATE INDEX "homebrew_items_source_idx" ON "homebrew_items"("source");

-- CreateIndex
CREATE INDEX "homebrew_items_owner_id_idx" ON "homebrew_items"("owner_id");

-- CreateIndex
CREATE INDEX "homebrew_items_name_idx" ON "homebrew_items"("name");

-- CreateIndex
CREATE UNIQUE INDEX "homebrew_items_name_type_source_key" ON "homebrew_items"("name", "type", "source");

-- CreateIndex
CREATE INDEX "collection_items_homebrew_item_id_idx" ON "collection_items"("homebrew_item_id");

-- AddForeignKey
ALTER TABLE "homebrew_items" ADD CONSTRAINT "homebrew_items_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_homebrew_item_id_fkey" FOREIGN KEY ("homebrew_item_id") REFERENCES "homebrew_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
