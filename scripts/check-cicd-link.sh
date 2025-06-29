#!/bin/bash
# Check CI/CD Pipeline Guide documentation link

echo "🔍 Documentation Table - CI/CD Pipeline Guide Link Check"
echo "======================================================"
echo ""

echo "📋 **DOCUMENTATION TABLE SECTION:**"
echo ""

# Extract the documentation table
sed -n '/📖.*Document.*Purpose.*Link/,/^$/p' /app/README.md | head -10

echo ""
echo "🔍 **SPECIFIC CI/CD LINE CHECK:**"
echo ""

# Show the exact CI/CD line
LINE_445=$(sed -n '445p' /app/README.md)
echo "Line 445: $LINE_445"

# Count vertical bars at start
PIPE_COUNT=$(echo "$LINE_445" | grep -o '^|*' | wc -c)
echo "Vertical bars at start: $((PIPE_COUNT-1))"

echo ""
echo "📊 **TABLE FORMATTING ANALYSIS:**"
echo ""

# Check all documentation lines
sed -n '442,448p' /app/README.md | while IFS= read -r line; do
    pipe_count=$(echo "$line" | grep -o '^|*' | wc -c)
    if [ $pipe_count -gt 0 ]; then
        echo "✅ $line (pipes: $((pipe_count-1)))"
    else
        echo "❌ $line (no pipes found)"
    fi
done

echo ""
echo "🎯 **EXPECTED RESULT:**"
echo "All documentation rows should have exactly 2 vertical bars (||) at the start"
echo ""

echo "🔗 **CI/CD LINK STATUS:**"
if grep -q "CI/CD Pipeline Guide.*DEVELOPMENT_WORKFLOW.md" /app/README.md; then
    echo "✅ CI/CD Pipeline Guide link found in documentation"
else
    echo "❌ CI/CD Pipeline Guide link missing or malformed"
fi

echo ""
echo "💡 **RECOMMENDATION:**"
echo "If the CI/CD link still doesn't appear on GitHub:"
echo "1. Push the current changes: git push"
echo "2. Wait 2-3 minutes for GitHub to update"
echo "3. Clear browser cache and refresh"
echo "4. Check if the markdown table renders correctly"