class PlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Int16Array(0);
    this.port.onmessage = (e) => {
      const newChunk = new Int16Array(e.data);
      const merged = new Int16Array(this.buffer.length + newChunk.length);
      merged.set(this.buffer);
      merged.set(newChunk, this.buffer.length);
      this.buffer = merged;
    };
  }
  process(_inputs, outputs) {
    const output = outputs[0];
    const channel = output[0];
    for (let i = 0; i < channel.length; i++) {
      if (this.buffer.length > 0) {
        channel[i] = this.buffer[0] / 32768;
        this.buffer = this.buffer.slice(1);
      } else {
        channel[i] = 0;
      }
    }
    return true;
  }
}
registerProcessor('playback-processor', PlaybackProcessor);
