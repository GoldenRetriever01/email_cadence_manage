import { Controller, Post, Get, Param, Body } from "@nestjs/common";
import { EnrollmentService } from "../services/enrollment.service";

@Controller("enrollments")
export class EnrollmentController {
  constructor(private enrollmentService: EnrollmentService) {}

  @Post()
  async startEnrollment(@Body() body: { cadenceId: string; contactEmail: string }) {
    return this.enrollmentService.startEnrollment(body.cadenceId, body.contactEmail);
  }

  @Get(":id")
  async getEnrollment(@Param("id") id: string) {
    return this.enrollmentService.getEnrollmentState(id);
  }

  @Post(":id/update-cadence")
  async updateCadence(@Param("id") id: string, @Body() body: { steps: any[] }) {
    await this.enrollmentService.updateCadenceInFlight(id, body.steps);
    return { success: true };
  }
}
