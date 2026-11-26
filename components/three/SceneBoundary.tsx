"use client";

import { Component, type ReactNode } from "react";

/** Keeps one failed 3D asset (network, decode) from taking the whole scene down. */
export class SceneBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[vaelis] 3D asset failed to load", error);
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
