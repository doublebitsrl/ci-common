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

    // TODO: create the markdown table for each test suite
    reportData.testResults.forEach(suite => {
      // Extract test suite name from the file path
      const testName = suite.name.split('/').pop().replace('.spec.js', '').replace('.test.js', '');

      // Determine status based on test results
      const status = suite.status === 'passed' ? '✅ PASS' : '❌ FAIL';

      // Calculate total tests and passed/failed counts
      const totalTests = suite.assertionResults.length;
      const passedTests = suite.assertionResults.filter(test => test.status === 'passed').length;
      const failedTests = suite.assertionResults.filter(test => test.status === 'failed').length;

      // Calculate duration in milliseconds
      const duration = `${suite.endTime - suite.startTime}ms`;

      markdown += `| ${testName} | ${status} | ${totalTests} | ${passedTests} | ${failedTests} | ${duration} |\n`;
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
    markdown += `### Challenge Result\n\n`;
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
