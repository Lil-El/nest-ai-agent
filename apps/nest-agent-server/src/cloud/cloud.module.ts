import { DynamicModule, FactoryProvider, ValueProvider, Provider, Module } from "@nestjs/common";
import { AliCloudService } from "./cloud.service";
import { AliCloudController } from './cloud.controller';

export interface AliCloudModuleOptions {
  isGlobal?: boolean;
  accessKeyId: string;
  accessKeySecret: string;
  endPoint: string;
  nlsKey: string;
  [key: string]: any;
}

export interface AliCloudModuleAsyncOptions {
  isGlobal?: boolean;
  useFactory: (...args: any[]) => Promise<AliCloudModuleOptions> | AliCloudModuleOptions;
  inject?: any[];
  imports?: any[];
}

@Module({
  // forRoot 返回的模块中，会替换掉这里静态的模块
  // controllers: [AliCloudController],
  // providers: [AliCloudService],
  // exports: [AliCloudService],
})
export class AliCloudModule {
  // 同步配置
  static forRoot(options: AliCloudModuleOptions): DynamicModule {
    const provider: ValueProvider = {
      provide: "ALI_CLOUD_OPTIONS",
      useValue: options,
    };

    return {
      global: options.isGlobal ?? false,
      module: AliCloudModule,
      controllers: [AliCloudController],
      providers: [AliCloudService, provider],
      exports: [AliCloudService],
    };
  }

  // 异步配置
  static forRootAsync(options: AliCloudModuleAsyncOptions): DynamicModule {
    const asyncProvider: FactoryProvider = {
      provide: "ALI_CLOUD_OPTIONS",
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    return {
      global: options.isGlobal ?? false,
      module: AliCloudModule,
      imports: options.imports || [],
      controllers: [AliCloudController],
      providers: [AliCloudService, asyncProvider],
      exports: [AliCloudService],
    };
  }
}


/**
ConfigModule 的例子

@Module({})
export class ConfigModule {
  static forRoot(options: ConfigModuleOptions): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        ConfigService,  // 重新声明服务
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
      ],
      exports: [ConfigService],
    };
  }
}
 */