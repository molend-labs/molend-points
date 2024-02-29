import { logger } from './logger';
import fetch from 'cross-fetch';
import { getConfig } from './mode';

async function sendSlackMessageInSegments(text: string) {
  const config = await getConfig();
  if (!config.slackWebhook) {
    logger.warn(`Missing config.slackWebhook`);
    return;
  }
  const slackMessageLengthLimit = 4000;
  const segments = [];
  for (let i = 0; i < text.length; i += slackMessageLengthLimit) {
    segments.push(text.slice(i, i + slackMessageLengthLimit));
  }

  for (const text of segments) {
    await fetch(config.slackWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
  }
}

async function sendSlackAlert(message: string, level: string) {
  const config = await getConfig();
  message = `*molend-points-snapshot@[${config.mode.chainName}]:* *[${level}]* ${message}`;
  try {
    await sendSlackMessageInSegments(message);
  } catch (e: any) {
    logger.error(`Failed to send Slack alert: ${e}`);
  }
}

export async function sendSlackWarning(message: string) {
  logger.warn(message);
  await sendSlackAlert(message, '⚠️WARN');
}

export async function sendSlackInfo(message: string) {
  logger.info(message);
  await sendSlackAlert(message, '💡INFO');
}

export async function sendSlackError(message: string) {
  logger.error(message);
  await sendSlackAlert(message, '❌ERROR');
}
