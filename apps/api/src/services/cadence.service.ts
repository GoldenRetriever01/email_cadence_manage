import { Injectable } from "@nestjs/common";
import { Cadence, CadenceStep } from "../shared/types";

// In-memory storage for demo purposes
const cadences = new Map<string, Cadence>();

@Injectable()
export class CadenceService {
  createCadence(id: string, name: string, steps: CadenceStep[]): Cadence {
    const cadence: Cadence = { id, name, steps };
    cadences.set(id, cadence);
    return cadence;
  }

  getCadence(id: string): Cadence | undefined {
    return cadences.get(id);
  }

  updateCadence(id: string, name: string, steps: CadenceStep[]): Cadence | undefined {
    const cadence = cadences.get(id);
    if (!cadence) return undefined;
    cadence.name = name;
    cadence.steps = steps;
    return cadence;
  }

  listCadences(): Cadence[] {
    return Array.from(cadences.values());
  }
}
