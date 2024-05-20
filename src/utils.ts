// Inspired by https://github.com/almostSouji/discord-status-webhook/blob/8d61e31ab36a1bbc3b99376434884f8fae0dc707/src/index.ts

import type {APIEmbed, APIMessage} from 'discord-api-types/v10';
import {
	API_BASE,
	EMBED_COLOR_BLACK,
	EMBED_COLOR_GREEN,
	EMBED_COLOR_ORANGE,
	EMBED_COLOR_RED,
	EMBED_COLOR_YELLOW,
} from './constants';
import {
	type DataEntry,
	type Env,
	type StatusPageIncident,
	StatusPageIncidentStatus,
	type StatusPageResult,
} from './types';

const STATUS_COLORS: Record<string, number> = {
	resolved: EMBED_COLOR_GREEN,
	postmortem: EMBED_COLOR_GREEN,
	critical: EMBED_COLOR_RED,
	major: EMBED_COLOR_ORANGE,
	minor: EMBED_COLOR_YELLOW,
	default: EMBED_COLOR_BLACK,
};

export function embedFromIncident(incident: StatusPageIncident): APIEmbed {
	const color = STATUS_COLORS[incident.status] || STATUS_COLORS[incident.impact] || STATUS_COLORS.default;
	const affectedNames = incident.components.map((component) => component.name).join(', ');
	const descriptionParts = [`• Impact: ${incident.impact}`];
	if (affectedNames) {
		descriptionParts.push(`• Affected Components: ${affectedNames}`);
	}
	return {
		color,
		timestamp: new Date(incident.started_at).toISOString(),
		url: incident.shortlink,
		title: incident.name,
		footer: {text: incident.id},
		description: descriptionParts.join('\n'),
	};
}

export async function sendWebhookMessage(env: Env, embed: APIEmbed): Promise<APIMessage> {
	const url = new URL(env.WEBHOOK_URL);
	url.searchParams.set('wait', 'true');
	const response = await fetch(url.toString(), {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify({
			content: `<@&${env.ROLE_ID}>`,
			embeds: [embed],
			allowed_mentions: {roles: [env.ROLE_ID]},
		}),
	});
	if (!response.ok) {
		throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
	}
	return response.json();
}

export async function editWebhookMessage(env: Env, messageId: string, embed: APIEmbed): Promise<APIMessage> {
	const url = new URL(env.WEBHOOK_URL);
	url.pathname += `/messages/${messageId}`;
	const response = await fetch(url.toString(), {
		method: 'PATCH',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify({
			content: `<@&${env.ROLE_ID}>`,
			embeds: [embed],
			allowed_mentions: {roles: [env.ROLE_ID]},
		}),
	});
	if (!response.ok) {
		throw new Error(`Failed to edit message: ${response.status} ${response.statusText}`);
	}
	return response.json();
}

const RESOLVED_STATUSES = new Set([StatusPageIncidentStatus.Resolved, StatusPageIncidentStatus.Postmortem]);

export async function updateIncident(env: Env, incident: StatusPageIncident, messageId?: string): Promise<void> {
	const embed = embedFromIncident(incident);
	const message = messageId ? await editWebhookMessage(env, messageId, embed) : await sendWebhookMessage(env, embed);
	const data: DataEntry = {
		incident_id: incident.id,
		last_updated_at: Date.now(),
		message_id: message.id,
		resolved: RESOLVED_STATUSES.has(incident.status),
	};
	await env.KV.put(incident.id, JSON.stringify(data));
}

export async function checkForUpdates(env: Env): Promise<void> {
	const {incidents} = await fetch(`${API_BASE}/incidents.json`).then((r) => r.json<StatusPageResult>());
	for (const incident of incidents.reverse()) {
		const data = await env.KV.get<DataEntry>(incident.id, 'json');
		if (!data) {
			if (RESOLVED_STATUSES.has(incident.status)) {
				continue;
			}
			await updateIncident(env, incident);
			continue;
		}
		const incidentUpdate = new Date(incident.updated_at ?? incident.created_at);
		if (data.last_updated_at < incidentUpdate.getTime()) {
			await updateIncident(env, incident, data.message_id);
		}
	}
}
