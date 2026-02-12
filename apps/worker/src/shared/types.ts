export interface CadenceStep {
  id: string;
  type: "SEND_EMAIL" | "WAIT";
  subject?: string;
  body?: string;
  seconds?: number;
}

export interface WorkflowInput {
  enrollmentId: string;
  cadenceId: string;
  contactEmail: string;
}

export interface SendEmailInput {
  enrollmentId: string;
  contactEmail: string;
  subject: string;
  body: string;
}

export interface SendEmailOutput {
  success: boolean;
  messageId: string;
  timestamp: number;
}

export interface WorkflowState {
  currentStepIndex: number;
  stepsVersion: number;
  status: "RUNNING" | "COMPLETED" | "FAILED";
}
