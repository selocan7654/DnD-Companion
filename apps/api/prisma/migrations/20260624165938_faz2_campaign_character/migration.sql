-- CreateEnum
CREATE TYPE "CharacterVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "banner_url" TEXT,
    "setting" TEXT,
    "owner_id" TEXT NOT NULL,
    "invite_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_members" (
    "campaign_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_members_pkey" PRIMARY KEY ("campaign_id","user_id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "name" TEXT NOT NULL,
    "race" TEXT,
    "class_name" TEXT,
    "subclass" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "background" TEXT,
    "alignment" TEXT,
    "experience_points" INTEGER NOT NULL DEFAULT 0,
    "ability_scores" JSONB NOT NULL DEFAULT '{"STR":10,"DEX":10,"CON":10,"INT":10,"WIS":10,"CHA":10}',
    "hit_points_max" INTEGER,
    "hit_points_current" INTEGER,
    "temporary_hit_points" INTEGER NOT NULL DEFAULT 0,
    "armor_class" INTEGER,
    "speed" INTEGER,
    "proficiency_bonus" INTEGER,
    "saving_throws" JSONB,
    "skills" JSONB,
    "features_and_traits" JSONB,
    "equipment" JSONB,
    "spell_slots" JSONB,
    "known_spells" JSONB,
    "death_saves" JSONB NOT NULL DEFAULT '{"successes":0,"failures":0}',
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "portrait_url" TEXT,
    "visibility" "CharacterVisibility" NOT NULL DEFAULT 'PRIVATE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_notes" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_invite_token_key" ON "campaigns"("invite_token");

-- CreateIndex
CREATE INDEX "campaigns_owner_id_idx" ON "campaigns"("owner_id");

-- CreateIndex
CREATE INDEX "campaign_members_user_id_idx" ON "campaign_members"("user_id");

-- CreateIndex
CREATE INDEX "characters_owner_id_idx" ON "characters"("owner_id");

-- CreateIndex
CREATE INDEX "characters_campaign_id_idx" ON "characters"("campaign_id");

-- CreateIndex
CREATE INDEX "dm_notes_campaign_id_sort_idx" ON "dm_notes"("campaign_id", "sort_order");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dm_notes" ADD CONSTRAINT "dm_notes_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
