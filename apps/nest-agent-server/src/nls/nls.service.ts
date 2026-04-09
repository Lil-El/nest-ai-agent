import { Injectable, Inject } from "@nestjs/common";
import { AliCloudService } from "src/cloud/cloud.service";

import { SpeechSynthesizer, SpeechRecognition } from "alibabacloud-nls";
import { createReadStream, readFileSync } from "fs";

@Injectable()
export class NlsService {
  @Inject(AliCloudService)
  private readonly aliCloudService: AliCloudService;

  private static readonly URL: string = "wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1";

  private appkey: string;

  private token: string;

  /**
   * 将文字转换为语音音频数据
   * @param text 要转换的文字
   * @returns 音频 Buffer
   */
  async textToSpeech(text: string): Promise<Buffer> {
    this.appkey = await this.aliCloudService.getNlsKey();
    this.token = await this.aliCloudService.getToken();

    const tts = new SpeechSynthesizer({
      url: NlsService.URL,
      appkey: this.appkey,
      token: this.token,
    });

    const audioChunks: Buffer[] = [];

    tts.on("failed", (msg) => {
      console.log("Client recv failed:", msg);
    });

    // 监听音频数据
    tts.on("data", (audioData: Buffer) => {
      audioChunks.push(audioData);
    });

    tts.on("closed", () => {
      console.log("Client recv closed ");
    });

    // 开始合成
    tts.start({
      text,
      format: "mp3", // 输出格式为 mp3
      sampleRate: 16000, // 采样率
      voice: "aixia", // 发音人
    });

    return new Promise((resolve, reject) => {
      // 监听合成完成
      tts.on("completed", () => {
        tts.shutdown();
        resolve(Buffer.concat(audioChunks));
      });
    });
  }

  /**
   * 流式语音识别 - 将音频文件转换为文字
   * @param filePathOrFileBuffer 音频文件路径或文件 buffer
   * @returns 识别结果文本
   */
  async asrStream(filePathOrFileBuffer: Buffer | string): Promise<string> {
    const fileBuffer =
      typeof filePathOrFileBuffer === "string" ? await readFileSync(filePathOrFileBuffer) : filePathOrFileBuffer;

    this.appkey = await this.aliCloudService.getNlsKey();
    this.token = await this.aliCloudService.getToken();

    const sr = new SpeechRecognition({
      url: NlsService.URL,
      appkey: this.appkey,
      token: this.token,
    });

    sr.on("started", (msg) => {});

    sr.on("changed", (msg) => {});

    sr.on("closed", () => {});

    sr.on("failed", (msg) => {
      sr.shutdown();
    });

    return new Promise((resolve, reject) => {
      sr.on("completed", (res) => {
        const { payload } = JSON.parse(res);
        sr.shutdown();
        resolve(payload.result);
      });

      const params = sr.defaultStartParams();
      params.format = "mp3";

      // 启动语音识别
      sr.start(params, true, 6000)
        .then(() => {
          /* 分块发送音频数据
            const stream = createReadStream(filePath, {
              highWaterMark: 3200, // 每次读取 3200 字节（约 100ms 音频）
            });

            stream.on("data", (chunk: Buffer) => {
              sr.sendAudio(chunk);
            });

            stream.on("end", () => {
              sr.close();
            });

            stream.on("error", (error) => {
              console.error("File read error:", error);
              sr.shutdown();
              reject(error);
            });
          */

          // 手动拆分音频文件
          const chunkSize = 3200;
          const totalChunks = Math.ceil(fileBuffer.length / chunkSize);

          for (let i = 0; i < totalChunks; i++) {
            const chunk = fileBuffer.subarray(i * chunkSize, (i + 1) * chunkSize);
            sr.sendAudio(chunk);
          }

          sr.close();
        })
        .catch((error) => {
          // token 过期会在这里捕获
          console.error("Failed to start ASR session:", error);
          sr.shutdown();
          reject(error);
        });
    });
  }
}
