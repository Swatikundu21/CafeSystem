import React, { useState, useEffect } from 'react';
import {
  TestTube2,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Award,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { TestCaseResult, TestRegistry, TestSuiteResult } from './testRunner.ts';
import { registerMenuValidationTests } from './validation.test.ts';
import { registerBillingTests } from './billing.test.ts';
import { jiraSyncService } from '../services/jiraSyncService.ts';

// Ensure tests are registered once
let registered = false;
function ensureTestsRegistered() {
  if (!registered) {
    registerMenuValidationTests();
    registerBillingTests();
    registered = true;
  }
}

export const TestRunnerView: React.FC = () => {
  const [suiteResults, setSuiteResults] = useState<TestSuiteResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');
  const [expandedTestIds, setExpandedTestIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    ensureTestsRegistered();
    runAllTests();
  }, []);

  const runAllTests = async () => {
    setIsRunning(true);
    // Yield to let UI show running animation
    await new Promise((r) => setTimeout(r, 100));
    const results = await TestRegistry.runSuite();
    setSuiteResults(results);
    setIsRunning(false);

    // Sync test run report to Jira Cloud project SCRUM
    const totalPassed = results.reduce((acc, s) => acc + s.passed, 0);
    const totalFailed = results.reduce((acc, s) => acc + s.failed, 0);
    const totalTests = totalPassed + totalFailed;
    jiraSyncService.logEvent({
      type: 'test_run',
      summary: `[QA Test Run] ${totalPassed}/${totalTests} Passed (${totalFailed === 0 ? '100% Success' : `${totalFailed} Failed`})`,
      details: `Automated QA Suite Execution:\nSuites: ${results.map((r) => r.suiteName).join(', ')}\nTotal: ${totalTests}\nPassed: ${totalPassed}\nFailed: ${totalFailed}\nExecution Duration: ${results.reduce((acc, s) => acc + s.durationMs, 0).toFixed(1)}ms`,
      issueType: totalFailed > 0 ? 'Bug' : 'Task',
    }).catch(() => {});
  };

  const runSpecificSuite = async (suiteName: string) => {
    setIsRunning(true);
    await new Promise((r) => setTimeout(r, 100));
    const results = await TestRegistry.runSuite(suiteName);
    setSuiteResults(results);
    setIsRunning(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedTestIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const allIds = suiteResults.flatMap((s) => s.tests.map((t) => t.id));
    setExpandedTestIds(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedTestIds(new Set());
  };

  // Aggregate stats
  const allTests = suiteResults.flatMap((s) => s.tests);
  const totalTests = allTests.length;
  const passedTests = allTests.filter((t) => t.passed).length;
  const failedTests = totalTests - passedTests;
  const totalDuration = suiteResults.reduce((acc, s) => acc + s.durationMs, 0);

  const filteredSuites = suiteResults.map((suite) => {
    const tests = suite.tests.filter((t) => {
      if (activeFilter === 'PASSED') return t.passed;
      if (activeFilter === 'FAILED') return !t.passed;
      return true;
    });
    return { ...suite, tests };
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#065f46] to-[#064e3b] text-white rounded-2xl p-6 shadow-md border border-[#047857]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 font-mono">
                White-Box &amp; Black-Box Verification
              </span>
              <span className="text-xs text-emerald-100">JIRA Test Execution Engine</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight font-['Plus_Jakarta_Sans']">
              Unit Test Suite Runner
            </h1>
            <p className="text-xs text-emerald-100/80 max-w-2xl mt-1">
              Direct verification of Module 1 Validation logic (Unique name, bounds &gt;0 and &le;10000, fixed categories)
              and Module 2 Billing Engine (Quantity 1–20, 10% discount on subtotal &gt;500, 5% GST calculation).
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="px-5 py-2.5 rounded-xl bg-white text-emerald-900 text-xs font-black hover:bg-emerald-50 active:scale-95 transition-all shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <Play className={`w-4 h-4 fill-current ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running Tests...' : 'Execute All Unit Tests'}</span>
            </button>
          </div>
        </div>

        {/* Test KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-600/50">
          <div className="bg-[#044332]/70 rounded-xl p-3 border border-emerald-700/60">
            <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider block">
              Total Tests
            </span>
            <span className="text-xl font-black text-white font-['Plus_Jakarta_Sans']">
              {totalTests}
            </span>
          </div>

          <div className="bg-[#044332]/70 rounded-xl p-3 border border-emerald-700/60">
            <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider block">
              Passed
            </span>
            <span className="text-xl font-black text-emerald-300 font-['Plus_Jakarta_Sans'] flex items-center space-x-1.5">
              <span>{passedTests}</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 inline" />
            </span>
          </div>

          <div className="bg-[#044332]/70 rounded-xl p-3 border border-emerald-700/60">
            <span className="text-[10px] text-rose-300 uppercase font-bold tracking-wider block">
              Failed
            </span>
            <span className="text-xl font-black text-rose-300 font-['Plus_Jakarta_Sans']">
              {failedTests}
            </span>
          </div>

          <div className="bg-[#044332]/70 rounded-xl p-3 border border-emerald-700/60">
            <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider block">
              Execution Time
            </span>
            <span className="text-xl font-black text-white font-['Plus_Jakarta_Sans'] flex items-center space-x-1">
              <span>{totalDuration.toFixed(1)}ms</span>
              <Clock className="w-4 h-4 text-emerald-300 inline" />
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Actions */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#e8dfd5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-[#523927] uppercase tracking-wider">
            Filter Results:
          </span>
          <div className="flex items-center space-x-1 bg-[#f5efe6] p-1 rounded-xl border border-[#e0d6cb]">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'ALL'
                  ? 'bg-white text-[#2c1d14] shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All ({totalTests})
            </button>
            <button
              onClick={() => setActiveFilter('PASSED')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'PASSED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-emerald-700'
              }`}
            >
              Passed ({passedTests})
            </button>
            <button
              onClick={() => setActiveFilter('FAILED')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'FAILED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-rose-700'
              }`}
            >
              Failed ({failedTests})
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 rounded-lg border border-[#e0d6cb] hover:bg-[#faf7f2] text-[#523927] font-semibold transition-colors"
          >
            Expand All Assertions
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 rounded-lg border border-[#e0d6cb] hover:bg-[#faf7f2] text-[#523927] font-semibold transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Test Suites Display */}
      <div className="space-y-6">
        {filteredSuites.map((suite) => (
          <div
            key={suite.suiteName}
            className="bg-white rounded-2xl shadow-xs border border-[#e8dfd5] overflow-hidden"
          >
            {/* Suite Header */}
            <div className="bg-[#faf7f2] px-6 py-4 border-b border-[#e8dfd5] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#2c1d14] font-['Plus_Jakarta_Sans']">
                    {suite.suiteName}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    {suite.passed} of {suite.total} tests passing ({suite.durationMs.toFixed(1)}ms)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {suite.passed === suite.total ? '100% PASS' : `${suite.passed}/${suite.total}`}
                </span>
                <button
                  onClick={() => runSpecificSuite(suite.suiteName)}
                  title="Re-run this suite"
                  className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-600 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Test Cases in this Suite */}
            <div className="divide-y divide-[#f0e8de]">
              {suite.tests.map((test) => {
                const isExpanded = expandedTestIds.has(test.id);

                return (
                  <div key={test.id} className="p-4 hover:bg-[#faf7f2]/40 transition-colors">
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => toggleExpand(test.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <button className="mt-0.5 text-neutral-400 hover:text-neutral-700">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center space-x-2">
                            {test.jiraKey && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                {test.jiraKey}
                              </span>
                            )}
                            <span className="text-xs font-bold text-[#2c1d14]">
                              {test.name}
                            </span>
                          </div>

                          <div className="text-[10px] text-neutral-500 mt-1 flex items-center space-x-3">
                            <span>{test.assertions.length} assertions verified</span>
                            <span>&bull;</span>
                            <span>Duration: {test.durationMs.toFixed(1)}ms</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {test.passed ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>PASS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>FAIL</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expandable Assertions Detail */}
                    {isExpanded && (
                      <div className="mt-3 ml-7 pt-3 border-t border-[#f0e8de] space-y-2">
                        <div className="text-[11px] font-bold text-[#78350f] uppercase tracking-wider mb-1">
                          Diagnostic Assertions Log:
                        </div>
                        <div className="space-y-1.5">
                          {test.assertions.map((a, idx) => (
                            <div
                              key={idx}
                              className={`p-2 rounded-lg text-xs font-mono flex items-start justify-between ${
                                a.passed
                                  ? 'bg-emerald-50/60 border border-emerald-200/60 text-emerald-950'
                                  : 'bg-rose-50 border border-rose-200 text-rose-950'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className={a.passed ? 'text-emerald-600' : 'text-rose-600'}>
                                  {a.passed ? '✓' : '✗'}
                                </span>
                                <span>{a.description}</span>
                              </div>

                              <div className="text-[10px] text-neutral-500 text-right shrink-0">
                                {a.passed ? (
                                  <span className="text-emerald-700">Assertion satisfied</span>
                                ) : (
                                  <span className="text-rose-700 font-bold">
                                    {a.errorMessage}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Software Engineering Testing Methodology Callout */}
      <div className="bg-[#faf7f2] border border-[#e8dfd5] rounded-2xl p-5 text-xs text-[#523927] space-y-3">
        <div className="flex items-center space-x-2 font-bold text-[#78350f] text-sm">
          <Award className="w-4 h-4 text-[#d97706]" />
          <span>Student Demo: Software Testing Methodology Summary</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed text-neutral-600">
          <div className="bg-white p-3 rounded-xl border border-[#e8dfd5]">
            <h5 className="font-bold text-[#2c1d14] mb-1">Boundary Value Analysis (BVA)</h5>
            <p>
              Tested <strong>Price:</strong> 0.00 (reject), 0.01 (pass), 10000.00 (pass), 10000.01 (reject).<br/>
              Tested <strong>Quantity:</strong> 0 (reject), 1 (pass), 20 (pass), 21 (reject).<br/>
              Tested <strong>Discount:</strong> 499.00 (0%), 500.00 (0%), 500.01 (10%).
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-[#e8dfd5]">
            <h5 className="font-bold text-[#2c1d14] mb-1">Equivalence Partitioning (EP)</h5>
            <p>
              Divided inputs into valid and invalid classes:<br/>
              - Name: empty string, valid text, duplicate (case-insensitive).<br/>
              - Category: approved 6 fixed categories vs outside domain values.
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-[#e8dfd5]">
            <h5 className="font-bold text-[#2c1d14] mb-1">White-Box Branch Coverage</h5>
            <p>
              Every decision branch in <code>billingEngine.ts</code> and <code>validation.ts</code> is exercised,
              including self-update name exemptions, decimal truncation, and discount threshold gates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
