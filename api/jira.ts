/**
 * Vercel Serverless Function & Backend API Proxy for Jira Cloud
 * 
 * Proxies calls to Atlassian Jira Cloud REST API v3 to avoid browser CORS restrictions
 * and safely handle API tokens.
 * 
 * Target: https://rbunagpur-team-rkyww9x4.atlassian.net
 * Project: SCRUM
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET health check for Vercel deployment verification
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      service: 'CafeMaster Jira API Gateway',
      environment: 'vercel-serverless',
      projectKey: process.env.JIRA_PROJECT_KEY || 'SCRUM',
      host: process.env.JIRA_HOST || 'https://rbunagpur-team-rkyww9x4.atlassian.net',
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const { action, host, projectKey, email, apiToken, summary, description, issueType } = body || {};

    const jiraHost = (host || process.env.JIRA_HOST || 'https://rbunagpur-team-rkyww9x4.atlassian.net').replace(/\/$/, '');
    const jiraEmail = email || process.env.JIRA_EMAIL || '24kundus@rbunagpur.in';
    const jiraToken = apiToken || process.env.JIRA_API_TOKEN;
    const jiraProject = projectKey || process.env.JIRA_PROJECT_KEY || 'SCRUM';

    if (!jiraToken) {
      return res.status(400).json({
        error: 'Missing Atlassian API Token. Please provide apiToken in request or set JIRA_API_TOKEN environment variable.',
      });
    }

    const authHeader = `Basic ${Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64')}`;

    // Action 1: Test Connection & Get Project Info
    if (action === 'test_connection') {
      const response = await fetch(`${jiraHost}/rest/api/3/project/${jiraProject}`, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: `Jira connection failed (${response.status}): ${errorText}`,
        });
      }

      const projectData = await response.json();
      return res.status(200).json({
        success: true,
        projectName: projectData.name,
        projectKey: projectData.key,
        lead: projectData.lead?.displayName,
      });
    }

    // Action 2: Create Issue in Jira Project (e.g. SCRUM)
    if (action === 'create_issue') {
      const jiraIssueType = issueType === 'Bug' ? 'Bug' : issueType === 'Story' ? 'Story' : 'Task';

      // Atlassian Document Format (ADF) description
      const adfDescription = {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: description || 'Website change notification triggered from CafeMaster system.',
              },
            ],
          },
        ],
      };

      const jiraPayload = {
        fields: {
          project: {
            key: jiraProject,
          },
          summary: summary || '[Website Update] Activity recorded',
          description: adfDescription,
          issuetype: {
            name: jiraIssueType,
          },
        },
      };

      const response = await fetch(`${jiraHost}/rest/api/3/issue`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(jiraPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: `Failed to create Jira issue (${response.status}): ${errorText}`,
        });
      }

      const issueData = await response.json();
      return res.status(200).json({
        success: true,
        issueId: issueData.id,
        issueKey: issueData.key,
        issueUrl: `${jiraHost}/browse/${issueData.key}`,
      });
    }

    // Action 3: Add Comment to an existing issue
    if (action === 'add_comment') {
      const { issueKey: targetKey, commentText } = req.body;
      if (!targetKey) {
        return res.status(400).json({ error: 'Missing target issueKey' });
      }

      const commentPayload = {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: commentText || 'Website activity log',
                },
              ],
            },
          ],
        },
      };

      const response = await fetch(`${jiraHost}/rest/api/3/issue/${targetKey}/comment`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(commentPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: `Failed to post comment to Jira (${response.status}): ${errorText}`,
        });
      }

      const commentData = await response.json();
      return res.status(200).json({
        success: true,
        commentId: commentData.id,
      });
    }

    return res.status(400).json({ error: `Unknown action: "${action}"` });
  } catch (err: any) {
    console.error('Jira API proxy error:', err);
    return res.status(500).json({ error: err.message || 'Internal proxy error' });
  }
}
