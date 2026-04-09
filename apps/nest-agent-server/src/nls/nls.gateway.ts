import { Inject } from "@nestjs/common";
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { NlsService } from "./nls.service";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
  namespace: "nls",
})
export class NlsWsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @Inject(NlsService)
  private readonly nlsService: NlsService;

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    console.log("nls gateway init");
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log("nls gateway connection", client.id);
  }

  handleDisconnect(client: Socket) {
    console.log("nls gateway disconnect", client.id);
  }

  @SubscribeMessage("speech_text")
  handleEvent(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log("Received speech_text request:", data);

    const text = data?.text;
    const messageId = data?.messageId;

    this.nlsService.textToSpeech(text).then((buffer) => {
      const bufferArray = Array.from(buffer);

      // client.emit 只给当前client发送
      // client.broadcast.emit 给除了自己以外所有client发送

      // 广播给所有client
      this.server.emit("speech_buffer", {
        type: "Buffer",
        data: bufferArray,
        text: text,
        messageId: messageId,
      });
    });
  }
}
