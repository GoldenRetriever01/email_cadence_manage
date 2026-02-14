import { CadenceStep } from "../shared/types";

export async function fetchCadence(cadenceId: string): Promise<CadenceStep[]> {
  const apiUrl = process.env.API_URL || "http://localhost:3001";
  try {
    const response = await fetch(`${apiUrl}/cadences/${cadenceId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch cadence: ${response.statusText}`);
    }
    const cadence = await response.json() as any;
    return cadence.steps || [];
  } catch (error) {
    console.error(`Error fetching cadence ${cadenceId}:`, error);
    throw error;
  }
}
