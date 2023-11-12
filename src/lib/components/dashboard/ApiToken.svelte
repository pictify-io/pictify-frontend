<script>
import {user, getAPITokenAction, createAPITokenAction, deleteAPITokenAction} from "../../../store/user.store";
import {onMount, onDestroy} from "svelte";
import CopyIcon from '$lib/assets/dashboard/Copy Icons.png';
import Toast from "$lib/components/Toast.svelte";
import {toast} from "../../../store/toast.store";

let apiTokens = [];
let unsubscribe;

onMount(async () => {
    unsubscribe = user.subscribe((u) => {
        apiTokens = u.apiTokens || [];
        console.log(apiTokens);
    });
     await getAPITokenAction();
})

onDestroy(() => {
    unsubscribe();
})

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        toast.set({ message: 'Copied to clipboard !!', duration: 1500 });
    });
}
</script>

<section>
    <div class="max-w-6xl p-5 m-auto">
        <div class="">
        <h1 class="text-lg font-bold">API Tokens</h1>
        <div class="flex justify-between items-center mt-10 mb-10">
                <div class="text-md text-gray-700">API tokens used to authenticate with Medify API. <br>Treat them like passwords and keep them secret. Learn more in our <a href="https://docs.medify.ai" target="_blank" class="text-blue-500">docs</a>.
                </div>
                <div >
                    <button class="text-sm text-gray-900 hover:text-gray-900 font-bold py-1 px-4 rounded border-2 border-black" on:click={() => {createAPITokenAction()}}>Create New Token</button>
                </div>
        </div>
        {#each apiTokens as token}
        <hr class="text-gray-400">
        <div class="flex flex-col mt-5 mb-5">
            <div class="flex items-baseline">
                <div class="flex flex-col">
                    <div class="text-md text-red-400">{token.token}</div>
                    <div class="text-xs text-gray-700 mt-2">Created on {new Date(token.createdAt).toLocaleString()}</div>
                    <div>
                        <button class="text-xs text-gray-500 py-1 px-4 rounded border-2 border-gray-500 mt-2" on:click={() => { deleteAPITokenAction(token.uid)}}>Disable</button>
                    </div>
                </div>
                <div class="w-4 h-4 ml-2">
                    <button on:click={copyToClipboard(token.token)}>
                        <img src={CopyIcon} alt="Copy Icon" class="cursor-pointer w-5 mt-[2px]"  title="copy"  />
                    </button>
                </div>
            </div>
        </div>
        {/each}
    </div>
    </div>
</section>

<Toast  />
