// ci-common/.github/scripts/formatReport.js
const fs = require('fs');
const report = JSON.parse(fs.readFileSync('hiring-tests/report.json', 'utf8'));

const rows = report.testResults.flatMap(suite =>
  suite.assertionResults.map(test => ({
    suite: suite.name.split('/').pop(),
    name: test.title,
    status: test.status,
    duration: test.duration
  }))
);

let md = `| Suite | Test | Stato | Durata (ms) |\n`;
md += `|-------|------|-------|-------------|\n`;
for (const r of rows) {
  md += `| ${r.suite} | ${r.name} | ${r.status} | ${r.duration} |\n`;
}
fs.writeFileSync('hiring-tests/summary.md', md);
