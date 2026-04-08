import { Module } from "@nestjs/common";
import { NlsService } from "./nls.service";
import { NlsController } from "./nls.controller";
import { AliCloudModule } from "src/cloud/cloud.module";
import { ConfigService } from "@nestjs/config";

@Module({
  imports: [
    AliCloudModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          accessKeyId: configService.getOrThrow("ALI_CLOUD_ACCESS_KEY_ID"),
          accessKeySecret: configService.getOrThrow("ALI_CLOUD_ACCESS_KEY_SECRET"),
          endPoint: configService.getOrThrow("ALI_CLOUD_END_POINT"),
          nlsKey: configService.getOrThrow("ALI_CLOUD_NLS_API_KEY"),
        };
      },
    }),
  ],
  controllers: [NlsController],
  providers: [NlsService],
})
export class NlsModule {}
