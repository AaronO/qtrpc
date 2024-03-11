export interface QTRPCMessage<TInput = unknown> {
  input: TInput;
  path: string;
  type: "mutation";
}
