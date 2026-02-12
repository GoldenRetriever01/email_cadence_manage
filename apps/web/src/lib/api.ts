const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function createCadence(id: string, name: string, steps: any[]) {
  const response = await fetch(`${API_BASE}/cadences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, name, steps }),
  });
  return response.json();
}

export async function getCadence(id: string) {
  const response = await fetch(`${API_BASE}/cadences/${id}`);
  return response.json();
}

export async function updateCadence(id: string, name: string, steps: any[]) {
  const response = await fetch(`${API_BASE}/cadences/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, steps }),
  });
  return response.json();
}

export async function startEnrollment(cadenceId: string, contactEmail: string) {
  const response = await fetch(`${API_BASE}/enrollments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cadenceId, contactEmail }),
  });
  return response.json();
}

export async function getEnrollment(id: string) {
  const response = await fetch(`${API_BASE}/enrollments/${id}`);
  return response.json();
}

export async function updateCadenceInFlight(id: string, steps: any[]) {
  const response = await fetch(`${API_BASE}/enrollments/${id}/update-cadence`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ steps }),
  });
  return response.json();
}
