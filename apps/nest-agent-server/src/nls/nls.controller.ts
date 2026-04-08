import { Controller, Get } from "@nestjs/common";
import { AliCloudService } from "src/cloud/cloud.service";

@Controller("nls")
export class NlsController {
  constructor(private readonly aliCloudService: AliCloudService) {}

  @Get()
  async getHello() {
    return this.aliCloudService.getAccessKeyId();
  }
}
