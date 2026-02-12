import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { EnrollmentService } from "./services/enrollment.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Initialize Temporal workflow client
  const enrollmentService = app.get(EnrollmentService);
  const temporalServer = process.env.TEMPORAL_SERVER_ADDRESS || "localhost:7233";
  const temporalNamespace = process.env.TEMPORAL_NAMESPACE || "default";
  await enrollmentService.initializeWorkflowClient(temporalServer, temporalNamespace);

  app.enableCors();
  await app.listen(3001);
  console.log("API server is running on http://localhost:3001");
}

bootstrap();
