<script>
import {user, getAPITokenAction, createAPITokenAction, deleteAPITokenAction, getPlanDetailsAction} from "../../../store/user.store";
import {onMount, onDestroy} from "svelte";
import CopyIcon from '$lib/assets/dashboard/Copy Icons.png';
import Toast from "$lib/components/Toast.svelte";
import Loader from '$lib/components/Loader.svelte';
import ProgressBar from '$lib/components/ProgressBar.svelte';
import {toast} from "../../../store/toast.store";

let apiTokens = [];
let unsubscribe = () => {};
let isLoading = true;
let currentPlan = '';
let planDetails= {};
let usagePercentage = 0;

onMount(async () => {
    unsubscribe = user.subscribe((u) => {
        console.log(u);
        apiTokens = u.apiTokens || [];
        isLoading = false;
        currentPlan = u.currentPlan;
        planDetails = u.planDetails;
        usagePercentage = (planDetails?.usage / planDetails?.monthlyLimit) * 100;
    });
     Promise.all([getAPITokenAction(), getPlanDetailsAction()]);
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
    <div class="max-w-6xl p-4 sm:p-5 m-auto">
        <div class="">
        <h1 class="text-lg font-bold">API Tokens</h1>
        <div class="flex flex-col sm:flex-row justify-between sm:items-center mt-10 mb-10">
                <div class="text-sm sm:text-md text-gray-700">API tokens used to authenticate with Pictify API. <br>Treat them like passwords and keep them secret. Learn more in our <a href="https://docs.pictify.ai" target="_blank" class="text-blue-500">docs</a>.
                </div>
                <div >
                    <button class="mt-10 sm:mt-0 text-sm text-gray-900 hover:text-gray-900 font-bold py-1 px-4 rounded border-2 border-black" on:click={() => {createAPITokenAction()}}>Create New Token</button>
                </div>
        </div>
        <div class="max-w-6xl pt-5 pb-5 m-auto">
        <Loader size="8" show={isLoading} />
        <div>
            Current Plan : <span class="text-red-400">{currentPlan}</span>
        </div>
        <div class=" mt-4">Usage -:</div>
        <div class="flex items-center mt-4">
            <div class="flex-grow">
                <ProgressBar progress={usagePercentage} />
            </div>
            <div class="text-xs text-gray-700 ml-2">{planDetails?.usage} / {planDetails?.monthlyLimit}</div>
 
        </div>
        </div>
        {#each apiTokens as token}
        <hr class="text-gray-400">
        <div class="flex flex-col mt-5 mb-5">
            <div class="flex items-baseline">
                <div class="flex flex-col">
                    <div class="text-md text-red-400 whitespace-nowrap overflow-hidden overflow-ellipsis max-w-xs sm:max-w-full">{token.token}</div>
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
