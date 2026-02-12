import { Injectable } from "@nestjs/common";
import { Connection, WorkflowClient } from "@temporal/client";
import { EnrollmentStatus } from "../shared/types";
import { v4 as uuidv4 } from "uuid";

// In-memory storage for demo purposes
const enrollments = new Map<string, EnrollmentStatus>();

@Injectable()
export class EnrollmentService {
  private workflowClient: WorkflowClient | null = null;

  async initializeWorkflowClient(
    serverAddress: string = "localhost:7233",
    namespace: string = "default"
  ): Promise<void> {
    try {
      const connection = await Connection.connect({ address: serverAddress });
      this.workflowClient = new WorkflowClient({
        connection,
        namespace,
      });
    } catch (error) {
      console.warn("Failed to connect to Temporal server:", error);
    }
  }

  async startEnrollment(
    cadenceId: string,
    contactEmail: string,
    taskQueue: string = "default"
  ): Promise<EnrollmentStatus> {
    const enrollmentId = `enr_${uuidv4().substring(0, 8)}`;
    const now = Date.now();

    if (this.workflowClient) {
      try {
        await this.workflowClient.execute("emailCadenceWorkflow", {
          args: [{ enrollmentId, cadenceId, contactEmail }],
          taskQueue,
          workflowId: enrollmentId,
        });
      } catch (error) {
        console.error("Failed to start workflow:", error);
      }
    }

    const enrollment: EnrollmentStatus = {
      id: enrollmentId,
      cadenceId,
      contactEmail,
      currentStepIndex: 0,
      stepsVersion: 0,
      status: "RUNNING",
      createdAt: now,
      updatedAt: now,
    };

    enrollments.set(enrollmentId, enrollment);
    return enrollment;
  }

  getEnrollment(id: string): EnrollmentStatus | undefined {
    return enrollments.get(id);
  }

  async getEnrollmentState(id: string): Promise<EnrollmentStatus | undefined> {
    if (!this.workflowClient) {
      return enrollments.get(id);
    }

    try {
      const handle = this.workflowClient.getHandle(id);
      const state = await handle.query<{
        currentStepIndex: number;
        stepsVersion: number;
        status: string;
      }>("getState");

      const enrollment = enrollments.get(id);
      if (enrollment) {
        enrollment.currentStepIndex = state.currentStepIndex;
        enrollment.stepsVersion = state.stepsVersion;
        enrollment.status = state.status as "RUNNING" | "COMPLETED" | "FAILED";
        enrollment.updatedAt = Date.now();
      }

      return enrollment;
    } catch (error) {
      console.warn("Failed to query workflow state:", error);
      return enrollments.get(id);
    }
  }

  async updateCadenceInFlight(id: string, steps: any[]): Promise<void> {
    if (!this.workflowClient) {
      return;
    }

    try {
      const handle = this.workflowClient.getHandle(id);
      await handle.signal("updateCadence", steps);
    } catch (error) {
      console.error("Failed to send update signal:", error);
    }
  }
}
