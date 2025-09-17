<script>
    import { goto } from '$app/navigation';
    import { impersonateAction } from '../../../store/user.store';

    let password = '';
    let email = '';
    let userId = '';
    let errorMessage = '';
    let isSubmitting = false;

    async function handleSubmit() {
        try {
            isSubmitting = true;
            errorMessage = '';
            await impersonateAction(password, email || undefined, userId || undefined);
            goto('/dashboard');
        } catch (e) {
            errorMessage = e.message || 'Failed to impersonate';
        } finally {
            isSubmitting = false;
        }
    }
</script>

<section class="flex justify-center items-center w-screen h-screen">
    <div class="sm:border-2 sm:min-w-[400px] border-gray-900 p-5 sm:p-10 max-w-sm">
        <div class="flex flex-col items-center justify-center">
            <div class="my-5">
                <span class="text-2xl font-bold font-heading text-shadow">Admin Impersonate</span>
            </div>
            <hr class="border-gray-900 w-full" />
            <p class="text-gray-700 my-5 text-center">
                Enter admin password and either the user's email or userId
            </p>
        </div>
        <div class="flex flex-col items-center justify-center mt-6">
            <input
                bind:value={password}
                type="password"
                placeholder="Admin Password"
                class="border-2 border-gray-900 p-2 rounded-md w-full"
            />
            <input
                bind:value={email}
                type="text"
                placeholder="User Email (optional)"
                class="border-2 border-gray-900 p-2 rounded-md w-full mt-4"
            />
            <input
                bind:value={userId}
                type="text"
                placeholder="User ID (optional)"
                class="border-2 border-gray-900 p-2 rounded-md w-full mt-4"
            />

            {#if errorMessage}
                <div class="text-red-500 mt-2 w-full text-left px-2">{errorMessage}</div>
            {/if}

            <button
                on:click={handleSubmit}
                class="bg-gray-900 text-white w-full p-2 rounded-md mt-4 disabled:opacity-60"
                disabled={isSubmitting || !password || (!email && !userId)}
            >
                {#if isSubmitting}
                    Impersonating...
                {:else}
                    Impersonate
                {/if}
            </button>
        </div>
    </div>
    
</section>


