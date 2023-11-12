<script>
  import "../app.css";
  import {getUser} from "../store/user.store";
  import {onMount} from "svelte";

  onMount(async () => {
    await getUser();
  });
</script>



<slot />