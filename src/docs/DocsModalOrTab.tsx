import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Bug,
  BookOpen,
  Database,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  ExternalLink,
  ShieldAlert,
  CheckCircle,
  FileText,
  RefreshCw,
  Send,
  Sliders,
  AlertTriangle,
  Zap,
  Globe,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import {
  generateTestCasesCSV,
  JIRA_BUG_REPORTS,
  JIRA_TEST_CASES,
  JIRA_USER_STORIES,
  JiraTestCase,
  JiraBugReport,
} from './jiraMockData.ts';
import { db } from '../database/db.ts';
import { jiraSyncService, JiraSyncConfig, JiraSyncEvent } from '../services/jiraSyncService.ts';

interface DocsModalOrTabProps {
  initialSubTab?: 'cases' | 'stories' | 'bugs' | 'schema' | 'sync';
}

export const DocsModalOrTab: React.FC<DocsModalOrTabProps> = ({ initialSubTab = 'sync' }) => {
  const [subTab, setSubTab] = useState<'cases' | 'stories' | 'bugs' | 'schema' | 'sync'>(initialSubTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Jira Sync state
  const [jiraConfig, setJiraConfig] = useState<JiraSyncConfig>(jiraSyncService.getConfig());
  const [jiraEvents, setJiraEvents] = useState<JiraSyncEvent[]>(jiraSyncService.getEvents());
  const [isTestingJira, setIsTestingJira] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [pushingBugId, setPushingBugId] = useState<string | null>(null);
  const [apiTokenInput, setApiTokenInput] = useState(jiraConfig.apiToken);
  const [webhookUrlInput, setWebhookUrlInput] = useState(jiraConfig.webhookUrl);
  const [emailInput, setEmailInput] = useState(jiraConfig.email);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    const unsubEvents = jiraSyncService.subscribeEvents((evts) => setJiraEvents(evts));
    const unsubConfig = jiraSyncService.subscribeConfig((cfg) => setJiraConfig(cfg));
    return () => {
      unsubEvents();
      unsubConfig();
    };
  }, []);

  const handleSaveJiraSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    jiraSyncService.saveConfig({
      apiToken: apiTokenInput.trim(),
      webhookUrl: webhookUrlInput.trim(),
      email: emailInput.trim(),
    });
    setTimeout(() => {
      setIsSavingConfig(false);
      setDownloadNotice('Jira settings updated successfully!');
      setTimeout(() => setDownloadNotice(null), 3000);
    }, 400);
  };

  const handleTestJiraConnection = async () => {
    setIsTestingJira(true);
    setTestResult(null);
    const res = await jiraSyncService.testConnection();
    setTestResult(res);
    setIsTestingJira(false);
  };

  const handleCreateTestTask = async () => {
    setIsTestingJira(true);
    await jiraSyncService.logEvent({
      type: 'test_run',
      summary: `[Website Ping] CafeMaster Live Sync Test`,
      details: `Verification ping from CafeMaster website to Jira Project SCRUM.\nOrigin: ${window.location.origin}\nTimestamp: ${new Date().toISOString()}`,
      issueType: 'Task',
    });
    setIsTestingJira(false);
    setDownloadNotice('Created test task event in Jira sync queue!');
    setTimeout(() => setDownloadNotice(null), 3000);
  };

  const handlePushBugToJira = async (bug: JiraBugReport) => {
    setPushingBugId(bug.bugId);
    try {
      await jiraSyncService.logEvent({
        type: 'bug_reported',
        summary: `[Bug] ${bug.bugId}: ${bug.title}`,
        details: `Defect Details:\nSeverity: ${bug.severity}\nPriority: ${bug.priority}\nModule: ${bug.module}\nEnvironment: ${bug.environment}\n\nDescription:\n${bug.description}\n\nSteps to Reproduce:\n${bug.stepsToReproduce.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}\n\nExpected: ${bug.expectedBehavior}\nActual: ${bug.actualBehavior}`,
        issueType: 'Bug',
      });
      setDownloadNotice(`Bug ${bug.bugId} pushed to Jira sync queue!`);
      setTimeout(() => setDownloadNotice(null), 3500);
    } finally {
      setPushingBugId(null);
    }
  };

  // Filter test cases
  const filteredCases = JIRA_TEST_CASES.filter((tc) => {
    const matchesSearch =
      tc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.jiraStoryKey.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = selectedModule === 'ALL' || tc.module.includes(selectedModule);
    return matchesSearch && matchesModule;
  });

  const handleDownloadCSV = () => {
    const csvContent = generateTestCasesCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'test_cases.csv';
    link.click();
    URL.revokeObjectURL(url);

    setDownloadNotice('Downloaded test_cases.csv (ready for Microsoft Excel / Google Sheets)');
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  const handleCopySQL = () => {
    const dump = db.generateSQLDump();
    navigator.clipboard.writeText(dump);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2500);
  };

  const jiraProjectUrl = `${jiraConfig.host}/jira/software/projects/${jiraConfig.projectKey}/summary`;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {downloadNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e140f] text-white px-4 py-3 rounded-xl shadow-2xl border border-blue-400 flex items-center space-x-2 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <CheckCircle className="w-4 h-4 text-blue-400" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#1e1b4b] text-white rounded-2xl p-6 shadow-md border border-[#1e40af]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-blue-500 text-white font-mono flex items-center space-x-1">
                <Radio className="w-3 h-3 animate-pulse text-emerald-300" />
                <span>JIRA Cloud Live Integration</span>
              </span>
              <a
                href={jiraProjectUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-200 hover:text-white underline font-mono flex items-center space-x-1"
              >
                <span>Project: {jiraConfig.projectKey} ({jiraConfig.host.replace('https://', '')})</span>
                <ExternalLink className="w-3 h-3 inline" />
              </a>
            </div>
            <h1 className="text-2xl font-black tracking-tight font-['Plus_Jakarta_Sans']">
              Jira Software Cloud Integration &amp; QA Center
            </h1>
            <p className="text-xs text-blue-200/80 max-w-2xl mt-1">
              Real-time synchronization between website operations (menu changes, orders, unit tests, defects) and your live Jira Cloud Scrum Board.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start md:self-auto">
            <a
              href={jiraProjectUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold transition-all shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open SCRUM in Jira</span>
            </a>
            <button
              onClick={handleDownloadCSV}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center space-x-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-blue-400/40 overflow-x-auto">
          <button
            onClick={() => setSubTab('sync')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              subTab === 'sync'
                ? 'bg-white text-blue-950 shadow-sm'
                : 'text-blue-200 hover:text-white hover:bg-blue-900/60'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-600" />
            <span>Jira Live Sync &amp; Activity ({jiraEvents.length})</span>
          </button>

          <button
            onClick={() => setSubTab('cases')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              subTab === 'cases'
                ? 'bg-white text-blue-950 shadow-sm'
                : 'text-blue-200 hover:text-white hover:bg-blue-900/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Test Cases Matrix ({JIRA_TEST_CASES.length})</span>
          </button>

          <button
            onClick={() => setSubTab('stories')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              subTab === 'stories'
                ? 'bg-white text-blue-950 shadow-sm'
                : 'text-blue-200 hover:text-white hover:bg-blue-900/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>JIRA User Stories ({JIRA_USER_STORIES.length})</span>
          </button>

          <button
            onClick={() => setSubTab('bugs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              subTab === 'bugs'
                ? 'bg-white text-blue-950 shadow-sm'
                : 'text-blue-200 hover:text-white hover:bg-blue-900/60'
            }`}
          >
            <Bug className="w-4 h-4" />
            <span>JIRA Bug Reports ({JIRA_BUG_REPORTS.length})</span>
          </button>

          <button
            onClick={() => setSubTab('schema')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              subTab === 'schema'
                ? 'bg-white text-blue-950 shadow-sm'
                : 'text-blue-200 hover:text-white hover:bg-blue-900/60'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>SQL Schema &amp; DDL</span>
          </button>
        </div>
      </div>

      {/* TAB 0: JIRA CLOUD LIVE SYNC & ACTIVITY STREAM */}
      {subTab === 'sync' && (
        <div className="space-y-6">
          {/* Status & Connection Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#e8dfd5] shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#f0e7dd]">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-base text-[#2c1d14]">
                      Jira Cloud Real-Time Bridge
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Target Board: <a href={jiraProjectUrl} target="_blank" rel="noreferrer" className="text-blue-700 font-semibold underline">{jiraConfig.host}/jira/software/projects/{jiraConfig.projectKey}/summary</a>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleTestJiraConnection}
                  disabled={isTestingJira}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingJira ? 'animate-spin' : ''}`} />
                  <span>Test Jira Connection</span>
                </button>

                <button
                  onClick={handleCreateTestTask}
                  disabled={isTestingJira}
                  className="px-3.5 py-2 rounded-xl bg-[#2c1d14] text-white hover:bg-[#1e140f] text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5 text-blue-400" />
                  <span>Push Test Ping to SCRUM</span>
                </button>

                <a
                  href={jiraProjectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Jira Board</span>
                </a>
              </div>
            </div>

            {/* Test Connection Output Alert */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center space-x-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Integration Configuration Form */}
            <form onSubmit={handleSaveJiraSettings} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Atlassian User Email:
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. 24kundus@rbunagpur.in"
                  className="w-full px-3 py-2 rounded-xl border border-[#e0d6cb] text-xs text-[#2c1d14] bg-[#faf7f2]/50 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Atlassian API Token (or via .env):
                </label>
                <input
                  type="password"
                  value={apiTokenInput}
                  onChange={(e) => setApiTokenInput(e.target.value)}
                  placeholder="Paste Atlassian API Token"
                  className="w-full px-3 py-2 rounded-xl border border-[#e0d6cb] text-xs text-[#2c1d14] bg-[#faf7f2]/50 focus:bg-white focus:outline-none focus:border-blue-600 font-mono"
                />
                <a
                  href="https://id.atlassian.com/manage-profile/security/api-tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-blue-600 hover:underline mt-1 inline-flex items-center space-x-0.5"
                >
                  <span>Generate token in Atlassian Security</span>
                  <ExternalLink className="w-2.5 h-2.5 ml-0.5 inline" />
                </a>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  OR Jira Incoming Webhook URL:
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={webhookUrlInput}
                    onChange={(e) => setWebhookUrlInput(e.target.value)}
                    placeholder="https://automation.atlassian.com/pro/hooks/..."
                    className="flex-1 px-3 py-2 rounded-xl border border-[#e0d6cb] text-xs text-[#2c1d14] bg-[#faf7f2]/50 focus:bg-white focus:outline-none focus:border-blue-600 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isSavingConfig}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    Save
                  </button>
                </div>
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  Jira Project Settings &gt; Automation &gt; Incoming Webhook
                </span>
              </div>
            </form>
          </div>

          {/* Real-time Website Activity Stream (Queue & Status) */}
          <div className="bg-white rounded-2xl p-6 border border-[#e8dfd5] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0e7dd]">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-sm text-[#2c1d14]">
                  Website Activity &amp; Live Jira Dispatch Log ({jiraEvents.length} Events)
                </h3>
              </div>

              {jiraEvents.length > 0 && (
                <button
                  onClick={() => jiraSyncService.clearEvents()}
                  className="text-[11px] text-neutral-400 hover:text-neutral-700 font-semibold underline"
                >
                  Clear log
                </button>
              )}
            </div>

            {jiraEvents.length === 0 ? (
              <div className="text-center py-10 bg-[#faf7f2]/60 rounded-xl border border-dashed border-[#e0d6cb]">
                <Radio className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-neutral-700">No events recorded yet</h4>
                <p className="text-[11px] text-neutral-500 mt-1 max-w-sm mx-auto">
                  Add a menu item, bill an order, toggle item stock, or run tests to watch real-time events queue and sync to Jira project SCRUM!
                </p>
                <button
                  onClick={handleCreateTestTask}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 text-xs font-bold hover:bg-blue-100 border border-blue-200 cursor-pointer"
                >
                  Trigger Sample Sync Event
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {jiraEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-4 rounded-xl border border-[#ede3d8] bg-[#faf7f2]/30 hover:bg-[#faf7f2] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-mono text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            evt.type.startsWith('menu')
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : evt.type.startsWith('order')
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : evt.type.startsWith('bug')
                              ? 'bg-red-100 text-red-900 border border-red-300'
                              : 'bg-blue-100 text-blue-900 border border-blue-300'
                          }`}
                        >
                          {evt.type.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#2c1d14]">{evt.summary}</h4>
                      <pre className="text-[11px] text-neutral-600 font-sans whitespace-pre-wrap leading-relaxed">
                        {evt.details}
                      </pre>
                      {evt.errorMessage && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                          {evt.errorMessage}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-1.5 self-start sm:self-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          evt.status === 'SYNCED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : evt.status === 'FAILED'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {evt.status}
                      </span>

                      {evt.jiraIssueKey ? (
                        <a
                          href={evt.jiraIssueUrl || jiraProjectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-mono text-blue-600 hover:underline flex items-center space-x-1"
                        >
                          <span>{evt.jiraIssueKey}</span>
                          <ExternalLink className="w-2.5 h-2.5 inline" />
                        </a>
                      ) : (
                        <button
                          onClick={() => jiraSyncService.dispatchToJira(evt)}
                          className="text-[11px] text-blue-700 font-bold hover:underline"
                        >
                          Retry Sync
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Guide on Reflecting Changes in Jira */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl p-5 border border-blue-100 space-y-3 text-xs text-blue-950">
            <h4 className="font-extrabold text-sm flex items-center space-x-2 text-blue-950">
              <Globe className="w-4 h-4 text-blue-700" />
              <span>How Website Changes Flow into Your Jira SCRUM Board</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white/80 p-3.5 rounded-xl border border-blue-200/60 shadow-xs space-y-1">
                <span className="font-black text-blue-900 block">1. Authentication Option</span>
                <p className="text-neutral-600 leading-relaxed">
                  Generate a free Atlassian API Token at <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noreferrer" className="text-blue-700 font-semibold underline">id.atlassian.com</a> and paste it above, or set <code>JIRA_API_TOKEN</code> in your environment variables.
                </p>
              </div>

              <div className="bg-white/80 p-3.5 rounded-xl border border-blue-200/60 shadow-xs space-y-1">
                <span className="font-black text-blue-900 block">2. Zero-Auth Webhook Option</span>
                <p className="text-neutral-600 leading-relaxed">
                  In Jira SCRUM: <em>Project Settings &gt; Automation &gt; Create Rule &gt; Incoming Webhook</em>. Paste the URL above, and events will flow into Jira with zero authentication overhead.
                </p>
              </div>

              <div className="bg-white/80 p-3.5 rounded-xl border border-blue-200/60 shadow-xs space-y-1">
                <span className="font-black text-blue-900 block">3. Automated Operations</span>
                <p className="text-neutral-600 leading-relaxed">
                  Every time you add/edit a menu item, bill an order, or run unit tests, the website automatically logs and transmits the change to Jira project <strong>SCRUM</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: TEST CASES MATRIX */}
      {subTab === 'cases' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#e8dfd5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search test cases by ID, title, or JIRA story key..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#e0d6cb] text-xs focus:outline-none focus:border-blue-600 bg-[#faf7f2]/50 text-[#2c1d14]"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-neutral-500 font-semibold">Filter Module:</span>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#e0d6cb] bg-white text-xs text-[#2c1d14] outline-none focus:border-blue-600"
              >
                <option value="ALL">All Modules</option>
                <option value="Menu">Module 1 (Menu)</option>
                <option value="Billing">Module 2 (Billing &amp; Order)</option>
              </select>
            </div>
          </div>

          {/* Test Cases Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#e8dfd5] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#faf7f2] border-b border-[#e8dfd5] text-[#1e3a8a] text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-3 px-3">Test ID</th>
                    <th className="py-3 px-3">JIRA Key</th>
                    <th className="py-3 px-3">Module &amp; Type</th>
                    <th className="py-3 px-4">Test Title &amp; Objective</th>
                    <th className="py-3 px-3">Test Data</th>
                    <th className="py-3 px-3">Expected Result</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e8de]">
                  {filteredCases.map((tc) => (
                    <tr key={tc.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-blue-900 whitespace-nowrap">
                        {tc.id}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {tc.jiraStoryKey}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-neutral-800">{tc.module}</div>
                        <span className="text-[10px] text-neutral-500 block font-mono">
                          {tc.testType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#2c1d14] mb-0.5">{tc.title}</div>
                        <div className="text-[10px] text-neutral-500">
                          <strong>Pre-cond:</strong> {tc.preconditions}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-neutral-600 bg-neutral-50/50">
                        {tc.testData}
                      </td>
                      <td className="py-3 px-3 text-neutral-700">
                        {tc.expectedResult}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>{tc.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: JIRA USER STORIES */}
      {subTab === 'stories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {JIRA_USER_STORIES.map((story) => (
            <div
              key={story.key}
              className="bg-white rounded-2xl p-5 border border-[#e8dfd5] shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 border border-blue-200">
                  {story.key}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-semibold text-neutral-500">
                    {story.storyPoints} Story Points
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {story.status}
                  </span>
                </div>
              </div>

              <h4 className="font-black text-sm text-[#2c1d14]">
                {story.summary}
              </h4>
              <p className="text-xs text-neutral-600 italic bg-[#faf7f2] p-2.5 rounded-xl border border-[#e8dfd5]">
                "{story.description}"
              </p>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#78350f] block mb-1.5">
                  Acceptance Criteria (Definition of Done):
                </span>
                <ul className="space-y-1 text-xs text-neutral-700">
                  {story.acceptanceCriteria.map((ac, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{ac}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-[#f0e8de] text-[10px] text-neutral-400 flex justify-between">
                <span>Module: {story.module}</span>
                <span>Assignee: {story.assignee}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: JIRA BUG REPORTS */}
      {subTab === 'bugs' && (
        <div className="space-y-4">
          {JIRA_BUG_REPORTS.map((bug) => (
            <div
              key={bug.bugId}
              className="bg-white rounded-2xl p-5 border border-red-200 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-neutral-100 gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-red-100 text-red-900 border border-red-200">
                    {bug.key} ({bug.bugId})
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                    Severity: {bug.severity}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                    Priority: {bug.priority}
                  </span>
                </div>

                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 self-start sm:self-auto">
                  {bug.status}
                </span>
              </div>

              <h4 className="font-extrabold text-sm text-[#2c1d14]">
                {bug.title}
              </h4>
              <p className="text-xs text-neutral-600">{bug.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-red-50/60 p-3 rounded-xl border border-red-100">
                  <span className="font-bold text-red-900 block mb-1 text-[11px] uppercase tracking-wider">
                    Actual Defect Behavior:
                  </span>
                  <p className="text-red-800">{bug.actualBehavior}</p>
                </div>

                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                  <span className="font-bold text-emerald-900 block mb-1 text-[11px] uppercase tracking-wider">
                    Expected Behavior:
                  </span>
                  <p className="text-emerald-800">{bug.expectedBehavior}</p>
                </div>
              </div>

              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-xs">
                <span className="font-bold text-blue-900 block mb-1 text-[11px] uppercase tracking-wider">
                  Root Cause &amp; Verification Resolution:
                </span>
                <p className="text-blue-800">{bug.resolutionNotes}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                <span className="text-[11px] text-neutral-500 font-mono">Module: {bug.module}</span>
                <button
                  onClick={() => handlePushBugToJira(bug)}
                  disabled={pushingBugId === bug.bugId}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                  <span>{pushingBugId === bug.bugId ? 'Pushing...' : 'Push Defect to Jira SCRUM'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: SQL SCHEMA VIEWER */}
      {subTab === 'schema' && (
        <div className="bg-white rounded-2xl p-5 border border-[#e8dfd5] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-black text-sm text-[#2c1d14]">
                Relational SQL Schema &amp; DDL (database/schema.sql)
              </h3>
              <p className="text-xs text-neutral-500">
                Tables: <code>menu_items</code>, <code>orders</code>, <code>order_items</code> with CHECK constraints and foreign keys.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopySQL}
                className="px-3 py-1.5 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-xs font-bold text-neutral-700 flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                {copiedSQL ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSQL ? 'Copied SQL Dump!' : 'Copy Live SQL Dump'}</span>
              </button>
            </div>
          </div>

          <div className="bg-[#1e1e1e] text-neutral-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed scrollbar-thin">
            <pre>{`-- ============================================================================
-- Cafe Management System - Relational Database Schema
-- Modules: Module 1 (Menu Management) & Module 2 (Order & Billing)
-- Target: PostgreSQL / SQLite3 / MySQL compatible ANSI SQL
-- ============================================================================

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS menu_items;

CREATE TABLE menu_items (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    availability BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_menu_item_price CHECK (price > 0.00 AND price <= 10000.00),
    CONSTRAINT chk_menu_item_category CHECK (
        category IN (
            'Hot Coffee',
            'Cold Brew & Iced',
            'Bakery & Pastries',
            'Sandwiches & Mains',
            'Artisanal Desserts',
            'Specialty Teas'
        )
    )
);

CREATE UNIQUE INDEX uq_menu_item_name_lower ON menu_items (LOWER(name));

CREATE TABLE orders (
    id VARCHAR(36) PRIMARY KEY,
    order_number VARCHAR(32) NOT NULL UNIQUE,
    customer_name VARCHAR(100) NOT NULL DEFAULT 'Walk-in Guest',
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0.00),
    discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_percent DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
    gst_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(10, 2) NOT NULL CHECK (grand_total >= 0.00),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'CASH',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    menu_item_id VARCHAR(36) NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price > 0.00),
    quantity INTEGER NOT NULL,
    line_total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) 
        REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_menu FOREIGN KEY (menu_item_id) 
        REFERENCES menu_items (id) ON DELETE RESTRICT,
    CONSTRAINT chk_order_item_quantity CHECK (quantity >= 1 AND quantity <= 20)
);`}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
