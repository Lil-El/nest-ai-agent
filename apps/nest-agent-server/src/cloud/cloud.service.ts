import { Injectable, Inject } from "@nestjs/common";
import { type AliCloudModuleOptions } from "./cloud.module";

@Injectable()
export class AliCloudService {
  @Inject("ALI_CLOUD_OPTIONS")
  private readonly options: AliCloudModuleOptions;

  async getAccessKeyId(): Promise<string> {
    return this.options.accessKeyId;
  }
}
