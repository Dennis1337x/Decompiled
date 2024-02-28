import { WebSocket } from 'ws';
import got from 'got';
import config from '../config.js';

const ws = new WebSocket('wss://gateway.discord.gg'),
  guilds = {};
let vanity = '';

ws.onopen = () => {
  ws.send(JSON.stringify({
    op: 2,
    d: {
      token: config.listenerToken,
      intents: 1,
      properties: {
        os: 'rashs macbookair',
        browser: 'brave',
        device: 'brave'
      }
    }
  }));
};

ws.onmessage = async message => {
  const data = JSON.parse(message.data);
  if (data.t === 'GUILD_UPDATE') {
    const previousVanity = guilds[data.d.guild_id];
    if (previousVanity && previousVanity !== data.d.vanity_url_code) {
      const payload = { code: previousVanity };
      got.patch(`https://discord.com/api/v10/guilds/${config.sniperGuild}/vanity-url`, {
        json: payload,
        headers: {
          Authorization: config.sniperToken
        }
      }).then(async response => {
        vanity = previousVanity + ' GUILD_UPDATE';
        if (response.statusCode === 200) {
          const webhookPayload = {
            username: 'sniplendi',
            content: `@everyone ${vanity} \n\`\`\`json\n${response.body}\`\`\``
          };
          await got.post(`${config.webhooks}`, { json: webhookPayload });
        } else if (response.statusCode === 400) {
          const webhookPayload = {
            username: 'yok alamadık',
            content: `@everyone ${vanity} \n\`\`\`json\n${response.body}\`\`\``
          };
          await got.post(`${config.webhooks}`, { json: webhookPayload });
        }
      }).catch(async error => {
        vanity = previousVanity + ' GUILD_UPDATE';
        const webhookPayload = {
          username: 'xxl',
          content: `@everyone ${vanity} \n\`\`\`${error.message}\`\`\``
        };
        await got.post(`${config.webhooks}`, { json: webhookPayload });
      });
    }
  } else if (data.t === 'GUILD_DELETE') {
    const previousVanity = guilds[data.d.id];
    if (previousVanity) {
      const payload = { code: previousVanity };
      got.patch(`https://discord.com/api/v10/guilds/${config.sniperGuild}/vanity-url`, {
        json: payload,
        headers: {
          Authorization: config.sniperToken
        }
      }).then(async response => {
        vanity = previousVanity + ' GUILD_DELETE';
        if (response.statusCode === 200) {
          const webhookPayload = {
            username: 'SUCCESS',
            content: `@everyone ${vanity} \n\`\`\`json\n${response.body}\`\`\``
          };
          await got.post(`${config.webhooks}`, { json: webhookPayload });
        } else if (response.statusCode === 400) {
          const webhookPayload = {
            username: 'ERROR',
            content: `@everyone ${vanity} \n\`\`\`json\n${response.body}\`\`\``
          };
          await got.post(`${config.webhooks}`, { json: webhookPayload });
        }
      }).catch(async error => {
        vanity = previousVanity + ' GUILD_UPDATE';
        const webhookPayload = {
          username: 'xxl',
          content: `@everyone ${vanity} \n\`\`\`${error.message}\`\`\``
        };
        await got.post(`${config.webhooks}`, { json: webhookPayload });
      });
    }
  }
  if (data.t === 'READY') {
    for (let guild of data.d.guilds) {
      if (guild.vanity_url_code) guilds[guild.id] = guild.vanity_url_code;
    }
    console.log(Object.values(guilds).map(code => code).join(', '));
  }
  if (data.op === 10) {
    const heartbeat = {
      op: 1,
      d: {},
      s: null,
      t: 'heartbeat'
    };
    setInterval(() => ws.send(JSON.stringify(heartbeat)), data.d.heartbeat_interval);
  } else if (data.op === 7) {
    process.exit();
  }
};

ws.onclose = () => process.exit();
ws.onerror = () => process.exit();
