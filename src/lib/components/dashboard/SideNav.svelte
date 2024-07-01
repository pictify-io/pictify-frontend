<script>
	import { page } from '../../../store/pages.store';
	import { logoutAction } from '../../../store/user.store';
	import { goto } from '$app/navigation';
	import CollapseIcon from '$lib/assets/dashboard/CollapseArrow.png';
	import { PUBLIC_DOCS_URL } from '$env/static/public';

	let isMediaListExpanded = false;
	function toggleMediaList() {
		isMediaListExpanded = !isMediaListExpanded;
	}

	function logout() {
		logoutAction();
		goto('/');
	}
</script>

<div class="flex flex-row item-start sm:flex-col h-full">
	<div class="overflow-y-auto">
		<div class="p-4">
			<ul
				class="space-y-2 items-baseline space-x-2 sm:space-x-0 text-center text-xs sm:text-base sm:text-left flex sm:block"
			>
				<li class="text-gray-700 hover:text-gray-900">
					<a href="/dashboard/api-token">API Usage</a>
				</li>
				<li class="text-gray-700 hover:text-gray-900">
					<a href="#" on:click={toggleMediaList}>
						<div class="flex items-center">
							<div>
								<span>Created Media </span>
							</div>
							<div class="ml-2">
								<img
									src={CollapseIcon}
									class="w-4"
									class:rotate-180={!isMediaListExpanded}
									alt="collapse-icon"
								/>
							</div>
						</div>
					</a>

					<ul class="space-y-2 ml-4" class:hidden={!isMediaListExpanded}>
						<li class="text-gray-700 hover:text-gray-900">
							<a href="/dashboard/media/images">Images</a>
						</li>
						<li class="text-gray-700 hover:text-gray-900">
							<a href="/dashboard/media/gifs">Gifs</a>
						</li>
					</ul>
				</li>
				<li class="text-gray-700 hover:text-gray-900">
					<a href="/dashboard/template">Templates</a>
				</li>
				<li class="text-gray-700 hover:text-gray-900">
					<a href={PUBLIC_DOCS_URL} target="_blank">Docs and Support</a>
				</li>
			</ul>
		</div>
	</div>
	<div class="flex-grow" />
	<div class="p-4 space-y-2 text-gray-700">
		<a href="#" on:click={logout}>Logout</a>
	</div>
</div>
