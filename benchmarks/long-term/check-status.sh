#!/bin/bash
# 장기 테스트 상태 확인 스크립트

echo "=========================================="
echo "Numflow 장기 테스트 상태 확인"
echo "=========================================="
echo ""

# 프로세스 확인
echo "🔍 실행 중인 프로세스:"
ps aux | grep -E "node (app\.js|monitor|load-generator)" | grep -v grep | awk '{printf "  %-20s PID: %-8s CPU: %5s  MEM: %5s\n", $11, $2, $3"%", $4"%"}' || echo "  ❌ 실행 중인 프로세스 없음"
echo ""

# Health Check
echo "🏥 서버 Health Check:"
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "  ✅ 서버 정상 실행 중"
    curl -s http://localhost:3000/api/health | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"  ⏱️  Uptime: {data['uptime']}\")
print(f\"  💾 Memory: {data['memory']['rss']}\")
print(f\"  📊 Steps: {data['featureFirst']['totalStepsExecuted']:,}\")
print(f\"  ⚡ Async Tasks: {data['featureFirst']['asyncTasksCompleted']:,}\")
print(f\"  💼 Transactions: {data['featureFirst']['transactionsCommitted']:,}\")
" 2>/dev/null || echo "  ⚠️  Health 데이터 파싱 실패"
else
    echo "  ❌ 서버 응답 없음"
fi
echo ""

# 로그 파일 크기
echo "📝 로그 파일:"
ls -lh /tmp/numflow-*.log 2>/dev/null | awk '{printf "  %-40s %8s\n", $9, $5}' || echo "  ❌ 로그 파일 없음"
echo ""

# 데이터 파일
echo "💾 모니터링 데이터:"
if [ -f "benchmarks/long-term/monitor-results.jsonl" ]; then
    LINES=$(wc -l < benchmarks/long-term/monitor-results.jsonl)
    SIZE=$(ls -lh benchmarks/long-term/monitor-results.jsonl | awk '{print $5}')
    echo "  ✅ 시스템 모니터링: $LINES 샘플 ($SIZE)"
else
    echo "  ❌ 시스템 모니터링 데이터 없음"
fi

if [ -f "benchmarks/long-term/feature-first/feature-metrics.jsonl" ]; then
    LINES=$(wc -l < benchmarks/long-term/feature-first/feature-metrics.jsonl)
    SIZE=$(ls -lh benchmarks/long-term/feature-first/feature-metrics.jsonl | awk '{print $5}')
    echo "  ✅ Feature 모니터링: $LINES 샘플 ($SIZE)"
else
    echo "  ❌ Feature 모니터링 데이터 없음"
fi
echo ""

echo "=========================================="
echo "📋 명령어:"
echo "  보고서 생성: node benchmarks/long-term/generate-report.js"
echo "  전체 중지:   killall -9 node"
echo "=========================================="
