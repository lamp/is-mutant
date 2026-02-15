#!/usr/bin/env bash
#
# ab_test.sh
# Simple wrapper around ApacheBench (ab) to test the /mutant/ endpoint.
#
# Creates a JSON payload file (mutant/human/custom) and runs ab with the
# provided concurrency and request count. Cleans up on exit.
#
# Requirements:
# - ApacheBench (ab) installed and available in PATH
# - bash shell
#
# Usage examples:
#  ./ab_test.sh                   # run default (mutant) test against http:/127.0.0.1:3000/mutant/
#  For some reason localhost refuses to connect, so use 127.0.0.1 instead
#  ./ab_test.sh -u http://api.example.com/mutant/ -t human -n 500 -c 50
#  ./ab_test.sh -t custom -f ./my_payload.json -n 1000 -c 200 -k -o results.txt
#
set -euo pipefail

DEFAULT_URL="http://127.0.0.1:3000/mutant/"
TYPE="mutant"
CUSTOM_FILE=""
REQUESTS=1000
CONCURRENCY=50
KEEPALIVE=false
OUTFILE=""
SHOW_PAYLOAD=false

print_usage() {
  cat <<EOF
Usage: $0 [options]

Options:
  -u URL           Target URL (default: ${DEFAULT_URL})
  -t TYPE          Payload type: mutant | human | custom  (default: mutant)
  -f FILE          Path to JSON file (required if -t custom)
  -n N             Number of requests (default: ${REQUESTS})
  -c C             Concurrency level (default: ${CONCURRENCY})
  -k               Enable HTTP Keep-Alive (-k to ab)
  -o FILE          Save ab output to FILE (also printed to stdout)
  -s               Show the JSON payload that will be used and exit
  -h               Show this help
EOF
}

while getopts "u:t:f:n:c:ko:sh" opt; do
  case "$opt" in
    u) URL="$OPTARG" ;;
    t) TYPE="$OPTARG" ;;
    f) CUSTOM_FILE="$OPTARG" ;;
    n) REQUESTS="$OPTARG" ;;
    c) CONCURRENCY="$OPTARG" ;;
    k) KEEPALIVE=true ;;
    o) OUTFILE="$OPTARG" ;;
    s) SHOW_PAYLOAD=true ;;
    h) print_usage; exit 0 ;;
    *) print_usage; exit 1 ;;
  esac
done

URL="${URL:-$DEFAULT_URL}"

# Check ab exists
if ! command -v ab >/dev/null 2>&1; then
  echo "ERROR: ApacheBench (ab) not found in PATH. Install it (often provided by apache2-utils/httpd-tools)." >&2
  exit 2
fi

# Prepare payloads
MUTANT_PAYLOAD='{"dna":["ATGCGA","CAGTGC","TTATGT","AGAAGG","CCCCTA","TCACTG"]}'
HUMAN_PAYLOAD='{"dna":["ATGCGA","CAGTGC","TTATTT","AGACGG","GCGTCA","TCACTG"]}'

if [[ "$TYPE" == "mutant" ]]; then
  PAYLOAD="$MUTANT_PAYLOAD"
elif [[ "$TYPE" == "human" ]]; then
  PAYLOAD="$HUMAN_PAYLOAD"
elif [[ "$TYPE" == "custom" ]]; then
  if [[ -z "$CUSTOM_FILE" ]]; then
    echo "ERROR: -t custom requires -f <file> with JSON payload." >&2
    exit 1
  fi
  if [[ ! -f "$CUSTOM_FILE" ]]; then
    echo "ERROR: custom file '$CUSTOM_FILE' not found." >&2
    exit 1
  fi
  PAYLOAD="$(cat "$CUSTOM_FILE")"
else
  echo "ERROR: unknown type '$TYPE'. Use mutant|human|custom." >&2
  exit 1
fi

# Optionally show payload and exit
if [[ "$SHOW_PAYLOAD" == true ]]; then
  echo "Using payload:"
  echo "$PAYLOAD"
  exit 0
fi

TMPFILE="$(mktemp)"
trap 'rm -f "$TMPFILE"' EXIT

echo "$PAYLOAD" > "$TMPFILE"

AB_ARGS=( -n "$REQUESTS" -c "$CONCURRENCY" -T "application/json" -p "$TMPFILE" -H "Accept: application/json" )

if [[ "$KEEPALIVE" == true ]]; then
  AB_ARGS+=( -k )
fi

echo "Running ApacheBench:"
echo "  URL:         $URL"
echo "  Type:        $TYPE"
if [[ "$TYPE" == "custom" ]]; then
  echo "  Custom file: $CUSTOM_FILE"
fi
echo "  Requests:    $REQUESTS"
echo "  Concurrency: $CONCURRENCY"
echo "  Keep-Alive:  $KEEPALIVE"
if [[ -n "$OUTFILE" ]]; then
  echo "  Output file: $OUTFILE"
fi
echo
echo "Payload written to: $TMPFILE"
echo

# Run ab and capture output
if [[ -n "$OUTFILE" ]]; then
  ab "${AB_ARGS[@]}" "$URL" 2>&1 | tee "$OUTFILE"
  AB_EXIT="${PIPESTATUS[0]}"
else
  ab "${AB_ARGS[@]}" "$URL"
  AB_EXIT=$?
fi

if [[ $AB_EXIT -ne 0 ]]; then
  echo "ab exited with code $AB_EXIT" >&2
  exit $AB_EXIT
fi

echo "Done."
exit 0
