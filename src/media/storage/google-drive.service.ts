import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';

interface EnsureFolderResult {
	id: string;
}

@Injectable()
export class GoogleDriveService {
	private drive: any;
	private rootFolderId: string;
	private defaultVisibility: 'link' | 'private';
	private cachedResolvedRootId?: string;

	constructor() {
		const oauthClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
		const oauthClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
		const oauthRefreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
		this.rootFolderId = process.env.GDRIVE_ROOT_FOLDER_ID ?? '';
		this.defaultVisibility = (process.env.GDRIVE_DEFAULT_VISIBILITY as any) === 'private' ? 'private' : 'link';

		if (!oauthClientId || !oauthClientSecret || !oauthRefreshToken) {
			throw new InternalServerErrorException('Google Drive OAuth not configured. Missing env variables.');
		}

		const auth = new google.auth.OAuth2({
			clientId: oauthClientId,
			clientSecret: oauthClientSecret,
		});
		auth.setCredentials({ refresh_token: oauthRefreshToken });
		this.drive = google.drive({ version: 'v3', auth });
	}

	async ensureFolder(name: string, parentId: string): Promise<EnsureFolderResult> {
		// Try find existing
		const list = await this.drive.files.list({
			q: `'${parentId}' in parents and name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
			fields: 'files(id, name)',
			includeItemsFromAllDrives: true,
			supportsAllDrives: true,
		});
		const existing = list.data.files?.[0];
		if (existing?.id) return { id: existing.id };
		// Create
		const created = await this.drive.files.create({
			requestBody: {
				name,
				mimeType: 'application/vnd.google-apps.folder',
				parents: [parentId],
			},
			fields: 'id',
			supportsAllDrives: true,
		});
		return { id: created.data.id as string };
	}

	async setFolderPermissionsForEmails(folderId: string, emails: string[]): Promise<void> {
		// Make it resilient but don't fail the entire request if sharing fails for a particular email
		for (const email of emails) {
			try {
				await this.drive.permissions.create({
					fileId: folderId,
					requestBody: {
						type: 'user',
						role: 'reader',
						emailAddress: email,
					},
					sendNotificationEmail: false,
					supportsAllDrives: true,
				});
			} catch {
				// ignore
			}
		}
		// If links are desired for anyone with link
		if (this.defaultVisibility === 'link') {
			try {
				await this.drive.permissions.create({
					fileId: folderId,
					requestBody: {
						type: 'anyone',
						role: 'reader',
					},
					sendNotificationEmail: false,
					supportsAllDrives: true,
				});
			} catch {
				// ignore
			}
		}
	}

	async uploadFile(params: {
		name: string;
		parentId: string;
		mimeType: string;
		body: Readable;
	}): Promise<{ id: string; webViewLink?: string; webContentLink?: string }> {
		try {
			const res = await this.drive.files.create({
				requestBody: {
					name: params.name,
					parents: [params.parentId],
					mimeType: params.mimeType,
				},
				media: {
					mimeType: params.mimeType,
					body: params.body,
				},
				fields: 'id, webViewLink, webContentLink',
				supportsAllDrives: true,
			});

			// Set link visibility if default is link
			if (this.defaultVisibility === 'link') {
				try {
					await this.drive.permissions.create({
						fileId: res.data.id as string,
						requestBody: { type: 'anyone', role: 'reader' },
						sendNotificationEmail: false,
						supportsAllDrives: true,
					});
				} catch {
					// ignore
				}
			}
			// Fetch links
			const get = await this.drive.files.get({
				fileId: res.data.id as string,
				fields: 'id, webViewLink, webContentLink',
				supportsAllDrives: true,
			});
			return {
				id: get.data.id as string,
				webViewLink: get.data.webViewLink ?? undefined,
				webContentLink: get.data.webContentLink ?? undefined,
			};
		} catch (e: any) {
			throw new InternalServerErrorException(`Drive upload failed: ${e?.message ?? e}`);
		}
	}

	getRootFolderId(): string {
		return this.rootFolderId;
	}

	// Creates or finds a top-level folder in the authenticated user's My Drive
	async ensureTopLevelFolder(name: string): Promise<{ id: string }> {
		const list = await this.drive.files.list({
			q: `'root' in parents and name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
			fields: 'files(id, name)',
		});
		const existing = list.data.files?.[0];
		if (existing?.id) return { id: existing.id };
		const created = await this.drive.files.create({
			requestBody: {
				name,
				mimeType: 'application/vnd.google-apps.folder',
				parents: ['root'],
			},
			fields: 'id',
		});
		return { id: created.data.id as string };
	}

	// Returns configured root folder id or lazily creates one if not configured
	async getOrCreateRootFolderId(): Promise<string> {
		if (this.rootFolderId) return this.rootFolderId;
		if (this.cachedResolvedRootId) return this.cachedResolvedRootId;
		const created = await this.ensureTopLevelFolder('no-slack-pact');
		this.cachedResolvedRootId = created.id;
		return created.id;
	}
}


