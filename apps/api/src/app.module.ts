import { Module } from "@nestjs/common";
import { CadenceService } from "./services/cadence.service";
import { EnrollmentService } from "./services/enrollment.service";
import { CadenceController } from "./controllers/cadence.controller";
import { EnrollmentController } from "./controllers/enrollment.controller";

@Module({
  providers: [CadenceService, EnrollmentService],
  controllers: [CadenceController, EnrollmentController],
})
export class AppModule {}
