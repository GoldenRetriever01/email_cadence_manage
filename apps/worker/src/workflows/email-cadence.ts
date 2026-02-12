import {
  proxyActivities,
  defineSignal,
  defineQuery,
  sleep,
} from "@temporal/workflow";
import { CadenceStep, WorkflowInput, WorkflowState } from "../shared/types";
import { sendEmail } from "../activities/email";
import type { Connection } from "@temporal/client";

const activities = proxyActivities<typeof import("../activities/email")>({
  startToCloseTimeout: "10 minutes",
});

const updateCadenceSignal = defineSignal<[CadenceStep[]]>("updateCadence");
const getStateQuery = defineQuery<WorkflowState>("getState");

// Workflow state
let currentStepIndex = 0;
let stepsVersion = 0;
let status: "RUNNING" | "COMPLETED" | "FAILED" = "RUNNING";
let steps: CadenceStep[] = [];

export async function emailCadenceWorkflow(input: WorkflowInput): Promise<void> {
  let cadenceSteps: CadenceStep[] = [];

  // Query the API to get cadence steps
  try {
    const apiUrl = process.env.API_URL || "http://localhost:3001";
    const response = await fetch(`${apiUrl}/cadences/${input.cadenceId}`);
    if (response.ok) {
      const cadence = await response.json();
      cadenceSteps = cadence.steps || [];
    }
  } catch (error) {
    console.error("Failed to fetch cadence:", error);
    status = "FAILED";
    return;
  }

  steps = cadenceSteps;
  currentStepIndex = 0;
  stepsVersion = 0;

  // Set up signal handler for cadence updates
  let updateReceived = false;
  updateCadenceSignal.onSignal((newSteps: CadenceStep[]) => {
    const newStepsLength = newSteps.length;

    if (newStepsLength <= currentStepIndex) {
      // No more steps to execute
      status = "COMPLETED";
      updateReceived = false;
      return;
    }

    // Update steps and continue from currentStepIndex
    steps = newSteps;
    stepsVersion++;
    updateReceived = true;
  });

  // Set up query handler
  getStateQuery.setHandler(() => ({
    currentStepIndex,
    stepsVersion,
    status,
  }));

  // Execute steps
  while (currentStepIndex < steps.length && status === "RUNNING") {
    const step = steps[currentStepIndex];

    if (step.type === "SEND_EMAIL") {
      try {
        await activities.sendEmail({
          enrollmentId: input.enrollmentId,
          contactEmail: input.contactEmail,
          subject: step.subject || "",
          body: step.body || "",
        });
      } catch (error) {
        console.error("Send email activity failed:", error);
        status = "FAILED";
        return;
      }
    } else if (step.type === "WAIT") {
      const seconds = step.seconds || 0;
      await sleep(seconds * 1000);
    }

    currentStepIndex++;

    // Check if an update was received
    if (updateReceived) {
      updateReceived = false;
      // Continue from new currentStepIndex with updated steps
      continue;
    }
  }

  status = "COMPLETED";
}
