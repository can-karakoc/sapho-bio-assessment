#!/usr/bin/env tsx

/**
 * Profile Enrichment Script
 *
 * Fetches LinkedIn profile data (photo + follower count) for each influencer
 * and downloads photos locally to public/avatars/<id>.jpg
 *
 * USAGE:
 *   npm run enrich
 *
 * REQUIREMENTS:
 *   - APIFY_TOKEN environment variable
 *   - Apify actor: harvestapi/linkedin-profile-scraper or dev_fusion/linkedin-profile-scraper
 */

import dotenv from "dotenv";
import { ApifyClient } from "apify-client";
import fs from "fs/promises";
import path from "path";
import type { Influencer } from "../lib/types";

dotenv.config({ path: ".env.local" });

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const DATA_DIR = path.join(process.cwd(), "data");
const AVATARS_DIR = path.join(process.cwd(), "public", "avatars");

// Try multiple actors (in order of preference)
const ACTOR_NAME = "harvestapi/linkedin-profile-scraper";

interface EnrichmentResult {
  name: string;
  avatarSet: boolean;
  followers: number | null;
}

async function main() {
  if (!APIFY_TOKEN) {
    console.log("⚠️  APIFY_TOKEN not set - enrichment skipped");
    console.log("");
    console.log("To enable profile enrichment:");
    console.log("1. Set APIFY_TOKEN in your .env.local file");
    console.log("2. Run: npm run enrich");
    console.log("");
    process.exit(0);
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });

  console.log("🚀 Starting profile enrichment...\n");

  // Load influencers
  const influencersPath = path.join(DATA_DIR, "influencers.json");
  const influencersData = await fs.readFile(influencersPath, "utf-8");
  const influencers: Influencer[] = JSON.parse(influencersData);

  console.log(`📋 Loaded ${influencers.length} influencers\n`);

  // Ensure avatars directory exists
  await fs.mkdir(AVATARS_DIR, { recursive: true });

  const results: EnrichmentResult[] = [];

  for (const influencer of influencers) {
    console.log(`Processing ${influencer.name}...`);

    try {
      // Call Apify actor
      const run = await client.actor(ACTOR_NAME).call({
        urls: [influencer.linkedinUrl],
      });

      const { items } = await client.dataset(run.defaultDatasetId).listItems();

      if (items.length === 0) {
        console.log(`  ⚠️  No data returned for ${influencer.name}`);
        results.push({
          name: influencer.name,
          avatarSet: false,
          followers: influencer.signals?.followers ?? null,
        });
        continue;
      }

      const profile = items[0] as any;

      // Log keys for defensive mapping
      if (influencers.indexOf(influencer) === 0) {
        console.log(
          `  [DEBUG] First profile keys: ${Object.keys(profile).join(", ")}`
        );
      }

      // Extract profile photo URL (defensive mapping)
      const photoUrl =
        profile.photo ??
        profile.profilePicture ??
        profile.profilePictureUrl ??
        profile.avatar ??
        profile.picture ??
        profile.photoUrl ??
        profile.imageUrl;

      // Extract follower count (defensive mapping)
      const followersCount =
        profile.followers ??
        profile.followerCount ??
        profile.followersCount ??
        profile.connectionsCount;

      let avatarSet = false;

      // Download profile photo if available
      if (photoUrl && typeof photoUrl === "string") {
        try {
          const response = await fetch(photoUrl);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            const avatarPath = path.join(AVATARS_DIR, `${influencer.id}.jpg`);
            await fs.writeFile(avatarPath, Buffer.from(buffer));

            // Set local path (NOT the external URL)
            influencer.avatarUrl = `/avatars/${influencer.id}.jpg`;
            avatarSet = true;
            console.log(`  ✓ Downloaded photo to ${avatarPath}`);
          } else {
            console.log(`  ⚠️  Failed to download photo (status ${response.status})`);
          }
        } catch (error) {
          console.log(`  ⚠️  Photo download error: ${error}`);
        }
      } else {
        console.log(`  ⚠️  No photo URL found`);
      }

      // Update follower count if currently null
      if (
        typeof followersCount === "number" &&
        (influencer.signals?.followers === null ||
          influencer.signals?.followers === undefined)
      ) {
        if (!influencer.signals) {
          influencer.signals = {};
        }
        influencer.signals.followers = followersCount;
        console.log(`  ✓ Set followers: ${followersCount}`);
      }

      results.push({
        name: influencer.name,
        avatarSet,
        followers: influencer.signals?.followers ?? null,
      });

      console.log("");
    } catch (error) {
      console.error(`  ✗ Failed to enrich ${influencer.name}:`, error);
      results.push({
        name: influencer.name,
        avatarSet: false,
        followers: influencer.signals?.followers ?? null,
      });
      console.log("");
    }
  }

  // Save updated influencers
  await fs.writeFile(influencersPath, JSON.stringify(influencers, null, 2));

  // Print summary table
  console.log("\n✅ Enrichment complete!\n");
  console.log("╔══════════════════════════════════════╦═══════════╦═════════════╗");
  console.log("║ Name                                 ║ Avatar    ║ Followers   ║");
  console.log("╠══════════════════════════════════════╬═══════════╬═════════════╣");

  for (const result of results) {
    const namePadded = result.name.padEnd(36).substring(0, 36);
    const avatarStatus = result.avatarSet ? "✓" : "—";
    const followersStr =
      result.followers !== null ? result.followers.toString() : "—";

    console.log(
      `║ ${namePadded} ║ ${avatarStatus.padEnd(9)} ║ ${followersStr.padEnd(11)} ║`
    );
  }

  console.log("╚══════════════════════════════════════╩═══════════╩═════════════╝");
  console.log(`\nSaved to ${influencersPath}`);
  console.log(`Photos in ${AVATARS_DIR}\n`);
}

main().catch((error) => {
  console.error("❌ Enrichment failed:", error);
  process.exit(1);
});
