#!/usr/bin/env node

import { intro, outro, confirm, spinner } from '@clack/prompts';
import { exec } from 'child_process';
import { promisify } from 'util';
import open from 'open';
import http from 'http';
import fs from 'fs/promises';

const execAsync = promisify(exec);

async function checkGitRepository(): Promise<boolean> {
  try {
    await execAsync('git rev-parse --is-inside-work-tree');
    return true;
  } catch (error) {
    return false;
  }
}

async function getUpstreamUrl(): Promise<string | null> {
  try {
    const { stdout } = await execAsync('git remote get-url origin');
    return stdout.trim();
  } catch (error) {
    return null;
  }
}

async function startCallbackServer(): Promise<{ server: http.Server; port: number; payloadPromise: Promise<string | null> }> {
  return new Promise((resolve) => {
    let payloadResolve: (value: string | null) => void;
    const payloadPromise = new Promise<string | null>((res) => {
      payloadResolve = res;
    });

    const server = http.createServer((req, res) => {
      if (req.url?.startsWith('/callback')) {
        const urlParams = new URLSearchParams(req.url.split('?')[1]);
        const payload = urlParams.get('payload');
        
        if (payload) {
          payloadResolve(payload);
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Callback received');
        } else {
          payloadResolve(null);
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('No payload received');
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      }
    });

    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'object' ? address?.port : null;
      resolve({ server, port: port || 0, payloadPromise });
    });
  });
}

async function up() {
  intro('Welcome to the Flipt Cloud Demo app!');

  // Add signal handler for SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('\nScript terminated by user.');
    process.exit(0);
  });

  const isGitRepo = await checkGitRepository();
  if (!isGitRepo) {
    console.error('This is not a git repository.');
    process.exit(1);
  }

  const upstreamUrl = await getUpstreamUrl();
  if (!upstreamUrl) {
    console.error('Unable to fetch upstream URL.');
    process.exit(1);
  }

  const shouldOpenBrowser = await confirm({
    message: 'We need to open your browser for login. Do you want to proceed?',
  });

  if (shouldOpenBrowser) {
    const s = spinner();
    s.start('Waiting for Flipt Cloud...');

    const { server: callbackServer, port, payloadPromise } = await startCallbackServer();
    const encodedData = Buffer.from(JSON.stringify({ repo: upstreamUrl, callbackUrl: `http://localhost:${port}/callback` })).toString('base64');
    const loginUrl = `https://flipt.cloud/demo/device?data=${encodedData}`;
    
    try {
      await open(loginUrl);

      // Wait for the payload or timeout after 5 minutes
      const payload = await Promise.race([
        payloadPromise,
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 60000 * 5))
      ]);

      if (payload) {
        s.stop('Received payload from Flipt Cloud');

        // Decode and parse the payload
        const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());

        const shouldOverwrite = await confirm({
          message: 'Do you want to overwrite your .env.local file with the Flipt Cloud credentials?',
        });

        if (shouldOverwrite) {
          const envContent = `FLIPT_CLOUD_URL=${decodedPayload.environment_url}\nFLIPT_CLOUD_API_KEY=${decodedPayload.environment_api_key}`;
          
          try {
            await fs.writeFile('.env.local', envContent);
            console.log('Successfully updated .env.local file with Flipt Cloud credentials.');
          } catch (error) {
            console.error('Failed to write .env.local file:', error);
          }
        } else {
          console.log('Skipped updating .env.local file.');
        }
      } else {
        s.stop('No payload received from Flipt Cloud');
      }
    } catch (error) {
      s.stop('Failed to receive payload from Flipt Cloud');
      console.error('Failed to receive payload:', error);
    } finally {
      callbackServer.close();
    }
  } else {
    console.log('Login process cancelled.');
  }

  outro('Command completed!');
}

// Run the command
up().catch((error) => {
  console.error(error);
});
