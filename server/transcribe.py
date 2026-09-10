#!/usr/bin/env python3
"""
Local Whisper transcription using faster-whisper (CTranslate2).
Runs entirely on CPU — no GPU required.
Uses ~150MB RAM with the 'base' model.

Usage:
    python transcribe.py --audio input.wav --model base --output output.json
"""

import argparse
import json
import sys
import os
import time

def main():
    parser = argparse.ArgumentParser(description='Local Whisper transcription')
    parser.add_argument('--audio', required=True, help='Path to audio file (wav)')
    parser.add_argument('--model', default='base', help='Whisper model size: tiny/base/small/medium/large-v3')
    parser.add_argument('--output', required=True, help='Output JSON path')
    parser.add_argument('--language', default=None, help='Language code (e.g. en). Auto-detect if not set.')
    parser.add_argument('--device', default='cpu', help='Device: cpu or cuda')
    parser.add_argument('--compute-type', default='int8', help='Compute type: int8/float16/float32')
    args = parser.parse_args()

    if not os.path.exists(args.audio):
        print(f"Error: Audio file not found: {args.audio}", file=sys.stderr)
        sys.exit(1)

    print(f"Loading Whisper model: {args.model} (device: {args.device})...")
    start_time = time.time()

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("Error: faster-whisper not installed.", file=sys.stderr)
        print("Install with: pip install faster-whisper", file=sys.stderr)
        sys.exit(1)

    # Load model
    model = WhisperModel(
        args.model,
        device=args.device,
        compute_type=args.compute_type,
    )
    print(f"  Model loaded in {time.time() - start_time:.1f}s")

    # Transcribe
    print(f"Transcribing: {args.audio}")
    transcribe_start = time.time()

    segments_iter, info = model.transcribe(
        args.audio,
        language=args.language,
        beam_size=5,
        vad_filter=True,
        vad_parameters=dict(
            min_silence_duration_ms=500,
            speech_pad_ms=200,
        ),
    )

    # Collect segments
    segments = []
    for segment in segments_iter:
        segments.append({
            'start': segment.start,
            'end': segment.end,
            'text': segment.text.strip(),
        })
        # Print progress every 50 segments
        if len(segments) % 50 == 0:
            print(f"  ... {len(segments)} segments processed")

    elapsed = time.time() - transcribe_start

    # Build output
    result = {
        'duration': info.duration,
        'language': info.language,
        'language_probability': round(info.language_probability, 3),
        'segments': segments,
        'model': args.model,
        'transcription_time': round(elapsed, 2),
        'segments_count': len(segments),
    }

    # Write output
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"✓ Done! {len(segments)} segments in {elapsed:.1f}s")
    print(f"  Language: {info.language} ({info.language_probability:.1%} confidence)")
    print(f"  Duration: {info.duration:.1f}s")
    print(f"  Output: {args.output}")


if __name__ == '__main__':
    main()
