import "dotenv/config";
import { SpeechRecognition } from "alibabacloud-nls";
import { SpeechTranscription } from "alibabacloud-nls";
import { SpeechSynthesizer } from "alibabacloud-nls";
import { RPCClient } from "@alicloud/pop-core";

const client = new RPCClient({
  apiVersion: "2019-02-28",
});

const result = await client.request("CreateToken");

console.log(result);
