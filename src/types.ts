// Inspired by https://github.com/almostSouji/discord-status-webhook/blob/8d61e31ab36a1bbc3b99376434884f8fae0dc707/src/interfaces/StatusPage.ts

export type Env = {
	KV: KVNamespace;
	WEBHOOK_URL: string;
	ROLE_ID: string;
};

export type DataEntry = {
	message_id: string;
	incident_id: string;
	last_updated_at: number;
	resolved: boolean;
};

export type StatusPageResult = {
	page: StatusPagePageInformation;
	incidents: StatusPageIncident[];
};

export type StatusPagePageInformation = {
	id: string;
	name: string;
	url: string;
	time_zone: string;
	updated_at: string;
};

export type StatusPageIncident = {
	id: string;
	name: string;
	status: StatusPageIncidentStatus;
	created_at: string;
	updated_at: string | null;
	monitoring_at: string | null;
	resolved_at: string | null;
	impact: StatusPageIncidentImpact;
	shortlink: string;
	started_at: string;
	page_id: string;
	incident_updates: StatusPageIncidentUpdate[];
	components: StatusPageComponent[];
};

export type StatusPageIncidentUpdate = {
	id: string;
	status: string;
	body: string;
	incident_id: string;
	created_at: string;
	update_at: string;
	display_at: string;
	affected_components: StatusPageComponentUpdate[];
	deliver_notifications: boolean;
	custom_tweet: string | null;
	tweet_id: string | null;
};

export enum StatusPageIncidentStatus {
	Investigating = 'investigating',
	Identified = 'identified',
	Monitoring = 'monitoring',
	Resolved = 'resolved',
	Postmortem = 'postmortem',
}

export enum StatusPageIncidentImpact {
	None = 'none',
	Minor = 'minor',
	Major = 'major',
	Critical = 'critical',
}

export type StatusPageComponent = {
	id: string;
	name: string;
	status: string;
	created_at: string;
	updated_at: string;
	position: number;
	description: string;
	showcase: boolean;
	start_date: string | null;
	group_id: string | null;
	page_id: string;
	group: boolean;
	only_show_if_degraded: boolean;
};

export type StatusPageComponentUpdate = {
	code: string;
	name: string;
	old_status: string;
	new_status: string;
};
