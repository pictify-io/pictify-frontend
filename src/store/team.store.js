import { writable, get, derived } from 'svelte/store';
import {
	getTeams,
	getCurrentTeam,
	createTeam as createTeamAPI,
	switchTeam as switchTeamAPI,
	migrateToTeams as migrateAPI,
	getTeamMembers as getMembersAPI,
	removeMember as removeMemberAPI,
	getTeamInvitations as getInvitationsAPI,
	createInvitation as createInvitationAPI,
	revokeInvitation as revokeInvitationAPI,
	updateTeam as updateTeamAPI,
	getPendingInvitations as getPendingAPI,
	acceptInvitation as acceptAPI,
	declineInvitation as declineAPI
} from '../api/teams';
import { analytics } from '$lib/analytics.js';
import { initOnboarding } from './onboarding.store';

/**
 * Team Store - Manages team state for the application
 *
 * State structure:
 * - currentTeam: The active team object (null if not migrated or no team)
 * - teams: Array of all teams the user is a member of
 * - membership: Current user's membership in the active team
 * - role: Current user's role in the active team
 * - members: Array of members in the current team
 * - invitations: Pending invitations for the current team
 * - pendingUserInvitations: Invitations sent to the current user
 * - loading: Loading state flags
 * - needsMigration: Whether user needs to be migrated to teams
 */

const createDefaultState = () => ({
	currentTeam: null,
	teams: [],
	membership: null,
	role: null,
	members: [],
	invitations: [],
	pendingUserInvitations: [],
	loading: {
		teams: false,
		currentTeam: false,
		members: false,
		invitations: false,
		switching: false,
		creating: false
	},
	needsMigration: false,
	error: null
});

export const teamStore = writable(createDefaultState());

// Derived stores for convenience
export const currentTeam = derived(teamStore, ($store) => $store.currentTeam);
export const teams = derived(teamStore, ($store) => $store.teams);
export const teamMembers = derived(teamStore, ($store) => $store.members);
export const teamInvitations = derived(teamStore, ($store) => $store.invitations);
export const isTeamOwner = derived(teamStore, ($store) => $store.role?.name === 'Owner');
export const canManageTeam = derived(
	teamStore,
	($store) => $store.role?.capabilities?.canManageTeam === true
);
export const canManageContent = derived(
	teamStore,
	($store) => $store.role?.capabilities?.canManageContent === true
);
export const teamUsage = derived(teamStore, ($store) => $store.currentTeam?.usage || null);
export const needsMigration = derived(teamStore, ($store) => $store.needsMigration);

// Check if user owns any team (for team creation limits)
export const ownsTeam = derived(teamStore, ($store) =>
	$store.teams.some((t) => t.role?.name === 'Owner')
);

// Setters
const setLoading = (key, value) => {
	teamStore.update((state) => ({
		...state,
		loading: { ...state.loading, [key]: value }
	}));
};

const setError = (error) => {
	teamStore.update((state) => ({
		...state,
		error: error?.message || error || null
	}));
};

export const clearTeamStore = () => {
	teamStore.set(createDefaultState());
};

// Actions

/**
 * Fetch all teams the user is a member of
 */
export const fetchTeams = async () => {
	setLoading('teams', true);
	setError(null);

	try {
		const response = await getTeams();
		teamStore.update((state) => ({
			...state,
			teams: response.teams || [],
			loading: { ...state.loading, teams: false }
		}));
		return response.teams;
	} catch (error) {
		setError(error);
		setLoading('teams', false);
		throw error;
	}
};

/**
 * Fetch current active team with full details
 */
export const fetchCurrentTeam = async () => {
	setLoading('currentTeam', true);
	setError(null);

	try {
		const response = await getCurrentTeam();
		teamStore.update((state) => ({
			...state,
			currentTeam: response.team,
			membership: response.membership,
			role: response.role,
			needsMigration: response.needsMigration || false,
			loading: { ...state.loading, currentTeam: false }
		}));
		return response;
	} catch (error) {
		setError(error);
		setLoading('currentTeam', false);
		throw error;
	}
};

/**
 * Initialize team state - call on app load after user is authenticated
 */
export const initializeTeamState = async () => {
	try {
		const [teamsResponse, currentResponse] = await Promise.all([
			getTeams().catch(() => ({ teams: [] })),
			getCurrentTeam().catch(() => ({ team: null, needsMigration: true }))
		]);

		teamStore.update((state) => ({
			...state,
			teams: teamsResponse.teams || [],
			currentTeam: currentResponse.team,
			membership: currentResponse.membership,
			role: currentResponse.role,
			needsMigration: currentResponse.needsMigration || false,
			loading: { ...state.loading, teams: false, currentTeam: false }
		}));

		return { teams: teamsResponse.teams, current: currentResponse };
	} catch (error) {
		setError(error);
		throw error;
	}
};

/**
 * Create a new team
 */
export const createTeamAction = async (name) => {
	setLoading('creating', true);
	setError(null);

	try {
		const response = await createTeamAPI({ name });

		// Track team creation
		analytics.track('Team Created', {
			team_name: name,
			team_id: response.team?.uid
		});

		// Refresh team list and current team
		await initializeTeamState();

		setLoading('creating', false);
		return response;
	} catch (error) {
		setError(error);
		setLoading('creating', false);
		throw error;
	}
};

/**
 * Switch to a different team
 */
export const switchTeamAction = async (teamId) => {
	setLoading('switching', true);
	setError(null);

	try {
		const response = await switchTeamAPI(teamId);

		// Track team switch
		analytics.track('Team Switched', {
			team_id: teamId,
			team_name: response.team?.name
		});

		teamStore.update((state) => ({
			...state,
			currentTeam: response.team,
			membership: response.membership,
			role: response.role,
			members: [], // Clear members since we switched teams
			invitations: [], // Clear invitations
			loading: { ...state.loading, switching: false }
		}));

		// Refresh onboarding state for the new team
		initOnboarding().catch((err) => {
			console.error('Failed to refresh onboarding after team switch:', err);
		});

		return response;
	} catch (error) {
		setError(error);
		setLoading('switching', false);
		throw error;
	}
};

/**
 * Trigger migration to teams for the current user
 */
export const migrateToTeamsAction = async () => {
	setLoading('creating', true);
	setError(null);

	try {
		const response = await migrateAPI();

		if (response.success) {
			analytics.track('User Migrated to Teams', {
				team_id: response.team?.uid,
				already_migrated: response.alreadyMigrated || false
			});

			// Refresh state
			await initializeTeamState();
		}

		setLoading('creating', false);
		return response;
	} catch (error) {
		setError(error);
		setLoading('creating', false);
		throw error;
	}
};

/**
 * Update team settings
 */
export const updateTeamAction = async (teamId, updates) => {
	setError(null);

	try {
		const response = await updateTeamAPI(teamId, updates);

		teamStore.update((state) => ({
			...state,
			currentTeam:
				state.currentTeam?.uid === teamId
					? { ...state.currentTeam, ...response.team }
					: state.currentTeam,
			teams: state.teams.map((t) =>
				t.team?.uid === teamId ? { ...t, team: { ...t.team, ...response.team } } : t
			)
		}));

		return response;
	} catch (error) {
		setError(error);
		throw error;
	}
};

/**
 * Fetch team members
 */
export const fetchTeamMembers = async (teamId) => {
	const store = get(teamStore);
	const targetTeamId = teamId || store.currentTeam?.uid;

	if (!targetTeamId) return [];

	setLoading('members', true);
	setError(null);

	try {
		const response = await getMembersAPI(targetTeamId);
		teamStore.update((state) => ({
			...state,
			members: response.members || [],
			loading: { ...state.loading, members: false }
		}));
		return response.members;
	} catch (error) {
		setError(error);
		setLoading('members', false);
		throw error;
	}
};

/**
 * Remove a team member
 */
export const removeMemberAction = async (teamId, memberUid) => {
	setError(null);

	try {
		await removeMemberAPI(teamId, memberUid);

		analytics.track('Team Member Removed', {
			team_id: teamId,
			member_uid: memberUid
		});

		teamStore.update((state) => ({
			...state,
			members: state.members.filter((m) => m.uid !== memberUid)
		}));

		return { success: true };
	} catch (error) {
		setError(error);
		throw error;
	}
};

/**
 * Fetch team invitations
 */
export const fetchTeamInvitations = async (teamId) => {
	const store = get(teamStore);
	const targetTeamId = teamId || store.currentTeam?.uid;

	if (!targetTeamId) return [];

	setLoading('invitations', true);
	setError(null);

	try {
		const response = await getInvitationsAPI(targetTeamId);
		teamStore.update((state) => ({
			...state,
			invitations: response.invitations || [],
			loading: { ...state.loading, invitations: false }
		}));
		return response.invitations;
	} catch (error) {
		setError(error);
		setLoading('invitations', false);
		throw error;
	}
};

/**
 * Create an invitation
 */
export const createInvitationAction = async (teamId, email) => {
	setError(null);

	try {
		const response = await createInvitationAPI(teamId, email);

		analytics.track('Team Invitation Sent', {
			team_id: teamId,
			invitee_email: email
		});

		teamStore.update((state) => ({
			...state,
			invitations: [...state.invitations, response.invitation]
		}));

		return response;
	} catch (error) {
		setError(error);
		throw error;
	}
};

/**
 * Revoke an invitation
 */
export const revokeInvitationAction = async (teamId, invitationUid) => {
	setError(null);

	try {
		await revokeInvitationAPI(teamId, invitationUid);

		teamStore.update((state) => ({
			...state,
			invitations: state.invitations.filter((i) => i.uid !== invitationUid)
		}));

		return { success: true };
	} catch (error) {
		setError(error);
		throw error;
	}
};

// User-facing invitation actions

/**
 * Fetch pending invitations for the current user
 */
export const fetchPendingInvitations = async () => {
	setError(null);

	try {
		const response = await getPendingAPI();
		teamStore.update((state) => ({
			...state,
			pendingUserInvitations: response.invitations || []
		}));
		return response.invitations;
	} catch (error) {
		setError(error);
		throw error;
	}
};

/**
 * Accept an invitation
 */
export const acceptInvitationAction = async (token) => {
	setError(null);

	try {
		const response = await acceptAPI(token);

		analytics.track('Team Invitation Accepted', {
			team_id: response.team?.uid,
			team_name: response.team?.name
		});

		// Refresh team state after accepting
		await initializeTeamState();

		return response;
	} catch (error) {
		setError(error);
		throw error;
	}
};

/**
 * Decline an invitation
 */
export const declineInvitationAction = async (token) => {
	setError(null);

	try {
		await declineAPI(token);

		// Remove from pending invitations
		teamStore.update((state) => ({
			...state,
			pendingUserInvitations: state.pendingUserInvitations.filter(
				(i) => !i.token || i.token !== token
			)
		}));

		return { success: true };
	} catch (error) {
		setError(error);
		throw error;
	}
};

// Getters

export const getCurrentTeamState = () => {
	const state = get(teamStore);
	return state.currentTeam;
};

export const isUserTeamOwner = () => {
	const state = get(teamStore);
	return state.role?.name === 'Owner';
};

export const getTeamId = () => {
	const state = get(teamStore);
	return state.currentTeam?.uid || null;
};

export const hasTeam = () => {
	const state = get(teamStore);
	return !!state.currentTeam;
};
