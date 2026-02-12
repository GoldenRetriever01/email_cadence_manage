export interface CadenceStep {
  id: string;
  type: "SEND_EMAIL" | "WAIT";
  subject?: string;
  body?: string;
  seconds?: number;
}

export interface Cadence {
  id: string;
  name: string;
  steps: CadenceStep[];
}

export interface EnrollmentStatus {
  id: string;
  cadenceId: string;
  contactEmail: string;
  currentStepIndex: number;
  stepsVersion: number;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  createdAt: number;
  updatedAt: number;
}
