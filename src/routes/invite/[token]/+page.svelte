<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getInvitationByToken, acceptInvitation, declineInvitation } from '../../../api/teams';
	import { user, isLoggedIn, getUser } from '../../../store/user.store';

	let invitation = null;
	let loading = true;
	let error = null;
	let accepting = false;
	let declining = false;
	let isAuthenticated = false;

	$: token = $page.params.token;

	onMount(async () => {
		// Check if user is logged in
		try {
			const userData = await getUser();
			isAuthenticated = !!userData?.email;
		} catch {
			isAuthenticated = false;
		}

		// Load invitation details
		await loadInvitation();
	});

	async function loadInvitation() {
		loading = true;
		error = null;

		try {
			const response = await getInvitationByToken(token);
			invitation = response.invitation;
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function handleAccept() {
		if (!isAuthenticated) {
			// Redirect to login with return URL
			goto(`/login?redirect=/invite/${token}`);
			return;
		}

		accepting = true;
		error = null;

		try {
			const response = await acceptInvitation(token);
			// Redirect to dashboard on success
			goto('/dashboard/template?joined=true');
		} catch (err) {
			error = err.message;
			accepting = false;
		}
	}

	async function handleDecline() {
		if (!isAuthenticated) {
			goto('/');
			return;
		}

		declining = true;

		try {
			await declineInvitation(token);
			goto('/dashboard/template');
		} catch (err) {
			error = err.message;
			declining = false;
		}
	}

	function formatDate(dateString) {
		if (!dateString) return '';
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Team Invitation | Pictify</title>
</svelte:head>

<div class="min-h-screen bg-[#FFFDF8] flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<!-- Logo -->
		<div class="text-center mb-8">
			<a href="/" class="inline-block">
				<img src="/logo.svg" alt="Pictify" class="h-10 mx-auto" />
			</a>
		</div>

		{#if loading}
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-8">
				<div class="flex items-center justify-center">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
				</div>
				<p class="text-center text-gray-500 mt-4">Loading invitation...</p>
			</div>
		{:else if error && !invitation}
			<div class="bg-white border-[3px] border-red-400 rounded-xl shadow-[4px_4px_0_0_#f87171] p-8 text-center">
				<svg class="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<h2 class="text-xl font-black text-gray-900 mb-2">Invitation Not Found</h2>
				<p class="text-gray-600">{error}</p>
				<a
					href="/"
					class="inline-block mt-6 px-6 py-3 text-sm font-bold text-white bg-gray-900 rounded-xl border-2 border-gray-900 hover:bg-gray-800 transition-colors"
				>
					Go to Homepage
				</a>
			</div>
		{:else if invitation}
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] overflow-hidden">
				<!-- Header -->
				<div class="px-8 py-6 bg-[#ffc480] border-b-[3px] border-gray-900 text-center">
					<h1 class="text-2xl font-black text-gray-900">You're Invited!</h1>
				</div>

				<!-- Content -->
				<div class="p-8">
					<!-- Team Info -->
					<div class="flex items-center justify-center mb-6">
						<div class="w-16 h-16 rounded-xl bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
							{#if invitation.team?.avatar}
								<img src={invitation.team.avatar} alt={invitation.team.name} class="w-full h-full rounded-xl object-cover" />
							{:else}
								<span class="text-2xl font-black text-gray-600">
									{invitation.team?.name?.charAt(0)?.toUpperCase() || 'T'}
								</span>
							{/if}
						</div>
					</div>

					<h2 class="text-xl font-black text-gray-900 text-center mb-2">
						{invitation.team?.name}
					</h2>

					<p class="text-gray-600 text-center mb-6">
						{invitation.invitedBy?.email || 'A team member'} has invited you to join their team on Pictify.
					</p>

					<!-- Invitation Details -->
					<div class="bg-gray-50 rounded-lg p-4 mb-6">
						<div class="flex justify-between text-sm mb-2">
							<span class="text-gray-500">Invited email:</span>
							<span class="font-bold text-gray-900">{invitation.email}</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-gray-500">Expires:</span>
							<span class="font-bold text-gray-900">{formatDate(invitation.expiresAt)}</span>
						</div>
					</div>

					{#if error}
						<div class="bg-red-50 border-2 border-red-200 rounded-lg p-3 mb-4 text-center">
							<p class="text-red-600 text-sm">{error}</p>
						</div>
					{/if}

					<!-- Auth Check Message -->
					{#if !isAuthenticated}
						<div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6 text-center">
							<p class="text-blue-800 text-sm font-bold">
								You'll need to log in or create an account to accept this invitation.
							</p>
						</div>
					{:else if $user.email && $user.email.toLowerCase() !== invitation.email.toLowerCase()}
						<div class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6 text-center">
							<p class="text-yellow-800 text-sm font-bold">
								This invitation was sent to {invitation.email}
							</p>
							<p class="text-yellow-600 text-xs mt-1">
								You're logged in as {$user.email}. Make sure to use the correct account.
							</p>
						</div>
					{/if}

					<!-- Action Buttons -->
					<div class="flex gap-3">
						<button
							on:click={handleDecline}
							disabled={declining}
							class="flex-1 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl border-2 border-gray-300 hover:bg-gray-200 transition-colors disabled:opacity-50"
						>
							{declining ? 'Declining...' : 'Decline'}
						</button>
						<button
							on:click={handleAccept}
							disabled={accepting}
							class="flex-1 px-4 py-3 text-sm font-bold text-white bg-gray-900 rounded-xl border-2 border-gray-900 shadow-[3px_3px_0_0_#374151] hover:shadow-[1px_1px_0_0_#374151] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
						>
							{#if accepting}
								Accepting...
							{:else if !isAuthenticated}
								Log in to Accept
							{:else}
								Accept Invitation
							{/if}
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Footer -->
		<p class="text-center text-gray-400 text-sm mt-6">
			By accepting, you agree to Pictify's <a href="/terms" class="underline hover:text-gray-600">Terms of Service</a>
		</p>
	</div>
</div>
