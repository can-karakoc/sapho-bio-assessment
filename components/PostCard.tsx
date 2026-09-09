"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar } from "./Avatar";
import { StatusChip } from "./StatusChip";
import { formatRelativeDate } from "@/lib/format";
import { useSessionActivity } from "@/lib/context/SessionActivityContext";
import type { Post, Influencer, GeneratedResponse } from "@/lib/types";

type BrandVoice = "peer-expert" | "warm" | "concise";
type LengthTweak = "none" | "shorter" | "longer";

const QUICK_TWEAKS = {
  "no-pitch": "Do NOT mention or pitch Sapho's product; keep it pure peer engagement — add value or ask a question.",
  "warmer": "Use a warmer, more personal tone.",
  "technical": "Use more precise technical / domain language.",
  "question": "End with a thoughtful question that invites a reply.",
  "hook": "Open with a stronger, more specific hook.",
  "sapho-angle": "Include a light, on-topic tie to Sapho's rapid release testing, only if genuinely relevant.",
} as const;

interface PostCardProps {
  post: Post;
  influencer: Influencer;
  showInfluencer?: boolean;
}

export function PostCard({
  post,
  influencer,
  showInfluencer: _showInfluencer = false,
}: PostCardProps) {
  const { addActivity } = useSessionActivity();
  const [goal, setGoal] = useState<"comment" | "dm">("comment");
  const [brandVoice, setBrandVoice] = useState<BrandVoice>("peer-expert");
  const [isEditing, setIsEditing] = useState(false);
  const [postExpanded, setPostExpanded] = useState(false);

  // Regen tweak panel state
  const [showTweakPanel, setShowTweakPanel] = useState(false);
  const [lengthTweak, setLengthTweak] = useState<LengthTweak>("none");
  const [customInstruction, setCustomInstruction] = useState("");
  const [selectedTweaks, setSelectedTweaks] = useState<Set<keyof typeof QUICK_TWEAKS>>(new Set());
  const tweakPanelRef = useRef<HTMLDivElement>(null);

  // Ephemeral state - NEVER persisted to files
  // Start with file status for SSR/hydration, then update from localStorage
  const [localStatus, setLocalStatus] = useState<
    "new" | "drafted" | "posted" | "skipped" | undefined
  >(post.status);
  const [draft, setDraft] = useState<GeneratedResponse | null>(null);
  const [draftText, setDraftText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load persisted draft state from localStorage (full state restoration)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("saphoEngage.v1.drafts");
      if (stored) {
        const drafts = JSON.parse(stored);
        const postDraft = drafts[post.id];
        if (postDraft) {
          // Restore all state
          if (postDraft.goal) setGoal(postDraft.goal);
          if (postDraft.voice) setBrandVoice(postDraft.voice);
          if (postDraft.text) setDraftText(postDraft.text);
          if (postDraft.status) setLocalStatus(postDraft.status);

          // Restore draft metadata if present
          if (postDraft.draft) {
            setDraft(postDraft.draft);
            setShowControls(true); // Show controls immediately for restored drafts
          }
        }
      }
    } catch (err) {
      console.warn("Failed to load draft from localStorage:", err);
    }
  }, [post.id]);

  // Click outside to close tweak panel
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (tweakPanelRef.current && !tweakPanelRef.current.contains((event as MouseEvent).target as Node)) {
        setShowTweakPanel(false);
      }
    };

    if (showTweakPanel) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showTweakPanel]);

  // Persist full draft state to localStorage whenever it changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem("saphoEngage.v1.drafts");
      const drafts = stored ? JSON.parse(stored) : {};

      drafts[post.id] = {
        goal,
        voice: brandVoice,
        text: draftText,
        status: localStatus,
        draft: draft, // Include full draft metadata
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem("saphoEngage.v1.drafts", JSON.stringify(drafts));
    } catch (err) {
      console.warn("Failed to save draft to localStorage:", err);
    }
  }, [post.id, goal, brandVoice, draftText, localStatus, draft]);

  const dmDisabled = post.flags?.complianceNegative ?? false;
  const activeGoal = goal === "dm" && dmDisabled ? "comment" : goal;
  const isDone = localStatus === "posted" || localStatus === "skipped";

  // Check if post is long enough to need expansion
  const postNeedsExpansion = post.text.length > 280;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setIsStreaming(true);
    setShowControls(false);
    setError(null);
    setDraftText(""); // Clear previous
    setDraft(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          config: {
            goal: activeGoal,
            brandVoice,
            instructions: "",
          },
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let metadata: {
        fullText: string;
        model: string;
        latencyMs: number;
        usedSources: string[];
        needsReview: boolean;
        variantId: string;
        provider: string;
      } | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Check for metadata marker
        const metadataMarker = "__METADATA__\n";
        const metadataIndex = buffer.indexOf(metadataMarker);

        if (metadataIndex !== -1) {
          const textBefore = buffer.slice(0, metadataIndex);
          if (textBefore) {
            setDraftText((prev) => prev + textBefore);
          }

          const afterMarker = buffer.slice(metadataIndex + metadataMarker.length);
          const metadataEnd = afterMarker.indexOf("\n");
          if (metadataEnd !== -1) {
            try {
              metadata = JSON.parse(afterMarker.slice(0, metadataEnd));
            } catch (e) {
              console.error("Failed to parse metadata:", e);
            }
          }
          break;
        } else {
          // Append chunk to draft
          setDraftText((prev) => prev + buffer);
          buffer = "";
        }
      }

      // Set final draft with metadata
      if (metadata) {
        const draftResponse: GeneratedResponse = {
          text: metadata.fullText,
          model: metadata.model,
          latencyMs: metadata.latencyMs,
          usedSources: metadata.usedSources,
          needsReview: metadata.needsReview,
          variantId: metadata.variantId,
          provider: metadata.provider,
        };
        setDraft(draftResponse);
        setDraftText(metadata.fullText); // Final text
        setLocalStatus("drafted");

        // Fade in controls after a brief delay
        setTimeout(() => setShowControls(true), 150);

        // DON'T add to History yet - only when posted
        // addActivity({...}); // Removed - History is for posted responses only
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
    }
  };

  const handleRegenerate = async (withTweaks = false) => {
    setIsGenerating(true);
    setIsStreaming(true);
    setShowControls(false);
    setError(null);
    setDraftText("");
    setDraft(null);
    if (withTweaks) setShowTweakPanel(false);

    try {
      // Build instructions from tweaks
      let instructions = "";

      // Add length directive
      if (lengthTweak === "shorter") {
        instructions += "Make it noticeably shorter (1-2 sentences). ";
      } else if (lengthTweak === "longer") {
        instructions += "Add a bit more depth (up to ~4 sentences). ";
      }

      // Add quick tweaks
      selectedTweaks.forEach((tweakKey) => {
        instructions += QUICK_TWEAKS[tweakKey] + " ";
      });

      // Add custom instruction
      if (customInstruction.trim()) {
        instructions += customInstruction.trim();
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          config: {
            goal: activeGoal,
            brandVoice,
            instructions: instructions.trim(),
          },
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Regeneration failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let metadata: {
        fullText: string;
        model: string;
        latencyMs: number;
        usedSources: string[];
        needsReview: boolean;
        variantId: string;
        provider: string;
      } | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Check for metadata marker
        const metadataMarker = "__METADATA__\n";
        const metadataIndex = buffer.indexOf(metadataMarker);

        if (metadataIndex !== -1) {
          const textBefore = buffer.slice(0, metadataIndex);
          if (textBefore) {
            setDraftText((prev) => prev + textBefore);
          }

          const afterMarker = buffer.slice(metadataIndex + metadataMarker.length);
          const metadataEnd = afterMarker.indexOf("\n");
          if (metadataEnd !== -1) {
            try {
              metadata = JSON.parse(afterMarker.slice(0, metadataEnd));
            } catch (e) {
              console.error("Failed to parse metadata:", e);
            }
          }
          break;
        } else {
          setDraftText((prev) => prev + buffer);
          buffer = "";
        }
      }

      // Set final draft with metadata
      if (metadata) {
        const draftResponse: GeneratedResponse = {
          text: metadata.fullText,
          model: metadata.model,
          latencyMs: metadata.latencyMs,
          usedSources: metadata.usedSources,
          needsReview: metadata.needsReview,
          variantId: metadata.variantId,
          provider: metadata.provider,
        };
        setDraft(draftResponse);
        setDraftText(metadata.fullText);

        // IMPORTANT: Set status to drafted immediately
        setLocalStatus("drafted");

        setTimeout(() => setShowControls(true), 150);

        // Log regenerate event
        await fetch("/api/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: post.id,
            action: "regenerated",
          }),
        });

        // Record in session activity
        addActivity({
          id: `${post.id}-${Date.now()}`,
          postId: post.id,
          influencerId: influencer.id,
          influencerName: influencer.name,
          postSnippet: post.text.slice(0, 120) + (post.text.length > 120 ? "..." : ""),
          goal: activeGoal,
          model: draftResponse.model,
          text: draftResponse.text,
          action: "regenerated",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regeneration failed");
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draftText);

      // Log copy event
      await fetch("/api/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          action: "copied",
        }),
      });

      // Record in session activity
      if (draft) {
        addActivity({
          id: `${post.id}-${Date.now()}`,
          postId: post.id,
          influencerId: influencer.id,
          influencerName: influencer.name,
          postSnippet: post.text.slice(0, 120) + (post.text.length > 120 ? "..." : ""),
          goal: activeGoal,
          model: draft.model,
          text: draftText,
          action: "copied",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handlePost = async () => {
    // Auto-copy to clipboard before posting
    try {
      await navigator.clipboard.writeText(draftText);
      console.log("✓ Copied to clipboard");
    } catch (err) {
      console.warn("Failed to copy to clipboard:", err);
    }

    // Set local status to posted
    setLocalStatus("posted");

    // Open LinkedIn post in new tab
    window.open(post.url, "_blank");

    // Log posted event and add to History (ONLY when posting)
    try {
      await fetch("/api/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          action: "posted",
        }),
      });

      // NOW add to History - this is when it moves from Queue to History
      if (draft) {
        addActivity({
          id: `${post.id}-${Date.now()}`,
          postId: post.id,
          influencerId: influencer.id,
          influencerName: influencer.name,
          postSnippet: post.text.slice(0, 120) + (post.text.length > 120 ? "..." : ""),
          goal: activeGoal,
          model: draft.model,
          text: draftText,
          action: "posted",
          createdAt: new Date().toISOString(),
        });
      }

      // Update localStorage to mark as posted (instead of deleting)
      // This ensures the card stays out of Queue on reload
      try {
        const stored = localStorage.getItem("saphoEngage.v1.drafts");
        const drafts = stored ? JSON.parse(stored) : {};

        drafts[post.id] = {
          goal: activeGoal,
          voice: brandVoice,
          text: draftText,
          status: "posted", // Mark as posted
          draft: draft,
          updatedAt: new Date().toISOString(),
        };

        localStorage.setItem("saphoEngage.v1.drafts", JSON.stringify(drafts));
      } catch (err) {
        console.warn("Failed to update posted status in localStorage:", err);
      }
    } catch (err) {
      console.error("Event logging failed:", err);
    }
  };

  const handleSkip = async () => {
    // Set local status to skipped
    setLocalStatus("skipped");

    // Log skip event
    try {
      await fetch("/api/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          action: "skipped",
        }),
      });

      // Record in session activity
      addActivity({
        id: `${post.id}-${Date.now()}`,
        postId: post.id,
        influencerId: influencer.id,
        influencerName: influencer.name,
        postSnippet: post.text.slice(0, 120) + (post.text.length > 120 ? "..." : ""),
        goal: activeGoal,
        model: draft?.model || "N/A",
        text: draftText || "",
        action: "skipped",
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Event logging failed:", err);
    }
  };

  return (
    <div
      className={`bg-surface border border-line rounded-lg shadow-sm ${
        isDone ? "opacity-60" : ""
      } ${showTweakPanel ? "relative z-10" : "relative z-0"}`}
    >
      {/* Attribution */}
      <div className="flex items-center gap-3 px-5 pt-5">
        <Avatar
          name={influencer.name}
          avatarUrl={influencer.avatarUrl}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="font-sans font-semibold text-sm text-ink tracking-tight">
            {influencer.name}
          </div>
          <div className="font-sans text-[11px] text-muted uppercase tracking-tight mt-0.5">
            {influencer.company} · {formatRelativeDate(post.postedAt)} · 👍{" "}
            {post.reactions} 💬 {post.comments}
          </div>
        </div>
        <StatusChip
          status={
            (localStatus || "new") as "new" | "drafted" | "posted" | "skipped"
          }
        />
      </div>

      {/* Post text - READING FONT with expandable */}
      <div className="px-5 py-4">
        <div
          className={`font-reading text-[15px] text-ink leading-relaxed whitespace-pre-wrap relative ${
            !postExpanded && postNeedsExpansion ? "line-clamp-4" : ""
          }`}
        >
          {post.text}
          {/* Subtle fade when collapsed */}
          {!postExpanded && postNeedsExpansion && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-surface to-transparent pointer-events-none" />
          )}
        </div>
        {/* Expand/collapse toggle - only show for long posts */}
        {postNeedsExpansion && (
          <button
            onClick={() => setPostExpanded(!postExpanded)}
            className="font-sans text-[11px] text-muted uppercase tracking-tight mt-2 hover:text-ink transition-colors"
          >
            {postExpanded ? "Show less" : "Show full post"}
          </button>
        )}
      </div>

      {/* Draft section */}
      <div className="bg-bg border-t border-line px-5 py-4 rounded-b-lg">
        {/* Error message */}
        {error && (
          <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-sm">
            <p className="font-sans text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Draft content or generation prompt */}
        {draft || draftText || isEditing || isGenerating ? (
          <>
            {/* Shimmer skeleton while waiting for first token */}
            {isGenerating && !draftText && !isEditing && (
              <div className="space-y-2 py-2 animate-pulse">
                <div className="h-4 bg-gradient-to-r from-line via-highlight-mint to-line bg-[length:200%_100%] animate-shimmer rounded-sm w-full" />
                <div className="h-4 bg-gradient-to-r from-line via-highlight-mint to-line bg-[length:200%_100%] animate-shimmer rounded-sm w-5/6" />
                <div className="h-4 bg-gradient-to-r from-line via-highlight-mint to-line bg-[length:200%_100%] animate-shimmer rounded-sm w-4/6" />
              </div>
            )}

            {/* Existing draft */}
            {isEditing ? (
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                className="w-full font-reading text-[15px] leading-relaxed text-ink bg-surface border border-highlight-teal rounded-sm px-3 py-2.5 resize-vertical min-h-[100px]"
                placeholder="Edit draft..."
              />
            ) : draftText ? (
              <div className="font-reading text-[15px] leading-relaxed text-ink py-1 animate-in fade-in duration-300">
                {draftText}
                {isStreaming && (
                  <span className="inline-block w-0.5 h-4 bg-highlight-teal ml-1 animate-pulse" />
                )}
              </div>
            ) : null}

            {/* Grounding chips + needs-review badge */}
            {draft && (
              <div className={`flex items-center gap-2 flex-wrap mt-3 transition-all duration-500 ${
                showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}>
                {/* Voice chip */}
                <span className="font-sans text-[10px] text-muted bg-surface border border-line rounded-sm px-1.5 py-0.5 uppercase tracking-tight">
                  Voice: {brandVoice}
                </span>

                {/* Sources chips */}
                {draft.usedSources.map((source, idx) => (
                  <span
                    key={idx}
                    className="font-sans text-[10px] text-muted bg-surface border border-line rounded-sm px-1.5 py-0.5 uppercase tracking-tight"
                  >
                    📄 {source}
                  </span>
                ))}

                {/* Needs review badge */}
                {draft.needsReview && (
                  <span className="font-sans text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-1.5 py-0.5 uppercase tracking-tight font-semibold">
                    ⚠️ Review
                  </span>
                )}

                {/* Model info */}
                <span className="font-sans text-[10px] text-muted bg-surface border border-line rounded-sm px-1.5 py-0.5 uppercase tracking-tight ml-auto">
                  {draft.model} · {draft.latencyMs}ms
                </span>
              </div>
            )}

            {/* Selectors - always visible */}
            <div className={`flex items-center gap-3 flex-wrap mt-4 pb-3 border-b border-line transition-all duration-500 ${
              showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}>
              {/* Response type */}
              <div className="flex items-center gap-2">
                <span className="font-sans text-[11px] text-muted uppercase tracking-tight">
                  Type
                </span>
                <div className="inline-flex bg-surface border border-line rounded-sm p-[2px]">
                  <button
                    onClick={() => setGoal("comment")}
                    className={`font-sans text-xs px-2.5 py-1 rounded-sm transition-all uppercase tracking-tight ${
                      activeGoal === "comment"
                        ? "bg-highlight-teal text-surface font-semibold"
                        : "text-ink hover:text-highlight-teal"
                    }`}
                  >
                    💬 Comment
                  </button>
                  <button
                    onClick={() => !dmDisabled && setGoal("dm")}
                    disabled={dmDisabled}
                    className={`font-sans text-xs px-2.5 py-1 rounded-sm transition-all uppercase tracking-tight ${
                      dmDisabled
                        ? "text-muted/40 cursor-not-allowed"
                        : activeGoal === "dm"
                        ? "bg-highlight-teal text-surface font-semibold"
                        : "text-ink hover:text-highlight-teal"
                    }`}
                  >
                    ✉️ DM
                  </button>
                </div>
              </div>

              {/* Voice */}
              <div className="flex items-center gap-2">
                <span className="font-sans text-[11px] text-muted uppercase tracking-tight">
                  Voice
                </span>
                <div className="inline-flex bg-surface border border-line rounded-sm p-[2px]">
                  <button
                    onClick={() => setBrandVoice("peer-expert")}
                    className={`font-sans text-xs px-2.5 py-1 rounded-sm transition-all uppercase tracking-tight ${
                      brandVoice === "peer-expert"
                        ? "bg-highlight-teal text-surface font-semibold"
                        : "text-ink hover:text-highlight-teal"
                    }`}
                  >
                    Peer
                  </button>
                  <button
                    onClick={() => setBrandVoice("warm")}
                    className={`font-sans text-xs px-2.5 py-1 rounded-sm transition-all uppercase tracking-tight ${
                      brandVoice === "warm"
                        ? "bg-highlight-teal text-surface font-semibold"
                        : "text-ink hover:text-highlight-teal"
                    }`}
                  >
                    Warm
                  </button>
                  <button
                    onClick={() => setBrandVoice("concise")}
                    className={`font-sans text-xs px-2.5 py-1 rounded-sm transition-all uppercase tracking-tight ${
                      brandVoice === "concise"
                        ? "bg-highlight-teal text-surface font-semibold"
                        : "text-ink hover:text-highlight-teal"
                    }`}
                  >
                    Concise
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={`flex gap-2 flex-wrap mt-3 transition-all duration-500 ${
              showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}>
              {/* Left side actions */}
              {/* Split Regen button */}
              <div className="relative inline-flex" ref={tweakPanelRef}>
                <button
                  onClick={() => handleRegenerate(false)}
                  disabled={isGenerating}
                  className="font-sans border border-line border-r-0 bg-surface text-ink text-xs font-medium pl-3 pr-2 py-2 rounded-l-sm hover:border-highlight-teal transition-all uppercase tracking-tight disabled:opacity-50"
                >
                  {isGenerating ? "..." : "↻ Regen"}
                </button>
                <button
                  onClick={() => setShowTweakPanel(!showTweakPanel)}
                  disabled={isGenerating}
                  className="font-sans border border-line bg-surface text-ink text-xs font-medium px-1.5 py-2 rounded-r-sm hover:border-highlight-teal transition-all disabled:opacity-50"
                  title="Regenerate with tweaks"
                >
                  ▾
                </button>

                {/* Tweak popover - absolute positioning, scrolls with content */}
                {showTweakPanel && (
                  <div
                    className="absolute top-full left-0 mt-1 w-80 border-2 border-line rounded-sm shadow-2xl z-[9999] p-3"
                    style={{ backgroundColor: '#ffffff' }}
                  >
                    {/* Length selector */}
                    <div className="mb-3">
                      <label className="font-sans text-[10px] text-muted uppercase tracking-tight block mb-1.5">
                        Length
                      </label>
                      <div className="inline-flex bg-bg border border-line rounded-sm p-[2px] w-full">
                        <button
                          onClick={() => setLengthTweak("none")}
                          className={`font-sans text-xs px-3 py-1.5 rounded-sm transition-all uppercase tracking-tight flex-1 ${
                            lengthTweak === "none"
                              ? "bg-highlight-teal text-surface font-semibold"
                              : "text-ink hover:text-highlight-teal"
                          }`}
                        >
                          None
                        </button>
                        <button
                          onClick={() => setLengthTweak("shorter")}
                          className={`font-sans text-xs px-3 py-1.5 rounded-sm transition-all uppercase tracking-tight flex-1 ${
                            lengthTweak === "shorter"
                              ? "bg-highlight-teal text-surface font-semibold"
                              : "text-ink hover:text-highlight-teal"
                          }`}
                        >
                          Shorter
                        </button>
                        <button
                          onClick={() => setLengthTweak("longer")}
                          className={`font-sans text-xs px-3 py-1.5 rounded-sm transition-all uppercase tracking-tight flex-1 ${
                            lengthTweak === "longer"
                              ? "bg-highlight-teal text-surface font-semibold"
                              : "text-ink hover:text-highlight-teal"
                          }`}
                        >
                          Longer
                        </button>
                      </div>
                    </div>

                    {/* Quick tweaks - multi-select chips */}
                    <div className="mb-3">
                      <label className="font-sans text-[10px] text-muted uppercase tracking-tight block mb-1.5">
                        Quick tweaks
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(QUICK_TWEAKS).map(([key, _directive]) => {
                          const isSelected = selectedTweaks.has(key as keyof typeof QUICK_TWEAKS);
                          const labels: Record<string, string> = {
                            "no-pitch": "No pitch",
                            "warmer": "Warmer",
                            "technical": "More technical",
                            "question": "Add a question",
                            "hook": "Punchier hook",
                            "sapho-angle": "Add Sapho angle",
                          };
                          return (
                            <button
                              key={key}
                              onClick={() => {
                                const newTweaks = new Set(selectedTweaks);
                                if (isSelected) {
                                  newTweaks.delete(key as keyof typeof QUICK_TWEAKS);
                                } else {
                                  newTweaks.add(key as keyof typeof QUICK_TWEAKS);
                                }
                                setSelectedTweaks(newTweaks);
                              }}
                              className={`font-mono text-[10px] px-2 py-1 rounded-sm transition-all uppercase tracking-tight ${
                                isSelected
                                  ? "bg-highlight-mint text-ink border border-highlight-teal"
                                  : "bg-bg text-muted border border-line hover:border-highlight-teal"
                              }`}
                            >
                              {labels[key]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom instruction */}
                    <div className="mb-3">
                      <label className="font-sans text-[10px] text-muted uppercase tracking-tight block mb-1.5">
                        Custom instruction
                      </label>
                      <input
                        type="text"
                        value={customInstruction}
                        onChange={(e) => setCustomInstruction(e.target.value)}
                        placeholder="Additional guidance..."
                        className="w-full font-sans text-xs text-ink bg-bg border border-line rounded-sm px-2 py-1.5 placeholder:text-muted/50"
                      />
                    </div>

                    {/* Apply button */}
                    <button
                      onClick={() => handleRegenerate(true)}
                      className="w-full font-sans border border-highlight-teal bg-highlight-teal text-surface text-xs font-semibold px-3 py-2 rounded-sm hover:bg-highlight-teal/90 transition-all uppercase tracking-tight"
                    >
                      ↻ Regenerate with tweaks
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleEdit}
                className="font-sans border border-line bg-surface text-ink text-xs font-medium px-3 py-2 rounded-sm hover:border-highlight-teal transition-all uppercase tracking-tight"
              >
                {isEditing ? "✓ Done" : "✎ Edit"}
              </button>
              <button
                onClick={handleCopy}
                className="font-sans border border-line bg-surface text-ink text-xs font-medium px-3 py-2 rounded-sm hover:border-highlight-teal transition-all uppercase tracking-tight"
              >
                ⧉ Copy
              </button>
              <button
                onClick={handlePost}
                className="font-sans border border-highlight-teal bg-highlight-teal text-surface text-xs font-semibold px-3 py-2 rounded-sm hover:bg-highlight-teal/90 transition-all uppercase tracking-tight"
              >
                {activeGoal === "comment" ? "Post ↗" : "Send ↗"}
              </button>

              {/* Right side actions */}
              <button
                onClick={() => {
                  setDraft(null);
                  setDraftText("");
                  setLocalStatus("new");
                  setShowControls(false);

                  // Clear from localStorage when discarded
                  try {
                    const stored = localStorage.getItem("saphoEngage.v1.drafts");
                    if (stored) {
                      const drafts = JSON.parse(stored);
                      delete drafts[post.id];
                      localStorage.setItem("saphoEngage.v1.drafts", JSON.stringify(drafts));
                    }
                  } catch (err) {
                    console.warn("Failed to clear discarded draft:", err);
                  }
                }}
                className="font-sans border-transparent text-muted text-xs font-medium px-3 py-2 rounded-sm ml-auto hover:text-red-600 transition-all uppercase tracking-tight"
              >
                Discard
              </button>

              {localStatus !== "skipped" && (
                <button
                  onClick={handleSkip}
                  className="font-sans border-transparent text-muted text-xs font-medium px-3 py-2 rounded-sm hover:text-ink transition-all uppercase tracking-tight"
                >
                  Skip
                </button>
              )}

              {localStatus === "skipped" && (
                <button
                  onClick={() => {
                    setLocalStatus(draftText ? "drafted" : "new");
                  }}
                  className="font-sans border border-line bg-surface text-ink text-xs font-medium px-3 py-2 rounded-sm hover:border-highlight-teal transition-all uppercase tracking-tight"
                >
                  ↺ Undo Skip
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Selectors - always visible */}
            <div className="flex items-center gap-3 flex-wrap pb-3 border-b border-line">
              {/* Response type */}
              <div className="flex items-center gap-2">
                <span className="font-sans text-[11px] text-muted uppercase tracking-tight">
                  Type
                </span>
                <div className="inline-flex bg-surface border border-line rounded-sm p-[2px]">
                  <button
                    onClick={() => setGoal("comment")}
                    className={`font-sans text-xs px-2.5 py-1 rounded-sm transition-all uppercase tracking-tight ${
                      activeGoal === "comment"
                        ? "bg-highlight-teal text-surface font-semibold"
                        : "text-ink hover:text-highlight-teal"
                    }`}
                  >
                    💬 Comment
                  </button>
                  <button
                    onClick={() => !dmDisabled && setGoal("dm")}
                    disabled={dmDisabled}
                    className={`font-sans text-xs px-2.5 py-1 rounded-sm transition-all uppercase tracking-tight ${
                      dmDisabled
                        ? "text-muted/40 cursor-not-allowed"
                        : activeGoal === "dm"
                        ? "bg-highlight-teal text-surface font-semibold"
                        : "text-ink hover:text-highlight-teal"
                    }`}
                  >
                    ✉️ DM
                  </button>
                </div>
              </div>

              {/* Voice */}
              <div className="flex items-center gap-2">
                <span className="font-sans text-[11px] text-muted uppercase tracking-tight">
                  Voice
                </span>
                <div className="inline-flex bg-surface border border-line rounded-sm p-[2px]">
                  <button
                    onClick={() => setBrandVoice("peer-expert")}
                    className={`font-sans text-xs px-2.5 py-1 rounded-sm transition-all uppercase tracking-tight ${
                      brandVoice === "peer-expert"
                        ? "bg-highlight-teal text-surface font-semibold"
                        : "text-ink hover:text-highlight-teal"
                    }`}
                  >
                    Peer
                  </button>
                  <button
                    onClick={() => setBrandVoice("warm")}
                    className={`font-sans text-xs px-2.5 py-1 rounded-sm transition-all uppercase tracking-tight ${
                      brandVoice === "warm"
                        ? "bg-highlight-teal text-surface font-semibold"
                        : "text-ink hover:text-highlight-teal"
                    }`}
                  >
                    Warm
                  </button>
                  <button
                    onClick={() => setBrandVoice("concise")}
                    className={`font-sans text-xs px-2.5 py-1 rounded-sm transition-all uppercase tracking-tight ${
                      brandVoice === "concise"
                        ? "bg-highlight-teal text-surface font-semibold"
                        : "text-ink hover:text-highlight-teal"
                    }`}
                  >
                    Concise
                  </button>
                </div>
              </div>

              {/* DM disabled note */}
              {dmDisabled && (
                <span className="font-sans text-[10px] text-muted italic">
                  DM disabled on compliance posts
                </span>
              )}
            </div>

            {/* Generate button */}
            <div className="flex justify-end mt-3">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="font-sans border border-highlight-teal bg-highlight-teal text-surface text-xs font-semibold px-4 py-2 rounded-sm hover:bg-highlight-teal/90 transition-all uppercase tracking-tight disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : "Generate Response"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
