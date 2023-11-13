<script>
import Dropdown from '$lib/components/Dropdown.svelte';
import Search from '$lib/components/Search.svelte';
import PlusIcon from '$lib/assets/dashboard/Plus.svg';
import {goto} from '$app/navigation';

const options = [
    {
        label: 'Option 1',
        value: 'option-1',
    },
    {
        label: 'Option 2',
        value: 'option-2',
    },
    {
        label: 'Option 3',
        value: 'option-3',
    },
]
</script>

<div class="p-2">
    <div class="flex items-center justify-between">
        <Search />
        <div class="flex-grow">

        </div>
        <div class="flex items-center space-x-4">
            <Dropdown  options={options} />
            <Dropdown />
            <button class="bg-black hover:bg-black text-white font-bold py-1 px-4 rounded ring-1 ring-black ring-opacity-5" on:click={() => {
                goto('/dashboard/template/create')
            }}>
                <div class="flex justify-between items-center">
                    <img src={PlusIcon} alt="Plus icon" class="w-5 h-5 mr-2" />
                    <div>Create</div>
                </div>
            </button>
        </div>
    </div>
</div>
