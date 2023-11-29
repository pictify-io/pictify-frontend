<script>
    import { searchTemplatesAction} from '../../store/template.store';

const debounce = (func, delay) => {
    let debounceTimer
    return function() {
        const context = this
        const args = arguments
            clearTimeout(debounceTimer)
                debounceTimer
            = setTimeout(() => func.apply(context, args), delay)
    }
}

const searchTemplate = debounce((e) => {
    searchTemplatesAction(e.target.value);
}, 500);

</script>

<div>
    <input class="px-4 py-2 rounded-md text-gray-900 ring-1 ring-black ring-opacity-6 active:ring-black focus:outline-none" type="search" placeholder="Search" on:input={searchTemplate}>
</div>