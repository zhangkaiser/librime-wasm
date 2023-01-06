
interface ICompressionStream {
  readable: ReadableStream,
  writable: WritableStream
}

type CompressionStreamContructor = {
  new (format: "gzip" | "deflate" | "deflate-raw"): IDecompressionStream;
  prototype: IDecompressionStream
}

declare module globalThis {
  var Module: EmscriptenModule;
  var DecompressionStream: CompressionStreamContructor;
  var CompressionStream: CompressionStreamContructor;
  var imeHandler: any;
  var ENVIRONMENT_IS_WEB: boolean;
  var ENVIRONMENT_IS_WORKER: boolean;
  var ENVIRONMENT_IS_NODE: boolean;
  var ENVIRONMENT_IS_SHELL: boolean;
}

module "*.css" {
  export default style;
}