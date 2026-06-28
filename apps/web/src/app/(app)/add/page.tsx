"use client";

import { AddTrackForm } from "@/components/add-track-form";

export default function AddPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Add track</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste a YouTube link to save audio on this device.
        </p>
      </div>
      <AddTrackForm />
    </div>
  );
}
