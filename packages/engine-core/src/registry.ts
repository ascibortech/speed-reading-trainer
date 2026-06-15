/**
 * The exercise registry (system-design §3.2) — the plugin mechanism. Exercise
 * modules register a PROVIDER (descriptor + factory); the core builds the
 * catalogue from the descriptors alone, and instantiates a fresh exercise per run
 * so concurrent/sequential sessions never share mutable state.
 */
import type { ExerciseDescriptor, ExerciseProvider } from "@srt/contracts";

export class ExerciseRegistry {
  private readonly providers = new Map<string, ExerciseProvider>();

  register(provider: ExerciseProvider): void {
    const id = provider.descriptor.id;
    if (this.providers.has(id)) {
      throw new Error(`Exercise "${id}" is already registered`);
    }
    this.providers.set(id, provider);
  }

  get(id: string): ExerciseProvider | undefined {
    return this.providers.get(id);
  }

  /** Descriptors for every registered exercise — drives the catalogue UI. */
  list(): ExerciseDescriptor[] {
    return [...this.providers.values()].map((p) => p.descriptor);
  }

  has(id: string): boolean {
    return this.providers.has(id);
  }
}

/** App-wide singleton registry. */
export const registry = new ExerciseRegistry();
