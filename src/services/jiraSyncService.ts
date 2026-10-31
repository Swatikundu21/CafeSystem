/**
 * Jira Cloud Live Synchronization Service
 * 
 * Pre-configured for:
 * Instance: https://rbunagpur-team-rkyww9x4.atlassian.net
 * Project Key: SCRUM
 * Target: https://rbunagpur-team-rkyww9x4.atlassian.net/jira/software/projects/SCRUM/summary
 */

export interface JiraSyncConfig {
  host: string;
  projectKey: string;
  email: string;
  apiToken: string;
  webhookUrl: string;
  syncEnabled: boolean;
  syncMenuChanges: boolean;
  syncOrders: boolean;
  syncBugs: boolean;
  syncTestRuns: boolean;
}

export interface JiraSyncEvent {
  id: string;
  timestamp: string;
  type: 'menu_created' | 'menu_updated' | 'menu_deleted' | 'menu_stock' | 'order_created' | 'bug_reported' | 'test_run' | 'system_reset';
  summary: string;
  details: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED' | 'QUEUED';
  jiraIssueKey?: string;
  jiraIssueUrl?: string;
  errorMessage?: string;
}

const STORAGE_KEY_CONFIG = 'cafemaster_jira_config_v1';
const STORAGE_KEY_EVENTS = 'cafemaster_jira_events_v1';

export const DEFAULT_JIRA_CONFIG: JiraSyncConfig = {
  host: 'https://rbunagpur-team-rkyww9x4.atlassian.net',
  projectKey: 'SCRUM',
  email: '24kundus@rbunagpur.in',
  apiToken: '',
  webhookUrl: '',
  syncEnabled: true,
  syncMenuChanges: true,
  syncOrders: true,
  syncBugs: true,
  syncTestRuns: true,
};

type EventListener = (events: JiraSyncEvent[]) => void;
type ConfigListener = (config: JiraSyncConfig) => void;

class JiraSyncManager {
  private config: JiraSyncConfig;
  private events: JiraSyncEvent[] = [];
  private eventListeners: Set<EventListener> = new Set();
  private configListeners: Set<ConfigListener> = new Set();

  constructor() {
    this.config = this.loadConfig();
    this.events = this.loadEvents();
  }

  private loadConfig(): JiraSyncConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        return { ...DEFAULT_JIRA_CONFIG, ...JSON.parse(saved) };
      }
    } catch {}
    return { ...DEFAULT_JIRA_CONFIG };
  }

  private loadEvents(): JiraSyncEvent[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EVENTS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return [];
  }

  public saveConfig(newConfig: Partial<JiraSyncConfig>): JiraSyncConfig {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    } catch {}
    this.notifyConfigListeners();
    return this.config;
  }

  public getConfig(): JiraSyncConfig {
    return { ...this.config };
  }

  public getEvents(): JiraSyncEvent[] {
    return [...this.events];
  }

  public clearEvents(): void {
    this.events = [];
    try {
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify([]));
    } catch {}
    this.notifyEventListeners();
  }

  public subscribeEvents(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  public subscribeConfig(listener: ConfigListener): () => void {
    this.configListeners.add(listener);
    return () => this.configListeners.delete(listener);
  }

  private notifyEventListeners(): void {
    this.eventListeners.forEach((fn) => fn([...this.events]));
  }

  private notifyConfigListeners(): void {
    this.configListeners.forEach((fn) => fn({ ...this.config }));
  }

  /**
   * Log an event whenever a website change occurs
   */
  public async logEvent(params: {
    type: JiraSyncEvent['type'];
    summary: string;
    details: string;
    issueType?: 'Task' | 'Bug' | 'Story';
  }): Promise<JiraSyncEvent> {
    const event: JiraSyncEvent = {
      id: `jira_evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      type: params.type,
      summary: params.summary,
      details: params.details,
      status: 'QUEUED',
    };

    // Prepend to event log
    this.events = [event, ...this.events].slice(0, 100);
    this.persistEvents();
    this.notifyEventListeners();

    // If sync is enabled, attempt to push to Jira
    if (this.config.syncEnabled) {
      this.dispatchToJira(event, params.issueType || 'Task');
    }

    return event;
  }

  private persistEvents(): void {
    try {
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(this.events));
    } catch {}
  }

  /**
   * Dispatches the event to Jira via API proxy or Incoming Webhook
   */
  public async dispatchToJira(event: JiraSyncEvent, issueType: string = 'Task'): Promise<void> {
    const config = this.config;

    // Check if we have credentials or webhook
    const hasWebhook = Boolean(config.webhookUrl && config.webhookUrl.trim().length > 0);
    const hasApiToken = Boolean(config.apiToken && config.apiToken.trim().length > 0);

    if (!hasWebhook && !hasApiToken) {
      // Mark as queued waiting for credentials
      this.updateEventStatus(event.id, 'QUEUED', undefined, undefined, 'Awaiting Jira API Token or Webhook URL in settings.');
      return;
    }

    try {
      if (hasWebhook) {
        // Method A: Direct Jira Incoming Automation Webhook
        const resp = await fetch(config.webhookUrl.trim(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: event.type,
            summary: event.summary,
            details: event.details,
            project: config.projectKey,
            timestamp: event.timestamp,
            websiteUrl: window.location.origin,
          }),
        });

        if (resp.ok) {
          this.updateEventStatus(
            event.id,
            'SYNCED',
            `${config.projectKey}-WEBHOOK`,
            `${config.host}/jira/software/projects/${config.projectKey}/summary`
          );
          return;
        } else {
          throw new Error(`Webhook returned status ${resp.status}`);
        }
      }

      // Method B: Jira REST API v3 via backend proxy
      const payload = {
        action: 'create_issue',
        host: config.host,
        projectKey: config.projectKey,
        email: config.email,
        apiToken: config.apiToken,
        issueType: issueType,
        summary: event.summary,
        description: `${event.details}\n\nGenerated automatically by CafeMaster Website Integration.\nTimestamp: ${new Date().toLocaleString()}`,
      };

      const resp = await fetch('/api/jira', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();

      if (resp.ok && data.success) {
        const issueKey = data.issueKey || `${config.projectKey}-SYNC`;
        const issueUrl = data.issueUrl || `${config.host}/browse/${issueKey}`;
        this.updateEventStatus(event.id, 'SYNCED', issueKey, issueUrl);
      } else {
        throw new Error(data.error || 'Failed to push to Jira API');
      }
    } catch (err: any) {
      console.warn('Jira sync dispatch error:', err);
      this.updateEventStatus(event.id, 'FAILED', undefined, undefined, err.message || 'Network / Auth error');
    }
  }

  private updateEventStatus(
    id: string,
    status: JiraSyncEvent['status'],
    jiraIssueKey?: string,
    jiraIssueUrl?: string,
    errorMessage?: string
  ): void {
    this.events = this.events.map((e) => {
      if (e.id === id) {
        return {
          ...e,
          status,
          jiraIssueKey: jiraIssueKey ?? e.jiraIssueKey,
          jiraIssueUrl: jiraIssueUrl ?? e.jiraIssueUrl,
          errorMessage: errorMessage ?? e.errorMessage,
        };
      }
      return e;
    });
    this.persistEvents();
    this.notifyEventListeners();
  }

  /**
   * Test connection to Jira instance
   */
  public async testConnection(): Promise<{ success: boolean; message: string; projectData?: any }> {
    const config = this.config;

    if (config.webhookUrl) {
      try {
        const resp = await fetch(config.webhookUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'test_connection',
            summary: '[Test Ping] CafeMaster Connection Test',
            details: 'Testing integration between CafeMaster and Jira SCRUM project.',
            timestamp: new Date().toISOString(),
          }),
        });
        if (resp.ok) {
          return { success: true, message: 'Successfully triggered Jira Automation Webhook!' };
        }
        return { success: false, message: `Webhook responded with HTTP ${resp.status}` };
      } catch (err: any) {
        return { success: false, message: `Webhook error: ${err.message}` };
      }
    }

    if (!config.apiToken) {
      return {
        success: false,
        message: 'No API Token configured yet. Please enter your Atlassian API Token or a Jira Automation Webhook URL.',
      };
    }

    try {
      const resp = await fetch('/api/jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_connection',
          host: config.host,
          projectKey: config.projectKey,
          email: config.email,
          apiToken: config.apiToken,
        }),
      });

      const data = await resp.json();
      if (resp.ok && data.success) {
        return {
          success: true,
          message: `Connected successfully to Jira project ${config.projectKey} (${data.projectName || 'SCRUM'})!`,
          projectData: data,
        };
      }
      return { success: false, message: data.error || 'Failed to authenticate with Jira' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to reach Jira proxy' };
    }
  }
}

export const jiraSyncService = new JiraSyncManager();
