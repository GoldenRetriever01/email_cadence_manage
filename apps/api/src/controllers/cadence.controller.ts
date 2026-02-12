import { Controller, Post, Get, Put, Body, Param } from "@nestjs/common";
import { CadenceService } from "../services/cadence.service";
import { CadenceStep } from "../shared/types";

@Controller("cadences")
export class CadenceController {
  constructor(private cadenceService: CadenceService) {}

  @Post()
  createCadence(@Body() body: { id: string; name: string; steps: CadenceStep[] }) {
    return this.cadenceService.createCadence(body.id, body.name, body.steps);
  }

  @Get(":id")
  getCadence(@Param("id") id: string) {
    return this.cadenceService.getCadence(id);
  }

  @Put(":id")
  updateCadence(
    @Param("id") id: string,
    @Body() body: { name: string; steps: CadenceStep[] }
  ) {
    return this.cadenceService.updateCadence(id, body.name, body.steps);
  }

  @Get()
  listCadences() {
    return this.cadenceService.listCadences();
  }
}
