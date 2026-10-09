'use client';

// Live-sync between teammates is disabled on this hosting tier.
// This module is kept as a no-op so every page calling useRealtime() keeps working
// unchanged. Pages refresh on navigation; notifications still poll every 5 minutes.

export function useRealtime() {
  // no-op: live-sync disabled
}
