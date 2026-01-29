#!/bin/bash

# Output directory
OUTPUT_DIR="tests/stress/output"
mkdir -p "$OUTPUT_DIR"

# Clean previous run
rm -f "$OUTPUT_DIR"/task_*.txt

echo "Spawning 30 background sessions..."

for i in {1..30}
do
   (
     # Simulating different tasks
     SLEEP_TIME=$(( ( RANDOM % 5 )  + 1 ))
     
     if [ $i -le 10 ]; then
        # Task Type A: IO bound simulation
        sleep $SLEEP_TIME
        echo "Task $i (Type A - IO) completed after ${SLEEP_TIME}s" > "$OUTPUT_DIR/task_$i.txt"
        
     elif [ $i -le 20 ]; then
        # Task Type B: CPU bound simulation (calculation)
        sleep $SLEEP_TIME
        RESULT=$((i * i))
        echo "Task $i (Type B - CPU) completed. Square: $RESULT" > "$OUTPUT_DIR/task_$i.txt"
        
     else
        # Task Type C: Metadata simulation
        sleep $SLEEP_TIME
        DATE=$(date)
        echo "Task $i (Type C - Meta) completed at $DATE" > "$OUTPUT_DIR/task_$i.txt"
     fi
   ) &
   
   echo "Spawned session $i (PID $!)"
done

echo "Waiting for all sessions to complete..."
wait
echo "All 30 sessions finished. Check $OUTPUT_DIR for results."
