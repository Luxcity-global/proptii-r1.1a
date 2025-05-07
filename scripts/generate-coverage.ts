import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const COVERAGE_DIR = 'coverage';
const REPORTS_DIR = join(COVERAGE_DIR, 'reports');
const HISTORY_DIR = join(COVERAGE_DIR, 'history');

// Ensure directories exist
[COVERAGE_DIR, REPORTS_DIR, HISTORY_DIR].forEach(dir => {
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
});

try {
    // Run tests with coverage
    console.log('Running tests with coverage...');
    execSync('vitest run --coverage', { stdio: 'inherit' });

    // Generate timestamp for report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Copy coverage report to history
    const reportPath = join(HISTORY_DIR, `coverage-${timestamp}.json`);
    execSync(`cp ${join(COVERAGE_DIR, 'coverage-final.json')} ${reportPath}`);

    // Generate coverage summary
    const coverage = require(join(process.cwd(), COVERAGE_DIR, 'coverage-final.json'));
    const summary = {
        timestamp,
        overall: {
            statements: 0,
            branches: 0,
            functions: 0,
            lines: 0
        },
        components: {}
    };

    // Calculate coverage metrics
    Object.entries(coverage).forEach(([file, data]: [string, any]) => {
        const metrics = {
            statements: data.statementMap ? calculateCoverage(data.s, data.statementMap) : 0,
            branches: data.branchMap ? calculateCoverage(data.b, data.branchMap) : 0,
            functions: data.fnMap ? calculateCoverage(data.f, data.fnMap) : 0,
            lines: data.lineMap ? calculateCoverage(data.l, data.lineMap) : 0
        };

        // Add to component-specific metrics
        const component = file.split('/').slice(-2).join('/');
        summary.components[component] = metrics;

        // Add to overall metrics
        Object.keys(metrics).forEach(metric => {
            summary.overall[metric] += metrics[metric];
        });
    });

    // Average the overall metrics
    const componentCount = Object.keys(summary.components).length;
    Object.keys(summary.overall).forEach(metric => {
        summary.overall[metric] /= componentCount;
    });

    // Save summary
    const summaryPath = join(REPORTS_DIR, `summary-${timestamp}.json`);
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log('Coverage report generated successfully!');
    console.log(`Summary saved to: ${summaryPath}`);
    console.log('\nOverall Coverage:');
    Object.entries(summary.overall).forEach(([metric, value]) => {
        console.log(`${metric}: ${value.toFixed(2)}%`);
    });

} catch (error) {
    console.error('Error generating coverage report:', error);
    process.exit(1);
}

function calculateCoverage(counts: Record<string, number>, map: Record<string, any>): number {
    const total = Object.keys(map).length;
    if (total === 0) return 0;

    const covered = Object.values(counts).filter(count => count > 0).length;
    return (covered / total) * 100;
} 