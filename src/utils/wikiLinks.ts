import { KnowledgeNote, BacklinkItem, GraphNode, GraphEdge, VaultStats, NoteStatus } from '../types';

// Regex to find [[Wiki Link Title]]
export const WIKI_LINK_REGEX = /\[\[(.*?)\]\]/g;

/**
 * Extract all [[Wiki Link]] targets from markdown text
 */
export function extractOutgoingLinks(content: string): string[] {
  if (!content) return [];
  const matches = content.match(WIKI_LINK_REGEX) || [];
  const titles = matches.map((m) => m.replace(/\[\[|\]\]/g, '').trim());
  return Array.from(new Set(titles.filter((t) => t.length > 0)));
}

/**
 * Calculate backlinks (linked and unlinked mentions) for a specific note
 */
export function computeBacklinks(
  targetNote: KnowledgeNote,
  allNotes: KnowledgeNote[]
): { linked: BacklinkItem[]; unlinked: BacklinkItem[] } {
  const linked: BacklinkItem[] = [];
  const unlinked: BacklinkItem[] = [];

  const targetTitleLower = targetNote.title.trim().toLowerCase();

  for (const sourceNote of allNotes) {
    if (sourceNote.id === targetNote.id) continue;

    // Check for explicit [[targetNote.title]]
    const outgoing = extractOutgoingLinks(sourceNote.content);
    const hasExplicit = outgoing.some((t) => t.toLowerCase() === targetTitleLower);

    if (hasExplicit) {
      // Find snippet around the link
      const snippet = extractSnippet(sourceNote.content, targetNote.title, true);
      linked.push({
        sourceNoteId: sourceNote.id,
        sourceNoteTitle: sourceNote.title,
        snippet,
        isExplicitLink: true,
      });
    } else {
      // Check for unlinked text mention (Unicode aware for Arabic & English)
      const escaped = targetNote.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const unlinkedRegex = new RegExp(`(?<![\\p{L}\\p{N}])(${escaped})(?![\\p{L}\\p{N}])`, 'iu');
      if (unlinkedRegex.test(sourceNote.content)) {
        const snippet = extractSnippet(sourceNote.content, targetNote.title, false);
        unlinked.push({
          sourceNoteId: sourceNote.id,
          sourceNoteTitle: sourceNote.title,
          snippet,
          isExplicitLink: false,
        });
      }
    }
  }

  return { linked, unlinked };
}

/**
 * Helper to grab surrounding context for mentions
 */
function extractSnippet(content: string, term: string, isLink: boolean): string {
  const cleanTerm = isLink ? `[[${term}]]` : term;
  const idx = content.toLowerCase().indexOf(cleanTerm.toLowerCase());
  if (idx === -1) {
    // fallback to just term without brackets
    const fallbackIdx = content.toLowerCase().indexOf(term.toLowerCase());
    if (fallbackIdx === -1) return content.slice(0, 100) + '...';
    const start = Math.max(0, fallbackIdx - 40);
    const end = Math.min(content.length, fallbackIdx + term.length + 40);
    return (start > 0 ? '...' : '') + content.slice(start, end).replace(/\n/g, ' ') + (end < content.length ? '...' : '');
  }
  const start = Math.max(0, idx - 40);
  const end = Math.min(content.length, idx + cleanTerm.length + 40);
  return (start > 0 ? '...' : '') + content.slice(start, end).replace(/\n/g, ' ') + (end < content.length ? '...' : '');
}

/**
 * Assign distinct harmonic colors to folders
 */
const FOLDER_COLORS: Record<string, string> = {
  'Knowledge Systems': '#3b82f6', // blue
  'Mental Models': '#8b5cf6', // purple
  'Engineering & Systems': '#06b6d4', // cyan
  'Cognitive Science': '#10b981', // emerald
  'Creative Lab': '#f59e0b', // amber
  'General': '#64748b', // slate
};

export function getFolderColor(folder: string): string {
  return FOLDER_COLORS[folder] || '#8b5cf6';
}

/**
 * Status color mappings
 */
export const STATUS_META: Record<NoteStatus, { label: string; badgeColor: string; icon: string }> = {
  seed: { label: 'Seedling', badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: '🌱' },
  growing: { label: 'Growing', badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: '🌿' },
  evergreen: { label: 'Evergreen', badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20', icon: '🌲' },
  archived: { label: 'Archived', badgeColor: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20', icon: '📦' },
};

/**
 * Build graph nodes and links for 2D Canvas force simulation
 */
export function buildGraphData(notes: KnowledgeNote[], includeTags: boolean = false): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodesMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const titleToIdMap = new Map<string, string>();

  // Map titles to IDs (case-insensitive)
  notes.forEach((n) => {
    titleToIdMap.set(n.title.trim().toLowerCase(), n.id);
  });

  // Calculate incoming count
  const incomingCounts = new Map<string, number>();

  notes.forEach((note) => {
    const outgoing = extractOutgoingLinks(note.content);
    outgoing.forEach((targetTitle) => {
      const targetId = titleToIdMap.get(targetTitle.toLowerCase());
      if (targetId) {
        incomingCounts.set(targetId, (incomingCounts.get(targetId) || 0) + 1);
        edges.push({
          source: note.id,
          target: targetId,
          weight: 1,
        });
      }
    });
  });

  // Create Note Nodes
  notes.forEach((n) => {
    const inCount = incomingCounts.get(n.id) || 0;
    const baseRadius = 6;
    const nodeVal = Math.min(22, baseRadius + inCount * 2.5);

    nodesMap.set(n.id, {
      id: n.id,
      title: n.title,
      type: 'note',
      val: nodeVal,
      color: getFolderColor(n.folder),
      folder: n.folder,
      tags: n.tags || [],
      status: n.status,
    });
  });

  // Optionally include tags as connective hubs
  if (includeTags) {
    const tagCounts = new Map<string, number>();
    notes.forEach((n) => {
      (n.tags || []).forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    tagCounts.forEach((count, tag) => {
      if (count > 1) {
        // only show tags connected to >1 note
        const tagNodeId = `tag-${tag}`;
        nodesMap.set(tagNodeId, {
          id: tagNodeId,
          title: `#${tag}`,
          type: 'tag',
          val: 5 + count * 1.5,
          color: '#ec4899', // pink for tags
          folder: 'Tags',
          tags: [tag],
        });

        notes.forEach((n) => {
          if ((n.tags || []).includes(tag)) {
            edges.push({
              source: n.id,
              target: tagNodeId,
              weight: 0.5,
            });
          }
        });
      }
    });
  }

  return {
    nodes: Array.from(nodesMap.values()),
    edges,
  };
}

/**
 * Calculate vault health and knowledge statistics
 */
export function calculateVaultStats(notes: KnowledgeNote[]): VaultStats {
  const totalNotes = notes.length;
  let totalLinks = 0;
  const linkCounts = new Map<string, number>();
  const statusCounts: Record<NoteStatus, number> = {
    seed: 0,
    growing: 0,
    evergreen: 0,
    archived: 0,
  };
  const tagsSet = new Set<string>();

  const titleToId = new Map<string, string>();
  notes.forEach((n) => {
    titleToId.set(n.title.trim().toLowerCase(), n.id);
    statusCounts[n.status] = (statusCounts[n.status] || 0) + 1;
    (n.tags || []).forEach((t) => tagsSet.add(t));
    linkCounts.set(n.id, 0);
  });

  notes.forEach((n) => {
    const outgoing = extractOutgoingLinks(n.content);
    outgoing.forEach((targetTitle) => {
      const targetId = titleToId.get(targetTitle.toLowerCase());
      if (targetId) {
        totalLinks++;
        linkCounts.set(n.id, (linkCounts.get(n.id) || 0) + 1);
        linkCounts.set(targetId, (linkCounts.get(targetId) || 0) + 1);
      }
    });
  });

  const orphanedNotes = notes.filter((n) => (linkCounts.get(n.id) || 0) === 0);

  const hubNotes = notes
    .map((n) => ({
      id: n.id,
      title: n.title,
      linkCount: linkCounts.get(n.id) || 0,
    }))
    .sort((a, b) => b.linkCount - a.linkCount)
    .slice(0, 5);

  const linkDensity = totalNotes > 0 ? Number((totalLinks / totalNotes).toFixed(2)) : 0;

  return {
    totalNotes,
    totalLinks,
    linkDensity,
    orphanedNotes,
    hubNotes,
    statusCounts,
    totalTags: tagsSet.size,
  };
}
