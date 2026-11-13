#!/bin/bash
# Replays the repository migrations into a THROWAWAY local PostgreSQL database
# and runs the department RLS regression suite. Never point this at Supabase.
# Usage: PGHOST=/tmp PGPORT=54329 PGUSER=postgres supabase/tests/run-local.sh [dbname]
set -euo pipefail
DB=${1:-rccg_rls_test}
case "${PGHOST:-}" in *supabase*|*pooler*) echo "Refusing: looks like a hosted Supabase host" >&2; exit 2;; esac
HERE=$(cd "$(dirname "$0")" && pwd)
P="psql -v ON_ERROR_STOP=1 -q"
$P -d postgres -c "drop database if exists $DB" -c "create database $DB"
$P -d "$DB" -f "$HERE/00_test_only_supabase_shim_and_stub_baseline.sql" 2>&1 | grep -v wal_level | grep -v HINT || true
for f in "$HERE"/../migrations/*.sql; do $P -d "$DB" -f "$f" 2>&1 | grep -v NOTICE || true; echo "applied $(basename "$f")"; done
$P -d "$DB" -f "$HERE/10_fictional_seed.sql"
$P -d "$DB" -f "$HERE/20_department_rls.test.sql" 2>&1 | sed 's/^psql:[^ ]* //'
echo "ALL DEPARTMENT RLS TESTS PASSED"
