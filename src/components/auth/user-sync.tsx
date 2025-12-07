"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

export function UserSync() {
  const { user, isLoaded } = useUser();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (isLoaded && user && !hasSynced.current) {
        hasSynced.current = true;
        
        // Call the debug sync endpoint
        fetch('/api/debug/sync')
            .then(res => {
                if (res.ok) console.log("User synced automatically to Supabase");
                else console.warn("Auto-sync failed");
            })
            .catch(err => console.error("Auto-sync error:", err));
    }
  }, [user, isLoaded]);

  return null;
}
