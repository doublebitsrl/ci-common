// ci-common/.github/scripts/formatReport.js
import fs from 'fs';

function formatReport() {
  try {
    // Read test results
    const reportData = JSON.parse(fs.readFileSync('hiring-tests/report.json', 'utf8'));

    // Read AI review
    const aiReview = JSON.parse(fs.readFileSync('hiring-tests/ai_review.json', 'utf8'));

    // Format test results table
    let markdown = '## 📊 Test Results\n\n';
    markdown += '| Test Suite | Status | Tests | Passed | Failed | Duration |\n';
    markdown += '|------------|--------|-------|--------|--------|---------|\n';

    reportData.testResults.forEach(suite => {
      const status = suite.numFailingTests === 0 ? '✅ PASS' : '❌ FAIL';
      // Safety check for perfStats to prevent undefined errors
      const duration = suite.perfStats && suite.perfStats.end && suite.perfStats.start
        ? `${(suite.perfStats.end - suite.perfStats.start)}ms`
        : 'N/A';
      // Use 'name' property instead of 'testFilePath' and add safety check
      const testName = suite.name ? suite.name.split('/').pop() : 'Unknown Test';
      markdown += `| ${testName} | ${status} | ${suite.numTotalTests || 0} | ${suite.numPassingTests || 0} | ${suite.numFailingTests || 0} | ${duration} |\n`;
    });

    // Add summary
    const totalTests = reportData.numTotalTests;
    const passedTests = reportData.numPassedTests;
    const failedTests = reportData.numFailedTests;
    const overallStatus = failedTests === 0 ? '✅ PASS' : '❌ FAIL';

    markdown += `\n**Overall Status:** ${overallStatus} (${passedTests}/${totalTests} tests passed)\n\n`;

    // Format AI Review section
    markdown += '## 🤖 AI Code Review\n\n';

    // Overall score with visual indicator
    const scoreEmoji = aiReview.overall_score >= 8 ? '🟢' : aiReview.overall_score >= 6 ? '🟡' : '🔴';
    markdown += `**Overall Score:** ${scoreEmoji} ${aiReview.overall_score}/10\n\n`;

    // Detailed scores table
    markdown += '### Detailed Analysis\n\n';
    markdown += '| Category | Score | Comments |\n';
    markdown += '|----------|-------|----------|\n';
    markdown += `| Code Quality | ${aiReview.code_quality.score}/10 | ${aiReview.code_quality.comments} |\n`;
    markdown += `| Best Practices | ${aiReview.best_practices.score}/10 | ${aiReview.best_practices.comments} |\n`;
    markdown += `| Performance | ${aiReview.performance.score}/10 | ${aiReview.performance.comments} |\n`;
    markdown += `| Maintainability | ${aiReview.maintainability.score}/10 | ${aiReview.maintainability.comments} |\n\n`;

    // Strengths
    if (aiReview.strengths && aiReview.strengths.length > 0) {
      markdown += '### ✅ Strengths\n\n';
      aiReview.strengths.forEach(strength => {
        markdown += `- ${strength}\n`;
      });
      markdown += '\n';
    }

    // Improvements
    if (aiReview.improvements && aiReview.improvements.length > 0) {
      markdown += '### 🔧 Areas for Improvement\n\n';
      aiReview.improvements.forEach(improvement => {
        markdown += `- ${improvement}\n`;
      });
      markdown += '\n';
    }

    // Final recommendation
    const recommendationEmoji = {
      'PASS': '✅',
      'REVIEW': '⚠️',
      'FAIL': '❌'
    };
    markdown += `### Final Recommendation\n\n`;
    markdown += `${recommendationEmoji[aiReview.recommendation] || '⚠️'} **${aiReview.recommendation}**\n\n`;

    // Write the combined report
    fs.writeFileSync('hiring-tests/summary.md', markdown);

    console.log('Report formatted successfully');
  } catch (error) {
    console.error('Error formatting report:', error);

    // Create a fallback report if there's an error
    const fallbackMarkdown = `## 📊 Test Results\n\nError reading test results: ${error.message}\n\n## 🤖 AI Code Review\n\nError reading AI review: Please review manually.\n`;
    fs.writeFileSync('hiring-tests/summary.md', fallbackMarkdown);

    process.exit(1);
  }
}

formatReport();
