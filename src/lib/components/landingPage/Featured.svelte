<script>
  import BetalistLogo from '$lib/assets/landing-page/betalist-logo.svg';
  import PeerlistLogo from '$lib/assets/landing-page/POM.svg';
</script>

<div class="max-w-6xl p-4 mt-20 sm:p-5 m-auto">
  <h1 class="text-2xl sm:text-2xl font-bold text-center md:text-center opacity-80">Featured On</h1>
  <div class=" flex flex-col  gap-5  sm:flex-row justify-between items-center sm:items-center mt-5 sm:mt-10 sm:mb-10 w-full">
    <div>
      <a href="https://peerlist.io/startups/pictify-io" target="_blank">
      <img src={PeerlistLogo} alt="Peerlist Logo" class="w-[10rem] sm:w-[12rem] border-gray-600 border-2 rounded-md" />
      </a>
    </div>

    <div>
      <a href="https://betalist.com/startups/pictify-io" target="_blank">
      <img src={BetalistLogo} alt="Betalist Logo" class="w-[8rem] sm:w-[10rem] border-gray-600 border-2 rounded-md" />
    </a>
    </div>
   
    <div>
      <a href='https://www.saashub.com/pictify-io?utm_source=badge&utm_campaign=badge&utm_content=pictify-io&badge_variant=color&badge_kind=approved' target='_blank'><img src="https://cdn-b.saashub.com/img/badges/approved-color.png?v=1" alt="pictify.io badge" class="w-[8rem] sm:w-[10rem]"/></a>
    </div>
  </div>
</div>