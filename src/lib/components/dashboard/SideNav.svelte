<script>
import { page } from "../../../store/pages.store";
import {logoutAction} from "../../../store/user.store";
import { goto } from '$app/navigation';

function logout() {
    logoutAction();
    goto('/');
}
</script>
<div class="flex flex-col h-full">
    <div class="overflow-y-auto">
      <div class="p-4">
        <ul class="space-y-2">
          <li class="text-gray-700 hover:text-gray-900">
            <a href="#" on:click|preventDefault={() => $page = 'template'}>Templates</a>
          </li>
          <li class="text-gray-700 hover:text-gray-900">
            <a href="#" on:click|preventDefault={() => $page = 'api-token'}>API Usage</a>
          </li>
          <li class="text-gray-700 hover:text-gray-900">
            <a href="#" on:click|preventDefault={() => $page = 'settings'}>Settings</a>
          </li>
          <li class="text-gray-700 hover:text-gray-900">
            <a href="#" on:click|preventDefault={() => $page = 'docs'}>Docs and Support</a>
          </li>
        </ul>
      </div>
    </div>
    <div class="flex-grow">
       
    </div>
    <div class="p-4 space-y-2 text-gray-700">
       <a href="#" on:click={logout}>Logout</a> 
    </div>
  </div>