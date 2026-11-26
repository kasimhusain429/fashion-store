#!/bin/bash
# Full batch: sim + Cycles renders + GLB export for every tee, then web conversions.
B="/c/Program Files/Blender Foundation/Blender 5.2/blender.exe"
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="${VAELIS_WORK:-D:/vaelis-work}"
mkdir -p "$WORK"
cd "$WORK"
for pid in monolith kimono column tank longsleeve pocket; do
  "$B" -b --factory-startup --python "$HERE/tee_pipeline.py" -- $pid --frames 45 --samples 40 > log_$pid.txt 2>&1
  grep -E "\[vaelis\] (tee z-range|DONE|FAILED)|Traceback|EXCEPTION" log_$pid.txt
done
echo ALL_DONE
