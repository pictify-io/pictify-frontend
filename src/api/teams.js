import backend from '../service/backend';

/**
 * Get all teams the user is a member of
 */
export const getTeams = async () => {
	try {
		return await backend.get('/api/teams');
	} catch (error) {
		if (error.status === 401) throw new Error('Please log in to view teams');
		throw new Error('Error fetching teams');
	}
};

/**
 * Get the current active team with full details
 */
export const getCurrentTeam = async () => {
	try {
		return await backend.get('/api/teams/current');
	} catch (error) {
		if (error.status === 401) throw new Error('Please log in');
		throw new Error('Error fetching current team');
	}
};

/**
 * Create a new team
 */
export const createTeam = async ({ name }) => {
	try {
		return await backend.post('/api/teams', { name });
	} catch (error) {
		if (error.status === 400) throw new Error('Team name is required');
		throw new Error('Error creating team');
	}
};

/**
 * Switch to a different team
 */
export const switchTeam = async (teamId) => {
	try {
		return await backend.post('/api/teams/switch', { teamId });
	} catch (error) {
		if (error.status === 403) throw new Error('You are not a member of this team');
		throw new Error('Error switching teams');
	}
};

/**
 * Trigger migration for the current user
 */
export const migrateToTeams = async () => {
	try {
		return await backend.post('/api/teams/migrate');
	} catch (error) {
		throw new Error('Error migrating to teams');
	}
};

/**
 * Get a specific team's details
 */
export const getTeam = async (teamId) => {
	try {
		return await backend.get(`/api/teams/${teamId}`);
	} catch (error) {
		if (error.status === 403) throw new Error('You are not a member of this team');
		if (error.status === 404) throw new Error('Team not found');
		throw new Error('Error fetching team');
	}
};

/**
 * Update team settings (Owner only)
 */
export const updateTeam = async (teamId, { name }) => {
	try {
		return await backend.patch(`/api/teams/${teamId}`, { name });
	} catch (error) {
		if (error.status === 403) throw new Error('Only team owners can update settings');
		if (error.status === 404) throw new Error('Team not found');
		throw new Error('Error updating team');
	}
};

/**
 * Get team members
 */
export const getTeamMembers = async (teamId) => {
	try {
		return await backend.get(`/api/teams/${teamId}/members`);
	} catch (error) {
		if (error.status === 403) throw new Error('You are not a member of this team');
		throw new Error('Error fetching team members');
	}
};

/**
 * Remove a member from the team (Owner only)
 */
export const removeMember = async (teamId, memberUid) => {
	try {
		return await backend.delete(`/api/teams/${teamId}/members/${memberUid}`);
	} catch (error) {
		if (error.status === 403) throw new Error('Only team owners can remove members');
		if (error.status === 400) throw new Error(error.message || 'Cannot remove this member');
		throw new Error('Error removing member');
	}
};

/**
 * Get pending invitations for the team
 */
export const getTeamInvitations = async (teamId) => {
	try {
		return await backend.get(`/api/teams/${teamId}/invitations`);
	} catch (error) {
		if (error.status === 403) throw new Error('You are not a member of this team');
		throw new Error('Error fetching invitations');
	}
};

/**
 * Create an invitation to join a team (Owner only)
 */
export const createInvitation = async (teamId, email) => {
	try {
		return await backend.post(`/api/teams/${teamId}/invitations`, { email });
	} catch (error) {
		if (error.status === 400) throw new Error(error.message || 'Invalid email');
		if (error.status === 403) {
			if (error.message?.includes('Seat limit')) {
				throw new Error('Seat limit reached. Upgrade your plan for more seats.');
			}
			throw new Error('Only team owners can invite members');
		}
		throw new Error('Error sending invitation');
	}
};

/**
 * Revoke an invitation (Owner only)
 */
export const revokeInvitation = async (teamId, invitationUid) => {
	try {
		return await backend.delete(`/api/teams/${teamId}/invitations/${invitationUid}`);
	} catch (error) {
		if (error.status === 403) throw new Error('Only team owners can revoke invitations');
		if (error.status === 404) throw new Error('Invitation not found');
		throw new Error('Error revoking invitation');
	}
};

// Invitation-related endpoints (user-facing)

/**
 * Get pending invitations for the current user's email
 */
export const getPendingInvitations = async () => {
	try {
		return await backend.get('/api/invitations/pending');
	} catch (error) {
		throw new Error('Error fetching invitations');
	}
};

/**
 * Get invitation details by token (public, for acceptance page)
 */
export const getInvitationByToken = async (token) => {
	try {
		return await backend.get(`/api/invitations/${token}`);
	} catch (error) {
		if (error.status === 404) {
			throw new Error('This invitation link is no longer valid');
		}
		throw new Error('Error loading invitation');
	}
};

/**
 * Accept an invitation
 */
export const acceptInvitation = async (token) => {
	try {
		return await backend.post(`/api/invitations/${token}/accept`);
	} catch (error) {
		if (error.status === 403) {
			if (error.message?.includes('full')) {
				throw new Error('This team has reached its member limit');
			}
			throw new Error('This invitation was sent to a different email');
		}
		if (error.status === 404) {
			throw new Error('This invitation link is no longer valid');
		}
		throw new Error('Error accepting invitation');
	}
};

/**
 * Decline an invitation
 */
export const declineInvitation = async (token) => {
	try {
		return await backend.post(`/api/invitations/${token}/decline`);
	} catch (error) {
		throw new Error('Error declining invitation');
	}
};
