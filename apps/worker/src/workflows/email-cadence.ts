import {
  proxyActivities,
  defineSignal,
  defineQuery,
  sleep,
  condition,
  setHandler,
} from "@temporalio/workflow";
import { CadenceStep, WorkflowInput, WorkflowState } from "../shared/types";
import type * as emailActivities from "../activities/email";
import type * as cadenceActivities from "../activities/cadence";

const { sendEmail } = proxyActivities<typeof emailActivities>({
  startToCloseTimeout: "1 minute",
});

const { fetchCadence } = proxyActivities<typeof cadenceActivities>({
  startToCloseTimeout: "30 seconds",
});

const updateCadenceSignal = defineSignal<[CadenceStep[]]>("updateCadence");
const getStateQuery = defineQuery<WorkflowState>("getState");

export async function emailCadenceWorkflow(input: WorkflowInput): Promise<void> {
  // Workflow state
  let currentStepIndex = 0;
  let stepsVersion = 0;
  let status: "RUNNING" | "COMPLETED" | "FAILED" = "RUNNING";
  let steps: CadenceStep[] = [];
  let updateReceived = false;

  // Query the API to get cadence steps via activity
  try {
    steps = await fetchCadence(input.cadenceId);
  } catch (error) {
    status = "FAILED";
    throw error;
  }

  // Set up signal handler for cadence updates
  setHandler(updateCadenceSignal, (newSteps: CadenceStep[]) => {
    steps = newSteps;
    stepsVersion++;
    updateReceived = true;
  });

  // Set up query handler
  setHandler(getStateQuery, () => ({
    currentStepIndex,
    stepsVersion,
    status,
  }));

  // Execute steps
  while (currentStepIndex < steps.length && status === "RUNNING") {
    const step = steps[currentStepIndex];
    let stepCompleted = false;

    if (step.type === "SEND_EMAIL") {
      try {
        await sendEmail({
          enrollmentId: input.enrollmentId,
          contactEmail: input.contactEmail,
          subject: step.subject || "",
          body: step.body || "",
        });
        stepCompleted = true;
      } catch (error) {
        status = "FAILED";
        throw error;
      }
    } else if (step.type === "WAIT") {
      const seconds = step.seconds || 0;
      // Wait for duration OR signal
      const signaled = await condition(() => updateReceived, seconds * 1000);
      // If we weren't signaled, the wait completed naturally
      if (!signaled) {
        stepCompleted = true;
      }
      // If we WERE signaled, stepCompleted remains false, 
      // so we re-evaluate the same index with the new definition.
    }

    if (updateReceived) {
      updateReceived = false;
      // If the current step was finished before or during the signal, move to next
      if (stepCompleted) {
        currentStepIndex++;
      }
      // If stepCompleted is false (e.g. interrupted WAIT), 
      // we stay at currentStepIndex to re-evaluate.
      
      // Ensure we haven't gone out of bounds with the new definition
      if (currentStepIndex >= steps.length) {
        break;
      }
      continue;
    }

    if (stepCompleted) {
      currentStepIndex++;
    }
  }

  status = "COMPLETED";
}
