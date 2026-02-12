import { Worker, NativeConnection } from "@temporalio/worker";
import * as emailCadenceWorkflow from "./workflows/email-cadence";
import * as emailActivities from "./activities/email";

async function runWorker() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_SERVER_ADDRESS || "localhost:7233",
  });

  const worker = await Worker.create({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || "default",
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || "default",
    workflowsPath: require.resolve("./workflows/email-cadence"),
    activities: emailActivities,
  });

  console.log("Worker started successfully");
  console.log(`Server: ${process.env.TEMPORAL_SERVER_ADDRESS || "localhost:7233"}`);
  console.log(`Namespace: ${process.env.TEMPORAL_NAMESPACE || "default"}`);
  console.log(`Task Queue: ${process.env.TEMPORAL_TASK_QUEUE || "default"}`);

  await worker.run();
}

runWorker().catch((err) => {
  console.error("Worker failed:", err);
  process.exit(1);
});
