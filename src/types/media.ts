// Extend MediaTrackCapabilities to include torch property
declare global {
  interface MediaTrackCapabilities {
    torch?: boolean;
  }
  
  interface MediaTrackConstraintSet {
    torch?: boolean;
  }
}

export {};
