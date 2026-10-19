"""Local speech worker. JSONL control in/out; audio stays in memory, never logged."""
import base64
import contextlib
import json
import sys
import time


protocol_output = sys.stdout


def emit(**event):
    print(json.dumps(event), file=protocol_output, flush=True)


def main():
    transcriber = None
    active = False
    stream_id = 0
    try:
        for raw in sys.stdin:
            command = json.loads(raw)
            kind = command['type']
            if kind == 'load':
                if transcriber is None:
                    emit(type='worker_status', status='loading')
                    started = time.perf_counter()
                    with contextlib.redirect_stdout(sys.stderr):
                        from moonshine_voice import Transcriber, TranscriptEventListener, ModelArch
                        from moonshine_voice.download import get_model_for_language
                        path, arch = get_model_for_language('en', ModelArch.SMALL_STREAMING)
                        transcriber = Transcriber(path, arch, update_interval=0.25)

                    class Listener(TranscriptEventListener):
                        def send(self, event, final):
                            emit(type='transcript', segmentId=str(event.line.line_id),
                                 text=event.line.text, final=final, streamId=str(stream_id),
                                 startMs=event.line.start_time * 1000,
                                 endMs=(event.line.start_time + event.line.duration) * 1000)
                        def on_line_started(self, event):
                            emit(type='speech_activity', segmentId=str(event.line.line_id),
                                 streamId=str(stream_id), startMs=event.line.start_time * 1000)
                        def on_line_text_changed(self, event):
                            self.send(event, False)
                        def on_line_completed(self, event):
                            self.send(event, True)
                        def on_error(self, event):
                            emit(type='worker_error', message=str(event))
                    transcriber.add_listener(Listener())
                    emit(type='worker_status', status='ready', loadMs=(time.perf_counter()-started)*1000)
            elif kind == 'start':
                if transcriber is None:
                    raise ValueError('Load the speech model before starting audio')
                stream_id += 1
                transcriber.start()
                active = True
                emit(type='worker_status', status='listening')
            elif kind == 'audio':
                if not active:
                    raise ValueError('Speech stream is not active')
                import numpy as np
                audio = np.frombuffer(base64.b64decode(command['pcm']), dtype='<i2').astype(np.float32) / 32768
                started = time.perf_counter()
                with contextlib.redirect_stdout(sys.stderr):
                    transcriber.add_audio(audio.tolist(), command['sampleRate'])
                emit(type='audio_ack', sequence=command['sequence'], processingMs=(time.perf_counter()-started)*1000)
            elif kind == 'stop':
                if active:
                    transcriber.stop()
                    active = False
                emit(type='worker_status', status='ready')
            elif kind == 'close':
                break
    except Exception as error:
        emit(type='worker_error', message=str(error))
        sys.exit(1)
    finally:
        if transcriber is not None:
            with contextlib.redirect_stdout(sys.stderr):
                transcriber.close()


if __name__ == '__main__':
    main()
