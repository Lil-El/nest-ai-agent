import { Controller, Get } from "@nestjs/common";
import { AliCloudService } from "./cloud.service";

@Controller("cloud")
export class AliCloudController {
  constructor(private readonly aliCloudService: AliCloudService) {}

  @Get()
  getAccessKeyId() {
    return this.aliCloudService.getAccessKeyId();
  }
}
